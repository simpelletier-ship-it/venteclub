import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { loginSchema, signupSchema } from "@/lib/validations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

import { useFingerprint } from "@/hooks/useFingerprint";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { translateAuthError } from "@/lib/authErrors";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { fingerprint, loading: fpLoading } = useFingerprint();
  
  const [loading, setLoading] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("login");
  const recaptchaRef = useRef<HTMLDivElement>(null);
  
  // États pour la vérification par code
  const [showVerificationCode, setShowVerificationCode] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingSignupData, setPendingSignupData] = useState<{
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  } | null>(null);

  // États pour le 2FA lors de la connexion
  const [show2FAPrompt, setShow2FAPrompt] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaChallengeId, setMfaChallengeId] = useState<string | null>(null);
  const [trustDevice, setTrustDevice] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  useEffect(() => {
    // Récupérer la page d'origine depuis sessionStorage
    const returnUrl = sessionStorage.getItem('authReturnUrl') || '/';
    
    // Vérifier la session existante
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        sessionStorage.removeItem('authReturnUrl');
        navigate(returnUrl);
      }
    });

    // Écouter les changements d'authentification (important pour le callback Google)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        toast({
          title: "Connexion réussie !",
          description: "Bienvenue sur Vente.Club",
        });
        const returnUrl = sessionStorage.getItem('authReturnUrl') || '/';
        sessionStorage.removeItem('authReturnUrl');
        navigate(returnUrl);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Connexion avec vérification de l'email confirmé
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Vérifier si c'est une erreur de confirmation d'email
        if (error.message.includes('Email not confirmed') || 
            error.message.includes('email_not_confirmed')) {
          toast({
            variant: "destructive",
            title: "Email non confirmé",
            description: "Vous devez confirmer votre email avant de vous connecter. Vérifiez votre boîte de réception.",
            duration: 7000,
          });
        } else {
          toast({
            variant: "destructive",
            title: "Erreur de connexion",
            description: translateAuthError(error.message),
          });
        }
        setLoading(false);
        return;
      }

      // Vérification supplémentaire si l'email est confirmé
      if (data.user && !data.user.email_confirmed_at) {
        toast({
          variant: "destructive",
          title: "Email non confirmé",
          description: "Vous devez confirmer votre email avant de vous connecter. Vérifiez votre boîte de réception.",
          duration: 7000,
        });
        // Déconnecter l'utilisateur
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // Vérifier si 2FA est activé pour cet utilisateur
      if (data.user) {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        console.log('🔒 Facteurs MFA disponibles:', factors);
        const totpFactor = factors?.totp?.find(f => f.status === 'verified');
        console.log('🔒 Facteur TOTP vérifié trouvé:', totpFactor);
        
        if (totpFactor) {
          console.log('🔒 2FA actif, vérification de l\'appareil...');
          // Vérifier si cet appareil est de confiance
          console.log('🔒 Fingerprint hash:', fingerprint?.hash);
          if (fingerprint?.hash) {
            const { data: isTrusted } = await supabase.rpc('is_device_trusted', {
              p_user_id: data.user.id,
              p_device_fingerprint: fingerprint.hash
            });
            console.log('🔒 Appareil de confiance?', isTrusted);

            if (isTrusted) {
              // Appareil de confiance, pas besoin de 2FA
              console.log('✅ Appareil de confiance détecté, skip 2FA');
              toast({
                title: "Connexion réussie !",
                description: "Appareil de confiance reconnu",
              });
              navigate("/");
              return;
            }
          }
          
          console.log('🔒 Appareil non reconnu, création du challenge 2FA...');

          // 2FA est activé et appareil pas de confiance, créer un challenge
          const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
            factorId: totpFactor.id,
          });

          if (challengeError) {
            console.error('❌ Erreur création challenge 2FA:', challengeError);
            throw challengeError;
          }

          console.log('✅ Challenge 2FA créé:', challengeData.id);
          // Sauvegarder les IDs pour la vérification
          setMfaFactorId(totpFactor.id);
          setMfaChallengeId(challengeData.id);
          setPendingUserId(data.user.id);
          setShow2FAPrompt(true);
          console.log('✅ Affichage du prompt 2FA activé');
          setLoading(false);
          return;
        } else {
          console.log('ℹ️ Aucun facteur TOTP vérifié trouvé');
        }
      }

      toast({
        title: "Connexion réussie !",
        description: "Bienvenue sur Vente.Club",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: translateAuthError(error.message) || "Une erreur est survenue lors de la connexion.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!twoFactorCode || twoFactorCode.length !== 6) {
      toast({
        variant: "destructive",
        title: "Code invalide",
        description: "Veuillez entrer un code à 6 chiffres.",
      });
      return;
    }

    if (!mfaFactorId || !mfaChallengeId) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Session expirée. Veuillez vous reconnecter.",
      });
      setShow2FAPrompt(false);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: mfaChallengeId,
        code: twoFactorCode,
      });

      if (error) throw error;

      // Si l'utilisateur a coché "faire confiance à cet appareil"
      if (trustDevice && fingerprint?.hash && pendingUserId) {
        try {
          const trustedUntil = new Date();
          trustedUntil.setDate(trustedUntil.getDate() + 30); // 30 jours

          await supabase.from('trusted_devices').insert({
            user_id: pendingUserId,
            device_fingerprint: fingerprint.hash,
            device_name: navigator.userAgent.includes('Mobile') ? 'Appareil mobile' : 'Ordinateur',
            trusted_until: trustedUntil.toISOString(),
          });
        } catch (error) {
          console.error('Error saving trusted device:', error);
        }
      }

      toast({
        title: "Connexion réussie !",
        description: trustDevice 
          ? "Cet appareil est maintenant de confiance pour 30 jours"
          : "Authentification à deux facteurs validée.",
      });
      
      setShow2FAPrompt(false);
      setTwoFactorCode("");
      setMfaFactorId(null);
      setMfaChallengeId(null);
      setTrustDevice(false);
      setPendingUserId(null);
      
      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Code incorrect",
        description: "Le code d'authentification est invalide. Vérifiez votre application d'authentification.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[SIGNUP] Démarrage de l\'inscription');
    setLoading(true);

    try {
      console.log('[SIGNUP] Vérification des conditions');
      if (!acceptedTerms) {
        console.log('[SIGNUP] Conditions non acceptées');
        toast({
          variant: "destructive",
          title: "Conditions non acceptées",
          description: "Vous devez accepter les conditions d'utilisation pour créer un compte.",
        });
        setLoading(false);
        return;
      }

      console.log('[SIGNUP] Vérification des mots de passe');
      if (password !== confirmPassword) {
        console.log('[SIGNUP] Mots de passe non correspondants');
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Les mots de passe ne correspondent pas.",
        });
        setLoading(false);
        return;
      }

      console.log('[SIGNUP] Création du code de vérification pour:', email);
      
      // Créer un code de vérification au lieu de créer le compte directement
      const { error } = await supabase.functions.invoke('create-verification-code', {
        body: { email }
      });

      if (error) {
        console.error('[SIGNUP] Erreur création code:', error);
        toast({
          variant: "destructive",
          title: "Erreur d'inscription",
          description: translateAuthError(error.message),
        });
        setLoading(false);
        return;
      }

      // Sauvegarder les données pour la vérification
      setPendingSignupData({
        email,
        password,
        firstName,
        lastName
      });

      console.log('[SIGNUP] Code envoyé avec succès');
      toast({
        title: "Code envoyé !",
        description: "Un code de vérification a été envoyé à votre adresse email. Vérifiez votre boîte de réception.",
        duration: 8000,
      });
      
      // Afficher le formulaire de vérification
      setShowVerificationCode(true);
    } catch (error: any) {
      console.error('[SIGNUP] Exception:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: translateAuthError(error.message) || "Une erreur est survenue lors de l'inscription.",
      });
    } finally {
      console.log('[SIGNUP] Finally - arrêt du loading');
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[VERIFY] Démarrage vérification');
    setLoading(true);

    try {
      if (!pendingSignupData) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Données d'inscription manquantes.",
        });
        setLoading(false);
        return;
      }

      console.log('[VERIFY] Appel verify-code-and-signup');
      const { error } = await supabase.functions.invoke('verify-code-and-signup', {
        body: {
          email: pendingSignupData.email,
          code: verificationCode,
          password: pendingSignupData.password
        }
      });

      if (error) {
        console.error('[VERIFY] Erreur:', error);
        toast({
          variant: "destructive",
          title: "Code invalide",
          description: "Le code de vérification est incorrect ou expiré.",
        });
        setLoading(false);
        return;
      }

      console.log('[VERIFY] Compte créé avec succès, connexion automatique...');
      
      // Connexion automatique après la création du compte
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: pendingSignupData.email,
        password: pendingSignupData.password,
      });

      if (signInError) {
        console.error('[VERIFY] Erreur connexion auto:', signInError);
        toast({
          title: "Compte créé !",
          description: "Votre compte a été créé. Veuillez vous connecter.",
        });
        setActiveTab("login");
        setEmail(pendingSignupData.email);
      } else {
        console.log('[VERIFY] Connexion automatique réussie');
        
        // Événement de conversion Google Ads - Inscription réussie
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'conversion', {
            'send_to': 'AW-974642760/z7Q0CLnYktUDEMi839AD',
            'value': 1.0,
            'currency': 'CAD'
          });
          
          // Google Analytics 4 - Inscription
          (window as any).gtag('event', 'sign_up', {
            'method': 'email'
          });
        }
        
        toast({
          title: "Bienvenue sur Vente.Club !",
          description: "Votre compte a été créé et vous êtes maintenant connecté.",
          duration: 5000,
        });
        
        // Rediriger vers la page d'accueil
        navigate("/");
      }
      
      // Réinitialiser tout
      setShowVerificationCode(false);
      setVerificationCode("");
      setPendingSignupData(null);
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setAcceptedTerms(false);
    } catch (error: any) {
      console.error('[VERIFY] Exception:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la vérification.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!pendingSignupData) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('create-verification-code', {
        body: { email: pendingSignupData.email }
      });

      if (error) throw error;

      toast({
        title: "Code renvoyé !",
        description: "Un nouveau code de vérification a été envoyé à votre email.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de renvoyer le code. Veuillez réessayer.",
      });
    } finally {
      setLoading(false);
    }
  };


  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use custom edge function to send password reset email with custom sender
      const { error } = await supabase.functions.invoke('send-password-reset', {
        body: {
          email: email,
          redirectUrl: `${window.location.origin}/reset-password`
        }
      });

      if (error) throw error;

      toast({
        title: "Email envoyé !",
        description: "Veuillez vérifier votre boîte de réception pour réinitialiser votre mot de passe. Si vous ne recevez pas l'email, vérifiez vos courriels indésirables.",
      });
      setShowResetPassword(false);
      setEmail("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: translateAuthError(error.message),
      });
    } finally {
      setLoading(false);
    }
  };

  const executeRecaptcha = async (action: string): Promise<string | null> => {
    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    if (!siteKey) {
      console.error('reCAPTCHA site key not configured');
      return null;
    }

    return new Promise((resolve) => {
      if (typeof (window as any).grecaptcha === 'undefined') {
        console.error('reCAPTCHA not loaded');
        resolve(null);
        return;
      }

      (window as any).grecaptcha.enterprise.ready(() => {
        (window as any).grecaptcha.enterprise.execute(siteKey, { action }).then((token: string) => {
          resolve(token);
        }).catch((error: any) => {
          console.error('reCAPTCHA execution error:', error);
          resolve(null);
        });
      });
    });
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        }
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur de connexion Google",
        description: translateAuthError(error.message),
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 cursor-pointer" onClick={() => navigate("/")}>
            Vente<span className="text-accent">.Club</span>
          </h1>
          <p className="text-muted-foreground">
            Achetez et vendez des entreprises en toute confiance
          </p>
        </div>

        {showResetPassword ? (
          <div className="bg-card p-8 rounded-2xl shadow-elegant border border-border/50">
            <h2 className="text-2xl font-bold mb-6 text-center">Réinitialiser le mot de passe</h2>
            <p className="text-sm text-muted-foreground mb-6 text-center">
              Entrez votre email pour recevoir un lien de réinitialisation
            </p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <Label htmlFor="reset-email">Email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full mt-2"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Envoi..." : "Envoyer le lien"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowResetPassword(false)}
                className="w-full"
              >
                Retour à la connexion
              </Button>
            </form>
          </div>
        ) : (
          <div className="bg-card p-8 rounded-2xl shadow-elegant border border-border/50">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Connexion</TabsTrigger>
                <TabsTrigger value="signup">Créer un compte</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                {securityWarning && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{securityWarning}</AlertDescription>
                  </Alert>
                )}
                
                {show2FAPrompt ? (
                  <form onSubmit={handleVerify2FA} className="space-y-4">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-semibold">Authentification à deux facteurs</h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        Entrez le code à 6 chiffres de votre application d'authentification
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="2fa-code">Code d'authentification</Label>
                      <Input
                        id="2fa-code"
                        type="text"
                        maxLength={6}
                        placeholder="000000"
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                        required
                        className="w-full mt-2 text-center text-2xl tracking-widest"
                        autoFocus
                      />
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        Code à 6 chiffres
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                      <Checkbox
                        id="trust-device"
                        checked={trustDevice}
                        onCheckedChange={(checked) => setTrustDevice(checked as boolean)}
                      />
                      <Label
                        htmlFor="trust-device"
                        className="text-sm cursor-pointer"
                      >
                        Faire confiance à cet appareil pendant 30 jours
                      </Label>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShow2FAPrompt(false);
                          setTwoFactorCode("");
                          setMfaFactorId(null);
                          setMfaChallengeId(null);
                        }}
                        className="flex-1"
                      >
                        Annuler
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={loading || twoFactorCode.length !== 6} 
                        className="flex-1"
                        variant="secondary"
                      >
                        {loading ? "Vérification..." : "Vérifier"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="login-password">Mot de passe</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Votre mot de passe"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full mt-2"
                    />
                  </div>
                  
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setShowResetPassword(true)}
                    className="w-full text-sm text-accent hover:text-accent/80 p-0 h-auto"
                  >
                    Mot de passe oublié ?
                  </Button>
                  
                  <div ref={recaptchaRef} className="g-recaptcha" data-sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY} data-action="LOGIN"></div>
                  
                  <Button 
                    type="submit" 
                    disabled={loading || fpLoading} 
                    className="w-full"
                    variant="secondary"
                  >
                    {loading ? "Connexion..." : "Se connecter"}
                  </Button>
                  
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <Separator />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Ou continuer avec</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoogleSignIn}
                    className="w-full"
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    Google
                  </Button>
                </form>
                )}
              </TabsContent>
              
              <TabsContent value="signup">
                {securityWarning && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{securityWarning}</AlertDescription>
                  </Alert>
                )}
                
                {showVerificationCode ? (
                  <form onSubmit={handleVerifyCode} className="space-y-4">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-semibold mb-2">Vérifiez votre email</h3>
                      <p className="text-sm text-muted-foreground">
                        Un code de vérification a été envoyé à <strong>{pendingSignupData?.email}</strong>
                      </p>
                      <p className="text-sm text-muted-foreground mt-3">
                        <strong className="text-foreground">N'oubliez pas de vérifier vos courriels indésirables</strong>
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="verification-code">Code de vérification</Label>
                      <Input
                        id="verification-code"
                        type="text"
                        maxLength={6}
                        placeholder="000000"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                        required
                        className="w-full mt-2 text-center text-2xl tracking-widest font-mono"
                      />
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        Entrez le code à 6 chiffres reçu par email
                      </p>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={loading || verificationCode.length !== 6} 
                      className="w-full"
                      variant="secondary"
                    >
                      {loading ? "Vérification..." : "Vérifier et créer le compte"}
                    </Button>

                    <div className="text-center space-y-2">
                      <Button
                        type="button"
                        variant="link"
                        onClick={handleResendCode}
                        disabled={loading}
                        className="text-sm"
                      >
                        Renvoyer le code
                      </Button>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setShowVerificationCode(false);
                          setVerificationCode("");
                          setPendingSignupData(null);
                        }}
                        className="w-full text-sm"
                      >
                        Retour
                      </Button>
                    </div>
                  </form>
                ) : (
                  // Formulaire d'inscription
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="signup-firstname">Prénom</Label>
                        <Input
                          id="signup-firstname"
                          type="text"
                          placeholder="Julie"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          className="w-full mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="signup-lastname">Nom</Label>
                        <Input
                          id="signup-lastname"
                          type="text"
                          placeholder="Tremblay"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                          className="w-full mt-2"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="votre@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="signup-password">Mot de passe</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Créez un mot de passe sécurisé"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        className="w-full mt-2"
                      />
                      <div className="mt-2 space-y-1 text-xs">
                        <p className="font-medium text-muted-foreground">Le mot de passe doit contenir :</p>
                        <div className="grid grid-cols-2 gap-1">
                          <div className={`flex items-center gap-1 ${password.length >= 8 ? 'text-green-600' : 'text-muted-foreground'}`}>
                            <span>{password.length >= 8 ? '✓' : '○'}</span>
                            <span>8 caractères minimum</span>
                          </div>
                          <div className={`flex items-center gap-1 ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-muted-foreground'}`}>
                            <span>{/[A-Z]/.test(password) ? '✓' : '○'}</span>
                            <span>Une majuscule</span>
                          </div>
                          <div className={`flex items-center gap-1 ${/[a-z]/.test(password) ? 'text-green-600' : 'text-muted-foreground'}`}>
                            <span>{/[a-z]/.test(password) ? '✓' : '○'}</span>
                            <span>Une minuscule</span>
                          </div>
                          <div className={`flex items-center gap-1 ${/[0-9]/.test(password) ? 'text-green-600' : 'text-muted-foreground'}`}>
                            <span>{/[0-9]/.test(password) ? '✓' : '○'}</span>
                            <span>Un chiffre</span>
                          </div>
                          <div className={`flex items-center gap-1 col-span-2 ${/[^A-Za-z0-9]/.test(password) ? 'text-green-600' : 'text-muted-foreground'}`}>
                            <span>{/[^A-Za-z0-9]/.test(password) ? '✓' : '○'}</span>
                            <span>Un caractère spécial (!@#$%^&*...)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirmez votre mot de passe"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                        className="w-full mt-2"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3 p-4 bg-muted/50 border border-border rounded-lg">
                        <Checkbox
                          id="terms"
                          checked={acceptedTerms}
                          onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <Label
                            htmlFor="terms"
                            className="text-sm leading-relaxed cursor-pointer"
                          >
                            J'ai lu et j'accepte les{" "}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                window.open('/terms', '_blank');
                              }}
                              className="text-primary font-medium underline hover:text-primary/80"
                            >
                              conditions d'utilisation
                            </button>
                            {" "}et je reconnais que Vente.Club n'est aucunement responsable des annonces publiées sur la plateforme.
                          </Label>
                        </div>
                      </div>
                    </div>

                    <div ref={recaptchaRef} className="g-recaptcha" data-sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY} data-action="SIGNUP"></div>

                    <Button 
                      type="submit" 
                      disabled={loading || !acceptedTerms || fpLoading} 
                      className="w-full"
                      variant="secondary"
                    >
                      {loading ? "Envoi du code..." : "Créer un compte"}
                    </Button>
                    
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <Separator />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Ou continuer avec</span>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleGoogleSignIn}
                      className="w-full"
                    >
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                      Google
                    </Button>
                  </form>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        <div className="mt-6 text-center">
          <Button variant="ghost" onClick={() => navigate("/")}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
