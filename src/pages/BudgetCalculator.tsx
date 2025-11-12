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

const BudgetCalculator = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isAuthenticated = !!user;

  useEffect(() => {
    console.log('BudgetCalculator - Auth state:', { user: !!user, loading, isAuthenticated });
  }, [user, loading, isAuthenticated]);

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

  const { data: goals = [] } = useQuery({
    queryKey: ['budget-goals'],
    queryFn: async () => {
      const { data, error } = await supabase.from('budget_goals').select('*');
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

  // Simple calculator for non-authenticated users
  if (!isAuthenticated) {
    return (
      <>
        <Helmet>
          <title>Planificateur de Budget Québec | Outil Gratuit de Gestion Financière</title>
          <meta name="description" content="Planificateur de budget intelligent et gratuit pour gérer vos finances personnelles au Québec. Suivi des dépenses, objectifs d'épargne, analyse des habitudes et coaching financier personnalisé." />
          <meta name="keywords" content="budget québec, planificateur financier gratuit, gestion budget personnel, suivi dépenses, objectifs épargne, calculateur budget" />
          <link rel="canonical" href="https://vente.club/outils/budget" />
          <meta property="og:title" content="Planificateur de Budget Québec | Outil Gratuit" />
          <meta property="og:description" content="Gérez votre budget avec intelligence. Suivi automatique, recommandations personnalisées et gamification pour atteindre vos objectifs financiers." />
          <meta property="og:type" content="website" />
        </Helmet>

        <div className="min-h-screen bg-background py-8">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-2 text-foreground">
                Planificateur de Budget
              </h1>
              <p className="text-muted-foreground text-lg">
                Créez et gérez votre budget mensuel et annuel
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Input Section */}
              <div className="lg:col-span-1 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenus mensuels</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Revenu net mensuel</Label>
                      <CurrencyInput value={monthlyIncome} onChange={setMonthlyIncome} className="mt-1" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Dépenses fixes</CardTitle>
                    <CardDescription>Dépenses récurrentes mensuelles</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Loyer / Hypothèque</Label>
                      <CurrencyInput value={rent} onChange={setRent} className="mt-1" />
                    </div>
                    <div>
                      <Label>Électricité / Chauffage</Label>
                      <CurrencyInput value={utilities} onChange={setUtilities} className="mt-1" />
                    </div>
                    <div>
                      <Label>Internet</Label>
                      <CurrencyInput value={internet} onChange={setInternet} className="mt-1" />
                    </div>
                    <div>
                      <Label>Téléphone</Label>
                      <CurrencyInput value={phone} onChange={setPhone} className="mt-1" />
                    </div>
                    <div>
                      <Label>Assurances</Label>
                      <CurrencyInput value={insurance} onChange={setInsurance} className="mt-1" />
                    </div>
                    <div>
                      <Label>Paiement auto</Label>
                      <CurrencyInput value={carPayment} onChange={setCarPayment} className="mt-1" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Dépenses variables</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Épicerie</Label>
                      <CurrencyInput value={groceries} onChange={setGroceries} className="mt-1" />
                    </div>
                    <div>
                      <Label>Transport</Label>
                      <CurrencyInput value={transportation} onChange={setTransportation} className="mt-1" />
                    </div>
                    <div>
                      <Label>Divertissement</Label>
                      <CurrencyInput value={entertainment} onChange={setEntertainment} className="mt-1" />
                    </div>
                    <div>
                      <Label>Restaurants</Label>
                      <CurrencyInput value={restaurants} onChange={setRestaurants} className="mt-1" />
                    </div>
                    <div>
                      <Label>Magasinage</Label>
                      <CurrencyInput value={shopping} onChange={setShopping} className="mt-1" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Épargne et dettes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Épargne mensuelle</Label>
                      <CurrencyInput value={savings} onChange={setSavings} className="mt-1" />
                    </div>
                    <div>
                      <Label>Remboursement dettes</Label>
                      <CurrencyInput value={debtPayment} onChange={setDebtPayment} className="mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Results Section */}
              <div className="lg:col-span-2 space-y-6">
                <Alert className={`border-2 ${budgetStatus.type === 'success' ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : budgetStatus.type === 'error' ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'}`}>
                  <StatusIcon className={`h-5 w-5 ${budgetStatus.color}`} />
                  <AlertDescription className={budgetStatus.color}>
                    {budgetStatus.message}
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>Revenus mensuels</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{formatPrice(results.income)}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>Dépenses totales</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                        {formatPrice(results.totalExpenses)}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription>Taux d'épargne</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {results.savingsRate.toFixed(1)}%
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={results.remaining >= 0 ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'}>
                    <CardHeader className="pb-3">
                      <CardDescription>Restant</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-3xl font-bold ${results.remaining >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {formatPrice(results.remaining)}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Répartition du budget</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={(entry) => `${entry.name}: ${((entry.value / results.income) * 100).toFixed(0)}%`}
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatPrice(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                  <CardHeader>
                    <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Débloquez toutes les fonctionnalités
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-blue-800 dark:text-blue-200 space-y-3">
                    <p className="font-semibold">Connectez-vous pour accéder à :</p>
                    <ul className="space-y-2">
                      <li>• 📊 Suivi détaillé des transactions avec historique</li>
                      <li>• 💰 Gestion complète des actifs (REER, CELI, propriétés)</li>
                      <li>• 💳 Suivi des dettes avec taux d'intérêt</li>
                      <li>• 🎮 Gamification de votre valeur nette</li>
                      <li>• 📈 Graphiques mensuels et rapports</li>
                      <li>• 🔒 Données chiffrées et privées</li>
                    </ul>
                    <Button 
                      className="w-full mt-4" 
                      size="lg"
                      onClick={() => navigate('/auth?redirect=/outils/budget')}
                    >
                      Se connecter pour plus de fonctionnalités
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Advanced planner for authenticated users
  return (
    <ErrorBoundary>
      <>
        <Helmet>
        <title>Planificateur de Budget Québec | Outil Gratuit de Gestion Financière</title>
        <meta name="description" content="Planificateur de budget intelligent et gratuit pour gérer vos finances personnelles au Québec. Suivi des dépenses, objectifs d'épargne, analyse des habitudes et coaching financier personnalisé." />
        <meta name="keywords" content="budget québec, planificateur financier gratuit, gestion budget personnel, suivi dépenses, objectifs épargne, calculateur budget" />
        <link rel="canonical" href="https://vente.club/outils/budget" />
        <meta property="og:title" content="Planificateur de Budget Québec | Outil Gratuit" />
        <meta property="og:description" content="Gérez votre budget avec intelligence. Suivi automatique, recommandations personnalisées et gamification pour atteindre vos objectifs financiers." />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2">
              Mon Planificateur Budgétaire Intelligent
            </h1>
            <p className="text-muted-foreground">
              Suivi rapide • Recommandations personnalisées • Récompenses quotidiennes
            </p>
          </div>

          {/* Quick Add */}
          <QuickExpenseTracker isAuthenticated={isAuthenticated} />

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-2 h-auto">
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
            </TabsList>

            <TabsContent value="overview">
              <div className="space-y-6">
                <NetWorthGamification netWorth={netWorth} isAuthenticated={isAuthenticated} />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ExpensesByCategory 
                    transactions={transactions}
                    categories={categories}
                  />
                  <BudgetInsights 
                    transactions={transactions}
                    categories={categories}
                    goals={goals}
                    debts={debts}
                    assets={assets}
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
              <BudgetAssetsDebts isAuthenticated={isAuthenticated} />
            </TabsContent>
          </Tabs>

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
