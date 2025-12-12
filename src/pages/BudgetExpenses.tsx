import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";
import { Loader2 } from "lucide-react";
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
import { FinancialSummaryBoxes } from "@/components/budget/FinancialSummaryBoxes";

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
          <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-6xl">
            {/* Header - Clean & Minimal */}
            <header className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">Dépenses</h1>
              <p className="text-muted-foreground mt-1">Suivez vos transactions</p>
            </header>

            {/* Quick Add - Top Priority */}
            <section className="mb-8">
              <QuickExpenseTracker isAuthenticated={isAuthenticated} />
            </section>

            {/* Financial Summary - Full Width, Clean */}
            <section className="mb-8">
              <FinancialSummaryBoxes transactions={transactions} />
            </section>

            {/* Two Column Grid */}
            <div className="grid lg:grid-cols-2 gap-6 mb-8">
              {/* Expenses by Category */}
              <section className="bg-card rounded-2xl border border-border/50 p-5 sm:p-6">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Par catégorie</h2>
                <ExpensesByCategory 
                  transactions={transactions} 
                  categories={categories}
                />
              </section>

              {/* Financial Health Score */}
              <section className="bg-card rounded-2xl border border-border/50 p-5 sm:p-6">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Santé financière</h2>
                <FinancialHealthScore 
                  transactions={formattedTransactions}
                  debts={formattedDebts}
                  assets={formattedAssets}
                />
              </section>
            </div>

            {/* Smart Insights */}
            <section className="mb-8 bg-card rounded-2xl border border-border/50 p-5 sm:p-6">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Conseils</h2>
              <SmartBudgetInsights 
                transactions={transactions}
                categories={categories}
                goals={goals}
                monthlyIncome={monthlyIncome}
                monthlyExpenses={monthlyExpenses}
              />
            </section>

            {/* Transactions List */}
            <section className="bg-card rounded-2xl border border-border/50 p-5 sm:p-6">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Historique</h2>
              <BudgetTransactions isAuthenticated={isAuthenticated} />
            </section>
          </div>
        </div>
      </>
    </ErrorBoundary>
  );
};

export default BudgetExpenses;
