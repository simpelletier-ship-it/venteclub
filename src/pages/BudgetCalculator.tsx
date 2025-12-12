import { Helmet } from "react-helmet";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NetWorthGamification } from "@/components/budget/NetWorthGamification";
import { BudgetTransactions } from "@/components/budget/BudgetTransactions";
import { BudgetAssetsDebts } from "@/components/budget/BudgetAssetsDebts";
import { SimpleNetWorthTracker } from "@/components/budget/SimpleNetWorthTracker";
import { AIFinancialCoach } from "@/components/budget/AIFinancialCoach";
import { BudgetPlanner } from "@/components/budget/BudgetPlanner";
import { BudgetInsights } from "@/components/budget/BudgetInsights";
import { FinancialGoals } from "@/components/budget/FinancialGoals";
import { ThemeCustomizer } from "@/components/budget/ThemeCustomizer";
import { CategoryManager } from "@/components/budget/CategoryManager";
import { QuickExpenseTracker } from "@/components/budget/QuickExpenseTrackerPro";
import RecurringExpenses from "@/components/budget/RecurringExpenses";
import { ExpensesByCategory } from "@/components/budget/ExpensesByCategory";
import { ExpenseTrendsChart } from "@/components/budget/ExpenseTrendsChart";
import { FinancialHealthScore } from "@/components/budget/FinancialHealthScore";
import { PremiumAnalysisTab } from "@/components/budget/PremiumAnalysisTab";
import { MonthComparisonChart } from "@/components/budget/MonthComparisonChart";
import { BudgetOnboarding } from "@/components/budget/BudgetOnboarding";
import { BenchmarkComparison } from "@/components/budget/BenchmarkComparison";
import { CreateDefaultCategories } from "@/components/budget/CreateDefaultCategories";
import { OfflineIndicator } from "@/components/budget/OfflineIndicator";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/priceFormat";
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Target, BarChart3, Coins, Calendar, Clock, CreditCard, Trophy, LineChart, Bell, Briefcase, GitCompare, Lightbulb } from "lucide-react";

// New feature imports
import { RoundUpSavings } from "@/components/budget/RoundUpSavings";
import { BillCalendar } from "@/components/budget/BillCalendar";
import { AgeOfMoney } from "@/components/budget/AgeOfMoney";
import { DebtPayoffPlanner } from "@/components/budget/DebtPayoffPlanner";
import { SavingsChallenges } from "@/components/budget/SavingsChallenges";
import { CashFlowForecast } from "@/components/budget/CashFlowForecast";
import { SpendingLimitsAlerts } from "@/components/budget/SpendingLimitsAlerts";
import { InvestmentTracker } from "@/components/budget/InvestmentTracker";
import { FinancialProductComparison } from "@/components/budget/FinancialProductComparison";
import { SmartInsights } from "@/components/budget/SmartInsights";

