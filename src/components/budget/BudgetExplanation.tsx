import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export const BudgetExplanation = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const dismissed = localStorage.getItem('budgetExplanationDismissed');
    if (dismissed === 'true') {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('budgetExplanationDismissed', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <Card className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleDismiss}
        className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-destructive/10"
      >
        <X className="h-4 w-4" />
      </Button>
      <CardContent className="p-4 lg:p-6 pr-10">
        <h2 className="text-lg lg:text-xl font-semibold mb-3">💡 C'est quoi un budget et pourquoi c'est important?</h2>
        <div className="space-y-3 text-sm lg:text-base text-muted-foreground">
          <p>
            <strong>Un budget</strong> est simplement un plan qui vous montre <strong>où va votre argent</strong> chaque mois. 
            C'est comme une carte routière pour vos finances : vous voyez d'où vient votre argent (salaire, revenus) 
            et où il part (loyer, épicerie, sorties, etc.).
          </p>
          <p>
            <strong>Pourquoi faire un budget?</strong> Parce que ça vous permet de <strong>reprendre le contrôle</strong> de votre argent! 
            Vous saurez exactement combien vous pouvez dépenser sans stress, combien vous économisez pour vos projets 
            (vacances, maison, auto) et vous éviterez les mauvaises surprises en fin de mois.
          </p>
          <p className="flex items-start gap-2">
            <span>🎯</span>
            <span>
              <strong>Notre planificateur vous aide</strong> en suivant automatiquement vos dépenses, 
              en vous montrant des graphiques clairs, en vous donnant des conseils personnalisés et en rendant 
              la gestion de vos finances amusante avec des objectifs et des récompenses!
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
