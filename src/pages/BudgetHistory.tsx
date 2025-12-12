import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BudgetTransactions } from "@/components/budget/BudgetTransactions";
import RecurringExpenses from "@/components/budget/RecurringExpenses";
import { ExpenseTrendsChart } from "@/components/budget/ExpenseTrendsChart";

const BudgetHistory = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isAuthenticated = !!user;

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/auth?redirect=/budget/historique');
    }
  }, [loading, isAuthenticated, navigate]);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <ErrorBoundary>
      <SEO
        title="Historique | Budget.club"
        description="Consultez l'historique de toutes vos transactions financières."
        canonical="/budget/historique"
      />
      <BreadcrumbSchema
        items={[
          { name: "Budget", url: "/budget" },
          { name: "Historique", url: "/budget/historique" }
        ]}
      />

      <div className="min-h-screen bg-slate-950 text-white pb-8">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-6">Historique des transactions</h1>
          
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <BudgetTransactions isAuthenticated={isAuthenticated} />
            </div>
            
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Dépenses récurrentes</h3>
              <RecurringExpenses isAuthenticated={isAuthenticated} />
            </div>
            
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <ExpenseTrendsChart transactions={transactions} />
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default BudgetHistory;
