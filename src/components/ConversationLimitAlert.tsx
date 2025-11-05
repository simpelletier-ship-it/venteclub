import { AlertCircle, Crown, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface ConversationLimitAlertProps {
  conversationsRemaining: number;
  hasClubSelect: boolean;
  hoursUntilReset?: number;
  minutesUntilReset?: number;
}

export const ConversationLimitAlert = ({ 
  conversationsRemaining, 
  hasClubSelect,
  hoursUntilReset = 0,
  minutesUntilReset = 0
}: ConversationLimitAlertProps) => {
  const navigate = useNavigate();

  if (hasClubSelect) {
    return null; // N'afficher rien si l'utilisateur a Club Select
  }

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
            🔒 Vous êtes limité à <strong>1 conversation toutes les 24 heures</strong> avec le plan gratuit.
          </p>
          
          {conversationsRemaining === 0 && hoursUntilReset !== undefined && minutesUntilReset !== undefined && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                Prochaine conversation disponible dans <strong>{hoursUntilReset}h {minutesUntilReset}min</strong>
              </span>
            </div>
          )}

          <p className="text-muted-foreground text-xs">
            📧 Les coordonnées des vendeurs restent cachées. Seuls les membres Club Select ont accès aux emails et téléphones.
          </p>
        </div>

        <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-3">
          <div className="flex items-start gap-3">
            <Crown className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="font-semibold text-sm">
                Rejoignez le Club Select pour 19,99$/mois
              </p>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>✓ Conversations illimitées</li>
                <li>✓ Accès aux coordonnées de TOUS les vendeurs</li>
                <li>✓ Chat illimité</li>
              </ul>
              <Button 
                size="sm" 
                onClick={() => navigate('/dashboard?tab=club-select')}
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                Rejoindre le Club Select
              </Button>
            </div>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};