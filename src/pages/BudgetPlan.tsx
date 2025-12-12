import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";
import { Loader2, Target, Settings2, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BudgetPlanner } from "@/components/budget/BudgetPlanner";
import { CategoryManager } from "@/components/budget/CategoryManager";
import { CreateDefaultCategories } from "@/components/budget/CreateDefaultCategories";
import { BudgetOnboarding } from "@/components/budget/BudgetOnboarding";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
          <div className="container mx-auto px-4 md:px-6 py-4 md:py-6">
            {/* Header */}
            <div className="mb-4 md:mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Target className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold text-foreground">Mon budget</h1>
                    <p className="text-xs md:text-sm text-muted-foreground">Glissez-déposez pour réorganiser</p>
                  </div>
                </div>
                
                {/* Manage Categories Button */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Settings2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Catégories</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Settings2 className="h-5 w-5" />
                        Gérer les catégories
                      </DialogTitle>
                    </DialogHeader>
                    <CategoryManager isAuthenticated={isAuthenticated} />
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Budget Planner - Everything on one page */}
            <BudgetPlanner isAuthenticated={isAuthenticated} />
          </div>
        </div>
      </>
    </ErrorBoundary>
  );
};

export default BudgetPlan;
