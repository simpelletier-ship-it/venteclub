import { Helmet } from "react-helmet";
import { Calculator, TrendingUp, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";

const Tools = () => {
  const tools = [
    {
      id: "salary-calculator",
      title: "Calculateur de Salaire Net",
      description: "Calculez votre salaire net après impôts et déductions au Québec",
      icon: Calculator,
      color: "bg-blue-500",
      link: "/outils/calculateur-salaire"
    },
    {
      id: "tax-return",
      title: "Calculateur de Retour d'Impôt",
      description: "Estimez votre retour d'impôt avec REER, CELIAPP et autres crédits",
      icon: TrendingUp,
      color: "bg-green-500",
      link: "/outils/retour-impot"
    },
    {
      id: "budget",
      title: "Planificateur de Budget",
      description: "Créez et gérez votre budget mensuel et annuel",
      icon: Wallet,
      color: "bg-purple-500",
      link: "/outils/budget"
    }
  ];

  return (
    <>
      <Helmet>
        <title>Outils Financiers Gratuits - Calculateurs Québec | Vente.Club</title>
        <meta name="description" content="Outils financiers gratuits pour le Québec : calculateur de salaire net, retour d'impôt, budget. Calculs précis avec les taux 2025." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Outils Financiers Gratuits
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Des calculateurs professionnels pour vous aider à prendre des décisions financières éclairées
            </p>
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <Link key={tool.id} to={tool.link}>
                  <Card className="h-full hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-2 hover:border-primary">
                    <CardHeader>
                      <div className={`w-12 h-12 ${tool.color} rounded-lg flex items-center justify-center mb-4`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-xl">{tool.title}</CardTitle>
                      <CardDescription className="text-base">
                        {tool.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-primary font-medium">
                        Accéder à l'outil →
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Info Section */}
          <div className="mt-16 text-center">
            <Card className="max-w-3xl mx-auto bg-muted">
              <CardHeader>
                <CardTitle>Pourquoi utiliser nos outils?</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-left space-y-2 text-muted-foreground">
                  <li>✓ Calculs basés sur les taux d'imposition 2025 du Québec et du Canada</li>
                  <li>✓ Interface intuitive et résultats en temps réel</li>
                  <li>✓ Visualisations graphiques pour mieux comprendre vos finances</li>
                  <li>✓ 100% gratuit, aucune inscription requise</li>
                  <li>✓ Données traitées localement, confidentialité garantie</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default Tools;
