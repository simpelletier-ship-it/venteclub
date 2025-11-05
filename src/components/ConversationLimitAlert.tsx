import { AlertCircle, Crown, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface ConversationLimitAlertProps {
  conversationsRemaining: number;
  hasPremium: boolean;
  nextResetDate?: Date;
}

export const ConversationLimitAlert = ({ 
  conversationsRemaining, 
  hasPremium,
  nextResetDate 
}: ConversationLimitAlertProps) => {
  const navigate = useNavigate();

  if (hasPremium) {
    return null; // N'afficher rien si l'utilisateur a Premium
  }

  const getDaysUntilReset = () => {
    if (!nextResetDate) {
      // Calculer le prochain reset (début du mois prochain)
      const now = new Date();
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const diffTime = nextMonth.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
    
    const now = new Date();
    const diffTime = nextResetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilReset = getDaysUntilReset();

  return (
    <Alert className="border-primary/50 bg-gradient-to-r from-primary/5 via-accent/5 to-secondary/5">
      <AlertCircle className="h-5 w-5 text-primary" />
      <AlertTitle className="flex items-center gap-2 mb-3">
        <span>Accès Gratuit Limité</span>
        <Badge variant="outline" className="ml-auto">
          {conversationsRemaining}/3 chats restants
        </Badge>
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <div className="text-sm space-y-2">
          <p className="font-medium">
            🔒 Vous êtes limité à <strong>3 conversations par mois</strong> avec le plan gratuit.
          </p>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              Réinitialisation dans <strong>{daysUntilReset} jour{daysUntilReset > 1 ? 's' : ''}</strong>
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
                <li>✓ Conversations illimitées</li>
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