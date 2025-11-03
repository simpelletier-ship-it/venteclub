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
];

export const QuickMessageTemplates = ({ onSelectTemplate }: QuickMessageTemplatesProps) => {
  return (
    <Card className="p-3 bg-gradient-to-br from-muted/40 to-muted/20 backdrop-blur-sm border-dashed border-border/60 shadow-sm">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="p-1 rounded-lg bg-primary/10">
          <MessageSquare className="w-3.5 h-3.5 text-primary" />
        </div>
        <h4 className="text-xs font-bold text-foreground">Messages rapides</h4>
      </div>
      <p className="text-[10px] text-muted-foreground/80 mb-2.5 font-medium">
        Gagnez du temps avec ces modèles :
      </p>
      <div className="grid gap-1.5">
        {templates.map((template, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="justify-start text-left h-auto py-2 px-2.5 text-xs whitespace-normal hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all"
            onClick={() => onSelectTemplate(template)}
          >
            <span className="line-clamp-2">{template}</span>
          </Button>
        ))}
      </div>
    </Card>
  );
};
