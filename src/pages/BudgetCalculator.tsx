import { Helmet } from "react-helmet";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, AlertCircle, CheckCircle, TrendingUp, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/CurrencyInput";
import { formatPrice } from "@/lib/priceFormat";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NetWorthGamification } from "@/components/budget/NetWorthGamification";
import { BudgetTransactions } from "@/components/budget/BudgetTransactions";
import { BudgetAssetsDebts } from "@/components/budget/BudgetAssetsDebts";
import { FinancialCalculator } from "@/components/budget/FinancialCalculator";
import { SimpleNetWorthTracker } from "@/components/budget/SimpleNetWorthTracker";
import { BudgetTemplates } from "@/components/budget/BudgetTemplates";
import { AIFinancialCoach } from "@/components/budget/AIFinancialCoach";
import { BudgetAlertsManager } from "@/components/budget/BudgetAlertsManager";
import { BudgetPlanner } from "@/components/budget/BudgetPlanner";
import { BudgetInsights } from "@/components/budget/BudgetInsights";
import { DebtCalculator } from "@/components/budget/DebtCalculator";
import { FinancialGoals } from "@/components/budget/FinancialGoals";
import { AchievementsBadges } from "@/components/budget/AchievementsBadges";
import { ThemeCustomizer } from "@/components/budget/ThemeCustomizer";
import { CategoryManager } from "@/components/budget/CategoryManager";
import { QuickExpenseTracker } from "@/components/budget/QuickExpenseTrackerPro";
import { SpendingHabitsStats } from "@/components/budget/SpendingHabitsStats";
import { GoalRecommendations } from "@/components/budget/GoalRecommendations";
import { DailyStreakReward } from "@/components/budget/DailyStreakReward";
import RecurringExpenses from "@/components/budget/RecurringExpenses";
import { ExpensesByCategory } from "@/components/budget/ExpensesByCategory";
import { ExpenseTrendsChart } from "@/components/budget/ExpenseTrendsChart";
import { FinancialHealthScore } from "@/components/budget/FinancialHealthScore";
import { ScenarioSimulator } from "@/components/budget/ScenarioSimulator";
import { QuickNetWorthUpdate } from "@/components/budget/QuickNetWorthUpdate";
import { PremiumAnalysisTab } from "@/components/budget/PremiumAnalysisTab";
import { BudgetResetDialog } from "@/components/budget/BudgetResetDialog";
import { BalanceSheetManager } from "@/components/budget/BalanceSheetManager";
import { MonthlySummaryWidget } from "@/components/budget/MonthlySummaryWidget";
import { DashboardVisibilitySettings, useDashboardVisibility } from "@/components/budget/DashboardVisibilitySettings";
import { DraggableDashboard } from "@/components/budget/DraggableDashboard";
import { MonthComparisonChart } from "@/components/budget/MonthComparisonChart";
import { BudgetTutorial } from "@/components/budget/BudgetTutorial";
import { BudgetOnboarding } from "@/components/budget/BudgetOnboarding";

import { BenchmarkComparison } from "@/components/budget/BenchmarkComparison";
import { BudgetExplanation } from "@/components/budget/BudgetExplanation";
import { CreateDefaultCategories } from "@/components/budget/CreateDefaultCategories";
import { OfflineIndicator } from "@/components/budget/OfflineIndicator";
import { useOfflineSync } from "@/hooks/useOfflineSync";

