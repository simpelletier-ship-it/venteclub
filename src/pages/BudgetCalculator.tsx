import { Helmet } from "react-helmet";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/CurrencyInput";
import { formatPrice } from "@/lib/priceFormat";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { AlertCircle, CheckCircle, TrendingUp, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NetWorthGamification } from "@/components/budget/NetWorthGamification";
import { BudgetTransactions } from "@/components/budget/BudgetTransactions";
import { BudgetAssetsDebts } from "@/components/budget/BudgetAssetsDebts";
import { BudgetPlanner } from "@/components/budget/BudgetPlanner";
import { BudgetInsights } from "@/components/budget/BudgetInsights";
import { DebtCalculator } from "@/components/budget/DebtCalculator";
import { FinancialGoals } from "@/components/budget/FinancialGoals";
import { AchievementsBadges } from "@/components/budget/AchievementsBadges";
import { ThemeCustomizer } from "@/components/budget/ThemeCustomizer";
import { CategoryManager } from "@/components/budget/CategoryManager";
import { QuickExpenseTracker } from "@/components/budget/QuickExpenseTracker";
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
import { TagStatistics } from "@/components/budget/TagStatistics";
import { TransactionTemplates } from "@/components/budget/TransactionTemplates";
import { TagComparison } from "@/components/budget/TagComparison";
import { BalanceSheetManager } from "@/components/budget/BalanceSheetManager";
import { MonthlySummaryWidget } from "@/components/budget/MonthlySummaryWidget";
import { DashboardVisibilitySettings, useDashboardVisibility } from "@/components/budget/DashboardVisibilitySettings";
import { DraggableDashboard } from "@/components/budget/DraggableDashboard";

