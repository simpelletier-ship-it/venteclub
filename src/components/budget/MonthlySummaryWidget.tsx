import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/priceFormat";
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface MonthlySummaryWidgetProps {
  isAuthenticated: boolean;
}

export const MonthlySummaryWidget = ({ isAuthenticated }: MonthlySummaryWidgetProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get current month transactions
  const { data: transactions = [] } = useQuery({
    queryKey: ['monthly-summary-transactions'],
    queryFn: async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('budget_transactions')
        .select('*')
        .gte('transaction_date', startOfMonth.toISOString())
        .lte('transaction_date', endOfMonth.toISOString());
      
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthenticated,
  });

  // Get financial goals
  const { data: financialGoals = [] } = useQuery({
    queryKey: ['monthly-summary-goals'],
    queryFn: async () => {
      const { data, error } = await supabase.from('financial_goals').select('*');
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthenticated,
  });

  // Calculate totals
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalIncome - totalExpenses;
  const isPositive = balance >= 0;

  // Calculate goal progression
  const activeGoals = financialGoals.filter(g => !g.completed);
  const completedGoals = financialGoals.filter(g => g.completed);
  const goalProgress = activeGoals.length > 0
    ? (completedGoals.length / financialGoals.length) * 100
    : 0;

  const currentMonth = new Date().toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' });

  return (
    <Card className="mb-8 bg-gradient-to-br from-background via-background to-primary/5 border-0 shadow-2xl overflow-hidden backdrop-blur-sm">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary))_0%,transparent_70%)] opacity-5" />
      
      <CardContent className="p-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-8 flex-1 w-full">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center backdrop-blur-sm">
                <span className="text-2xl">📅</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Période</p>
                <p className="font-semibold capitalize text-lg">{currentMonth}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:flex lg:items-center gap-4 lg:gap-8 w-full lg:w-auto">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center backdrop-blur-sm">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">Revenus</span>
                </div>
                <span className="font-semibold text-green-600 text-xl ml-10">{formatPrice(totalIncome)}</span>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center backdrop-blur-sm">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">Dépenses</span>
                </div>
                <span className="font-semibold text-red-600 text-xl ml-10">{formatPrice(totalExpenses)}</span>
              </div>

              <div className="flex flex-col gap-1 col-span-2">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Solde disponible</span>
                <span className={`font-bold text-2xl ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPrice(balance)}
                </span>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="self-end lg:self-auto shrink-0 h-10 w-10 rounded-full hover:bg-muted/50 transition-all"
          >
            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </Button>
        </div>

        {/* Expanded view - Detailed breakdown */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-background/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Revenus du mois</span>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-600">{formatPrice(totalIncome)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {transactions.filter(t => t.type === 'income').length} transactions
                </p>
              </div>

              <div className="bg-background/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Dépenses du mois</span>
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-red-600">{formatPrice(totalExpenses)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {transactions.filter(t => t.type === 'expense').length} transactions
                </p>
              </div>

              <div className="bg-background/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Solde net</span>
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <p className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPrice(balance)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isPositive ? 'Excédent' : 'Déficit'}
                </p>
              </div>
            </div>

            {activeGoals.length > 0 && (
              <div className="bg-background/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">🎯 Progression des objectifs</span>
                  <span className="text-sm text-muted-foreground">
                    {completedGoals.length} / {financialGoals.length} complétés
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${goalProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
