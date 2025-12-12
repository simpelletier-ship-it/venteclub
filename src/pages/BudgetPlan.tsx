import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";
import { Loader2, Target, Settings2, Info, X, BookOpen, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BudgetPlanner } from "@/components/budget/BudgetPlanner";
import { CategoryManager } from "@/components/budget/CategoryManager";
import { CreateDefaultCategories } from "@/components/budget/CreateDefaultCategories";
import { BudgetOnboarding } from "@/components/budget/BudgetOnboarding";
import { BudgetTips } from "@/components/budget/BudgetTips";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

const BUDGET_FEATURES = [
  "Définissez un budget pour chaque catégorie de dépense",
  "Suivez vos revenus et dépenses en temps réel",
  "Visualisez votre progression avec des graphiques",
  "Recevez des alertes quand vous dépassez vos limites",
  "Réorganisez vos catégories par glisser-déposer",
  "Créez des catégories personnalisées selon vos besoins"
];

const BudgetPlan = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isAuthenticated = !!user;
  const [showInfo, setShowInfo] = useState(() => {
    return localStorage.getItem('budget-info-dismissed') !== 'true';
  });

  const dismissInfo = () => {
    localStorage.setItem('budget-info-dismissed', 'true');
    setShowInfo(false);
  };

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

            {/* Info card about budgeting - dismissible */}
            {showInfo && (
              <Card className="mb-6 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-transparent">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      C'est quoi un budget?
                    </CardTitle>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 -mt-1 -mr-2"
                      onClick={dismissInfo}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Un budget est un plan qui vous aide à <strong>contrôler où va votre argent</strong>. 
                    Au lieu de vous demander "où est passé mon argent?", vous décidez à l'avance 
                    combien vous voulez dépenser dans chaque catégorie.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {BUDGET_FEATURES.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Budget Planner - Everything on one page */}
            <BudgetPlanner isAuthenticated={isAuthenticated} />

            {/* Budget Tips Section */}
            <div className="mt-8">
              <BudgetTips />
            </div>
          </div>
        </div>
      </>
    </ErrorBoundary>
  );
};

export default BudgetPlan;
