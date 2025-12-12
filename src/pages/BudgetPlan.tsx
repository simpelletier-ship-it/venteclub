import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { SEO } from "@/components/SEO";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";
import { Loader2, Settings2, X, BookOpen, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BudgetPlanner } from "@/components/budget/BudgetPlanner";
import { CategoryManager } from "@/components/budget/CategoryManager";
import { CreateDefaultCategories } from "@/components/budget/CreateDefaultCategories";
import { BudgetOnboarding } from "@/components/budget/BudgetOnboarding";
import { BudgetTips } from "@/components/budget/BudgetTips";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
          title="Mon Budget Personnel | Planificateur de Dépenses Gratuit Québec 2025"
          description="Créez votre budget personnel avec notre planificateur gratuit. Définissez combien dépenser par catégorie, suivez vos revenus et dépenses, recevez des conseils personnalisés. Interface intuitive avec règle 50/30/20."
          keywords="budget personnel gratuit, planificateur budget, gestion dépenses, catégories budget, épargne mensuelle, règle 50-30-20, suivi finances"
          canonical="/budget/planifier"
          type="website"
        />
        <BreadcrumbSchema
          items={[
            { name: "Outils Financiers", url: "/outils" },
            { name: "Budget", url: "/budget" },
            { name: "Mon budget", url: "/budget/planifier" }
          ]}
        />
        
        <Helmet>
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Planificateur de Budget par Catégorie",
              "description": "Définissez votre budget mensuel par catégorie de dépenses et revenus. Glissez-déposez pour réorganiser vos priorités.",
              "url": "https://vente.club/budget/planifier",
              "applicationCategory": "FinanceApplication",
              "inLanguage": "fr-CA",
              "isAccessibleForFree": true,
              "offers": { "@type": "Offer", "price": "0", "priceCurrency": "CAD" }
            })}
          </script>
        </Helmet>

        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-6xl">
            {/* Header - Clean & Minimal */}
            <header className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">Budget</h1>
                <p className="text-muted-foreground mt-1">Planifiez vos dépenses</p>
              </div>
              
              {/* Manage Categories Button */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 rounded-full">
                    <Settings2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Catégories</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Gérer les catégories</DialogTitle>
                  </DialogHeader>
                  <CategoryManager isAuthenticated={isAuthenticated} />
                </DialogContent>
              </Dialog>
            </header>

            {/* Info card about budgeting - dismissible */}
            {showInfo && (
              <section className="mb-8 p-5 sm:p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    <h2 className="font-semibold text-foreground">C'est quoi un budget?</h2>
                  </div>
                  <button 
                    onClick={dismissInfo}
                    className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Un budget vous aide à <strong className="text-foreground">contrôler où va votre argent</strong>. 
                  Décidez à l'avance combien dépenser dans chaque catégorie.
                </p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {BUDGET_FEATURES.slice(0, 4).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Budget Planner */}
            <BudgetPlanner isAuthenticated={isAuthenticated} />

            {/* Budget Tips Section */}
            <section className="mt-8">
              <BudgetTips />
            </section>
          </div>
        </div>
      </>
    </ErrorBoundary>
  );
};

export default BudgetPlan;
