import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SimpleNetWorthTracker } from "@/components/budget/SimpleNetWorthTracker";
import { NetWorthGamification } from "@/components/budget/NetWorthGamification";

const BudgetNetWorth = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isAuthenticated = !!user;

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/auth?redirect=/budget/valeur-nette');
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

  const totalAssets = assets.reduce((sum, asset) => sum + Number(asset.value), 0);
  const totalDebts = debts.reduce((sum, debt) => sum + Number(debt.balance), 0);
  const netWorth = totalAssets - totalDebts;

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
        title="Valeur nette | Budget.club"
        description="Suivez l'évolution de votre valeur nette et patrimoine."
        canonical="/budget/valeur-nette"
      />
      <BreadcrumbSchema
        items={[
          { name: "Budget", url: "/budget" },
          { name: "Valeur nette", url: "/budget/valeur-nette" }
        ]}
      />

      <div className="min-h-screen bg-background pb-8">
        <div className="container mx-auto px-6 py-6">
          <h1 className="text-xl font-semibold text-foreground mb-6">Mon patrimoine</h1>
          
          {/* Graphique d'évolution de la valeur nette */}
          <div className="mb-6">
            <NetWorthGamification netWorth={netWorth} isAuthenticated={isAuthenticated} />
          </div>

          {/* Gestion des actifs et passifs */}
          <SimpleNetWorthTracker currentNetWorth={netWorth} isAuthenticated={isAuthenticated} />
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default BudgetNetWorth;