const BudgetCalculator = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isAuthenticated = !!user;
  const { preferences, setPreferences, currentProfile, applyProfile } = useDashboardVisibility();

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
    return null; // Will redirect via useEffect
  }

  return (
    <ErrorBoundary>
      <>
        <Helmet>
        <title>Planificateur Budget Québec Gratuit | Gestion Finances Personnelles 2025</title>
        <meta name="description" content="Planificateur de budget intelligent gratuit pour gérer vos finances personnelles au Québec. Suivi dépenses en temps réel, objectifs épargne, analyse habitudes financières, coaching personnalisé et gamification. Outil complet REER, CELI, dettes." />
        <meta name="keywords" content="planificateur budget québec, budget personnel gratuit, gestion finances québec, suivi dépenses, calculateur budget mensuel, objectifs épargne, REER CELI, coaching financier gratuit, outil budget intelligent, gestion dettes, calculateur salaire net québec" />
        
        {/* Canonical et alternates */}
        <link rel="canonical" href="https://vente.club/outils/budget" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Planificateur Budget Québec Gratuit | Gestion Finances 2025" />
        <meta property="og:description" content="Gérez votre budget intelligemment avec notre planificateur gratuit. Suivi automatique, recommandations personnalisées, gamification et coaching financier pour atteindre vos objectifs au Québec." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://vente.club/outils/budget" />
        <meta property="og:site_name" content="Vente.Club" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Planificateur Budget Québec Gratuit | Gestion Finances 2025" />
        <meta name="twitter:description" content="Outil gratuit de gestion budgétaire intelligent pour le Québec. Suivi dépenses, objectifs, coaching personnalisé." />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Planificateur Budget Québec",
            "applicationCategory": "FinanceApplication",
            "operatingSystem": "All",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "CAD"
            },
            "description": "Planificateur de budget intelligent et gratuit pour gérer vos finances personnelles au Québec. Suivi des dépenses en temps réel, objectifs d'épargne, analyse des habitudes financières et coaching personnalisé.",
            "featureList": [
              "Suivi des dépenses et revenus en temps réel",
              "Gestion REER, CELI et autres actifs",
              "Suivi des dettes avec calcul d'intérêts",
              "Score de santé financière",
              "Recommandations personnalisées",
              "Graphiques d'évolution",
              "Objectifs d'épargne avec progression",
              "Gamification et récompenses"
            ],
            "author": {
              "@type": "Organization",
              "name": "Vente.Club"
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* SEO Content Section */}
          <div className="text-center mb-8 space-y-4">
            <div className="flex items-center justify-center gap-4">
              <h1 className="text-4xl font-bold mb-3">
                Planificateur de Budget Québec Gratuit 2025
              </h1>
              <BudgetResetDialog />
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Gérez vos finances personnelles intelligemment avec notre outil gratuit de planification budgétaire. 
              Suivi des dépenses en temps réel, objectifs d'épargne, coaching financier personnalisé et gamification.
            </p>
            
            {/* SEO-optimized feature highlights - Simple list style */}
            <div className="flex flex-wrap justify-center gap-6 max-w-3xl mx-auto mt-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                <span className="text-muted-foreground">Suivi en temps réel</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">💰</span>
                <span className="text-muted-foreground">REER & CELI</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                <span className="text-muted-foreground">Objectifs épargne</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🤖</span>
                <span className="text-muted-foreground">Coach IA</span>
              </div>
            </div>
          </div>

          {/* Quick Add */}
          <QuickExpenseTracker isAuthenticated={isAuthenticated} />

          {/* Monthly Summary Widget */}
          <MonthlySummaryWidget isAuthenticated={isAuthenticated} />

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 gap-2 h-auto">
              <TabsTrigger value="overview" className="text-base py-3">
                📊 Tableau de bord
              </TabsTrigger>
              <TabsTrigger value="transactions" className="text-base py-3">
                💳 Mes dépenses
              </TabsTrigger>
              <TabsTrigger value="budget" className="text-base py-3">
                💰 Mon budget
              </TabsTrigger>
              <TabsTrigger value="assets" className="text-base py-3">
                🏦 Mes actifs
              </TabsTrigger>
              <TabsTrigger value="analyses" className="text-base py-3">
                📈 Analyses
              </TabsTrigger>
              <TabsTrigger value="customize" className="text-base py-3">
                🎨 Personnaliser
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="flex justify-end mb-4">
                <DashboardVisibilitySettings
                  preferences={preferences}
                  onChange={setPreferences}
                  currentProfile={currentProfile}
                  onProfileChange={applyProfile}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Score financier - Sticky sidebar */}
                <div className="lg:col-span-1">
                  <div className="lg:sticky lg:top-4">
                    <FinancialHealthScore 
                      transactions={transactions}
                      debts={debts}
                      assets={assets}
                    />
                  </div>
                </div>

                {/* Main content - Draggable widgets */}
                <div className="lg:col-span-3">
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
                            const transactionsTab = tabsList?.querySelector('[value="transactions"]') as HTMLButtonElement;
                            transactionsTab?.click();
                          }}
                        />
                      ),
                      netWorthGamification: (
                        <NetWorthGamification netWorth={netWorth} isAuthenticated={isAuthenticated} />
                      ),
                      quickNetWorthUpdate: (
                        <div className="flex justify-center">
                          <QuickNetWorthUpdate currentNetWorth={netWorth} isAuthenticated={isAuthenticated} />
                        </div>
                      ),
                      reerCeli: (
                        <Card>
                          <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
                            <CardTitle className="flex items-center gap-2">
                              <span className="text-2xl">💰</span>
                              REER & CELI
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {assets.filter(a => a.type === 'REER' || a.type === 'CELI').length > 0 ? (
                                assets
                                  .filter(a => a.type === 'REER' || a.type === 'CELI')
                                  .map(asset => (
                                    <div key={asset.id} className="p-4 bg-muted/50 rounded-lg">
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <p className="text-sm text-muted-foreground">{asset.type}</p>
                                          <p className="text-xl font-bold">{formatPrice(asset.value)}</p>
                                        </div>
                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                          <span className="text-2xl">
                                            {asset.type === 'REER' ? '🏦' : '💎'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))
                              ) : (
                                <div className="col-span-2 p-4 bg-muted/30 rounded-lg text-center text-sm text-muted-foreground">
                                  Aucun REER ou CELI enregistré. Ajoutez-les dans l'onglet "Mes actifs".
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ),
                      coachIA: (
                        <Card>
                          <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
                            <CardTitle className="flex items-center gap-2">
                              <span className="text-2xl">🤖</span>
                              Coach IA
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
                    }}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="budget">
              <BudgetPlanner isAuthenticated={isAuthenticated} />
            </TabsContent>

            <TabsContent value="transactions">
              <BudgetTransactions isAuthenticated={isAuthenticated} />
            </TabsContent>

            <TabsContent value="assets">
              <div className="space-y-6">
                <BalanceSheetManager isAuthenticated={isAuthenticated} />
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
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">🏷️</span>
                      Statistiques par tag
                    </CardTitle>
                    <CardDescription>Analysez vos dépenses par étiquettes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TagStatistics isAuthenticated={isAuthenticated} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">📊</span>
                      Comparaison par tag
                    </CardTitle>
                    <CardDescription>Comparez vos dépenses entre périodes</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TagComparison isAuthenticated={isAuthenticated} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">⚡</span>
                      Templates de transactions
                    </CardTitle>
                    <CardDescription>Transactions fréquentes sauvegardées</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TransactionTemplates 
                      isAuthenticated={isAuthenticated}
                      categories={categories}
                    />
                  </CardContent>
                </Card>

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