const BudgetCalculator = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isAuthenticated = !!user;
  const { isOnline, pendingCount, isSyncing, triggerSync } = useOfflineSync(isAuthenticated);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/auth?redirect=/outils/budget');
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

  // Current month calculations
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    sessionStorage.setItem('authReturnUrl', '/outils/budget');
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
          canonical="/outils/budget"
          type="website"
        />
        <BreadcrumbSchema
          items={[
            { name: "Accueil", url: "/" },
            { name: "Budget", url: "/outils/budget" }
          ]}
        />

        <div className="min-h-screen bg-background">
          {/* Compact Header with KPIs */}
          <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
            <div className="container mx-auto px-4 py-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Revenus</p>
                    <p className="text-lg font-semibold">{formatPrice(monthlyIncome)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border">
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Dépenses</p>
                    <p className="text-lg font-semibold">{formatPrice(monthlyExpenses)}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Wallet className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Balance</p>
                    <p className={`text-lg font-semibold ${monthlyBalance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {formatPrice(monthlyBalance)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border">
                  <div className="p-2 rounded-lg bg-violet-500/10">
                    <Target className="h-5 w-5 text-violet-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Valeur nette</p>
                    <p className={`text-lg font-semibold ${netWorth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {formatPrice(netWorth)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 py-6 pb-24 lg:pb-8">
            {/* Offline Indicator */}
            <OfflineIndicator 
              isOnline={isOnline}
              pendingCount={pendingCount}
              isSyncing={isSyncing}
              onSync={triggerSync}
            />

            {/* Quick Add Section - Primary Focus */}
            <div className="mb-8">
              <QuickExpenseTracker isAuthenticated={isAuthenticated} />
            </div>

            {/* Main Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
              {/* Desktop Tabs */}
              <TabsList className="hidden lg:flex w-full h-12 p-1 bg-muted/50 rounded-xl">
                <TabsTrigger value="overview" className="flex-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Tableau de bord
                </TabsTrigger>
                <TabsTrigger value="transactions" className="flex-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Historique
                </TabsTrigger>
                <TabsTrigger value="budget" className="flex-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Mon budget
                </TabsTrigger>
              <TabsTrigger value="assets" className="flex-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Valeur nette
                </TabsTrigger>
                <TabsTrigger value="tools" className="flex-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Outils
                </TabsTrigger>
                <TabsTrigger value="analyses" className="flex-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Analyses
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Paramètres
                </TabsTrigger>
              </TabsList>

              {/* Mobile Bottom Nav */}
              <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border z-50">
                <TabsList className="grid w-full grid-cols-6 h-16 bg-transparent rounded-none">
                  <TabsTrigger value="overview" className="flex flex-col gap-0.5 h-full rounded-none data-[state=active]:bg-primary/5">
                    <BarChart3 className="h-5 w-5" />
                    <span className="text-[10px]">Accueil</span>
                  </TabsTrigger>
                  <TabsTrigger value="transactions" className="flex flex-col gap-0.5 h-full rounded-none data-[state=active]:bg-primary/5">
                    <span className="text-lg">📋</span>
                    <span className="text-[10px]">Historique</span>
                  </TabsTrigger>
                  <TabsTrigger value="budget" className="flex flex-col gap-0.5 h-full rounded-none data-[state=active]:bg-primary/5">
                    <span className="text-lg">💰</span>
                    <span className="text-[10px]">Budget</span>
                  </TabsTrigger>
                  <TabsTrigger value="assets" className="flex flex-col gap-0.5 h-full rounded-none data-[state=active]:bg-primary/5">
                    <span className="text-lg">📊</span>
                    <span className="text-[10px]">Valeur</span>
                  </TabsTrigger>
                  <TabsTrigger value="tools" className="flex flex-col gap-0.5 h-full rounded-none data-[state=active]:bg-primary/5">
                    <span className="text-lg">🛠️</span>
                    <span className="text-[10px]">Outils</span>
                  </TabsTrigger>
                  <TabsTrigger value="analyses" className="flex flex-col gap-0.5 h-full rounded-none data-[state=active]:bg-primary/5">
                    <span className="text-lg">📈</span>
                    <span className="text-[10px]">Plus</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Main Charts */}
                  <div className="lg:col-span-2 space-y-6">
                    <ExpensesByCategory 
                      transactions={transactions}
                      categories={categories}
                      onAnalyze={() => {}}
                    />
                    <ExpenseTrendsChart transactions={transactions} />
                  </div>
                  
                  {/* Sidebar */}
                  <div className="space-y-6">
                    <FinancialHealthScore 
                      transactions={transactions}
                      debts={debts}
                      assets={assets}
                    />
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                          🎯 Objectifs
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <FinancialGoals isAuthenticated={isAuthenticated} />
                      </CardContent>
                    </Card>
                  </div>
                </div>
                
                {/* AI Coach */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium flex items-center gap-2">
                      🤖 Conseils personnalisés
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <BudgetInsights 
                      transactions={transactions}
                      categories={categories}
                      debts={debts}
                      assets={assets}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Budget Tab */}
              <TabsContent value="budget" className="space-y-6">
                <BudgetPlanner isAuthenticated={isAuthenticated} />
              </TabsContent>

              {/* Transactions Tab */}
              <TabsContent value="transactions" className="space-y-6">
                <BudgetTransactions isAuthenticated={isAuthenticated} />
                <details className="group">
                  <summary className="flex items-center gap-2 cursor-pointer p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors">
                    <span>🔁</span>
                    <span className="font-medium">Dépenses récurrentes</span>
                  </summary>
                  <div className="mt-3">
                    <RecurringExpenses isAuthenticated={isAuthenticated} />
                  </div>
                </details>
              </TabsContent>

              {/* Assets Tab */}
              <TabsContent value="assets" className="space-y-6">
                <SimpleNetWorthTracker currentNetWorth={netWorth} isAuthenticated={isAuthenticated} />
                <NetWorthGamification netWorth={netWorth} isAuthenticated={isAuthenticated} />
                <BudgetAssetsDebts isAuthenticated={isAuthenticated} />
                <InvestmentTracker />
              </TabsContent>

              {/* Tools Tab - All New Features */}
              <TabsContent value="tools" className="space-y-6">
                {/* Quick Access Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AgeOfMoney 
                    monthlyIncome={monthlyIncome}
                    monthlyExpenses={monthlyExpenses}
                    currentBalance={monthlyBalance > 0 ? monthlyBalance : 0}
                  />
                  <RoundUpSavings transactions={transactions} />
                  <SpendingLimitsAlerts />
                </div>

                {/* Debt & Savings Tools */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <DebtPayoffPlanner />
                  <SavingsChallenges />
                </div>

                {/* Calendar & Forecast */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <BillCalendar />
                  <CashFlowForecast />
                </div>

                {/* Product Comparison & Smart Insights */}
                <SmartInsights />
                <FinancialProductComparison />
              </TabsContent>

              {/* Analyses Tab */}
              <TabsContent value="analyses" className="space-y-6">
                <MonthComparisonChart transactions={transactions} categories={categories} />
                <BenchmarkComparison isAuthenticated={isAuthenticated} />
                <PremiumAnalysisTab 
                  transactions={transactions}
                  categories={categories}
                  debts={debts}
                  assets={assets}
                />
                <AIFinancialCoach />
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <CategoryManager isAuthenticated={isAuthenticated} />
                  <ThemeCustomizer />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </>
    </ErrorBoundary>
  );
};

export default BudgetCalculator;
