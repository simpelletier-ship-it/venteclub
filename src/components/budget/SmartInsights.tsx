import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Lightbulb, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  DollarSign,
  PiggyBank
} from "lucide-react";
import { motion } from "framer-motion";

interface Insight {
  id: string;
  type: "saving" | "warning" | "opportunity" | "achievement";
  title: string;
  description: string;
  action?: string;
  potentialSavings?: number;
  priority: "high" | "medium" | "low";
}

export const SmartInsights = () => {
  const insights: Insight[] = [
    {
      id: "1",
      type: "saving",
      title: "Abonnements inutilisés détectés",
      description: "Vous avez 2 abonnements que vous n'avez pas utilisés depuis 60+ jours: Netflix, Spotify.",
      action: "Réviser mes abonnements",
      potentialSavings: 32,
      priority: "high",
    },
    {
      id: "2",
      type: "opportunity",
      title: "Opportunité d'épargne automatique",
      description: "Basé sur vos habitudes, vous pourriez épargner 150$/mois sans affecter votre style de vie.",
      action: "Configurer l'épargne auto",
      potentialSavings: 150,
      priority: "high",
    },
    {
      id: "3",
      type: "warning",
      title: "Dépenses restaurants en hausse",
      description: "Vos dépenses restaurants ont augmenté de 45% par rapport au mois dernier.",
      action: "Voir les détails",
      priority: "medium",
    },
    {
      id: "4",
      type: "achievement",
      title: "Objectif épargne atteint! 🎉",
      description: "Félicitations! Vous avez atteint 75% de votre objectif 'Fonds d'urgence'.",
      priority: "low",
    },
    {
      id: "5",
      type: "saving",
      title: "Meilleur moment pour payer",
      description: "Payez votre carte de crédit le 25 du mois pour économiser 12$ en intérêts.",
      potentialSavings: 12,
      priority: "medium",
    },
  ];

  const getIcon = (type: Insight["type"]) => {
    switch (type) {
      case "saving":
        return <DollarSign className="w-5 h-5 text-emerald-600" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case "opportunity":
        return <Sparkles className="w-5 h-5 text-blue-600" />;
      case "achievement":
        return <ThumbsUp className="w-5 h-5 text-violet-600" />;
    }
  };

  const getBackground = (type: Insight["type"]) => {
    switch (type) {
      case "saving":
        return "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800";
      case "warning":
        return "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800";
      case "opportunity":
        return "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800";
      case "achievement":
        return "bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800";
    }
  };

  const totalPotentialSavings = insights
    .filter((i) => i.potentialSavings)
    .reduce((acc, i) => acc + (i.potentialSavings || 0), 0);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10">
              <Lightbulb className="w-5 h-5 text-violet-600" />
            </div>
            Insights intelligents
          </CardTitle>
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
            <PiggyBank className="w-3 h-3 mr-1" />
            {totalPotentialSavings}$/mois potentiel
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight, index) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-xl border ${getBackground(insight.type)}`}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-sm">
                {getIcon(insight.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-semibold text-sm">{insight.title}</h4>
                  {insight.potentialSavings && (
                    <Badge variant="secondary" className="shrink-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
                      +{insight.potentialSavings}$/mois
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {insight.description}
                </p>
                {insight.action && (
                  <Button size="sm" variant="ghost" className="h-8 px-3 gap-1">
                    {insight.action}
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {/* Feedback section */}
        <div className="flex items-center justify-center gap-4 pt-4 border-t">
          <span className="text-sm text-muted-foreground">Ces conseils sont-ils utiles?</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="gap-1">
              <ThumbsUp className="w-4 h-4" />
              Oui
            </Button>
            <Button variant="ghost" size="sm" className="gap-1">
              <ThumbsDown className="w-4 h-4" />
              Non
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
