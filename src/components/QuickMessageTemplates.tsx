import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

interface QuickMessageTemplatesProps {
  onSelectTemplate: (message: string) => void;
}

const templates = [
  "Bonjour, je suis intéressé par votre entreprise. Pouvez-vous me fournir plus d'informations?",
  "Est-ce que l'entreprise est toujours disponible?",
  "J'aimerais planifier une rencontre pour discuter de l'opportunité.",
  "Pourriez-vous me partager plus de détails financiers?",
  "Quel est votre prix final pour cette entreprise?",
  "Y a-t-il des employés en place?",
];

export const QuickMessageTemplates = ({ onSelectTemplate }: QuickMessageTemplatesProps) => {
  return (
    <Card className="p-4 bg-muted/30 border-dashed">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-semibold text-foreground">Messages rapides</h4>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Cliquez sur un message pour l'utiliser :
      </p>
      <div className="grid gap-2">
        {templates.map((template, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="justify-start text-left h-auto py-2 px-3 whitespace-normal"
            onClick={() => onSelectTemplate(template)}
          >
            {template}
          </Button>
        ))}
      </div>
    </Card>
  );
};
