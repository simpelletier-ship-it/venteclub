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

            {/* Budget vs Actual Summary */}
            {categoryStats.length > 0 && (
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      Budget vs Réel ce mois
                    </CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate('/budget/planifier')}
                      className="text-xs text-muted-foreground"
                    >
                      Modifier mon budget <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Overall Progress */}
                  <div className="mb-4 p-4 rounded-xl bg-muted/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Total dépensé</span>
                      <span className={cn(
                        "text-sm font-bold",
                        totalSpent > totalBudget ? "text-destructive" : "text-primary"
                      )}>
                        {formatPrice(totalSpent)} / {formatPrice(totalBudget)}
                      </span>
                    </div>
                    <Progress 
                      value={Math.min((totalSpent / totalBudget) * 100, 100)} 
                      className="h-2"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {totalRemaining >= 0 
                          ? `Il vous reste ${formatPrice(totalRemaining)}`
                          : `Dépassement de ${formatPrice(Math.abs(totalRemaining))}`
                        }
                      </span>
                      {overBudgetCount > 0 && (
                        <span className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {overBudgetCount} catégorie(s) dépassée(s)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Categories breakdown */}
                  <div className="space-y-3">
                    {categoryStats.slice(0, 5).map(stat => (
                      <div key={stat.category.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-xs">
                          {stat.category.icon?.slice(0, 2) || '📦'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium truncate">{stat.category.name}</span>
                            <span className={cn(
                              "text-xs font-medium",
                              stat.isOver ? "text-destructive" : "text-muted-foreground"
                            )}>
                              {formatPrice(stat.spent)} / {formatPrice(stat.budget)}
                            </span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full transition-all",
                                stat.isOver ? "bg-destructive" : stat.percentage > 80 ? "bg-amber-500" : "bg-primary"
                              )}
                              style={{ width: `${Math.min(stat.percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                        {stat.isOver ? (
                          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                        ) : stat.percentage >= 100 ? (
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        ) : null}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No budget warning */}
            {categoryStats.length === 0 && (
              <Card className="mb-6 border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-foreground mb-1">Aucun budget défini</p>
                      <p className="text-sm text-muted-foreground mb-2">
                        Créez un budget pour voir si vous respectez vos objectifs de dépenses.
                      </p>
                      <Button 
                        size="sm"
                        onClick={() => navigate('/budget/planifier')}
                      >
                        Créer mon budget
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
