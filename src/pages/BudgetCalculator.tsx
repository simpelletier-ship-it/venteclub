import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";
import { Loader2, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, Plus, ChevronRight, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BudgetPlanner } from "@/components/budget/BudgetPlanner";
import { QuickExpenseTracker } from "@/components/budget/QuickExpenseTrackerPro";
import { ExpensesByCategory } from "@/components/budget/ExpensesByCategory";
import { FinancialHealthScore } from "@/components/budget/FinancialHealthScore";
import { FinancialGoals } from "@/components/budget/FinancialGoals";
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    sessionStorage.setItem('authReturnUrl', '/budget');
    navigate("/auth");
    return null;
  }

  const currentMonthName = new Date().toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' });

  return (
    <ErrorBoundary>
      <>
        <CreateDefaultCategories />
        <BudgetOnboarding />
        <SEO
          title="Tableau de bord | Budget"
          description="Gérez votre budget personnel. Suivi des dépenses, objectifs d'épargne et analyses financières."
          keywords="budget personnel, gestion finances, suivi dépenses, épargne"
          canonical="/budget"
          type="website"
        />
        <BreadcrumbSchema
          items={[{ name: "Budget", url: "/budget" }]}
        />

        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-6 py-6">
            {/* Offline indicator - subtle positioning */}
            {(!isOnline || pendingCount > 0) && (
              <div className="mb-4">
                <OfflineIndicator 
                  isOnline={isOnline}
                  pendingCount={pendingCount}
                  isSyncing={isSyncing}
                  onSync={triggerSync}
                />
              </div>
            )}
            {/* KPI Cards - Banking Style */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Revenus</span>
                    <TrendingUp className="h-4 w-4 text-success" />
                  </div>
                  <p className="text-xl font-semibold text-foreground">{formatPrice(monthlyIncome)}</p>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Dépenses</span>
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  </div>
                  <p className="text-xl font-semibold text-foreground">{formatPrice(monthlyExpenses)}</p>
                  {expenseChange !== 0 && (
                    <div className={cn(
                      "flex items-center gap-1 mt-1 text-xs",
                      expenseChange > 0 ? "text-destructive" : "text-success"
                    )}>
                      {expenseChange > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      <span>{Math.abs(expenseChange).toFixed(0)}% vs mois dernier</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Solde</span>
                    <Wallet className="h-4 w-4 text-primary" />
                  </div>
                  <p className={cn(
                    "text-xl font-semibold",
                    monthlyBalance >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {monthlyBalance >= 0 ? '+' : ''}{formatPrice(monthlyBalance)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border cursor-pointer hover:border-primary/20 transition-colors" onClick={() => navigate('/budget/valeur-nette')}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Patrimoine</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className={cn(
                    "text-xl font-semibold",
                    netWorth >= 0 ? "text-foreground" : "text-destructive"
                  )}>
                    {formatPrice(netWorth)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Add Section */}
            <div className="mb-6">
              <QuickExpenseTracker isAuthenticated={isAuthenticated} />
            </div>

            {/* Recent Transactions */}
            <Card className="mb-6 border-border">
              <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-border">
                <CardTitle className="text-sm font-medium">Transactions récentes</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/budget/historique')}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Voir tout <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {transactions.slice(0, 5).map((t) => {
                    const category = categories.find(c => c.id === t.category_id);
                    return (
                      <div key={t.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-sm">
                            {category?.icon || '📝'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{t.description || category?.name || 'Transaction'}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(t.transaction_date).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                        </div>
                        <span className={cn(
                          "text-sm font-medium",
                          t.type === 'income' ? "text-success" : "text-foreground"
                        )}>
                          {t.type === 'income' ? '+' : '-'}{formatPrice(Number(t.amount))}
                        </span>
                      </div>
                    );
                  })}
                  {transactions.length === 0 && (
                    <div className="px-5 py-8 text-center">
                      <p className="text-sm text-muted-foreground">Aucune transaction</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <Card className="border-border">
                <CardHeader className="pb-2 border-b border-border">
                  <CardTitle className="text-sm font-medium">Dépenses par catégorie</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <ExpensesByCategory 
                    transactions={transactions}
                    categories={categories}
                    onAnalyze={() => {}}
                  />
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardHeader className="pb-2 border-b border-border">
                  <CardTitle className="text-sm font-medium">Score financier</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <FinancialHealthScore 
                    transactions={transactions}
                    debts={debts}
                    assets={assets}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Financial Goals Section */}
            <Card className="mb-6 border-border">
              <CardHeader className="pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-medium">Objectifs financiers</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <FinancialGoals isAuthenticated={isAuthenticated} />
              </CardContent>
            </Card>

            {/* Budget Planner */}
            <Card className="border-border">
              <CardHeader className="pb-2 border-b border-border">
                <CardTitle className="text-sm font-medium">Planification budgétaire</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <BudgetPlanner isAuthenticated={isAuthenticated} />
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    </ErrorBoundary>
  );
};

export default BudgetCalculator;
