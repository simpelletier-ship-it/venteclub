import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { formatPrice } from "@/lib/priceFormat";
import { CategoryIcon } from "./CategoryIcon";
import { CheckCircle, AlertTriangle, XCircle, HelpCircle, TrendingUp, TrendingDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface BudgetVsActualProps {
  isAuthenticated: boolean;
}

export const BudgetVsActual = ({ isAuthenticated }: BudgetVsActualProps) => {
  const { data: categories = [] } = useQuery({
    queryKey: ['budget-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('budget_categories').select('*');
      if (error) throw error;
      return data;
    },
    enabled: isAuthenticated,
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['budget-goals'],
    queryFn: async () => {
      const { data, error } = await supabase.from('budget_goals').select('*');
      if (error) throw error;
      return data;
    },
    enabled: isAuthenticated,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['budget-transactions-current-month'],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('budget_transactions')
        .select('category_id, amount, type')
        .gte('transaction_date', startOfMonth.toISOString().split('T')[0]);
      if (error) throw error;
      return data;
    },
    enabled: isAuthenticated,
  });

  const getActualAmount = (categoryId: string, type: string) => {
    return transactions
      .filter(t => t.category_id === categoryId && t.type === type)
      .reduce((sum, t) => sum + Number(t.amount), 0);
  };

  const getBudgetAmount = (categoryId: string) => {
    const goal = goals.find(g => g.category_id === categoryId);
    return goal ? Number(goal.monthly_limit) : 0;
  };

  // Filter categories that have a budget set
  const budgetedExpenses = categories
    .filter(c => c.type === 'expense' && getBudgetAmount(c.id) > 0)
    .map(c => ({
      ...c,
      budget: getBudgetAmount(c.id),
      actual: getActualAmount(c.id, 'expense'),
    }))
    .sort((a, b) => (b.actual / b.budget) - (a.actual / a.budget));

  const budgetedIncome = categories
    .filter(c => c.type === 'income' && getBudgetAmount(c.id) > 0)
    .map(c => ({
      ...c,
      budget: getBudgetAmount(c.id),
      actual: getActualAmount(c.id, 'income'),
    }));

  const totalBudgetedExpenses = budgetedExpenses.reduce((sum, c) => sum + c.budget, 0);
  const totalActualExpenses = budgetedExpenses.reduce((sum, c) => sum + c.actual, 0);
  const totalBudgetedIncome = budgetedIncome.reduce((sum, c) => sum + c.budget, 0);
  const totalActualIncome = budgetedIncome.reduce((sum, c) => sum + c.actual, 0);

  const getStatusIcon = (percentage: number, type: 'expense' | 'income') => {
    if (type === 'expense') {
      if (percentage <= 70) return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      if (percentage <= 100) return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      return <XCircle className="w-4 h-4 text-red-500" />;
    } else {
      if (percentage >= 100) return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      if (percentage >= 70) return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getProgressColor = (percentage: number, type: 'expense' | 'income') => {
    if (type === 'expense') {
      if (percentage <= 70) return 'bg-emerald-500';
      if (percentage <= 100) return 'bg-amber-500';
      return 'bg-red-500';
    } else {
      if (percentage >= 100) return 'bg-emerald-500';
      if (percentage >= 70) return 'bg-amber-500';
      return 'bg-red-500';
    }
  };

  if (budgetedExpenses.length === 0 && budgetedIncome.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">Aucun budget défini</h3>
          <p className="text-sm text-muted-foreground">
            Définis d'abord un budget pour voir la comparaison avec tes dépenses réelles
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-emerald-200 dark:border-emerald-800/50">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <span className="font-medium">Revenus</span>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Compare tes revenus réels avec ce que tu avais prévu</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-end justify-between mb-2">
              <span className="text-2xl font-bold text-emerald-600">{formatPrice(totalActualIncome)}</span>
              <span className="text-sm text-muted-foreground">sur {formatPrice(totalBudgetedIncome)}</span>
            </div>
            <Progress 
              value={totalBudgetedIncome > 0 ? Math.min((totalActualIncome / totalBudgetedIncome) * 100, 100) : 0} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {totalBudgetedIncome > 0 
                ? `${Math.round((totalActualIncome / totalBudgetedIncome) * 100)}% de l'objectif`
                : 'Aucun objectif défini'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-800/50">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <span className="font-medium">Dépenses</span>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Compare tes dépenses réelles avec ton budget</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-end justify-between mb-2">
              <span className="text-2xl font-bold text-red-600">{formatPrice(totalActualExpenses)}</span>
              <span className="text-sm text-muted-foreground">sur {formatPrice(totalBudgetedExpenses)}</span>
            </div>
            <Progress 
              value={totalBudgetedExpenses > 0 ? Math.min((totalActualExpenses / totalBudgetedExpenses) * 100, 100) : 0}
              className={cn(
                "h-2",
                totalActualExpenses > totalBudgetedExpenses ? "[&>div]:bg-red-500" : "[&>div]:bg-emerald-500"
              )}
            />
            <p className={cn(
              "text-xs mt-2",
              totalActualExpenses > totalBudgetedExpenses ? "text-red-600" : "text-muted-foreground"
            )}>
              {totalBudgetedExpenses > 0 
                ? totalActualExpenses > totalBudgetedExpenses
                  ? `⚠️ Dépassement de ${formatPrice(totalActualExpenses - totalBudgetedExpenses)}`
                  : `${Math.round((totalActualExpenses / totalBudgetedExpenses) * 100)}% du budget utilisé`
                : 'Aucun budget défini'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      {budgetedExpenses.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              Détail par catégorie
            </CardTitle>
            <CardDescription>
              Vert = sous budget • Jaune = proche de la limite • Rouge = dépassé
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {budgetedExpenses.map((cat) => {
              const percentage = cat.budget > 0 ? (cat.actual / cat.budget) * 100 : 0;
              const difference = cat.budget - cat.actual;

              return (
                <div key={cat.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CategoryIcon icon={cat.icon} color={cat.color} size="md" />
                      <span className="font-medium text-sm">{cat.name}</span>
                      {getStatusIcon(percentage, 'expense')}
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">{formatPrice(cat.actual)}</span>
                      <span className="text-muted-foreground text-sm"> / {formatPrice(cat.budget)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full transition-all", getProgressColor(percentage, 'expense'))}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <span className={cn(
                      "text-xs font-medium w-16 text-right",
                      difference >= 0 ? "text-emerald-600" : "text-red-600"
                    )}>
                      {difference >= 0 ? '+' : ''}{formatPrice(difference)}
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
