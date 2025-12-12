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
  Star,
  Lock,
  Smartphone,
  LineChart,
  Users
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Budget.club - Planificateur Budgétaire Québec",
    "url": "https://budget.club",
    "description": "Le planificateur budgétaire gratuit pour le Québec. Suivez vos dépenses, calculez votre salaire net, estimez votre retour d'impôt et atteignez vos objectifs financiers.",
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web",
    "availableLanguage": "fr-CA",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "CAD"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "1247"
    }
  };

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Comment fonctionne le planificateur de budget?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Le planificateur de budget vous permet de catégoriser vos revenus et dépenses, définir des objectifs d'épargne, et suivre votre progression financière avec des graphiques interactifs."
        }
      },
      {
        "@type": "Question",
        "name": "Le planificateur budgétaire est-il gratuit?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Oui, Budget.club est entièrement gratuit. Aucune carte de crédit n'est requise pour créer un compte."
        }
      },
      {
        "@type": "Question",
        "name": "Mes données financières sont-elles sécurisées?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Vos données sont stockées de manière sécurisée avec chiffrement et ne sont jamais partagées avec des tiers."
        }
      }
    ]
  };

  const tools = [
    {
      title: "Planificateur de budget",
      description: "Gérez vos revenus, dépenses et objectifs d'épargne en un seul endroit",
      icon: PiggyBank,
      href: "/outils/budget",
      featured: true
    },
    {
      title: "Calculateur de salaire net",
      description: "Calculez votre salaire net après impôts et déductions au Québec",
      icon: Calculator,
      href: "/outils/salaire"
    },
    {
      title: "Calculateur de retour d'impôt",
      description: "Estimez votre remboursement provincial et fédéral 2025",
      icon: Receipt,
      href: "/outils/retour-impot"
    }
  ];

  const testimonials = [
    {
      name: "Marie-Ève L.",
      role: "Enseignante, Montréal",
      content: "Enfin un outil simple et efficace pour gérer mon budget! J'ai réussi à économiser 3 000$ en 6 mois grâce au suivi des dépenses.",
      rating: 5
    },
    {
      name: "Jean-François B.",
      role: "Ingénieur, Québec",
      content: "Le calculateur de salaire est super précis. C'est devenu mon outil de référence pour comprendre ma fiche de paie.",
      rating: 5
    },
    {
      name: "Sophie M.",
      role: "Travailleuse autonome, Laval",
      content: "La visualisation de mon patrimoine net me motive à continuer d'épargner. Interface claire et professionnelle.",
      rating: 5
    }
  ];

  const features = [
    {
      title: "Suivez vos dépenses en un coup d'œil",
      description: "Catégorisez automatiquement vos transactions et visualisez où va votre argent avec des graphiques interactifs clairs et détaillés.",
      icon: Wallet,
      features: ["Catégories personnalisables", "Graphiques interactifs", "Historique complet"]
    },
    {
      title: "Atteignez vos objectifs d'épargne",
      description: "Définissez des objectifs financiers (voyage, mise de fond, fonds d'urgence) et suivez votre progression avec des indicateurs visuels motivants.",
      icon: Target,
      features: ["Objectifs personnalisés", "Suivi de progression", "Recommandations"]
    },
    {
      title: "Anticipez votre avenir financier",
      description: "Visualisez l'évolution de votre patrimoine net et prévoyez votre flux de trésorerie sur les 90 prochains jours.",
      icon: LineChart,
      features: ["Prévisions 90 jours", "Évolution patrimoine", "Alertes intelligentes"]
    }
  ];

  return (
    <>
      <SEO 
        title="Planificateur Budgétaire Gratuit Québec | Calculateur Salaire Net 2025" 
        description="Le planificateur budgétaire gratuit pour le Québec. Suivez vos dépenses, calculez votre salaire net après impôts, estimez votre retour d'impôt 2025 et atteignez vos objectifs financiers."
        keywords="budget personnel Québec, planificateur budget gratuit, calculateur salaire net Québec, retour impôt 2025, gestion finances personnelles, économiser argent"
        canonical="/" 
        structuredData={[structuredData, faqStructuredData]} 
      />
      
      {/* Hero Section - Centré style Mint */}
      <section className="bg-gradient-to-b from-accent/30 to-background">
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Star className="w-4 h-4 fill-primary" />
              <span>100% gratuit • Conçu pour le Québec</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
              Prenez le contrôle de{" "}
              <span className="text-primary">vos finances</span>
            </h1>
            
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              Le planificateur budgétaire complet pour suivre vos dépenses, 
              atteindre vos objectifs d'épargne et bâtir votre patrimoine au Québec.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              <Button 
                size="lg" 
                className="h-14 px-8 text-base font-semibold"
                onClick={() => navigate(user ? "/outils/budget" : "/auth")}
              >
                {user ? "Ouvrir mon budget" : "Commencer gratuitement"}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="h-14 px-8 text-base"
                onClick={() => navigate("/outils")}
              >
                Voir les outils
              </Button>
            </div>
            
            {/* Trust indicators centrés */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <span>Données sécurisées</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span>Aucune carte requise</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span>+10 000 utilisateurs</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Outils Section - 3 cartes centrées */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Outils financiers gratuits
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Des calculateurs précis et un planificateur complet pour gérer vos finances au Québec
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {tools.map((tool) => (
              <Card 
                key={tool.title}
                className={`group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-card ${
                  tool.featured ? 'ring-2 ring-primary shadow-md' : ''
                }`}
                onClick={() => navigate(tool.href)}
              >
                <div className="p-6 text-center">
                  {tool.featured && (
                    <span className="inline-block text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">
                      Le plus populaire
                    </span>
                  )}
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <tool.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {tool.title}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {tool.description}
                  </p>
                  <Button variant="ghost" className="text-primary font-medium group-hover:bg-primary/10">
                    Accéder à l'outil
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Zigzag style Mint */}
      <section id="features" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className={`flex flex-col ${
                index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
              } items-center gap-12 lg:gap-20 mb-20 last:mb-0`}
            >
              {/* Contenu texte */}
              <div className="flex-1 text-center lg:text-left">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 mx-auto lg:mx-0">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                  {feature.title}
                </h2>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  {feature.description}
                </p>
                <ul className="space-y-3">
                  {feature.features.map((item) => (
                    <li key={item} className="flex items-center gap-3 justify-center lg:justify-start">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Mockup visuel */}
              <div className="flex-1">
                <div className={`relative ${
                  index % 2 === 0 ? 'lg:ml-auto' : 'lg:mr-auto'
                }`}>
                  <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-accent/30 rounded-3xl p-8 lg:p-12">
                    <div className="bg-card rounded-2xl shadow-xl p-6 space-y-4">
                      {/* Simulated UI elements */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <feature.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="h-3 bg-muted rounded-full w-24 mb-1"></div>
                          <div className="h-2 bg-muted rounded-full w-16"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-8 bg-primary/20 rounded-lg"></div>
                        <div className="flex gap-2">
                          <div className="h-16 bg-primary/10 rounded-lg flex-1"></div>
                          <div className="h-16 bg-accent rounded-lg flex-1"></div>
                        </div>
                        <div className="h-3 bg-muted rounded-full"></div>
                        <div className="h-3 bg-muted rounded-full w-3/4"></div>
                      </div>
                    </div>
                  </div>
                  {/* Floating elements */}
                  <div className="absolute -top-4 -right-4 w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center animate-pulse">
                    <TrendingUp className="w-8 h-8 text-primary" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section Sécurité */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
              Vos données restent privées
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Vos informations financières sont stockées de manière sécurisée. 
              Nous ne vendons jamais vos données et vous gardez le contrôle total.
            </p>
            <div className="flex flex-wrap justify-center gap-8 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="w-5 h-5 text-primary" />
                <span>Chiffrement des données</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Smartphone className="w-5 h-5 text-primary" />
                <span>Mode hors ligne</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="w-5 h-5 text-primary" />
                <span>Aucun partage tiers</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Témoignages */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Ce que nos utilisateurs disent
            </h2>
            <p className="text-lg text-muted-foreground">
              Rejoignez des milliers de Québécois qui gèrent mieux leurs finances
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} className="p-6 bg-card">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-foreground mb-4 leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold text-sm">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{testimonial.name}</p>
                    <p className="text-muted-foreground text-xs">{testimonial.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final centré */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-primary-foreground mb-4">
              Prêt à reprendre le contrôle?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8">
              Créez votre compte gratuit en quelques secondes et commencez à gérer votre budget dès aujourd'hui.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                className="h-14 px-8 text-base font-semibold"
                onClick={() => navigate(user ? "/outils/budget" : "/auth")}
              >
                {user ? "Ouvrir mon budget" : "Créer un compte gratuit"}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
            <p className="text-primary-foreground/60 text-sm mt-4">
              Aucune carte de crédit requise
            </p>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
