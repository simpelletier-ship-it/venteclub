import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";
import { Loader2, TrendingUp, TrendingDown, Wallet, Target, ChevronRight, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BudgetPlanner } from "@/components/budget/BudgetPlanner";
import { QuickExpenseTracker } from "@/components/budget/QuickExpenseTrackerPro";
import { ExpensesByCategory } from "@/components/budget/ExpensesByCategory";
import { FinancialHealthScore } from "@/components/budget/FinancialHealthScore";
import { BudgetOnboarding } from "@/components/budget/BudgetOnboarding";
import { CreateDefaultCategories } from "@/components/budget/CreateDefaultCategories";
import { OfflineIndicator } from "@/components/budget/OfflineIndicator";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/priceFormat";
import { cn } from "@/lib/utils";

const BudgetCalculator = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isAuthenticated = !!user;
  const { isOnline, pendingCount, isSyncing, triggerSync } = useOfflineSync(isAuthenticated);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/auth?redirect=/budget');
    }
  }, [loading, isAuthenticated, navigate]);

  const { data: assets = [] } = useQuery({
    queryKey: ['user-assets'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_assets').select('*');
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthenticated,
    retry: 1,
  });

  const { data: debts = [] } = useQuery({
    queryKey: ['user-debts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_debts').select('*');
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthenticated,
    retry: 1,
  });

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
    enabled: isAuthenticated,
    retry: 1,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['budget-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('budget_categories').select('*');
      if (error) throw error;
      return (data || []) as Array<{
        id: string;
        name: string;
        icon: string;
        color: string;
        type: 'income' | 'expense';
        user_id: string;
        created_at: string;
        is_custom: boolean;
      }>;
    },
    enabled: isAuthenticated,
    retry: 1,
  });

  const totalAssets = assets.reduce((sum, asset) => sum + Number(asset.value), 0);
  const totalDebts = debts.reduce((sum, debt) => sum + Number(debt.balance), 0);
  const netWorth = totalAssets - totalDebts;

  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthTransactions = transactions.filter(t => 
    t.transaction_date?.startsWith(currentMonth)
  );
  
  const monthlyIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const monthlyExpenses = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const monthlyBalance = monthlyIncome - monthlyExpenses;

  const prevMonth = new Date();
  prevMonth.setMonth(prevMonth.getMonth() - 1);
  const prevMonthStr = prevMonth.toISOString().slice(0, 7);
  const prevMonthTransactions = transactions.filter(t => 
    t.transaction_date?.startsWith(prevMonthStr)
  );
  const prevMonthExpenses = prevMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  
  const expenseChange = prevMonthExpenses > 0 
    ? ((monthlyExpenses - prevMonthExpenses) / prevMonthExpenses) * 100 
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    sessionStorage.setItem('authReturnUrl', '/budget');
    navigate("/auth");
    return null;
  }

  return (
    <ErrorBoundary>
      <>
        <CreateDefaultCategories />
        <BudgetOnboarding />
        <SEO
          title="Mon Budget | Gestion Finances Personnelles"
          description="Gérez votre budget personnel simplement. Suivi des dépenses, objectifs d'épargne et analyses financières."
          keywords="budget personnel, gestion finances, suivi dépenses, épargne"
          canonical="/budget"
          type="website"
        />
        <BreadcrumbSchema
          items={[
            { name: "Budget", url: "/budget" }
          ]}
        />

        <div className="min-h-screen bg-slate-950 text-white pb-8">
          {/* Top Summary Bar */}
          <div className="bg-slate-900 border-b border-slate-800">
            <div className="container mx-auto px-4 py-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs text-slate-400 uppercase tracking-wide">Revenus</span>
                  </div>
                  <p className="text-xl font-bold text-emerald-400">{formatPrice(monthlyIncome)}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown className="h-4 w-4 text-red-400" />
                    <span className="text-xs text-slate-400 uppercase tracking-wide">Dépenses</span>
                  </div>
                  <p className="text-xl font-bold text-red-400">{formatPrice(monthlyExpenses)}</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="h-4 w-4 text-blue-400" />
                    <span className="text-xs text-slate-400 uppercase tracking-wide">Solde</span>
                  </div>
                  <p className={cn(
                    "text-xl font-bold",
                    monthlyBalance >= 0 ? "text-emerald-400" : "text-red-400"
                  )}>
                    {monthlyBalance >= 0 ? '+' : ''}{formatPrice(monthlyBalance)}
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="h-4 w-4 text-violet-400" />
                    <span className="text-xs text-slate-400 uppercase tracking-wide">Valeur nette</span>
                  </div>
                  <p className={cn(
                    "text-xl font-bold",
                    netWorth >= 0 ? "text-violet-400" : "text-red-400"
                  )}>
                    {formatPrice(netWorth)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 py-6">
            <OfflineIndicator 
              isOnline={isOnline}
              pendingCount={pendingCount}
              isSyncing={isSyncing}
              onSync={triggerSync}
            />

            {/* QUICK ADD - PRIMARY ACTION */}
            <div className="mb-8">
              <QuickExpenseTracker isAuthenticated={isAuthenticated} />
            </div>

            {/* Monthly Trend */}
            {expenseChange !== 0 && (
              <div className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-lg text-sm mb-6",
                expenseChange > 0 
                  ? "bg-red-500/10 border border-red-500/20 text-red-400" 
                  : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
              )}>
                {expenseChange > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                <span>
                  Dépenses {expenseChange > 0 ? 'en hausse' : 'en baisse'} de {Math.abs(expenseChange).toFixed(0)}% vs mois dernier
                </span>
              </div>
            )}

            {/* Recent Transactions */}
            <Card className="bg-slate-900 border-slate-800 mb-6">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-semibold text-white">Dernières transactions</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/budget/historique')}
                  className="text-slate-400 hover:text-white"
                >
                  Voir tout <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1">
                  {transactions.slice(0, 5).map((t) => {
                    const category = categories.find(c => c.id === t.category_id);
                    return (
                      <div key={t.id} className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-lg">
                            {category?.icon || '📝'}
                          </div>
                          <div>
                            <p className="font-medium text-white">{t.description || category?.name || 'Transaction'}</p>
                            <p className="text-xs text-slate-500">
                              {new Date(t.transaction_date).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                        </div>
                        <span className={cn(
                          "font-semibold",
                          t.type === 'income' ? "text-emerald-400" : "text-white"
                        )}>
                          {t.type === 'income' ? '+' : '-'}{formatPrice(Number(t.amount))}
                        </span>
                      </div>
                    );
                  })}
                  {transactions.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-8">Aucune transaction</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <ExpensesByCategory 
                  transactions={transactions}
                  categories={categories}
                  onAnalyze={() => {}}
                />
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <FinancialHealthScore 
                  transactions={transactions}
                  debts={debts}
                  assets={assets}
                />
              </div>
            </div>

            {/* Budget Planner */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <BudgetPlanner isAuthenticated={isAuthenticated} />
            </div>
          </div>
        </div>
      </>
    </ErrorBoundary>
  );
};

export default BudgetCalculator;
