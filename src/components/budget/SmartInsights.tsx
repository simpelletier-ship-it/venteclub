import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Lightbulb, 
  ArrowRight,
  DollarSign,
  PiggyBank,
  Trophy,
  AlertTriangle,
  Sparkles,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface Insight {
  id: string;
  type: "saving" | "warning" | "opportunity" | "achievement";
  title: string;
  description: string;
  action?: string;
  actionRoute?: string;
  potentialSavings?: number;
  priority: "high" | "medium" | "low";
}

export const SmartInsights = () => {
  const navigate = useNavigate();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const allInsights: Insight[] = [
    {
      id: "1",
      type: "saving",
      title: "Abonnements inutilisés",
      description: "2 abonnements non utilisés depuis 60+ jours",
      action: "Réviser",
      actionRoute: "/budget/analyses?section=abonnements",
      potentialSavings: 32,
      priority: "high",
    },
    {
      id: "2",
      type: "opportunity",
      title: "Épargne automatique",
      description: "Potentiel de 150$/mois sans impact",
      action: "Configurer",
      actionRoute: "/budget/objectifs",
      potentialSavings: 150,
      priority: "high",
    },
    {
      id: "3",
      type: "warning",
      title: "Restaurants en hausse",
      description: "+45% vs mois dernier",
      action: "Détails",
      actionRoute: "/budget/historique?category=restaurant",
      priority: "medium",
    },
    {
      id: "4",
      type: "achievement",
      title: "Objectif atteint!",
      description: "75% du fonds d'urgence",
      action: "Voir",
      actionRoute: "/budget/objectifs",
      priority: "low",
    },
    {
      id: "5",
      type: "saving",
      title: "Optimiser paiement",
      description: "Payez le 25 pour économiser 12$",
      action: "Gérer",
      actionRoute: "/budget/valeur-nette",
      potentialSavings: 12,
      priority: "medium",
    },
  ];

  const insights = allInsights.filter(i => !dismissedIds.includes(i.id));

  const getIcon = (type: Insight["type"]) => {
    switch (type) {
      case "saving":
        return <DollarSign className="w-4 h-4" />;
      case "warning":
        return <AlertTriangle className="w-4 h-4" />;
      case "opportunity":
        return <Sparkles className="w-4 h-4" />;
      case "achievement":
        return <Trophy className="w-4 h-4" />;
    }
  };

  const getColors = (type: Insight["type"]) => {
    switch (type) {
      case "saving":
        return "bg-primary/10 text-primary border-primary/20";
      case "warning":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "opportunity":
        return "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20";
      case "achievement":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    }
  };

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => [...prev, id]);
  };

  const totalPotentialSavings = insights
    .filter((i) => i.potentialSavings)
    .reduce((acc, i) => acc + (i.potentialSavings || 0), 0);

  if (insights.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-30" />
        Aucune recommandation pour le moment
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header compact */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-primary/10 text-primary border-0 text-xs">
            <PiggyBank className="w-3 h-3 mr-1" />
            {totalPotentialSavings}$/mois
          </Badge>
        </div>
        <span className="text-xs text-muted-foreground">{insights.length} conseil(s)</span>
      </div>

      {/* Scrollable insights */}
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-2">
          <AnimatePresence mode="popLayout">
            {insights.map((insight) => (
              <motion.div
                key={insight.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, x: -20 }}
                className={cn(
                  "relative flex-shrink-0 w-[260px] p-4 rounded-xl border transition-all hover:shadow-md",
                  getColors(insight.type)
                )}
              >
                {/* Dismiss button */}
                <button
                  onClick={() => handleDismiss(insight.id)}
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-background/50 transition-colors opacity-60 hover:opacity-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-background/80 shadow-sm">
                    {getIcon(insight.type)}
                  </div>
                  <div className="flex-1 min-w-0 pr-4">
                    <h4 className="font-semibold text-sm truncate">{insight.title}</h4>
                    <p className="text-xs opacity-80 line-clamp-2 mt-0.5">
                      {insight.description}
                    </p>
                    {insight.action && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 px-2 gap-1 mt-2 text-xs -ml-2"
                        onClick={() => insight.actionRoute && navigate(insight.actionRoute)}
                      >
                        {insight.action}
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {insight.potentialSavings && (
                  <Badge className="absolute bottom-3 right-3 bg-background/80 text-foreground border-0 text-[10px]">
                    +{insight.potentialSavings}$
                  </Badge>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};
