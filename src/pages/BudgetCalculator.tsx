import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";
import { Loader2, Plus, ArrowUpRight, ArrowDownRight, ChevronRight, History, PieChart, Target, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BudgetTransactions } from "@/components/budget/BudgetTransactions";
import { SimpleNetWorthTracker } from "@/components/budget/SimpleNetWorthTracker";
import { BudgetPlanner } from "@/components/budget/BudgetPlanner";
import { FinancialGoals } from "@/components/budget/FinancialGoals";
import { QuickExpenseTracker } from "@/components/budget/QuickExpenseTrackerPro";
import RecurringExpenses from "@/components/budget/RecurringExpenses";
import { ExpensesByCategory } from "@/components/budget/ExpensesByCategory";
import { ExpenseTrendsChart } from "@/components/budget/ExpenseTrendsChart";
import { FinancialHealthScore } from "@/components/budget/FinancialHealthScore";
import { BudgetOnboarding } from "@/components/budget/BudgetOnboarding";
import { CreateDefaultCategories } from "@/components/budget/CreateDefaultCategories";
import { OfflineIndicator } from "@/components/budget/OfflineIndicator";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/priceFormat";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const BudgetCalculator = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isAuthenticated = !!user;
  const { isOnline, pendingCount, isSyncing, triggerSync } = useOfflineSync(isAuthenticated);
  const [activeView, setActiveView] = useState<'dashboard' | 'transactions' | 'goals' | 'networth'>('dashboard');
  const [showQuickAdd, setShowQuickAdd] = useState(false);

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

  // Previous month for comparison
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    sessionStorage.setItem('authReturnUrl', '/outils/budget');
    navigate("/auth");
    return null;
  }

  const currentMonthName = new Date().toLocaleDateString('fr-CA', { month: 'long' });

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

        <div className="min-h-screen bg-background pb-24 lg:pb-8">
          <div className="container mx-auto px-4 py-6">
            <OfflineIndicator 
              isOnline={isOnline}
              pendingCount={pendingCount}
              isSyncing={isSyncing}
              onSync={triggerSync}
            />

            {/* Main Balance Card - Hero */}
            <Card className="mb-6 overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background border-primary/20">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-1">Solde du mois</p>
                <p className={cn(
                  "text-4xl font-bold tracking-tight mb-4",
                  monthlyBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                )}>
                  {monthlyBalance >= 0 ? '+' : ''}{formatPrice(monthlyBalance)}
                </p>
                
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-sm text-muted-foreground">Revenus</span>
                    <span className="text-sm font-medium">{formatPrice(monthlyIncome)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-sm text-muted-foreground">Dépenses</span>
                    <span className="text-sm font-medium">{formatPrice(monthlyExpenses)}</span>
                  </div>
                </div>

                {expenseChange !== 0 && (
                  <div className={cn(
                    "mt-4 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full",
                    expenseChange > 0 ? "bg-red-500/10 text-red-600" : "bg-emerald-500/10 text-emerald-600"
                  )}>
                    {expenseChange > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(expenseChange).toFixed(0)}% {expenseChange > 0 ? 'plus' : 'moins'} que le mois dernier
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <button
                onClick={() => setActiveView('dashboard')}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                  activeView === 'dashboard' 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "bg-card border-border hover:border-primary/50"
                )}
              >
                <PieChart className="h-5 w-5" />
                <span className="text-xs font-medium">Aperçu</span>
              </button>
              <button
                onClick={() => setActiveView('transactions')}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                  activeView === 'transactions' 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "bg-card border-border hover:border-primary/50"
                )}
              >
                <History className="h-5 w-5" />
                <span className="text-xs font-medium">Historique</span>
              </button>
              <button
                onClick={() => setActiveView('goals')}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                  activeView === 'goals' 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "bg-card border-border hover:border-primary/50"
                )}
              >
                <Target className="h-5 w-5" />
                <span className="text-xs font-medium">Objectifs</span>
              </button>
              <button
                onClick={() => setActiveView('networth')}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                  activeView === 'networth' 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "bg-card border-border hover:border-primary/50"
                )}
              >
                <Wallet className="h-5 w-5" />
                <span className="text-xs font-medium">Valeur nette</span>
              </button>
            </div>

            {/* Content based on active view */}
            {activeView === 'dashboard' && (
              <div className="space-y-6">
                {/* Spending by Category */}
                <ExpensesByCategory 
                  transactions={transactions}
                  categories={categories}
                  onAnalyze={() => {}}
                />

                {/* Health Score */}
                <FinancialHealthScore 
                  transactions={transactions}
                  debts={debts}
                  assets={assets}
                />

                {/* Recent Transactions Preview */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-semibold">Dernières transactions</h2>
                      <Button variant="ghost" size="sm" onClick={() => setActiveView('transactions')}>
                        Voir tout <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {transactions.slice(0, 5).map((t) => {
                        const category = categories.find(c => c.id === t.category_id);
                        return (
                          <div key={t.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{category?.icon || '📝'}</span>
                              <div>
                                <p className="text-sm font-medium">{t.description || category?.name || 'Transaction'}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(t.transaction_date).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}
                                </p>
                              </div>
                            </div>
                            <span className={cn(
                              "font-medium",
                              t.type === 'income' ? "text-emerald-600" : "text-foreground"
                            )}>
                              {t.type === 'income' ? '+' : '-'}{formatPrice(Number(t.amount))}
                            </span>
                          </div>
                        );
                      })}
                      {transactions.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">Aucune transaction</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Budget vs Actual */}
                <BudgetPlanner isAuthenticated={isAuthenticated} />
              </div>
            )}

            {activeView === 'transactions' && (
              <div className="space-y-6">
                <BudgetTransactions isAuthenticated={isAuthenticated} />
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-4">Dépenses récurrentes</h3>
                    <RecurringExpenses isAuthenticated={isAuthenticated} />
                  </CardContent>
                </Card>
                <ExpenseTrendsChart transactions={transactions} />
              </div>
            )}

            {activeView === 'goals' && (
              <div className="space-y-6">
                <FinancialGoals isAuthenticated={isAuthenticated} />
              </div>
            )}

            {activeView === 'networth' && (
              <div className="space-y-6">
                <SimpleNetWorthTracker currentNetWorth={netWorth} isAuthenticated={isAuthenticated} />
              </div>
            )}
          </div>

          {/* Floating Add Button */}
          <Dialog open={showQuickAdd} onOpenChange={setShowQuickAdd}>
            <DialogTrigger asChild>
              <Button 
                size="lg"
                className="fixed bottom-20 lg:bottom-8 right-4 lg:right-8 h-14 w-14 rounded-full shadow-lg z-50"
              >
                <Plus className="h-6 w-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Ajouter une transaction</DialogTitle>
              </DialogHeader>
              <QuickExpenseTracker isAuthenticated={isAuthenticated} />
            </DialogContent>
          </Dialog>

          {/* Mobile Bottom Nav */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border z-40">
            <div className="grid grid-cols-4 h-16">
              <button
                onClick={() => setActiveView('dashboard')}
                className={cn(
                  "flex flex-col items-center justify-center gap-1",
                  activeView === 'dashboard' ? "text-primary" : "text-muted-foreground"
                )}
              >
                <PieChart className="h-5 w-5" />
                <span className="text-xs">Aperçu</span>
              </button>
              <button
                onClick={() => setActiveView('transactions')}
                className={cn(
                  "flex flex-col items-center justify-center gap-1",
                  activeView === 'transactions' ? "text-primary" : "text-muted-foreground"
                )}
              >
                <History className="h-5 w-5" />
                <span className="text-xs">Historique</span>
              </button>
              <button
                onClick={() => setActiveView('goals')}
                className={cn(
                  "flex flex-col items-center justify-center gap-1",
                  activeView === 'goals' ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Target className="h-5 w-5" />
                <span className="text-xs">Objectifs</span>
              </button>
              <button
                onClick={() => setActiveView('networth')}
                className={cn(
                  "flex flex-col items-center justify-center gap-1",
                  activeView === 'networth' ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Wallet className="h-5 w-5" />
                <span className="text-xs">Valeur</span>
              </button>
            </div>
          </div>
        </div>
      </>
    </ErrorBoundary>
  );
};

export default BudgetCalculator;
