import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Info, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProfileCompletionAlertProps {
  profile: any;
}

export const ProfileCompletionAlert = ({ profile }: ProfileCompletionAlertProps) => {
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);
  
  const isProfileIncomplete = !profile?.first_name || !profile?.last_name || !profile?.phone;
  
  if (!isProfileIncomplete || isDismissed) return null;
  
  return (
    <Alert className="mb-4 border-primary/50 bg-primary/5 relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6"
        onClick={() => setIsDismissed(true)}
      >
        <X className="h-4 w-4" />
      </Button>
      <Info className="h-4 w-4 text-primary" />
      <AlertTitle className="text-foreground font-semibold pr-8">Complétez votre profil</AlertTitle>
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
