import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";
import { Loader2, HelpCircle, Lightbulb, PiggyBank, Target, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BudgetPlanner } from "@/components/budget/BudgetPlanner";
import { CreateDefaultCategories } from "@/components/budget/CreateDefaultCategories";
import { BudgetOnboarding } from "@/components/budget/BudgetOnboarding";
import { BudgetExplanation } from "@/components/budget/BudgetExplanation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const BudgetPlan = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isAuthenticated = !!user;

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/auth?redirect=/budget/planifier');
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    sessionStorage.setItem('authReturnUrl', '/budget/planifier');
    navigate("/auth");
    return null;
  }

  return (
    <ErrorBoundary>
      <>
        <CreateDefaultCategories />
        <BudgetOnboarding />
        <SEO
          title="Mon Budget | Planifier mes dépenses"
          description="Créez votre budget personnel. Définissez combien vous voulez dépenser par catégorie chaque mois."
          keywords="budget personnel, planification budget, gestion finances"
          canonical="/budget/planifier"
          type="website"
        />
        <BreadcrumbSchema
          items={[
            { name: "Budget", url: "/budget" },
            { name: "Mon budget", url: "/budget/planifier" }
          ]}
        />

        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-6 py-6">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Mon budget</h1>
                  <p className="text-sm text-muted-foreground">Définissez combien vous voulez dépenser par catégorie</p>
                </div>
              </div>
            </div>

            {/* Info Card */}
            <Card className="mb-6 border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground mb-1">Comment ça marche?</p>
                    <p className="text-muted-foreground">
                      Définissez un montant maximum pour chaque catégorie de dépense. 
                      Ensuite, entrez vos dépenses réelles dans "Mes dépenses" pour voir si vous respectez votre budget.
                    </p>
                    <Button 
                      variant="link" 
                      className="px-0 h-auto text-primary mt-2"
                      onClick={() => navigate('/budget/depenses')}
                    >
                      Aller à Mes dépenses →
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Budget Explanation */}
            <BudgetExplanation />

            {/* Budget Planner */}
            <BudgetPlanner isAuthenticated={isAuthenticated} />

            {/* Tips Section */}
            <Card className="mt-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  Conseils pour bien budgéter
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Commencez par les dépenses fixes (loyer, assurances, téléphone)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Prévoyez 10-20% de vos revenus pour l'épargne</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Gardez une marge pour les imprévus</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Révisez votre budget chaque mois selon vos besoins</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    </ErrorBoundary>
  );
};

export default BudgetPlan;
