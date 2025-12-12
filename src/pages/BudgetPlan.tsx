import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";
import { Loader2, HelpCircle, Lightbulb, Target, Settings2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BudgetPlanner } from "@/components/budget/BudgetPlanner";
import { CategoryManager } from "@/components/budget/CategoryManager";
import { CreateDefaultCategories } from "@/components/budget/CreateDefaultCategories";
import { BudgetOnboarding } from "@/components/budget/BudgetOnboarding";
import { BudgetExplanation } from "@/components/budget/BudgetExplanation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const BudgetPlan = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const isAuthenticated = !!user;
  const [activeTab, setActiveTab] = useState("budget");

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
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">Mon budget</h1>
                    <p className="text-sm text-muted-foreground">Planifiez et suivez vos dépenses</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 max-w-md">
                <TabsTrigger value="budget">📊 Budget</TabsTrigger>
                <TabsTrigger value="categories">⚙️ Catégories</TabsTrigger>
                <TabsTrigger value="conseils">💡 Conseils</TabsTrigger>
              </TabsList>

              <TabsContent value="budget" className="space-y-6">
                {/* Info Card */}
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-foreground mb-1">Comment ça marche?</p>
                        <p className="text-muted-foreground">
                          Cliquez sur une catégorie pour définir un budget. La barre de progression montre votre avancement (vert = OK, rouge = dépassé).
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Budget Explanation */}
                <BudgetExplanation />

                {/* Budget Planner with Budget vs Real */}
                <BudgetPlanner isAuthenticated={isAuthenticated} />
              </TabsContent>

              <TabsContent value="categories" className="space-y-6">
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Settings2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-foreground mb-1">Gérez vos catégories</p>
                        <p className="text-muted-foreground">
                          Ajoutez, supprimez ou réorganisez vos catégories. Glissez-déposez pour changer l'ordre.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <CategoryManager isAuthenticated={isAuthenticated} />
              </TabsContent>

              <TabsContent value="conseils" className="space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-primary" />
                      Conseils pour bien budgéter
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                        <h3 className="font-medium text-emerald-700 dark:text-emerald-400 mb-2">🎯 La règle 50/30/20</h3>
                        <p className="text-sm text-muted-foreground">
                          50% pour les besoins (loyer, épicerie, transport), 30% pour les envies (sorties, loisirs), 20% pour l'épargne et les dettes.
                        </p>
                      </div>

                      <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <h3 className="font-medium text-blue-700 dark:text-blue-400 mb-2">💰 Payez-vous en premier</h3>
                        <p className="text-sm text-muted-foreground">
                          Dès que vous recevez votre paie, mettez automatiquement 10-20% de côté pour l'épargne avant de dépenser.
                        </p>
                      </div>

                      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <h3 className="font-medium text-amber-700 dark:text-amber-400 mb-2">📝 Suivez tout</h3>
                        <p className="text-sm text-muted-foreground">
                          Notez chaque dépense, même les petites. Les cafés à 5$ s'accumulent vite (150$/mois).
                        </p>
                      </div>

                      <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <h3 className="font-medium text-purple-700 dark:text-purple-400 mb-2">🚨 Fonds d'urgence</h3>
                        <p className="text-sm text-muted-foreground">
                          Visez 3-6 mois de dépenses en réserve pour les imprévus (perte d'emploi, réparations).
                        </p>
                      </div>

                      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                        <h3 className="font-medium text-red-700 dark:text-red-400 mb-2">💳 Évitez les dettes</h3>
                        <p className="text-sm text-muted-foreground">
                          Payez votre carte de crédit en entier chaque mois. Les intérêts à 20% vous coûtent cher.
                        </p>
                      </div>

                      <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                        <h3 className="font-medium text-cyan-700 dark:text-cyan-400 mb-2">📅 Révisez mensuellement</h3>
                        <p className="text-sm text-muted-foreground">
                          À la fin de chaque mois, analysez vos dépenses et ajustez votre budget selon vos besoins.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </>
    </ErrorBoundary>
  );
};

export default BudgetPlan;
