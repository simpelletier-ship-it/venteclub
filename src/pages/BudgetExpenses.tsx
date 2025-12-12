import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";
import { Loader2, Plus, Receipt, TrendingUp, TrendingDown, Target, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { QuickExpenseTracker } from "@/components/budget/QuickExpenseTrackerPro";
import { BudgetTransactions } from "@/components/budget/BudgetTransactions";
import { CreateDefaultCategories } from "@/components/budget/CreateDefaultCategories";
import { useBudgetRealtime } from "@/hooks/useBudgetRealtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/priceFormat";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

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

  // Fetch budget goals
  const { data: goals = [] } = useQuery({
    queryKey: ['budget-goals'],
    queryFn: async () => {
      const { data, error } = await supabase.from('budget_goals').select('*');
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthenticated,
  });

  // Fetch current month transactions
  const { data: transactions = [] } = useQuery({
    queryKey: ['budget-transactions-current-month'],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('budget_transactions')
        .select('*')
        .gte('transaction_date', startOfMonth.toISOString().split('T')[0])
        .order('transaction_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthenticated,
  });

  // Calculate budget vs actual per category
  const expenseCategories = categories.filter(c => c.type === 'expense');
  
  const categoryStats = expenseCategories.map(cat => {
    const goal = goals.find(g => g.category_id === cat.id);
    const budget = goal ? Number(goal.monthly_limit) : 0;
    const spent = transactions
      .filter(t => t.category_id === cat.id && t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const percentage = budget > 0 ? (spent / budget) * 100 : 0;
    const remaining = budget - spent;
    
    return {
      category: cat,
      budget,
      spent,
      remaining,
      percentage,
      isOver: spent > budget && budget > 0,
      hasBudget: budget > 0
    };
  }).filter(s => s.hasBudget);

  const totalBudget = categoryStats.reduce((sum, s) => sum + s.budget, 0);
  const totalSpent = categoryStats.reduce((sum, s) => sum + s.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const overBudgetCount = categoryStats.filter(s => s.isOver).length;

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

            {/* Transactions List */}
            <BudgetTransactions isAuthenticated={isAuthenticated} />
          </div>
        </div>
      </>
    </ErrorBoundary>
  );
};

export default BudgetExpenses;
