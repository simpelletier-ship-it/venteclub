import { useState, useMemo } from "react";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user } = useAuth();
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('dismissed-insights');
    return saved ? JSON.parse(saved) : [];
  });

  // Fetch transactions
  const { data: transactions = [] } = useQuery({
    queryKey: ['budget-transactions-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_transactions')
        .select('*')
        .order('transaction_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch goals
  const { data: goals = [] } = useQuery({
    queryKey: ['financial-goals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_goals')
        .select('*');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['budget-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('budget_categories').select('*');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Generate real insights based on data
  const allInsights = useMemo(() => {
    const insights: Insight[] = [];

    // 1. Detect unused/dormant subscriptions
    const detectSubscriptions = () => {
      const transactionsByDescription = transactions
        .filter((t: any) => t.type === 'expense')
        .reduce((acc: any, t: any) => {
          const desc = t.description?.toLowerCase().trim() || '';
          if (!desc) return acc;
          if (!acc[desc]) acc[desc] = [];
          acc[desc].push(t);
          return acc;
        }, {});

      let dormantCount = 0;
      let potentialSavings = 0;

      Object.entries(transactionsByDescription).forEach(([description, txs]: [string, any]) => {
        if (txs.length < 2) return;

        const sorted = txs.sort((a: any, b: any) => 
          new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
        );

        const intervals = [];
        for (let i = 1; i < sorted.length; i++) {
          const days = Math.round(
            (new Date(sorted[i].transaction_date).getTime() - 
             new Date(sorted[i - 1].transaction_date).getTime()) / 
            (1000 * 60 * 60 * 24)
          );
          intervals.push(days);
        }

        if (intervals.length === 0) return;

        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const isMonthly = avgInterval >= 28 && avgInterval <= 35;

        if (!isMonthly) return;

        const lastTransaction = sorted[sorted.length - 1];
        const daysSinceLast = Math.round(
          (Date.now() - new Date(lastTransaction.transaction_date).getTime()) / (1000 * 60 * 60 * 24)
        );

        // If no transaction in 60+ days for a monthly subscription
        if (daysSinceLast > 60) {
          dormantCount++;
          potentialSavings += Number(lastTransaction.amount);
        }
      });

      if (dormantCount > 0) {
        insights.push({
          id: "subscriptions-unused",
          type: "saving",
          title: "Abonnements inutilisés",
          description: `${dormantCount} abonnement${dormantCount > 1 ? 's' : ''} non utilisé${dormantCount > 1 ? 's' : ''} depuis 60+ jours`,
          action: "Réviser",
          actionRoute: "/budget/analyses",
          potentialSavings: Math.round(potentialSavings),
          priority: "high",
        });
      }

      return { dormantCount, potentialSavings };
    };

    detectSubscriptions();

    // 2. Detect spending increase by category
    const currentMonth = new Date().toISOString().slice(0, 7);
    const prevMonth = new Date();
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    const prevMonthStr = prevMonth.toISOString().slice(0, 7);

    const currentMonthExpenses = transactions.filter((t: any) => 
      t.type === 'expense' && t.transaction_date?.startsWith(currentMonth)
    );
    const prevMonthExpenses = transactions.filter((t: any) => 
      t.type === 'expense' && t.transaction_date?.startsWith(prevMonthStr)
    );

    // Group by category
    const currentByCategory: Record<string, number> = {};
    const prevByCategory: Record<string, number> = {};

    currentMonthExpenses.forEach((t: any) => {
      const catId = t.category_id || 'other';
      currentByCategory[catId] = (currentByCategory[catId] || 0) + Number(t.amount);
    });

    prevMonthExpenses.forEach((t: any) => {
      const catId = t.category_id || 'other';
      prevByCategory[catId] = (prevByCategory[catId] || 0) + Number(t.amount);
    });

    // Find significant increases
    Object.entries(currentByCategory).forEach(([catId, currentAmount]) => {
      const prevAmount = prevByCategory[catId] || 0;
      if (prevAmount > 0) {
        const increase = ((currentAmount - prevAmount) / prevAmount) * 100;
        if (increase >= 30 && currentAmount >= 50) {
          const category = categories.find((c: any) => c.id === catId);
          insights.push({
            id: `increase-${catId}`,
            type: "warning",
            title: `${category?.name || 'Catégorie'} en hausse`,
            description: `+${Math.round(increase)}% vs mois dernier`,
            action: "Détails",
            actionRoute: "/budget/historique",
            priority: "medium",
          });
        }
      }
    });

    // 3. Goal achievements
    goals.forEach((goal: any) => {
      const progress = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
      if (progress >= 75 && progress < 100) {
        insights.push({
          id: `goal-progress-${goal.id}`,
          type: "achievement",
          title: "Objectif proche!",
          description: `${Math.round(progress)}% de "${goal.name}" atteint`,
          action: "Voir",
          actionRoute: "/budget/objectifs",
          priority: "low",
        });
      }
      if (goal.completed) {
        insights.push({
          id: `goal-done-${goal.id}`,
          type: "achievement",
          title: "Objectif atteint!",
          description: `"${goal.name}" complété`,
          action: "Voir",
          actionRoute: "/budget/objectifs",
          priority: "low",
        });
      }
    });

    // 4. Savings opportunity based on income vs expenses
    const currentMonthIncome = transactions
      .filter((t: any) => t.type === 'income' && t.transaction_date?.startsWith(currentMonth))
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
    
    const currentMonthExpenseTotal = currentMonthExpenses
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    const surplus = currentMonthIncome - currentMonthExpenseTotal;
    if (surplus > 100) {
      insights.push({
        id: "savings-opportunity",
        type: "opportunity",
        title: "Épargne possible",
        description: `${Math.round(surplus)}$ disponible ce mois`,
        action: "Objectifs",
        actionRoute: "/budget/objectifs",
        potentialSavings: Math.round(surplus),
        priority: "high",
      });
    }

    return insights;
  }, [transactions, goals, categories]);

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
    const newDismissed = [...dismissedIds, id];
    setDismissedIds(newDismissed);
    localStorage.setItem('dismissed-insights', JSON.stringify(newDismissed));
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
          {totalPotentialSavings > 0 && (
            <Badge variant="secondary" className="bg-primary/10 text-primary border-0 text-xs">
              <PiggyBank className="w-3 h-3 mr-1" />
              {totalPotentialSavings}$/mois
            </Badge>
          )}
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
