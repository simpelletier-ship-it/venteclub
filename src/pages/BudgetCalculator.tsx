import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";
import { Loader2, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, Plus, ChevronRight, Target, Calendar, Clock, CreditCard, PiggyBank, LineChart, Bell, BarChart3, Lightbulb, ReceiptText, Trash2, Pencil, X } from "lucide-react";
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
import { BillCalendar } from "@/components/budget/BillCalendar";
import { AgeOfMoney } from "@/components/budget/AgeOfMoney";
import { DebtPayoffPlanner } from "@/components/budget/DebtPayoffPlanner";
import { SavingsChallenges } from "@/components/budget/SavingsChallenges";
import { CashFlowForecast } from "@/components/budget/CashFlowForecast";
import { SpendingLimitsAlerts } from "@/components/budget/SpendingLimitsAlerts";
import { InvestmentTracker } from "@/components/budget/InvestmentTracker";
import { FinancialProductComparison } from "@/components/budget/FinancialProductComparison";
import { SmartInsights } from "@/components/budget/SmartInsights";
import { SubscriptionDetector } from "@/components/budget/SubscriptionDetector";
import { InterestAnalyzer } from "@/components/budget/InterestAnalyzer";
import { CategoryIcon } from "@/components/budget/CategoryIcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPrice } from "@/lib/priceFormat";
import { cn } from "@/lib/utils";

const BudgetCalculator = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading } = useAuth();
  const isAuthenticated = !!user;
  const { isOnline, pendingCount, isSyncing, triggerSync } = useOfflineSync(isAuthenticated);

  // Delete transaction mutation
  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('budget_transactions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-transactions-all'] });
      queryClient.invalidateQueries({ queryKey: ['budget-transactions'] });
      toast.success("Transaction supprimée");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });

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

            {/* KPI Cards - Premium Banking Style */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              {/* Revenus */}
              <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-card min-h-[130px]">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Revenus</span>
                      <p className="text-2xl lg:text-3xl font-bold text-foreground mt-2 tracking-tight">{formatPrice(monthlyIncome)}</p>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dépenses */}
              <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-card min-h-[130px]">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Dépenses</span>
                      <p className="text-2xl lg:text-3xl font-bold text-foreground mt-2 tracking-tight">{formatPrice(monthlyExpenses)}</p>
                      {expenseChange !== 0 && (
                        <div className={cn(
                          "flex items-center gap-1.5 mt-2 text-xs font-medium",
                          expenseChange > 0 ? "text-amber-600 dark:text-amber-400" : "text-primary"
                        )}>
                          {expenseChange > 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                          <span>{Math.abs(expenseChange).toFixed(0)}%</span>
                        </div>
                      )}
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-slate-500/10 flex items-center justify-center">
                      <TrendingDown className="h-5 w-5 text-slate-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Solde */}
              <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-card min-h-[130px]">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Solde</span>
                      <p className={cn(
                        "text-2xl lg:text-3xl font-bold mt-2 tracking-tight",
                        monthlyBalance >= 0 ? "text-primary" : "text-[#C7463D]"
                      )}>
                        {monthlyBalance >= 0 ? '+' : ''}{formatPrice(monthlyBalance)}
                      </p>
                    </div>
                    <div className={cn(
                      "w-11 h-11 rounded-xl flex items-center justify-center",
                      monthlyBalance >= 0 ? "bg-primary/10" : "bg-[#C7463D]/10"
                    )}>
                      <Wallet className={cn("h-5 w-5", monthlyBalance >= 0 ? "text-primary" : "text-[#C7463D]")} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Patrimoine */}
              <Card 
                className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-card min-h-[130px] cursor-pointer group" 
                onClick={() => navigate('/budget/valeur-nette')}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Patrimoine</span>
                      <p className={cn(
                        "text-2xl lg:text-3xl font-bold mt-2 tracking-tight",
                        netWorth >= 0 ? "text-foreground" : "text-amber-600 dark:text-amber-400"
                      )}>
                        {formatPrice(netWorth)}
                      </p>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                      <ChevronRight className="h-5 w-5 text-violet-500" />
                    </div>
                  </div>
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
                      <div key={t.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                            <CategoryIcon icon={category?.icon} size="md" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{t.description || category?.name || 'Transaction'}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(t.transaction_date).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-sm font-medium",
                            t.type === 'income' ? "text-success" : "text-foreground"
                          )}>
                            {t.type === 'income' ? '+' : '-'}{formatPrice(Number(t.amount))}
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 w-7 p-0"
                              onClick={() => navigate(`/budget/historique?edit=${t.id}`)}
                            >
                              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 w-7 p-0 hover:bg-destructive/10"
                              onClick={() => deleteTransaction.mutate(t.id)}
                            >
                              <X className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </div>
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

            {/* Insights Section - Compact scrollable */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Recommandations</span>
              </div>
              <SmartInsights />
            </div>

            {/* Analytics Grid - Premium cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-0 pt-5 px-5">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <PiggyBank className="h-4 w-4 text-primary" />
                    Dépenses par catégorie
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 px-5 pb-5">
                  <ExpensesByCategory 
                    transactions={transactions}
                    categories={categories}
                    onAnalyze={() => {}}
                  />
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardHeader className="pb-0 pt-5 px-5">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Score financier
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 px-5 pb-5">
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
            <Card className="border-border mb-6">
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
