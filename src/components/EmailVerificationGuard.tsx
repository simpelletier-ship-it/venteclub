import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Mail, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

export const EmailVerificationGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [resending, setResending] = useState(false);

  const handleResendEmail = async () => {
    if (!user?.email) return;
    
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/email-confirmed`
        }
      });

      if (error) throw error;
      
      toast.success("Email de confirmation renvoyé avec succès!");
    } catch (error: any) {
      toast.error("Erreur lors de l'envoi de l'email: " + error.message);
    } finally {
      setResending(false);
    }
  };

  if (loading) {
    return null;
  }

  // Si l'utilisateur est connecté MAIS l'email n'est pas confirmé, bloquer TOUT accès
  if (user && !user.email_confirmed_at) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <Mail className="h-16 w-16 mx-auto text-primary mb-4" />
            <h1 className="text-3xl font-bold mb-2">Confirmez votre email</h1>
            <p className="text-muted-foreground">
              Pour accéder à toutes les fonctionnalités de Vente.Club, vous devez d'abord confirmer votre adresse email.
            </p>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Email de confirmation envoyé</AlertTitle>
            <AlertDescription>
              Nous avons envoyé un email de confirmation à <strong>{user.email}</strong>.
              Veuillez cliquer sur le lien dans l'email pour activer votre compte.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <Button 
              onClick={handleResendEmail}
              disabled={resending}
              className="w-full"
              variant="outline"
            >
              {resending ? "Envoi en cours..." : "Renvoyer l'email de confirmation"}
            </Button>

            <Button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/auth";
              }}
              variant="ghost"
              className="w-full"
            >
              Se déconnecter
            </Button>
          </div>

          <div className="text-sm text-muted-foreground text-center space-y-2">
            <p>
              Vous n'avez pas reçu l'email ? Vérifiez votre dossier spam ou cliquez sur "Renvoyer l'email de confirmation".
            </p>
            <p className="text-xs">
              L'email peut prendre quelques minutes à arriver.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Email confirmé OU utilisateur non connecté : autoriser l'accès
  return <>{children}</>;
};
