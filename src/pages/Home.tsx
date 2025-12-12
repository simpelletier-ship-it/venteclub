import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ArrowRight, 
  PiggyBank, 
  TrendingUp, 
  Target, 
  Wallet, 
  Calculator, 
  Receipt, 
  Shield, 
  BarChart3,
  CheckCircle2,
  ChevronRight
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Budget.club",
    "url": "https://budget.club",
    "description": "Plateforme de gestion budgétaire personnelle. Suivez vos dépenses et atteignez vos objectifs financiers.",
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "CAD"
    }
  };

  const features = [
    { icon: Wallet, title: "Suivi des dépenses", description: "Catégorisation automatique de vos transactions" },
    { icon: Target, title: "Objectifs financiers", description: "Définissez et suivez vos objectifs d'épargne" },
    { icon: TrendingUp, title: "Prévisions", description: "Anticipez votre solde sur 90 jours" },
    { icon: BarChart3, title: "Analyse budgétaire", description: "Comparez budget prévu vs réel" },
    { icon: Receipt, title: "Calendrier factures", description: "Ne manquez plus aucune échéance" },
    { icon: PiggyBank, title: "Patrimoine net", description: "Suivez l'évolution de vos actifs" },
  ];

  const tools = [
    {
      title: "Planificateur de budget",
      description: "Gérez vos revenus, dépenses et objectifs financiers",
      icon: PiggyBank,
      href: "/outils/budget",
      featured: true
    },
    {
      title: "Calculateur de salaire",
      description: "Calculez votre salaire net après impôts au Québec",
      icon: Calculator,
      href: "/outils/salaire"
    },
    {
      title: "Retour d'impôt",
      description: "Estimez votre remboursement provincial et fédéral",
      icon: Receipt,
      href: "/outils/retour-impot"
    }
  ];

  return (
    <>
      <SEO 
        title="Gestion budgétaire - Planificateur financier" 
        description="Plateforme de gestion budgétaire. Suivez vos dépenses, atteignez vos objectifs d'épargne et prenez le contrôle de vos finances personnelles."
        keywords="budget personnel, planificateur budget, gestion finances, économiser argent, suivi dépenses, Québec"
        canonical="/" 
        structuredData={structuredData} 
      />
      
      {/* Hero Section - Style Bancaire Institutionnel */}
      <section className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
              Gestion financière personnelle
            </p>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-semibold text-foreground leading-tight mb-6">
              Prenez le contrôle de vos finances
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-xl mb-8 leading-relaxed">
              Le planificateur budgétaire complet pour suivre vos dépenses, 
              atteindre vos objectifs et bâtir votre patrimoine.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                size="lg" 
                className="h-12 px-8"
                onClick={() => navigate("/outils/budget")}
              >
                Accéder au planificateur
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="h-12 px-8"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                En savoir plus
              </Button>
            </div>
            
            {/* Trust indicators */}
            <div className="flex flex-wrap items-center gap-6 mt-10 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span>Données sécurisées</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>Gratuit</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>Aucune carte requise</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4">
          <div className="mb-10">
            <h2 className="text-2xl font-display font-semibold text-foreground mb-2">
              Outils financiers
            </h2>
            <p className="text-muted-foreground">
              Calculateurs et planificateur pour gérer vos finances
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {tools.map((tool) => (
              <Card 
                key={tool.title}
                className={`group cursor-pointer transition-all duration-200 hover:shadow-md ${tool.featured ? 'ring-1 ring-primary/20' : ''}`}
                onClick={() => navigate(tool.href)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                      <tool.icon className="w-5 h-5 text-primary" />
                    </div>
                    {tool.featured && (
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                        Principal
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {tool.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {tool.description}
                  </p>
                  <div className="flex items-center text-sm font-medium text-primary">
                    Accéder
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-background border-t border-border">
        <div className="container mx-auto px-4">
          <div className="mb-10">
            <h2 className="text-2xl font-display font-semibold text-foreground mb-2">
              Fonctionnalités
            </h2>
            <p className="text-muted-foreground">
              Outils pour simplifier la gestion de votre budget
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded bg-muted flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-display font-semibold text-primary-foreground mb-4">
              Commencez dès maintenant
            </h2>
            <p className="text-primary-foreground/80 mb-6">
              Créez un compte gratuit et prenez le contrôle de vos finances.
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              className="h-12 px-8"
              onClick={() => navigate(user ? "/outils/budget" : "/auth")}
            >
              {user ? "Ouvrir mon budget" : "Créer un compte"}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
