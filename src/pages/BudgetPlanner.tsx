import { Helmet } from "react-helmet";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NetWorthGamification } from "@/components/budget/NetWorthGamification";
import { BudgetTransactions } from "@/components/budget/BudgetTransactions";
import { BudgetAssetsDebts } from "@/components/budget/BudgetAssetsDebts";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

const BudgetPlanner = () => {
  const navigate = useNavigate();

  // Check authentication
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth?redirect=/budget-planner');
      }
    });
  }, [navigate]);

  // Fetch user's net worth
  const { data: assets = [], isLoading: loadingAssets } = useQuery({
    queryKey: ['user-assets'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_assets').select('value');
      if (error) throw error;
      return data;
    },
  });

  const { data: debts = [], isLoading: loadingDebts } = useQuery({
    queryKey: ['user-debts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_debts').select('balance');
      if (error) throw error;
      return data;
    },
  });

  const totalAssets = assets.reduce((sum, asset) => sum + Number(asset.value), 0);
  const totalDebts = debts.reduce((sum, debt) => sum + Number(debt.balance), 0);
  const netWorth = totalAssets - totalDebts;

  if (loadingAssets || loadingDebts) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Planificateur de Budget Québec | Vente.Club</title>
        <meta name="description" content="Planificateur de budget complet avec suivi des revenus, dépenses, actifs, dettes et gamification de votre valeur nette. Gratuit et privé." />
      </Helmet>

      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 text-foreground">
              Planificateur de Budget Personnel
            </h1>
            <p className="text-muted-foreground text-lg">
              Gérez vos finances, atteignez vos objectifs
            </p>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="assets">Actifs & Dettes</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <NetWorthGamification netWorth={netWorth} />
            </TabsContent>

            <TabsContent value="transactions">
              <BudgetTransactions />
            </TabsContent>

            <TabsContent value="assets">
              <BudgetAssetsDebts />
            </TabsContent>
          </Tabs>

          {/* Info Section */}
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
  );
};

export default BudgetPlanner;