const BudgetCalculator = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isAuthenticated = !!user;
  const { preferences, setPreferences, currentProfile, applyProfile } = useDashboardVisibility();
  const { isOnline, pendingCount, isSyncing, triggerSync } = useOfflineSync(isAuthenticated);

  useEffect(() => {
    console.log('BudgetCalculator - Auth state:', { user: !!user, loading, isAuthenticated });
  }, [user, loading, isAuthenticated]);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/auth?redirect=/outils/budget');
    }
  }, [loading, isAuthenticated, navigate]);

  // Simple calculator state (for non-authenticated users)
  const [monthlyIncome, setMonthlyIncome] = useState("4000");
  const [rent, setRent] = useState("1200");
  const [utilities, setUtilities] = useState("150");
  const [internet, setInternet] = useState("60");
  const [phone, setPhone] = useState("50");
  const [insurance, setInsurance] = useState("200");
  const [carPayment, setCarPayment] = useState("300");
  const [groceries, setGroceries] = useState("400");
  const [transportation, setTransportation] = useState("150");
  const [entertainment, setEntertainment] = useState("200");
  const [restaurants, setRestaurants] = useState("150");
  const [shopping, setShopping] = useState("100");
  const [savings, setSavings] = useState("300");
  const [debtPayment, setDebtPayment] = useState("200");

  // Fetch user's data for insights
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

  const { data: budgetGoals = [] } = useQuery({
    queryKey: ['budget-goals'],
    queryFn: async () => {
      const { data, error } = await supabase.from('budget_goals').select('*');
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthenticated,
    retry: 1,
  });

  const { data: financialGoals = [] } = useQuery({
    queryKey: ['financial-goals'],
    queryFn: async () => {
      const { data, error } = await supabase.from('financial_goals').select('*');
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthenticated,
    retry: 1,
  });

  const calculateSimpleBudget = () => {
    const income = parseFloat(monthlyIncome) || 0;
    
    const fixedExpenses = 
      (parseFloat(rent) || 0) +
      (parseFloat(utilities) || 0) +
      (parseFloat(internet) || 0) +
      (parseFloat(phone) || 0) +
      (parseFloat(insurance) || 0) +
      (parseFloat(carPayment) || 0);
    
    const variableExpenses = 
      (parseFloat(groceries) || 0) +
      (parseFloat(transportation) || 0) +
      (parseFloat(entertainment) || 0) +
      (parseFloat(restaurants) || 0) +
      (parseFloat(shopping) || 0);
    
    const savingsAmount = parseFloat(savings) || 0;
    const debtAmount = parseFloat(debtPayment) || 0;
    
    const totalExpenses = fixedExpenses + variableExpenses + savingsAmount + debtAmount;
    const remaining = income - totalExpenses;
    const savingsRate = income > 0 ? (savingsAmount / income) * 100 : 0;

    return {
      income,
      fixedExpenses,
      variableExpenses,
      savingsAmount,
      debtAmount,
      totalExpenses,
      remaining,
      savingsRate
    };
  };

  const results = calculateSimpleBudget();
  const totalAssets = assets.reduce((sum, asset) => sum + Number(asset.value), 0);
  const totalDebts = debts.reduce((sum, debt) => sum + Number(debt.balance), 0);
  const netWorth = totalAssets - totalDebts;

  // Calculate total income and expenses for PDF export
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Generate recommendations for PDF export
  const generateRecommendations = () => {
    const recommendations: string[] = [];
    
    if (totalExpenses > totalIncome) {
      recommendations.push("⚠️ Vos dépenses dépassent vos revenus. Identifiez les dépenses non essentielles à réduire.");
    }
    
    if (totalDebts > totalAssets) {
      recommendations.push("📉 Vos dettes dépassent vos actifs. Priorisez le remboursement des dettes à haut taux d'intérêt.");
    }
    
    if (netWorth > 0) {
      recommendations.push("✅ Félicitations ! Votre valeur nette est positive. Continuez sur cette voie.");
    }
    
    if (financialGoals.length === 0) {
      recommendations.push("🎯 Définissez des objectifs financiers pour mieux structurer votre épargne.");
    }
    
    if (transactions.filter(t => t.type === 'income' && t.is_recurring).length === 0) {
      recommendations.push("💡 Automatisez vos revenus récurrents pour simplifier votre suivi budgétaire.");
    }
    
    recommendations.push("📊 Continuez à suivre vos dépenses quotidiennes pour maintenir une vue claire de votre situation financière.");
    recommendations.push("💰 Envisagez d'augmenter votre épargne mensuelle de 5-10% si votre budget le permet.");
    
    return recommendations;
  };

  const chartData = [
    { name: "Dépenses fixes", value: results.fixedExpenses, color: "#ef4444" },
    { name: "Dépenses variables", value: results.variableExpenses, color: "#f59e0b" },
    { name: "Épargne", value: results.savingsAmount, color: "#10b981" },
    { name: "Remboursement dettes", value: results.debtAmount, color: "#8b5cf6" },
    { name: "Restant", value: Math.max(0, results.remaining), color: "#3b82f6" },
  ].filter(item => item.value > 0);

  const getBudgetStatus = () => {
    if (results.remaining >= 0 && results.savingsRate >= 20) {
      return {
        type: "success",
        icon: CheckCircle,
        message: "Excellent! Votre budget est équilibré et vous épargnez suffisamment.",
        color: "text-green-600 dark:text-green-400"
      };
    } else if (results.remaining >= 0 && results.savingsRate >= 10) {
      return {
        type: "warning",
        icon: TrendingUp,
        message: "Bon budget, mais essayez d'augmenter votre taux d'épargne à 20%.",
        color: "text-yellow-600 dark:text-yellow-400"
      };
    } else if (results.remaining >= 0) {
      return {
        type: "warning",
        icon: AlertCircle,
        message: "Votre budget est équilibré, mais vous devriez épargner davantage.",
        color: "text-yellow-600 dark:text-yellow-400"
      };
    } else {
      return {
        type: "error",
        icon: AlertCircle,
        message: "Attention! Vos dépenses dépassent vos revenus. Réduisez vos dépenses.",
        color: "text-red-600 dark:text-red-400"
      };
    }
  };

  const budgetStatus = getBudgetStatus();
  const StatusIcon = budgetStatus.icon;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Require authentication
  if (!isAuthenticated) {
    // Sauvegarder l'URL actuelle pour redirection après login
    sessionStorage.setItem('authReturnUrl', '/outils/budget');
    navigate("/auth");
    return null;
  }

  return (
    <ErrorBoundary>
      <>
        <CreateDefaultCategories />
        <BudgetOnboarding />
        <BudgetTutorial />
        <SEO
          title="Planificateur Budget Personnel Gratuit Québec | Gestion Finances 2025"
          description="Planificateur de budget intelligent gratuit pour gérer vos finances au Québec. Suivi dépenses temps réel, objectifs épargne REER CELI, analyse habitudes, coach financier IA personnalisé. Outil complet gestion budget familial et personnel."
          keywords="planificateur budget québec gratuit, gestion budget personnel québec, suivi dépenses temps réel, calculateur budget mensuel, objectifs épargne REER CELI, coach financier gratuit, outil budget intelligent québec, gestion finances personnelles, budget familial québec, calculateur salaire net, planification financière québec, gestionnaire dépenses, application budget gratuite"
          canonical="/outils/budget"
          type="website"
          structuredData={{
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Planificateur de Budget Personnel Québec",
            "description": "Planificateur de budget intelligent et gratuit pour gérer vos finances personnelles au Québec. Suivi des dépenses en temps réel, objectifs d'épargne, analyse des habitudes financières, coaching personnalisé IA, et gamification.",
            "url": "https://vente.club/outils/budget",
            "applicationCategory": "FinanceApplication",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "CAD"
            },
            "featureList": [
              "Suivi des dépenses et revenus en temps réel",
              "Gestion REER, CELI et autres actifs financiers",
              "Suivi des dettes avec calcul automatique d'intérêts",
              "Calcul et évolution de la valeur nette",
              "Score de santé financière personnalisé",
              "Coach financier IA avec recommandations intelligentes",
              "Graphiques d'évolution et analyses avancées",
              "Objectifs d'épargne avec suivi de progression",
              "Détection automatique d'abonnements",
              "Mode hors ligne avec synchronisation",
              "Export PDF des rapports mensuels",
              "Gamification et récompenses motivantes"
            ],
            "author": {
              "@type": "Organization",
              "name": "Vente.Club",
              "url": "https://vente.club"
            },
            "audience": {
              "@type": "Audience",
              "geographicArea": {
                "@type": "Place",
                "name": "Québec, Canada"
              }
            },
            "inLanguage": "fr-CA"
          }}
        />
        <BreadcrumbSchema
          items={[
            { name: "Accueil", url: "/" },
            { name: "Outils Financiers Québec", url: "/outils" },
            { name: "Planificateur Budget Personnel", url: "/outils/budget" }
          ]}
        />

      <div className="min-h-screen bg-background py-8 pb-24 lg:pb-8">
        <div className="container mx-auto px-3 lg:px-4 max-w-7xl">
          <Alert className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
            <AlertTitle className="text-yellow-800 dark:text-yellow-400">Confidentialité et Avertissement</AlertTitle>
            <AlertDescription className="text-yellow-700 dark:text-yellow-300">
              Toutes vos données financières sont stockées de manière sécurisée et privée. Ce planificateur est un outil d'aide à la décision financière personnelle. Pour des conseils financiers professionnels adaptés à votre situation, consultez toujours un conseiller financier ou un comptable qualifié.
            </AlertDescription>
          </Alert>
          
          {/* SEO Content Section */}
          <div className="text-center mb-6 lg:mb-8 space-y-3 lg:space-y-4">
            <div className="flex flex-col lg:flex-row items-center justify-center gap-3 lg:gap-4">
              <h1 className="text-2xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Planificateur de Budget Personnel Gratuit au Québec
              </h1>
              <BudgetResetDialog />
            </div>
            <p className="text-base lg:text-xl text-muted-foreground max-w-4xl mx-auto px-2 leading-relaxed">
              Prenez le contrôle de vos finances personnelles avec notre planificateur de budget intelligent 100% gratuit. 
              Conçu spécialement pour les Québécois, suivez vos dépenses en temps réel, gérez vos actifs REER et CELI, 
              fixez des objectifs d'épargne réalistes et bénéficiez d'un coach financier IA personnalisé pour atteindre 
              la liberté financière.
            </p>
            <p className="text-sm lg:text-base text-muted-foreground max-w-3xl mx-auto px-2">
              Que vous souhaitiez créer votre premier budget familial, optimiser vos dépenses mensuelles, 
              planifier un achat important ou simplement mieux gérer votre argent au quotidien, notre outil 
              de gestion budgétaire vous accompagne avec des analyses avancées 100% gratuites et accessibles.
            </p>
            {/* SEO-optimized feature highlights - Mobile optimized */}
            <div className="flex flex-wrap justify-center gap-4 lg:gap-6 max-w-3xl mx-auto mt-4 lg:mt-6 text-xs lg:text-sm">
              <div className="flex items-center gap-2">
                <span className="text-xl lg:text-2xl">📊</span>
                <span className="text-muted-foreground">Suivi en temps réel</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl lg:text-2xl">🎯</span>
                <span className="text-muted-foreground">Objectifs épargne</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl lg:text-2xl">🤖</span>
                <span className="text-muted-foreground">Coach IA</span>
              </div>
            </div>
          </div>

          {/* Quick Add */}
          <OfflineIndicator 
            isOnline={isOnline}
            pendingCount={pendingCount}
            isSyncing={isSyncing}
            onSync={triggerSync}
          />
          
          {/* Monthly Summary - After Quick Tracker */}
          <MonthlySummaryWidget isAuthenticated={isAuthenticated} />
          
          <QuickExpenseTracker isAuthenticated={isAuthenticated} />

          <Tabs defaultValue="overview" className="space-y-6">
            {/* Desktop Tabs */}
            <TabsList className="hidden lg:grid w-full grid-cols-6 gap-2 h-auto">
              <TabsTrigger value="overview" className="text-base py-3">
                📊 Tableau de bord
              </TabsTrigger>
              <TabsTrigger value="transactions" className="text-base py-3">
                💳 Historique
              </TabsTrigger>
              <TabsTrigger value="budget" className="text-base py-3">
                💰 Mon budget
              </TabsTrigger>
              <TabsTrigger value="assets" className="text-base py-3">
                🏦 Ma valeur nette
              </TabsTrigger>
              <TabsTrigger value="analyses" className="text-base py-3">
                📈 Analyses
              </TabsTrigger>
              <TabsTrigger value="customize" className="text-base py-3">
                🎨 Personnaliser
              </TabsTrigger>
            </TabsList>

            {/* Mobile Navigation - Fixed Bottom */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 pb-safe">
              <TabsList className="grid w-full grid-cols-5 h-16 rounded-none bg-background">
                <TabsTrigger value="overview" className="flex flex-col gap-1 data-[state=active]:bg-primary/10">
                  <span className="text-xl">📊</span>
                  <span className="text-xs">Accueil</span>
                </TabsTrigger>
                <TabsTrigger value="transactions" className="flex flex-col gap-1 data-[state=active]:bg-primary/10">
                  <span className="text-xl">💳</span>
                  <span className="text-xs">Historique</span>
                </TabsTrigger>
                <TabsTrigger value="budget" className="flex flex-col gap-1 data-[state=active]:bg-primary/10">
                  <span className="text-xl">💰</span>
                  <span className="text-xs">Budget</span>
                </TabsTrigger>
                <TabsTrigger value="assets" className="flex flex-col gap-1 data-[state=active]:bg-primary/10">
                  <span className="text-xl">🏦</span>
                  <span className="text-xs">Valeur</span>
                </TabsTrigger>
                <TabsTrigger value="analyses" className="flex flex-col gap-1 data-[state=active]:bg-primary/10">
                  <span className="text-xl">📈</span>
                  <span className="text-xs">Plus</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview">
              <div className="flex justify-end mb-4">
                <DashboardVisibilitySettings
                  preferences={preferences}
                  onChange={setPreferences}
                  currentProfile={currentProfile}
                  onProfileChange={applyProfile}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6 pb-20 lg:pb-6">
                {/* Score financier - Sidebar on desktop, full width on mobile */}
                <div className="lg:col-span-1 order-2 lg:order-1">
                  <div className="lg:sticky lg:top-4">
                    <FinancialHealthScore 
                      transactions={transactions}
                      debts={debts}
                      assets={assets}
                    />
                  </div>
                </div>

                {/* Main content - Draggable widgets */}
                <div className="lg:col-span-3 order-1 lg:order-2">
                  <DraggableDashboard
                    preferences={preferences}
                    onOrderChange={(newOrder) => {
                      setPreferences({ ...preferences, widgetOrder: newOrder });
                    }}
                    children={{
                      expenseTrends: (
                        <ExpenseTrendsChart transactions={transactions} />
                      ),
                      expensesByCategory: (
                        <ExpensesByCategory 
                          transactions={transactions}
                          categories={categories}
                          onAnalyze={() => {
                            const tabsList = document.querySelector('[role="tablist"]');
                            const analysesTab = tabsList?.querySelector('[value="analyses"]') as HTMLButtonElement;
                            analysesTab?.click();
                          }}
                        />
                      ),
                      monthComparison: (
                        <MonthComparisonChart 
                          transactions={transactions}
                          categories={categories}
                        />
                      ),
                      coachIA: (
                        <Card>
                          <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
                            <CardTitle className="flex items-center gap-2">
                              <span className="text-2xl">🤖</span>
                              Coach financier
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6">
                            <BudgetInsights 
                              transactions={transactions}
                              categories={categories}
                              debts={debts}
                              assets={assets}
                            />
                          </CardContent>
                        </Card>
                      ),
                      financialGoals: (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <span className="text-2xl">🎯</span>
                              Objectifs d'épargne
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <FinancialGoals isAuthenticated={isAuthenticated} />
                          </CardContent>
                        </Card>
                      ),
                      budgetTemplates: (
                        <BudgetTemplates />
                      ),
                      aiCoach: (
                        <AIFinancialCoach />
                      ),
                      budgetAlerts: (
                        <BudgetAlertsManager />
                      ),
                    }}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="budget" className="pb-20 lg:pb-6">
              <div className="space-y-6">
                <BudgetExplanation />
                <BudgetPlanner isAuthenticated={isAuthenticated} />
              </div>
            </TabsContent>

            <TabsContent value="transactions" className="pb-20 lg:pb-6">
              <div className="space-y-6">
                <BudgetTransactions isAuthenticated={isAuthenticated} />
                
                {/* Compact Fixed Costs Section */}
                <details className="group">
                  <summary className="flex items-center gap-2 cursor-pointer list-none p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <span className="text-lg">🔁</span>
                    <span className="font-medium">Mes coûts fixes</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      Cliquez pour voir vos dépenses récurrentes
                    </span>
                  </summary>
                  <div className="mt-2 p-4 rounded-lg border bg-card">
                    <RecurringExpenses isAuthenticated={isAuthenticated} />
                  </div>
                </details>
              </div>
            </TabsContent>

            <TabsContent value="assets">
              <div className="space-y-6">
                <SimpleNetWorthTracker currentNetWorth={netWorth} isAuthenticated={isAuthenticated} />
                <NetWorthGamification netWorth={netWorth} isAuthenticated={isAuthenticated} />
                <BudgetAssetsDebts isAuthenticated={isAuthenticated} />
              </div>
            </TabsContent>

            <TabsContent value="customize">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CategoryManager isAuthenticated={isAuthenticated} />
                <ThemeCustomizer />
              </div>
            </TabsContent>

            <TabsContent value="analyses">
              <div className="space-y-6">
                <BenchmarkComparison isAuthenticated={isAuthenticated} />

                <PremiumAnalysisTab 
                  transactions={transactions}
                  categories={categories}
                  debts={debts}
                  assets={assets}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* SEO Content Section */}
          <div className="mt-12 space-y-8">
            <section className="prose prose-slate dark:prose-invert max-w-none">
              <h2 className="text-3xl font-bold mb-4">Planificateur de Budget Gratuit pour le Québec</h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Notre <strong>planificateur de budget en ligne gratuit</strong> est conçu spécifiquement pour les Québécois 
                qui souhaitent prendre le contrôle de leurs finances personnelles. Que vous cherchiez à économiser pour 
                l'achat d'une entreprise, à mieux gérer vos dépenses quotidiennes, ou à planifier votre retraite avec 
                votre REER et CELI, notre outil vous accompagne à chaque étape.
              </p>
            </section>

            <section className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">🎯 Fonctionnalités Principales</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>✓ <strong>Suivi des dépenses en temps réel</strong> avec catégorisation automatique</p>
                  <p>✓ <strong>Gestion REER, CELI et actifs</strong> avec historique complet</p>
                  <p>✓ <strong>Suivi des dettes</strong> avec calcul des intérêts et planification remboursement</p>
                  <p>✓ <strong>Score de santé financière</strong> basé sur vos habitudes réelles</p>
                  <p>✓ <strong>Recommandations personnalisées</strong> par intelligence artificielle</p>
                  <p>✓ <strong>Graphiques d'évolution</strong> pour visualiser vos progrès</p>
                  <p>✓ <strong>Objectifs d'épargne</strong> avec suivi de progression automatique</p>
                  <p>✓ <strong>Budget vs Réel</strong> pour comparer planifié et dépensé</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">💡 Pourquoi Utiliser Notre Outil?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>✓ <strong>100% gratuit</strong> sans limitation ni publicité intrusive</p>
                  <p>✓ <strong>Données sécurisées</strong> avec chiffrement de bout en bout</p>
                  <p>✓ <strong>Facile à utiliser</strong> interface intuitive et minimaliste</p>
                  <p>✓ <strong>Adapté au Québec</strong> REER, CELI, taux d'imposition QC</p>
                  <p>✓ <strong>Accessible partout</strong> sur mobile, tablette et ordinateur</p>
                  <p>✓ <strong>Sans inscription bancaire</strong> vos comptes restent privés</p>
                  <p>✓ <strong>Coaching intelligent</strong> conseils personnalisés automatiques</p>
                  <p>✓ <strong>Gamification motivante</strong> badges et récompenses quotidiennes</p>
                </CardContent>
              </Card>
            </section>

            <section className="prose prose-slate dark:prose-invert max-w-none">
              <h3 className="text-2xl font-bold mb-3">Comment Utiliser le Planificateur de Budget?</h3>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  <strong>1. Ajoutez vos transactions rapidement</strong> - Utilisez le tracker express pour enregistrer 
                  vos dépenses et revenus en quelques secondes. Les catégories s'appliquent automatiquement.
                </p>
                <p>
                  <strong>2. Définissez votre budget mensuel</strong> - Établissez des limites par catégorie 
                  (alimentation, logement, transport) pour mieux contrôler vos sorties d'argent.
                </p>
                <p>
                  <strong>3. Suivez vos actifs et dettes</strong> - Enregistrez vos REER, CELI, placements, 
                  hypothèque, prêts auto et cartes de crédit pour calculer votre valeur nette réelle.
                </p>
                <p>
                  <strong>4. Consultez votre score de santé financière</strong> - Obtenez une évaluation objective 
                  de votre situation financière avec des recommandations concrètes d'amélioration.
                </p>
                <p>
                  <strong>5. Visualisez votre progression</strong> - Les graphiques d'évolution vous montrent 
                  comment votre patrimoine évolue dans le temps et vous motivent à continuer.
                </p>
              </div>
            </section>

            <section className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg p-6">
              <h3 className="text-2xl font-bold mb-4">Atteignez Vos Objectifs Financiers au Québec</h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">💰 Épargner pour un projet</h4>
                  <p className="text-muted-foreground">
                    Maison, voyage, entreprise - définissez vos objectifs et suivez votre progression jour après jour.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">📉 Rembourser vos dettes</h4>
                  <p className="text-muted-foreground">
                    Calculez l'impact des intérêts et créez un plan de remboursement accéléré pour vous libérer.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">📈 Bâtir votre patrimoine</h4>
                  <p className="text-muted-foreground">
                    REER, CELI, placements - diversifiez intelligemment et suivez la croissance de vos actifs.
                  </p>
                </div>
              </div>
            </section>
          </div>

          {/* SEO-Rich Educational Content Section */}
          <Card className="mt-8 bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-2xl">Pourquoi utiliser un planificateur de budget au Québec?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-muted-foreground">
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-3">Gestion de Budget Personnel Simplifiée</h2>
                <p className="leading-relaxed">
                  Un planificateur de budget est un outil essentiel pour prendre le contrôle de vos finances personnelles. 
                  Que vous soyez un jeune professionnel qui débute, une famille québécoise qui souhaite épargner pour l'achat 
                  d'une maison, ou un travailleur autonome qui gère des revenus variables, notre planificateur budgétaire gratuit 
                  vous aide à visualiser clairement où va votre argent chaque mois et à prendre de meilleures décisions financières.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Fonctionnalités principales de notre outil de gestion budgétaire</h3>
                <ul className="space-y-2 list-disc list-inside">
                  <li><strong>Suivi automatique des dépenses et revenus</strong> - Enregistrez toutes vos transactions en quelques secondes</li>
                  <li><strong>Gestion REER et CELI</strong> - Suivez l'évolution de vos placements et épargne-retraite</li>
                  <li><strong>Calculateur de valeur nette</strong> - Visualisez votre patrimoine total (actifs moins dettes)</li>
                  <li><strong>Objectifs d'épargne personnalisés</strong> - Fixez des buts financiers et suivez votre progression</li>
                  <li><strong>Coach financier IA intelligent</strong> - Recevez des recommandations adaptées à votre situation</li>
                  <li><strong>Analyses avancées gratuites</strong> - Détection d'abonnements, calcul d'intérêts sur dettes, prévisions</li>
                  <li><strong>Mode hors ligne</strong> - Accédez à votre budget même sans connexion internet</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Comment créer un budget mensuel efficace au Québec?</h3>
                <p className="leading-relaxed mb-3">
                  Créer un budget familial ou personnel efficace commence par comprendre vos revenus nets mensuels (après impôts et cotisations). 
                  Notre calculateur de salaire net intégré vous aide à déterminer précisément combien vous gagnez réellement chaque mois. 
                  Ensuite, catégorisez vos dépenses en différentes sections : logement (loyer/hypothèque), alimentation (épicerie), 
                  transport (auto, essence, transport en commun), divertissement, épargne, et remboursement de dettes.
                </p>
                <p className="leading-relaxed">
                  La règle populaire du 50/30/20 suggère d'allouer 50% de vos revenus aux besoins essentiels, 30% aux envies et loisirs, 
                  et 20% à l'épargne et au remboursement de dettes. Notre planificateur vous aide à visualiser si vous respectez ces proportions 
                  et à identifier les opportunités d'optimisation de vos finances personnelles.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Épargne et Planification Financière pour les Québécois</h3>
                <p className="leading-relaxed">
                  Au Québec, maximiser vos contributions REER (Régime enregistré d'épargne-retraite) et CELI (Compte d'épargne libre d'impôt) 
                  est crucial pour bâtir votre richesse à long terme. Notre planificateur budgétaire vous aide à suivre l'évolution de ces 
                  placements et à calculer combien vous pouvez épargner mensuellement selon vos objectifs financiers. Que vous épargniez 
                  pour la mise de fonds d'une propriété, un voyage, l'éducation de vos enfants, ou votre retraite, notre outil vous 
                  accompagne dans l'atteinte de vos buts avec des prévisions réalistes et un suivi motivant.
                </p>
              </div>

              <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                <p className="text-sm text-foreground">
                  <strong>Débutez gratuitement aujourd'hui :</strong> Aucune carte de crédit requise. 
                  Créez votre compte et commencez à suivre vos finances en moins de 2 minutes. 
                  Rejoignez des milliers de Québécois qui ont repris le contrôle de leur budget personnel avec notre planificateur intelligent.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-8 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100">🔒 Confidentialité et sécurité</CardTitle>
            </CardHeader>
            <CardContent className="text-blue-800 dark:text-blue-200 space-y-2">
              <p>• Toutes vos données financières sont chiffrées et stockées en toute sécurité</p>
              <p>• Aucune donnée n'est partagée avec des tiers</p>
              <p>• Vous conservez un contrôle total sur vos informations</p>
              <p>• Les données sont sauvegardées automatiquement dans votre compte</p>
            </CardContent>
          </Card>
        </div>
      </div>
      </>
    </ErrorBoundary>
  );
};

export default BudgetCalculator;
