import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";
import { Loader2, Home, Target, ReceiptText, CreditCard, Lightbulb, HelpCircle, ChevronRight, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BudgetPlanner } from "@/components/budget/BudgetPlanner";
import { BudgetQuestionnaire } from "@/components/budget/BudgetQuestionnaire";
import { DebtManager } from "@/components/budget/DebtManager";
import { ExpenseTracker } from "@/components/budget/ExpenseTracker";
import { BudgetVsActual } from "@/components/budget/BudgetVsActual";
import { BudgetOnboarding } from "@/components/budget/BudgetOnboarding";
import { CreateDefaultCategories } from "@/components/budget/CreateDefaultCategories";
import { OfflineIndicator } from "@/components/budget/OfflineIndicator";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { SmartInsights } from "@/components/budget/SmartInsights";
import { ExpensesByCategory } from "@/components/budget/ExpensesByCategory";
import { FinancialHealthScore } from "@/components/budget/FinancialHealthScore";
import { FinancialGoals } from "@/components/budget/FinancialGoals";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPrice } from "@/lib/priceFormat";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const BudgetCalculator = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isAuthenticated = !!user;
  const { isOnline, pendingCount, isSyncing, triggerSync } = useOfflineSync(isAuthenticated);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

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

  // Check if user has any budget goals set
  const hasNoBudget = goals.length === 0;

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

  return (
    <ErrorBoundary>
      <>
        <CreateDefaultCategories />
        <BudgetOnboarding />
        <SEO
          title="Planificateur Budget | Gestion finances personnelles"
          description="Gérez votre budget personnel facilement. Suivi des dépenses, gestion des dettes, objectifs d'épargne et analyses financières."
          keywords="budget personnel, gestion finances, suivi dépenses, épargne, dettes"
          canonical="/budget"
          type="website"
        />
        <BreadcrumbSchema
          items={[{ name: "Budget", url: "/budget" }]}
        />

        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-6 max-w-6xl">
            {/* Offline indicator */}
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

            {/* Header with Help */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold">Mon Budget</h1>
                <p className="text-muted-foreground">Gère ton argent simplement</p>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon">
                      <HelpCircle className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    <p className="font-medium mb-1">Comment utiliser?</p>
                    <ul className="text-sm space-y-1">
                      <li><strong>Tableau de bord:</strong> Vue d'ensemble rapide</li>
                      <li><strong>Mon Budget:</strong> Planifie combien tu veux dépenser</li>
                      <li><strong>Mes Dépenses:</strong> Entre tes dépenses réelles</li>
                      <li><strong>Mes Dettes:</strong> Suis et gère tes dettes</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Main Navigation Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid grid-cols-4 h-auto p-1 bg-muted/50">
                <TabsTrigger 
                  value="dashboard" 
                  className="flex flex-col gap-1 py-3 data-[state=active]:bg-background"
                >
                  <Home className="w-5 h-5" />
                  <span className="text-xs font-medium">Tableau de bord</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="budget" 
                  className="flex flex-col gap-1 py-3 data-[state=active]:bg-background"
                >
                  <Target className="w-5 h-5" />
                  <span className="text-xs font-medium">Mon Budget</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="expenses" 
                  className="flex flex-col gap-1 py-3 data-[state=active]:bg-background"
                >
                  <ReceiptText className="w-5 h-5" />
                  <span className="text-xs font-medium">Mes Dépenses</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="debts" 
                  className="flex flex-col gap-1 py-3 data-[state=active]:bg-background"
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-xs font-medium">Mes Dettes</span>
                </TabsTrigger>
              </TabsList>

              {/* DASHBOARD TAB */}
              <TabsContent value="dashboard" className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-0 shadow-sm">
                    <CardContent className="pt-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Revenus</p>
                          <p className="text-xl font-bold">{formatPrice(monthlyIncome)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm">
                    <CardContent className="pt-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                          <TrendingDown className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Dépenses</p>
                          <p className="text-xl font-bold">{formatPrice(monthlyExpenses)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-sm">
                    <CardContent className="pt-5">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          monthlyBalance >= 0 ? "bg-primary/10" : "bg-amber-500/10"
                        )}>
                          <Wallet className={cn("w-5 h-5", monthlyBalance >= 0 ? "text-primary" : "text-amber-600")} />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Solde</p>
                          <p className={cn(
                            "text-xl font-bold",
                            monthlyBalance >= 0 ? "text-primary" : "text-amber-600"
                          )}>
                            {monthlyBalance >= 0 ? '+' : ''}{formatPrice(monthlyBalance)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card 
                    className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate('/budget/valeur-nette')}
                  >
                    <CardContent className="pt-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                          <ChevronRight className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Patrimoine</p>
                          <p className={cn(
                            "text-xl font-bold",
                            netWorth >= 0 ? "text-foreground" : "text-amber-600"
                          )}>
                            {formatPrice(netWorth)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Insights */}
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">Conseils personnalisés</span>
                </div>
                <SmartInsights />

                {/* Budget vs Actual Summary */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Budget vs Réel ce mois</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setActiveTab('budget')}>
                        Voir détails <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <BudgetVsActual isAuthenticated={isAuthenticated} />
                  </CardContent>
                </Card>

                {/* Expenses by Category */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Dépenses par catégorie</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ExpensesByCategory 
                        transactions={transactions}
                        categories={categories}
                        onAnalyze={() => {}}
                      />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Objectifs financiers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FinancialGoals isAuthenticated={isAuthenticated} />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* BUDGET TAB */}
              <TabsContent value="budget" className="space-y-6">
                {/* Help Banner */}
                <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <Target className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">C'est quoi un budget?</p>
                    <p className="text-sm text-muted-foreground">
                      Un budget c'est décider à l'avance combien tu veux dépenser dans chaque catégorie. 
                      Ça t'aide à éviter de dépasser et à économiser pour tes projets!
                    </p>
                  </div>
                  {hasNoBudget && (
                    <Button onClick={() => setShowQuestionnaire(true)} className="shrink-0">
                      <HelpCircle className="w-4 h-4 mr-2" />
                      Aide-moi à créer mon budget
                    </Button>
                  )}
                </div>

                {/* Questionnaire Modal */}
                {showQuestionnaire && (
                  <BudgetQuestionnaire onComplete={() => setShowQuestionnaire(false)} />
                )}

                {/* Budget Planner */}
                {!showQuestionnaire && (
                  <BudgetPlanner isAuthenticated={isAuthenticated} />
                )}

                {/* Budget vs Actual Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Budget vs Réel
                    </CardTitle>
                    <CardDescription>
                      Compare ce que tu avais prévu avec ce que tu as vraiment dépensé
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <BudgetVsActual isAuthenticated={isAuthenticated} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* EXPENSES TAB */}
              <TabsContent value="expenses" className="space-y-6">
                <ExpenseTracker isAuthenticated={isAuthenticated} />
              </TabsContent>

              {/* DEBTS TAB */}
              <TabsContent value="debts" className="space-y-6">
                <DebtManager isAuthenticated={isAuthenticated} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </>
    </ErrorBoundary>
  );
};

export default BudgetCalculator;
