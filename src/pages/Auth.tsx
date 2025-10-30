import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { authSchema } from "@/lib/validations";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validatedData = authSchema.parse({ email, password });

      // Vérifier si le compte est verrouillé
      const { data: attemptCheck } = await supabase.functions.invoke('check-login-attempt', {
        body: {
          email: validatedData.email,
          success: false,
          ip_address: 'web',
          user_agent: navigator.userAgent
        }
      });

      if (attemptCheck?.locked) {
        toast({
          variant: "destructive",
          title: "Compte temporairement verrouillé",
          description: attemptCheck.message,
          duration: 10000,
        });
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (error) {
        // Enregistrer l'échec et récupérer le nombre de tentatives restantes
        const { data: failureCheck } = await supabase.functions.invoke('check-login-attempt', {
          body: {
            email: validatedData.email,
            success: false,
            failure_reason: error.message,
            ip_address: 'web',
            user_agent: navigator.userAgent
          }
        });

        // Afficher le nombre de tentatives restantes seulement en cas d'échec
        if (failureCheck?.remaining_attempts !== undefined && failureCheck.remaining_attempts < 3) {
          toast({
            variant: "destructive",
            title: "Attention",
            description: failureCheck.message,
            duration: 5000,
          });
        } else if (error.message.includes('Invalid login credentials')) {
          toast({
            variant: "destructive",
            title: "Erreur de connexion",
            description: "Email ou mot de passe incorrect.",
          });
        } else if (error.message.includes('Email not confirmed')) {
          toast({
            variant: "destructive",
            title: "Email non confirmé",
            description: "Veuillez vérifier votre boîte de réception pour confirmer votre email.",
          });
        } else {
          throw error;
        }
        return;
      }

      // Enregistrer le succès
      await supabase.functions.invoke('check-login-attempt', {
        body: {
          email: validatedData.email,
          success: true,
          ip_address: 'web',
          user_agent: navigator.userAgent
        }
      });

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

      const validatedData = authSchema.parse({ email, password });

      // Appeler l'edge function pour créer et envoyer le code
      const { error } = await supabase.functions.invoke('create-verification-code', {
        body: { email: validatedData.email }
      });

      if (error) {
        throw error;
      }

      // Passer à l'étape de vérification
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
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Connexion..." : "Se connecter"}
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

                  <Button type="submit" disabled={loading || !acceptedTerms} className="w-full">
                    {loading ? "Envoi du code..." : "Recevoir le code de vérification"}
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
