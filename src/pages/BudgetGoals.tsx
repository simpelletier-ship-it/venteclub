import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FinancialGoals } from "@/components/budget/FinancialGoals";

const BudgetGoals = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isAuthenticated = !!user;

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/auth?redirect=/budget/objectifs');
    }
  }, [loading, isAuthenticated, navigate]);

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
        title="Objectifs financiers | Budget.club"
        description="Définissez et suivez vos objectifs d'épargne et financiers."
        canonical="/budget/objectifs"
      />
      <BreadcrumbSchema
        items={[
          { name: "Budget", url: "/budget" },
          { name: "Objectifs", url: "/budget/objectifs" }
        ]}
      />

      <div className="min-h-screen bg-slate-950 text-white pb-8">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-6">Mes objectifs financiers</h1>
          
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <FinancialGoals isAuthenticated={isAuthenticated} />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default BudgetGoals;
