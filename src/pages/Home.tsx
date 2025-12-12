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
  Users,
  CreditCard,
  Home as HomeIcon,
  ShoppingCart,
  Car,
  Utensils,
  Zap
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Vente.club - Achat et Vente d'Entreprises au Québec",
    "url": "https://vente.club",
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
          "text": "Oui, Vente.club est entièrement gratuit. Aucune carte de crédit n'est requise pour créer un compte."
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

  // Mockup 1: Dépenses par catégorie (Pie chart simulé)
  const MockupDepenses = () => (
    <div className="bg-card rounded-2xl shadow-2xl p-6 border border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Ce mois</p>
          <h3 className="text-xl font-bold text-foreground">Dépenses</h3>
        </div>
        <span className="text-2xl font-bold text-foreground">2 847 $</span>
      </div>
      
      {/* Simulated pie chart */}
      <div className="flex items-center gap-6 mb-6">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--muted))" strokeWidth="3"/>
            <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" 
              strokeDasharray="35 65" strokeLinecap="round"/>
            <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--warning))" strokeWidth="3" 
              strokeDasharray="25 75" strokeDashoffset="-35" strokeLinecap="round"/>
            <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--chart-5))" strokeWidth="3" 
              strokeDasharray="20 80" strokeDashoffset="-60" strokeLinecap="round"/>
            <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--destructive))" strokeWidth="3" 
              strokeDasharray="12 88" strokeDashoffset="-80" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <HomeIcon className="w-4 h-4 text-primary" />
            <span className="text-sm text-foreground flex-1">Logement</span>
            <span className="text-sm font-medium text-foreground">1 200 $</span>
          </div>
          <div className="flex items-center gap-2">
            <Utensils className="w-4 h-4 text-warning" />
            <span className="text-sm text-foreground flex-1">Alimentation</span>
            <span className="text-sm font-medium text-foreground">650 $</span>
          </div>
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-chart-5" />
            <span className="text-sm text-foreground flex-1">Transport</span>
            <span className="text-sm font-medium text-foreground">425 $</span>
          </div>
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-destructive" />
            <span className="text-sm text-foreground flex-1">Achats</span>
            <span className="text-sm font-medium text-foreground">320 $</span>
          </div>
        </div>
      </div>
      
      <div className="bg-accent/50 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-sm text-foreground">12% de moins que le mois dernier</span>
        </div>
      </div>
    </div>
  );

  // Mockup 2: Objectifs d'épargne
  const MockupObjectifs = () => (
    <div className="bg-card rounded-2xl shadow-2xl p-6 border border-border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-foreground">Mes objectifs</h3>
        <span className="text-sm text-primary font-medium">3 actifs</span>
      </div>
      
      <div className="space-y-4">
        {/* Objectif 1 */}
        <div className="bg-muted/50 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-lg">✈️</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Voyage Europe</p>
              <p className="text-xs text-muted-foreground">Objectif: 5 000 $</p>
            </div>
            <span className="text-lg font-bold text-primary">68%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-primary rounded-full h-2" style={{ width: '68%' }}></div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">3 400 $ / 5 000 $ • 1 600 $ restant</p>
        </div>
        
        {/* Objectif 2 */}
        <div className="bg-muted/50 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
              <span className="text-lg">🏠</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Mise de fond</p>
              <p className="text-xs text-muted-foreground">Objectif: 40 000 $</p>
            </div>
            <span className="text-lg font-bold text-warning">45%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-warning rounded-full h-2" style={{ width: '45%' }}></div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">18 000 $ / 40 000 $ • Encore 22 mois</p>
        </div>
        
        {/* Objectif 3 */}
        <div className="bg-muted/50 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-chart-5/20 flex items-center justify-center">
              <span className="text-lg">🚗</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">Nouvelle auto</p>
              <p className="text-xs text-muted-foreground">Objectif: 15 000 $</p>
            </div>
            <span className="text-lg font-bold text-chart-5">25%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-chart-5 rounded-full h-2" style={{ width: '25%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );

  // Mockup 3: Évolution patrimoine net
  const MockupPatrimoine = () => (
    <div className="bg-card rounded-2xl shadow-2xl p-6 border border-border">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Patrimoine net</p>
          <h3 className="text-3xl font-bold text-foreground">87 450 $</h3>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center gap-1 text-sm font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
            <TrendingUp className="w-3 h-3" />
            +12.4%
          </span>
          <p className="text-xs text-muted-foreground mt-1">vs année dernière</p>
        </div>
      </div>
      
      {/* Simulated line chart */}
      <div className="h-32 mt-4 mb-4 relative">
        <svg className="w-full h-full" viewBox="0 0 300 80" preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path
            d="M0,60 Q30,55 60,50 T120,45 T180,35 T240,25 T300,15 V80 H0 Z"
            fill="url(#chartGradient)"
          />
          <path
            d="M0,60 Q30,55 60,50 T120,45 T180,35 T240,25 T300,15"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
          />
          <circle cx="300" cy="15" r="4" fill="hsl(var(--primary))"/>
        </svg>
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground">
          <span>Jan</span>
          <span>Avr</span>
          <span>Juil</span>
          <span>Oct</span>
          <span>Déc</span>
        </div>
      </div>
      
      {/* Assets/Debts summary */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Actifs</p>
          <p className="text-lg font-bold text-primary">142 800 $</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <CreditCard className="w-3 h-3" />
            <span>CELI, REER, Maison</span>
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Passifs</p>
          <p className="text-lg font-bold text-destructive">55 350 $</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <HomeIcon className="w-3 h-3" />
            <span>Hypothèque, Prêt auto</span>
          </div>
        </div>
      </div>
    </div>
  );

  const features = [
    {
      title: "Suivez vos dépenses en un coup d'œil",
      description: "Catégorisez automatiquement vos transactions et visualisez où va votre argent avec des graphiques interactifs clairs et détaillés.",
      icon: Wallet,
      features: ["Catégories personnalisables", "Graphiques interactifs", "Historique complet"],
      mockup: MockupDepenses
    },
    {
      title: "Atteignez vos objectifs d'épargne",
      description: "Définissez des objectifs financiers (voyage, mise de fond, fonds d'urgence) et suivez votre progression avec des indicateurs visuels motivants.",
      icon: Target,
      features: ["Objectifs personnalisés", "Suivi de progression", "Recommandations intelligentes"],
      mockup: MockupObjectifs
    },
    {
      title: "Suivez votre patrimoine net",
      description: "Visualisez l'évolution de votre richesse totale incluant vos actifs (CELI, REER, propriété) et vos passifs (hypothèque, dettes).",
      icon: LineChart,
      features: ["Évolution historique", "Actifs vs Passifs", "Prévisions financières"],
      mockup: MockupPatrimoine
    }
  ];

  return (
    <>
      <SEO 
        title="Planificateur Budgétaire Gratuit Québec | Calculateur Salaire Net 2025" 
        description="Le planificateur budgétaire gratuit #1 au Québec. Suivez vos dépenses, calculez votre salaire net après impôts, estimez votre retour d'impôt 2025 et atteignez vos objectifs financiers."
        keywords="budget personnel Québec, planificateur budget gratuit, calculateur salaire net Québec 2025, retour impôt Québec, gestion finances personnelles, économiser argent, suivi dépenses"
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

      {/* Features Section - Zigzag avec mockups uniques */}
      <section id="features" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Des outils puissants et intuitifs pour reprendre le contrôle de vos finances personnelles
            </p>
          </div>
          
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className={`flex flex-col ${
                index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
              } items-center gap-12 lg:gap-20 mb-24 last:mb-0`}
            >
              {/* Contenu texte */}
              <div className="flex-1 text-center lg:text-left">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 mx-auto lg:mx-0">
                  <feature.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                  {feature.title}
                </h3>
                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                  {feature.description}
                </p>
                <ul className="space-y-3 mb-6">
                  {feature.features.map((item) => (
                    <li key={item} className="flex items-center gap-3 justify-center lg:justify-start">
                      <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  variant="outline" 
                  className="mt-2"
                  onClick={() => navigate("/outils/budget")}
                >
                  Essayer gratuitement
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
              
              {/* Mockup visuel unique */}
              <div className="flex-1 w-full max-w-md lg:max-w-none">
                <div className={`relative ${index % 2 === 0 ? 'lg:ml-auto' : 'lg:mr-auto'}`}>
                  <feature.mockup />
                  {/* Floating badge */}
                  <div className="absolute -top-3 -right-3 w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                    <Zap className="w-6 h-6 text-primary-foreground" />
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
              <Card key={testimonial.name} className="p-6 bg-card hover:shadow-lg transition-shadow">
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-foreground mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-border">
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
