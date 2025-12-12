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
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
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

      <div className="min-h-screen bg-slate-950 text-white pb-8">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-6">Ma valeur nette</h1>
          
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <SimpleNetWorthTracker currentNetWorth={netWorth} isAuthenticated={isAuthenticated} />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default BudgetNetWorth;
