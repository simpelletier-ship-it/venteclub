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
import { DisclaimerAlert } from "@/components/DisclaimerAlert";
import ReCAPTCHA from "react-google-recaptcha";
import { useFingerprint } from "@/hooks/useFingerprint";
import { Shield, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Clé publique reCAPTCHA v2
const RECAPTCHA_SITE_KEY = "6Lf93wMsAAAAAKlX6GeEsPfLuM7fTmgbBRlh4HcT";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { fingerprint, loading: fpLoading } = useFingerprint();
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);

  useEffect(() => {
    // Vérifier la session existante
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });

    // Écouter les changements d'authentification (important pour le callback Google)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        toast({
          title: "Connexion réussie !",
          description: "Bienvenue sur Vente.Club",
        });
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSecurityWarning(null);

    try {
      // Valider les données
      const validatedData = loginSchema.parse({ email, password });

      // Vérifier reCAPTCHA
      if (!recaptchaToken) {
        toast({
          variant: "destructive",
          title: "Vérification requise",
          description: "Veuillez compléter la vérification de sécurité.",
        });
        setLoading(false);
        return;
      }

      // Vérifier le reCAPTCHA côté serveur
      const { data: recaptchaResult } = await supabase.functions.invoke('verify-recaptcha', {
        body: { token: recaptchaToken }
      });

      if (!recaptchaResult?.success) {
        toast({
          variant: "destructive",
          title: "Vérification échouée",
          description: "La vérification de sécurité a échoué. Veuillez réessayer.",
        });
        recaptchaRef.current?.reset();
        setRecaptchaToken(null);
        setLoading(false);
        return;
      }

      // Vérifier rate limiting
      const { data: rateLimitCheck } = await supabase.functions.invoke('check-rate-limit', {
        body: {
          identifier: validatedData.email,
          identifierType: 'email',
          actionType: 'login'
        }
      });

      if (rateLimitCheck && !rateLimitCheck.allowed) {
        toast({
          variant: "destructive",
          title: "Trop de tentatives",
          description: `Vous avez dépassé la limite de tentatives. Veuillez réessayer dans ${rateLimitCheck.minutesRemaining || 15} minutes.`,
          duration: 10000,
        });
        setLoading(false);
        return;
      }

      // Tenter la connexion
      const { error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Erreur de connexion",
          description: "Email ou mot de passe incorrect.",
        });
        recaptchaRef.current?.reset();
        setRecaptchaToken(null);
        setLoading(false);
        return;
      }

      // Enregistrer le fingerprint après connexion réussie
      if (fingerprint) {
        await supabase.functions.invoke('register-fingerprint', {
          body: {
            fingerprintHash: fingerprint.hash,
            ipAddress: null, // L'edge function le récupérera
            userAgent: fingerprint.components.userAgent,
            screenResolution: fingerprint.components.screenResolution,
            timezone: fingerprint.components.timezone,
            language: fingerprint.components.language,
            platform: fingerprint.components.platform
          }
        });
      }

      toast({
        title: "Connexion réussie !",
        description: "Bienvenue sur Vente.Club",
      });
      navigate("/");
    } catch (error: any) {
      if (error.errors) {
        error.errors.forEach((err: any) => {
          toast({
            variant: "destructive",
            title: "Erreur de validation",
            description: err.message,
          });
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: error.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSecurityWarning(null);

    try {
      if (!acceptedTerms) {
        toast({
          variant: "destructive",
          title: "Conditions non acceptées",
          description: "Vous devez accepter les conditions d'utilisation pour créer un compte.",
        });
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Les mots de passe ne correspondent pas.",
        });
        setLoading(false);
        return;
      }

      // Valider les données
      const validatedData = signupSchema.parse({ email, password });

      // Vérifier reCAPTCHA
      if (!recaptchaToken) {
        toast({
          variant: "destructive",
          title: "Vérification requise",
          description: "Veuillez compléter la vérification de sécurité.",
        });
        setLoading(false);
        return;
      }

      // Vérifier le reCAPTCHA côté serveur
      const { data: recaptchaResult } = await supabase.functions.invoke('verify-recaptcha', {
        body: { token: recaptchaToken }
      });

      if (!recaptchaResult?.success) {
        toast({
          variant: "destructive",
          title: "Vérification échouée",
          description: "La vérification de sécurité a échoué. Veuillez réessayer.",
        });
        recaptchaRef.current?.reset();
        setRecaptchaToken(null);
        setLoading(false);
        return;
      }

      // Vérifier le fingerprint pour détecter les comptes multiples
      if (fingerprint) {
        const { data: fingerprintCheck } = await supabase.functions.invoke('check-fingerprint', {
          body: {
            fingerprintHash: fingerprint.hash,
            ipAddress: null,
            userAgent: fingerprint.components.userAgent,
            screenResolution: fingerprint.components.screenResolution,
            timezone: fingerprint.components.timezone,
            language: fingerprint.components.language,
            platform: fingerprint.components.platform,
            email: validatedData.email
          }
        });

        if (fingerprintCheck && fingerprintCheck.suspicious) {
          setSecurityWarning(
            `Activité suspecte détectée: ${fingerprintCheck.suspicionReasons.join(', ')}. Vérification supplémentaire requise.`
          );
          
          // Si très suspect, bloquer
          if (fingerprintCheck.suspicionReasons.length > 1) {
            toast({
              variant: "destructive",
              title: "Création de compte bloquée",
              description: "Activité suspecte détectée. Veuillez contacter le support.",
              duration: 10000,
            });
            setLoading(false);
            return;
          }
        }
      }

      // Vérifier rate limiting
      const { data: rateLimitCheck } = await supabase.functions.invoke('check-rate-limit', {
        body: {
          identifier: validatedData.email,
          identifierType: 'email',
          actionType: 'signup'
        }
      });

      if (rateLimitCheck && !rateLimitCheck.allowed) {
        toast({
          variant: "destructive",
          title: "Trop de tentatives",
          description: `Limite de création de comptes atteinte. Veuillez réessayer dans ${rateLimitCheck.minutesRemaining || 60} minutes.`,
          duration: 10000,
        });
        setLoading(false);
        return;
      }

      // Créer le code de vérification
      const { error } = await supabase.functions.invoke('create-verification-code', {
        body: { email: validatedData.email }
      });

      if (error) {
        throw error;
      }

      setVerificationStep(true);
      toast({
        title: "Code envoyé !",
        description: "Nous vous avons envoyé un code de vérification par courriel. Merci de consulter vos pourriels.",
        duration: 8000,
      });
    } catch (error: any) {
      if (error.errors) {
        error.errors.forEach((err: any) => {
          toast({
            variant: "destructive",
            title: "Erreur de validation",
            description: err.message,
          });
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: error.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Vérifier le code et créer le compte
      const { data, error } = await supabase.functions.invoke('verify-code-and-signup', {
        body: {
          email,
          code: verificationCode,
          password
        }
      });

      if (error) {
        if (error.message.includes('invalide') || error.message.includes('expiré')) {
          toast({
            variant: "destructive",
            title: "Code invalide",
            description: "Le code que vous avez entré est invalide ou expiré. Veuillez réessayer.",
          });
        } else {
          throw error;
        }
        return;
      }

      // Maintenant se connecter avec les credentials
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      // Enregistrer le fingerprint après signup réussi
      if (fingerprint) {
        await supabase.functions.invoke('register-fingerprint', {
          body: {
            fingerprintHash: fingerprint.hash,
            ipAddress: null,
            userAgent: fingerprint.components.userAgent,
            screenResolution: fingerprint.components.screenResolution,
            timezone: fingerprint.components.timezone,
            language: fingerprint.components.language,
            platform: fingerprint.components.platform
          }
        });
      }

      toast({
        title: "Compte vérifié avec succès !",
        description: "Vous êtes maintenant connecté.",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
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
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
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
        title: "Erreur",
        description: error.message,
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
            <Tabs defaultValue="login" className="w-full">
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
                  
                  {/* reCAPTCHA */}
                  <div className="flex justify-center">
                    <ReCAPTCHA
                      ref={recaptchaRef}
                      sitekey={RECAPTCHA_SITE_KEY}
                      onChange={(token) => setRecaptchaToken(token)}
                      onExpired={() => setRecaptchaToken(null)}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span>Connexion sécurisée avec protection anti-robot</span>
                  </div>
                  
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setShowResetPassword(true)}
                    className="w-full text-sm text-accent hover:text-accent/80 p-0 h-auto"
                  >
                    Mot de passe oublié ?
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading || !recaptchaToken || fpLoading} 
                    className="w-full"
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
              </TabsContent>
              
              <TabsContent value="signup">
                {verificationStep ? (
                  <form onSubmit={handleVerifyCode} className="space-y-4">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-semibold mb-2">Code de vérification</h3>
                      <p className="text-sm text-muted-foreground">
                        Nous vous avons envoyé un code de vérification par courriel. Merci de consulter vos pourriels.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="verification-code">Code de vérification</Label>
                      <Input
                        id="verification-code"
                        type="text"
                        placeholder="Entrez le code à 6 chiffres"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        required
                        maxLength={6}
                        className="w-full mt-2 text-center text-2xl tracking-widest font-mono"
                      />
                    </div>
                    <Button type="submit" disabled={loading || verificationCode.length !== 6} className="w-full">
                      {loading ? "Vérification..." : "Vérifier le code"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setVerificationStep(false);
                        setVerificationCode("");
                      }}
                      className="w-full"
                    >
                      Retour
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleSignUp} className="space-y-4">
                  {securityWarning && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{securityWarning}</AlertDescription>
                    </Alert>
                  )}
                  <DisclaimerAlert />
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
                      placeholder="Minimum 8 caractères"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="w-full mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Le mot de passe doit contenir au moins 8 caractères
                    </p>
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
                  
                  {/* reCAPTCHA */}
                  <div className="flex justify-center">
                    <ReCAPTCHA
                      ref={recaptchaRef}
                      sitekey={RECAPTCHA_SITE_KEY}
                      onChange={(token) => setRecaptchaToken(token)}
                      onExpired={() => setRecaptchaToken(null)}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span>Protection avancée contre les comptes multiples et les robots</span>
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

                  <Button 
                    type="submit" 
                    disabled={loading || !acceptedTerms || !recaptchaToken || fpLoading} 
                    className="w-full"
                  >
                    {loading ? "Envoi du code..." : "Recevoir le code de vérification"}
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
