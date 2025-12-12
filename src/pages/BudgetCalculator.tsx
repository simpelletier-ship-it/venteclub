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

            {/* Main Tabs - SIMPLIFIED: 3 tabs only */}
            <Tabs defaultValue="home" className="space-y-6">
              {/* Desktop Tabs - Clean and Simple */}
              <TabsList className="hidden lg:grid w-full max-w-md mx-auto grid-cols-3 h-12 p-1 bg-muted/50 rounded-xl">
                <TabsTrigger value="home" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  🏠 Accueil
                </TabsTrigger>
                <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  📋 Historique
                </TabsTrigger>
                <TabsTrigger value="more" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  ⚙️ Plus
                </TabsTrigger>
              </TabsList>

              {/* Mobile Bottom Nav - 3 tabs only */}
              <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border z-50">
                <TabsList className="grid w-full grid-cols-3 h-16 bg-transparent rounded-none">
                  <TabsTrigger value="home" className="flex flex-col gap-0.5 h-full rounded-none data-[state=active]:bg-primary/5 data-[state=active]:text-primary">
                    <span className="text-xl">🏠</span>
                    <span className="text-xs font-medium">Accueil</span>
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex flex-col gap-0.5 h-full rounded-none data-[state=active]:bg-primary/5 data-[state=active]:text-primary">
                    <span className="text-xl">📋</span>
                    <span className="text-xs font-medium">Historique</span>
                  </TabsTrigger>
                  <TabsTrigger value="more" className="flex flex-col gap-0.5 h-full rounded-none data-[state=active]:bg-primary/5 data-[state=active]:text-primary">
                    <span className="text-xl">⚙️</span>
                    <span className="text-xs font-medium">Plus</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* HOME TAB - Everything important at a glance */}
              <TabsContent value="home" className="space-y-6">
                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ExpensesByCategory 
                    transactions={transactions}
                    categories={categories}
                    onAnalyze={() => {}}
                  />
                  <div className="space-y-6">
                    <FinancialHealthScore 
                      transactions={transactions}
                      debts={debts}
                      assets={assets}
                    />
                    <AgeOfMoney 
                      monthlyIncome={monthlyIncome}
                      monthlyExpenses={monthlyExpenses}
                      currentBalance={monthlyBalance > 0 ? monthlyBalance : 0}
                    />
                  </div>
                </div>

                {/* Goals & Budget */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-medium">🎯 Objectifs d'épargne</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FinancialGoals isAuthenticated={isAuthenticated} />
                    </CardContent>
                  </Card>
                  <BudgetPlanner isAuthenticated={isAuthenticated} />
                </div>

                {/* Trends */}
                <ExpenseTrendsChart transactions={transactions} />

                {/* AI Insights */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium">💡 Conseils personnalisés</CardTitle>
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

              {/* HISTORY TAB - All transactions */}
              <TabsContent value="history" className="space-y-6">
                <BudgetTransactions isAuthenticated={isAuthenticated} />
                
                {/* Recurring Expenses Collapsible */}
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

              {/* MORE TAB - All other features organized in sections */}
              <TabsContent value="more" className="space-y-8">
                {/* Section: Net Worth */}
                <div>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    💰 Valeur nette
                  </h2>
                  <div className="space-y-4">
                    <SimpleNetWorthTracker currentNetWorth={netWorth} isAuthenticated={isAuthenticated} />
                    <NetWorthGamification netWorth={netWorth} isAuthenticated={isAuthenticated} />
                    <BudgetAssetsDebts isAuthenticated={isAuthenticated} />
                  </div>
                </div>

                {/* Section: Tools */}
                <div>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    🛠️ Outils financiers
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <RoundUpSavings transactions={transactions} />
                    <SpendingLimitsAlerts />
                    <InvestmentTracker />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                    <DebtPayoffPlanner />
                    <SavingsChallenges />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                    <BillCalendar />
                    <CashFlowForecast />
                  </div>
                </div>

                {/* Section: Analysis */}
                <div>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    📊 Analyses avancées
                  </h2>
                  <div className="space-y-4">
                    <MonthComparisonChart transactions={transactions} categories={categories} />
                    <BenchmarkComparison isAuthenticated={isAuthenticated} />
                    <SmartInsights />
                    <FinancialProductComparison />
                  </div>
                </div>

                {/* Section: Settings */}
                <div>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    ⚙️ Paramètres
                  </h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <CategoryManager isAuthenticated={isAuthenticated} />
                    <ThemeCustomizer />
                  </div>
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
