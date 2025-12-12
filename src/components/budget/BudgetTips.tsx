import { useState } from "react";
import { 
  Lightbulb, 
  TrendingDown, 
  PiggyBank, 
  Target, 
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Wallet,
  Calculator,
  Shield,
  Clock,
  BarChart3,
  Banknote
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface Tip {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  category: "épargne" | "dépenses" | "planification" | "sécurité";
  priority: "high" | "medium" | "low";
}

const BUDGET_TIPS: Tip[] = [
  {
    id: "50-30-20",
    icon: <Calculator className="h-5 w-5" />,
    title: "Règle 50/30/20",
    description: "Allouez 50% de vos revenus aux besoins essentiels (logement, épicerie), 30% aux envies (loisirs, resto), et 20% à l'épargne et remboursement de dettes.",
    category: "planification",
    priority: "high"
  },
  {
    id: "emergency-fund",
    icon: <Shield className="h-5 w-5" />,
    title: "Fonds d'urgence",
    description: "Constituez un fonds d'urgence équivalent à 3-6 mois de dépenses. C'est votre filet de sécurité en cas d'imprévu (perte d'emploi, réparation auto).",
    category: "sécurité",
    priority: "high"
  },
  {
    id: "track-spending",
    icon: <BarChart3 className="h-5 w-5" />,
    title: "Suivez chaque dépense",
    description: "Notez toutes vos dépenses, même les petites. Les cafés à 5$ et les achats impulsifs s'accumulent rapidement. L'awareness est la première étape.",
    category: "dépenses",
    priority: "high"
  },
  {
    id: "pay-yourself-first",
    icon: <PiggyBank className="h-5 w-5" />,
    title: "Payez-vous en premier",
    description: "Dès que vous recevez votre paie, transférez automatiquement un montant vers l'épargne AVANT de payer vos factures. Ce qui reste sera dépensé.",
    category: "épargne",
    priority: "high"
  },
  {
    id: "subscriptions",
    icon: <Clock className="h-5 w-5" />,
    title: "Auditez vos abonnements",
    description: "Netflix, Spotify, gym, apps... Les petits abonnements mensuels peuvent totaliser des centaines de dollars par an. Annulez ceux que vous n'utilisez pas vraiment.",
    category: "dépenses",
    priority: "medium"
  },
  {
    id: "waiting-period",
    icon: <AlertTriangle className="h-5 w-5" />,
    title: "Règle des 24-48h",
    description: "Avant un achat non essentiel de plus de 50$, attendez 24-48h. Souvent, l'envie passe et vous évitez un achat impulsif.",
    category: "dépenses",
    priority: "medium"
  },
  {
    id: "automate",
    icon: <TrendingDown className="h-5 w-5" />,
    title: "Automatisez tout",
    description: "Configurez des virements automatiques pour l'épargne, le REER, le CELI. Ce que vous ne voyez pas ne vous manque pas.",
    category: "épargne",
    priority: "medium"
  },
  {
    id: "meal-prep",
    icon: <Wallet className="h-5 w-5" />,
    title: "Planifiez vos repas",
    description: "Préparer ses repas peut économiser 200-400$ par mois vs manger au restaurant. Faites une liste d'épicerie et respectez-la.",
    category: "dépenses",
    priority: "medium"
  },
  {
    id: "goals",
    icon: <Target className="h-5 w-5" />,
    title: "Objectifs SMART",
    description: "Définissez des objectifs Spécifiques, Mesurables, Atteignables, Réalistes et Temporels. 'Économiser 5000$ d'ici décembre' > 'Économiser plus'.",
    category: "planification",
    priority: "medium"
  },
  {
    id: "review-monthly",
    icon: <Banknote className="h-5 w-5" />,
    title: "Revue mensuelle",
    description: "Prenez 30 minutes chaque mois pour revoir votre budget vs réel. Ajustez les catégories selon vos habitudes réelles.",
    category: "planification",
    priority: "low"
  }
];

const CATEGORY_COLORS = {
  épargne: "text-emerald-600 bg-emerald-500/10",
  dépenses: "text-red-600 bg-red-500/10",
  planification: "text-blue-600 bg-blue-500/10",
  sécurité: "text-amber-600 bg-amber-500/10"
};

const PRIORITY_BADGES = {
  high: { label: "Essentiel", className: "bg-red-500/10 text-red-600 border-red-500/20" },
  medium: { label: "Recommandé", className: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
  low: { label: "Bonus", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" }
};

export function BudgetTips() {
  const [expanded, setExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredTips = selectedCategory 
    ? BUDGET_TIPS.filter(tip => tip.category === selectedCategory)
    : BUDGET_TIPS;

  const displayedTips = expanded ? filteredTips : filteredTips.slice(0, 4);

  const categories = [
    { id: "épargne", label: "Épargne", icon: <PiggyBank className="h-3.5 w-3.5" /> },
    { id: "dépenses", label: "Dépenses", icon: <TrendingDown className="h-3.5 w-3.5" /> },
    { id: "planification", label: "Planification", icon: <Target className="h-3.5 w-3.5" /> },
    { id: "sécurité", label: "Sécurité", icon: <Shield className="h-3.5 w-3.5" /> }
  ];

  return (
    <Card className="border-primary/10 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Lightbulb className="h-5 w-5 text-primary" />
          </div>
          Conseils pour mieux gérer votre budget
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            className="h-7 text-xs"
          >
            Tous
          </Button>
          {categories.map(cat => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className="h-7 text-xs gap-1"
            >
              {cat.icon}
              {cat.label}
            </Button>
          ))}
        </div>

        {/* Tips grid */}
        <div className="grid sm:grid-cols-2 gap-3">
          <AnimatePresence mode="popLayout">
            {displayedTips.map((tip, index) => (
              <motion.div
                key={tip.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "p-4 rounded-xl border bg-card hover:shadow-md transition-all",
                  "group cursor-default"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-2 rounded-lg shrink-0",
                    CATEGORY_COLORS[tip.category]
                  )}>
                    {tip.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{tip.title}</h4>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full border shrink-0",
                        PRIORITY_BADGES[tip.priority].className
                      )}>
                        {PRIORITY_BADGES[tip.priority].label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {tip.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Expand/collapse button */}
        {filteredTips.length > 4 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Voir moins
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Voir {filteredTips.length - 4} autres conseils
              </>
            )}
          </Button>
        )}

        {/* Quick stats about budgeting */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          <div className="text-center p-2 rounded-lg bg-emerald-500/5">
            <p className="text-lg font-bold text-emerald-600">20%</p>
            <p className="text-[10px] text-muted-foreground">Épargne recommandée</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-blue-500/5">
            <p className="text-lg font-bold text-blue-600">3-6 mois</p>
            <p className="text-[10px] text-muted-foreground">Fonds d'urgence</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-amber-500/5">
            <p className="text-lg font-bold text-amber-600">30%</p>
            <p className="text-[10px] text-muted-foreground">Max logement</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
