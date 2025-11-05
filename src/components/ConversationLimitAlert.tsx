import { AlertCircle, Crown, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface ConversationLimitAlertProps {
  conversationsRemaining: number;
  hasPremium: boolean;
}

export const ConversationLimitAlert = ({ 
  conversationsRemaining, 
  hasPremium
}: ConversationLimitAlertProps) => {
  const navigate = useNavigate();

  if (hasPremium) {
    return null; // N'afficher rien si l'utilisateur a Premium
  }

  const getTimeUntilReset = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const diffMs = tomorrow.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours: diffHours, minutes: diffMinutes };
  };

  const { hours, minutes } = getTimeUntilReset();

  return (
    <Alert className="border-primary/50 bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5">
      <AlertCircle className="h-5 w-5 text-primary" />
      <AlertTitle className="flex items-center gap-2 mb-3">
        <span>Accès Gratuit Limité</span>
        <Badge variant="outline" className="ml-auto">
          {conversationsRemaining}/1 chat restant
        </Badge>
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <div className="text-sm space-y-2">
          <p className="font-medium">
            🔒 Vous êtes limité à <strong>1 conversation par jour</strong> avec le plan gratuit.
          </p>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              Réinitialisation dans <strong>{hours}h {minutes}min</strong>
            </span>
          </div>

          <p className="text-muted-foreground text-xs">
            📧 Les coordonnées des vendeurs restent cachées. Seuls les abonnés Premium ont accès aux emails et téléphones.
          </p>
        </div>

        <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-3">
          <div className="flex items-start gap-3">
            <Crown className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="font-semibold text-sm">
                Passez à Premium pour 19,99$/mois
              </p>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>✓ Conversations illimitées par jour</li>
                <li>✓ Accès aux coordonnées de TOUS les vendeurs</li>
                <li>✓ Chat illimité</li>
              </ul>
              <Button 
                size="sm" 
                onClick={() => navigate('/dashboard?tab=premium')}
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                Débloquer Premium
              </Button>
            </div>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};