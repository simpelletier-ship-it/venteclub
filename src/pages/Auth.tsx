import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { authSchema } from "@/lib/validations";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate with Zod
      const validatedData = authSchema.parse({ email, password });

      // Try to sign in first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (signInError) {
        // If user not found, create account
        if (signInError.message.includes('Invalid login credentials')) {
          const { error: signUpError } = await supabase.auth.signUp({
            email: validatedData.email,
            password: validatedData.password,
            options: {
              emailRedirectTo: `${window.location.origin}/`,
            },
          });
          
          if (signUpError) throw signUpError;
          
          toast({
            title: "Compte créé avec succès !",
            description: "Vous êtes maintenant connecté.",
          });
          navigate("/");
        } else {
          throw signInError;
        }
      } else {
        toast({
          title: "Connexion réussie !",
          description: "Bienvenue sur Vente.Club",
        });
        navigate("/");
      }
    } catch (error: any) {
      if (error.errors) {
        // Zod validation errors
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

        <div className="bg-card p-8 rounded-2xl shadow-elegant border border-border/50">
          <h2 className="text-2xl font-bold mb-6 text-center">Connexion</h2>
          <p className="text-sm text-muted-foreground mb-6 text-center">
            Entrez vos informations. Un compte sera créé automatiquement si vous êtes nouveau.
          </p>
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Mot de passe
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 8 caractères"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Chargement..." : "Continuer"}
            </Button>
          </form>
        </div>

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
