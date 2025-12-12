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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
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

      <div className="min-h-screen bg-background pb-8">
        <div className="container mx-auto px-6 py-6">
          <h1 className="text-xl font-semibold text-foreground mb-6">Historique des transactions</h1>
          
          <div className="space-y-4">
            <Card className="border-border">
              <CardContent className="p-6">
                <BudgetTransactions isAuthenticated={isAuthenticated} />
              </CardContent>
            </Card>
            
            <Card className="border-border">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-medium">Dépenses récurrentes</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <RecurringExpenses isAuthenticated={isAuthenticated} />
              </CardContent>
            </Card>
            
            <Card className="border-border">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-medium">Tendances</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ExpenseTrendsChart transactions={transactions} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default BudgetHistory;