import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";
import { Loader2, Receipt } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { QuickExpenseTracker } from "@/components/budget/QuickExpenseTrackerPro";
import { BudgetTransactions } from "@/components/budget/BudgetTransactions";
import { CreateDefaultCategories } from "@/components/budget/CreateDefaultCategories";
import { useBudgetRealtime } from "@/hooks/useBudgetRealtime";
import { FinancialHealthScore } from "@/components/budget/FinancialHealthScore";
import { ExpensesByCategory } from "@/components/budget/ExpensesByCategory";
import { SmartBudgetInsights } from "@/components/budget/SmartBudgetInsights";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BudgetExpenses = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isAuthenticated = !!user;
  
  useBudgetRealtime(user?.id);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/auth?redirect=/budget/depenses');
    }
  }, [loading, isAuthenticated, navigate]);

  // Fetch all transactions
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
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['budget-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('budget_categories').select('*');
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthenticated,
  });

  // Fetch goals
  const { data: goals = [] } = useQuery({
    queryKey: ['budget-goals'],
    queryFn: async () => {
      const { data, error } = await supabase.from('budget_goals').select('*');
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthenticated,
  });

  // Fetch assets
  const { data: assets = [] } = useQuery({
    queryKey: ['user-assets'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_assets').select('*');
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthenticated,
  });

  // Fetch debts
  const { data: debts = [] } = useQuery({
    queryKey: ['user-debts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_debts').select('*');
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthenticated,
  });

  // Calculate monthly income/expenses
  const { monthlyIncome, monthlyExpenses } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const currentMonthTransactions = transactions.filter(t => {
      const date = new Date(t.transaction_date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const income = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return { monthlyIncome: income, monthlyExpenses: expenses };
  }, [transactions]);

  // Format transactions for FinancialHealthScore
  const formattedTransactions = useMemo(() => {
    return transactions.map(t => ({
      ...t,
      date: t.transaction_date,
      amount: Number(t.amount)
    }));
  }, [transactions]);

  // Format assets for FinancialHealthScore
  const formattedAssets = useMemo(() => {
    return assets.map(a => ({
      ...a,
      value: Number(a.value)
    }));
  }, [assets]);

  // Format debts for FinancialHealthScore
  const formattedDebts = useMemo(() => {
    return debts.map(d => ({
      ...d,
      balance: Number(d.balance)
    }));
  }, [debts]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    sessionStorage.setItem('authReturnUrl', '/budget/depenses');
    navigate("/auth");
    return null;
  }

  return (
    <ErrorBoundary>
      <>
        <CreateDefaultCategories />
        <SEO
          title="Mes Dépenses | Suivi des transactions"
          description="Entrez vos dépenses et revenus réels. Comparez avec votre budget pour savoir si vous êtes sur la bonne voie."
          keywords="suivi dépenses, transactions, budget réel"
          canonical="/budget/depenses"
          type="website"
        />
        <BreadcrumbSchema
          items={[
            { name: "Budget", url: "/budget" },
            { name: "Mes dépenses", url: "/budget/depenses" }
          ]}
        />

        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-6 py-6">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Receipt className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Mes dépenses</h1>
                  <p className="text-sm text-muted-foreground">Entrez vos transactions et suivez votre budget</p>
                </div>
              </div>
            </div>

            {/* Quick Add Transaction */}
            <div className="mb-6">
              <QuickExpenseTracker isAuthenticated={isAuthenticated} />
            </div>

            {/* Score & Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Financial Health Score */}
              <Card className="border-border">
                <CardHeader className="pb-3 border-b border-border">
                  <CardTitle className="text-sm font-medium">Score de santé financière</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <FinancialHealthScore 
                    transactions={formattedTransactions}
                    debts={formattedDebts}
                    assets={formattedAssets}
                  />
                </CardContent>
              </Card>

              {/* Expenses by Category */}
              <Card className="border-border">
                <CardHeader className="pb-3 border-b border-border">
                  <CardTitle className="text-sm font-medium">Dépenses par catégorie</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <ExpensesByCategory 
                    transactions={transactions} 
                    categories={categories}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Smart Insights */}
            <div className="mb-6">
              <Card className="border-border">
                <CardHeader className="pb-3 border-b border-border">
                  <CardTitle className="text-sm font-medium">Conseils personnalisés</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <SmartBudgetInsights 
                    transactions={transactions}
                    categories={categories}
                    goals={goals}
                    monthlyIncome={monthlyIncome}
                    monthlyExpenses={monthlyExpenses}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Transactions List */}
            <Card className="border-border">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-medium">Historique des transactions</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <BudgetTransactions isAuthenticated={isAuthenticated} />
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    </ErrorBoundary>
  );
};

export default BudgetExpenses;
