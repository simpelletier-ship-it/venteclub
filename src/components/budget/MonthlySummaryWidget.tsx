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
    <Card className="mb-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
      <CardContent className="p-4">
        {/* Compact view - One line summary */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">📅</span>
              <span className="font-semibold capitalize">{currentMonth}</span>
            </div>

            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Revenus:</span>
              <span className="font-semibold text-green-600">{formatPrice(totalIncome)}</span>
            </div>

            <div className="flex items-center gap-1">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-sm text-muted-foreground">Dépenses:</span>
              <span className="font-semibold text-red-600">{formatPrice(totalExpenses)}</span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">Solde:</span>
              <span className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {formatPrice(balance)}
              </span>
            </div>

            {activeGoals.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-xl">🎯</span>
                <span className="text-sm text-muted-foreground">Objectifs:</span>
                <span className="font-semibold">{completedGoals.length}/{financialGoals.length}</span>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="shrink-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
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
