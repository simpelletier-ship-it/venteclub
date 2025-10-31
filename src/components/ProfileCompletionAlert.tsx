import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProfileCompletionAlertProps {
  profile: any;
}

export const ProfileCompletionAlert = ({ profile }: ProfileCompletionAlertProps) => {
  const navigate = useNavigate();
  
  const isProfileIncomplete = !profile?.first_name || !profile?.last_name || !profile?.phone;
  
  if (!isProfileIncomplete) return null;
  
  return (
    <Alert className="mb-4 border-primary/50 bg-primary/5">
      <Info className="h-4 w-4 text-primary" />
      <AlertTitle className="text-foreground font-semibold">Complétez votre profil</AlertTitle>
      <AlertDescription className="text-sm text-muted-foreground">
        Votre profil sera visible par le vendeur. Un profil complet inspire confiance et facilite les échanges.
        <Button
          variant="link"
          className="p-0 h-auto ml-2 text-primary"
          onClick={() => navigate('/settings')}
        >
          Compléter maintenant
        </Button>
      </AlertDescription>
    </Alert>
  );
};
