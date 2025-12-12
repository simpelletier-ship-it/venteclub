import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";
import { Loader2, Calendar, Clock, CreditCard, PiggyBank, LineChart, Lightbulb, ReceiptText, TrendingDown, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BillCalendar } from "@/components/budget/BillCalendar";
import { AgeOfMoney } from "@/components/budget/AgeOfMoney";
import { DebtPayoffPlanner } from "@/components/budget/DebtPayoffPlanner";
import { SavingsChallenges } from "@/components/budget/SavingsChallenges";
import { CashFlowForecast } from "@/components/budget/CashFlowForecast";
import { SpendingLimitsAlerts } from "@/components/budget/SpendingLimitsAlerts";
import { InvestmentTracker } from "@/components/budget/InvestmentTracker";

import { SmartInsights } from "@/components/budget/SmartInsights";
import { SubscriptionDetector } from "@/components/budget/SubscriptionDetector";
import { InterestAnalyzer } from "@/components/budget/InterestAnalyzer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BudgetAnalytics = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isAuthenticated = !!user;

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/auth?redirect=/budget/analyses');
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
        title="Analyses avancées | Vente.club"
        description="Analyses financières avancées : insights, abonnements, trésorerie, dettes et épargne."
        canonical="/budget/analyses"
      />
      <BreadcrumbSchema
        items={[
          { name: "Budget", url: "/budget" },
          { name: "Analyses", url: "/budget/analyses" }
        ]}
      />

      <div className="min-h-screen bg-background pb-8">
        <div className="container mx-auto px-6 py-6">
          <h1 className="text-xl font-semibold text-foreground mb-6">Analyses avancées</h1>
          
          <Card className="border-border">
            <CardContent className="pt-6">
              <Tabs defaultValue="debts" className="w-full">
                <TabsList className="grid grid-cols-3 lg:grid-cols-7 gap-1 h-auto p-1 mb-6">
                  <TabsTrigger value="debts" className="text-xs py-2.5 px-3 gap-1.5">
                    <CreditCard className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Dettes</span>
                  </TabsTrigger>
                  <TabsTrigger value="interests" className="text-xs py-2.5 px-3 gap-1.5">
                    <TrendingDown className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Intérêts</span>
                  </TabsTrigger>
                  <TabsTrigger value="subscriptions" className="text-xs py-2.5 px-3 gap-1.5">
                    <ReceiptText className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Abonnements</span>
                  </TabsTrigger>
                  <TabsTrigger value="calendar" className="text-xs py-2.5 px-3 gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Factures</span>
                  </TabsTrigger>
                  <TabsTrigger value="cashflow" className="text-xs py-2.5 px-3 gap-1.5">
                    <LineChart className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Trésorerie</span>
                  </TabsTrigger>
                  <TabsTrigger value="savings" className="text-xs py-2.5 px-3 gap-1.5">
                    <PiggyBank className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Épargne</span>
                  </TabsTrigger>
                  <TabsTrigger value="age" className="text-xs py-2.5 px-3 gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Âge argent</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="debts" className="mt-0 space-y-6">
                  <DebtPayoffPlanner />
                </TabsContent>

                <TabsContent value="interests" className="mt-0">
                  <InterestAnalyzer debts={debts} />
                </TabsContent>

                <TabsContent value="subscriptions" className="mt-0">
                  <SubscriptionDetector 
                    transactions={transactions}
                    categories={categories}
                  />
                </TabsContent>

                <TabsContent value="calendar" className="mt-0 space-y-6">
                  <BillCalendar />
                  <SpendingLimitsAlerts />
                </TabsContent>

                <TabsContent value="cashflow" className="mt-0">
                  <CashFlowForecast 
                    currentBalance={netWorth > 0 ? netWorth : 5000}
                    monthlyIncome={monthlyIncome || 4000}
                    monthlyExpenses={monthlyExpenses || 3000}
                    upcomingBills={[]}
                  />
                </TabsContent>

                <TabsContent value="savings" className="mt-0 space-y-6">
                  <SavingsChallenges />
                  <InvestmentTracker />
                </TabsContent>

                <TabsContent value="age" className="mt-0">
                  <AgeOfMoney 
                    monthlyIncome={monthlyIncome}
                    monthlyExpenses={monthlyExpenses}
                    currentBalance={monthlyBalance > 0 ? monthlyBalance : 0}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default BudgetAnalytics;
