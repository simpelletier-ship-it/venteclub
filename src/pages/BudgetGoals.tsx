import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FinancialGoals } from "@/components/budget/FinancialGoals";
import { Card, CardContent } from "@/components/ui/card";

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <ErrorBoundary>
      <SEO
        title="Objectifs financiers | Vente.club"
        description="Définissez et suivez vos objectifs d'épargne et financiers."
        canonical="/budget/objectifs"
      />
      <BreadcrumbSchema
        items={[
          { name: "Budget", url: "/budget" },
          { name: "Objectifs", url: "/budget/objectifs" }
        ]}
      />

      <div className="min-h-screen bg-background pb-8">
        <div className="container mx-auto px-6 py-6">
          <h1 className="text-xl font-semibold text-foreground mb-6">Mes objectifs financiers</h1>
          
          <Card className="border-border">
            <CardContent className="p-6">
              <FinancialGoals isAuthenticated={isAuthenticated} />
            </CardContent>
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default BudgetGoals;