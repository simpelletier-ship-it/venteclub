import { Helmet } from "react-helmet";
import { Calculator, TrendingUp, Wallet, ArrowRight, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Tools = () => {
  const tools = [
    {
      id: "salary-calculator",
      title: "Calculateur de Salaire Net Québec",
      description: "Calculez précisément votre salaire net après impôts fédéral et provincial, RRQ, assurance-emploi et RQAP. Conversion automatique entre toutes les périodes de paie (annuel, mensuel, bihebdomadaire, hebdomadaire, horaire).",
      features: [
        "Taux d'imposition 2025 à jour",
        "Calcul RRQ, AE et RQAP",
        "Conversion multi-périodes",
        "Taux marginal et effectif"
      ],
      icon: Calculator,
      color: "bg-blue-500",
      link: "/outils/salaire",
      keywords: "salaire net, impôt québec, paie, RRQ, RQAP"
    },
    {
      id: "tax-return",
      title: "Calculateur de Retour d'Impôt",
      description: "Estimez votre retour d'impôt provincial (Québec) et fédéral avec tous les crédits disponibles : REER, CELIAPP, dons de charité, frais médicaux, garde d'enfants, REER FTQ, frais de scolarité et plus encore.",
      features: [
        "Séparation Québec/Fédéral",
        "Tous les crédits populaires",
        "REER et CELIAPP",
        "Crédits FTQ et études"
      ],
      icon: TrendingUp,
      color: "bg-green-500",
      link: "/outils/retour-impot",
      keywords: "retour impôt, REER, CELIAPP, crédit fiscal"
    },
    {
      id: "budget",
      title: "Planificateur de Budget Personnel",
      description: "Planificateur de budget intelligent et gratuit pour gérer vos finances personnelles. Suivi des dépenses en temps réel, gestion REER/CELI, objectifs d'épargne, analyse des habitudes financières, score de santé financière et coaching personnalisé.",
      features: [
        "Suivi temps réel",
        "Objectifs d'épargne",
        "Coach IA personnalisé",
        "Graphiques d'évolution"
      ],
      icon: Wallet,
      color: "bg-purple-500",
      link: "/outils/budget",
      keywords: "budget, planification financière, épargne, dettes"
    }
  ];

  const benefits = [
    {
      icon: CheckCircle,
      title: "Calculs Précis 2025",
      description: "Tous nos calculateurs utilisent les taux d'imposition, cotisations et crédits fiscaux mis à jour pour 2025 au Québec et au Canada."
    },
    {
      icon: CheckCircle,
      title: "100% Gratuit",
      description: "Accès complet et illimité à tous nos outils financiers sans frais cachés ni inscription obligatoire (sauf planificateur budget)."
    },
    {
      icon: CheckCircle,
      title: "Confidentialité Garantie",
      description: "Vos données financières sont traitées localement dans votre navigateur ou stockées de manière sécurisée et chiffrée."
    },
    {
      icon: CheckCircle,
      title: "Interface Intuitive",
      description: "Résultats instantanés avec visualisations graphiques pour comprendre facilement votre situation financière."
    }
  ];

  return (
    <>
      <Helmet>
        <title>Outils Financiers Gratuits Québec 2025 | Calculateurs Budget Salaire Impôt</title>
        <meta name="description" content="Suite complète d'outils financiers gratuits pour le Québec : calculateur de salaire net, retour d'impôt avec REER/CELIAPP, planificateur de budget intelligent. Taux 2025 à jour, calculs précis, interface intuitive. Gérez vos finances personnelles efficacement." />
        <meta name="keywords" content="outils financiers québec, calculateur salaire net, calculateur retour impôt, planificateur budget, gestion finances personnelles, REER, CELIAPP, budget mensuel, impôt québec 2025, calculateur gratuit" />
        
        {/* Canonical */}
        <link rel="canonical" href="https://vente.club/outils" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Outils Financiers Gratuits Québec 2025 | Calculateurs Budget Salaire Impôt" />
        <meta property="og:description" content="Suite complète d'outils financiers gratuits : calculateur salaire net, retour d'impôt, planificateur budget. Taux 2025 à jour." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://vente.club/outils" />
        
        {/* Structured Data - BreadcrumbList */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Accueil",
                "item": "https://vente.club"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Outils Financiers",
                "item": "https://vente.club/outils"
              }
            ]
          })}
        </script>
        
        {/* Structured Data - CollectionPage */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Outils Financiers Gratuits Québec",
            "description": "Suite complète d'outils financiers gratuits pour gérer vos finances personnelles au Québec",
            "url": "https://vente.club/outils",
            "hasPart": [
              {
                "@type": "WebApplication",
                "name": "Calculateur de Salaire Net Québec",
                "url": "https://vente.club/outils/salaire",
                "applicationCategory": "FinanceApplication"
              },
              {
                "@type": "WebApplication",
                "name": "Calculateur de Retour d'Impôt",
                "url": "https://vente.club/outils/retour-impot",
                "applicationCategory": "FinanceApplication"
              },
              {
                "@type": "WebApplication",
                "name": "Planificateur de Budget",
                "url": "https://vente.club/outils/budget",
                "applicationCategory": "FinanceApplication"
              }
            ],
            "publisher": {
              "@type": "Organization",
              "name": "Vente.Club"
            }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-2 md:px-4 py-8 md:py-12">
          {/* Hero Section */}
          <header className="text-center mb-12 md:mb-16 px-4 animate-fade-in">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground leading-tight">
              Outils Financiers Gratuits pour le Québec
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto mb-6 leading-relaxed">
              Des calculateurs professionnels et un planificateur de budget intelligent pour vous aider à prendre des décisions financières éclairées. Taux 2025 à jour, calculs précis, 100% gratuit.
            </p>
            <div className="flex flex-wrap justify-center gap-3 md:gap-4 text-xs md:text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-500" />
                Taux 2025 à jour
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-500" />
                100% gratuit
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-500" />
                Confidentialité garantie
              </span>
            </div>
          </header>

          {/* Tools Grid */}
          <section className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto px-2 md:px-0">
              {tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Card 
                    key={tool.id} 
                    className="flex flex-col h-full hover:shadow-xl transition-all duration-300 hover:scale-[1.02] md:hover:scale-[1.03] border-2 hover:border-primary group animate-fade-in touch-manipulation"
                  >
                    <CardHeader className="flex-grow pb-4">
                      <div className={`w-14 h-14 md:w-16 md:h-16 ${tool.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                      </div>
                      <CardTitle className="text-lg md:text-xl mb-2 leading-tight">{tool.title}</CardTitle>
                      <CardDescription className="text-sm md:text-base leading-relaxed mb-4">
                        {tool.description}
                      </CardDescription>
                      
                      {/* Features list */}
                      <ul className="space-y-2 mb-4">
                        {tool.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs md:text-sm text-muted-foreground">
                            <CheckCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      <p className="text-[10px] md:text-xs text-muted-foreground italic">
                        Mots-clés: {tool.keywords}
                      </p>
                    </CardHeader>
                    <CardContent className="pt-0 mt-auto">
                      <Link to={tool.link} className="block">
                        <Button 
                          className="w-full group/btn text-base md:text-lg active:scale-95 transition-transform" 
                          size="lg"
                        >
                          Accéder à l'outil
                          <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Benefits Section */}
          <section className="mb-16 px-4 md:px-0">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 animate-fade-in">
              Pourquoi utiliser nos outils financiers?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto">
              {benefits.map((benefit, idx) => {
                const Icon = benefit.icon;
                return (
                  <Card 
                    key={idx} 
                    className="text-center hover:shadow-lg transition-all duration-300 animate-fade-in touch-manipulation"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-center mb-3">
                        <Icon className="h-8 w-8 md:h-10 md:w-10 text-green-500" />
                      </div>
                      <CardTitle className="text-base md:text-lg">{benefit.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                        {benefit.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* SEO Content Section */}
          <section className="max-w-4xl mx-auto space-y-8">
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-2xl">
                  Outils financiers adaptés au contexte québécois
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Notre suite d'outils financiers gratuits a été spécialement conçue pour répondre aux besoins des résidents du Québec. 
                  Nous comprenons la complexité du système fiscal canadien à deux paliers (fédéral et provincial) et l'importance de 
                  calculer précisément vos contributions au Régime de rentes du Québec (RRQ), à l'assurance-emploi et au Régime québécois 
                  d'assurance parentale (RQAP).
                </p>
                
                <h3 className="text-xl font-semibold text-foreground mt-6">
                  Calculateur de Salaire Net - Comprendre votre paie
                </h3>
                <p>
                  Notre calculateur de salaire net vous permet de voir instantanément combien vous recevrez réellement dans votre compte bancaire 
                  après toutes les déductions obligatoires. Que vous négociiez un nouveau salaire, compariez des offres d'emploi ou planifiiez 
                  votre budget familial, cet outil vous donne une vision claire de votre rémunération nette avec les taux d'imposition 2025.
                </p>
                
                <h3 className="text-xl font-semibold text-foreground mt-6">
                  Calculateur de Retour d'Impôt - Maximiser vos remboursements
                </h3>
                <p>
                  Le calculateur de retour d'impôt vous aide à estimer vos économies fiscales grâce à vos cotisations REER, CELIAPP, dons de 
                  charité et autres crédits d'impôt disponibles. Découvrez comment maximiser votre retour d'impôt en planifiant stratégiquement 
                  vos contributions avant la fin de l'année fiscale. Notre outil sépare clairement la portion provinciale (Québec) et fédérale 
                  de vos économies d'impôt.
                </p>
                
                <h3 className="text-xl font-semibold text-foreground mt-6">
                  Planificateur de Budget - Prenez le contrôle de vos finances
                </h3>
                <p>
                  Notre planificateur de budget intelligent va bien au-delà d'un simple calculateur. C'est un véritable assistant financier 
                  personnel qui vous aide à suivre vos dépenses en temps réel, gérer vos actifs (REER, CELI, propriété), suivre vos dettes 
                  avec calcul d'intérêts, définir des objectifs d'épargne réalistes et recevoir des recommandations personnalisées basées 
                  sur vos habitudes financières. Avec un système de gamification motivant, vous progressez vers vos objectifs financiers 
                  de manière engageante.
                </p>
                
                <h3 className="text-xl font-semibold text-foreground mt-6">
                  Confidentialité et sécurité de vos données
                </h3>
                <p>
                  Nous prenons la confidentialité de vos informations financières au sérieux. Les calculateurs de salaire et de retour d'impôt 
                  traitent toutes vos données localement dans votre navigateur - aucune information n'est envoyée à nos serveurs. Pour le 
                  planificateur de budget, vos données sont stockées de manière sécurisée et chiffrée, accessibles uniquement par vous avec 
                  votre compte protégé par authentification.
                </p>
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Questions fréquentes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold text-lg mb-2">Les calculateurs sont-ils vraiment gratuits?</h4>
                  <p className="text-muted-foreground">
                    Oui, absolument! Tous nos outils financiers sont 100% gratuits et sans frais cachés. Le calculateur de salaire 
                    et le calculateur de retour d'impôt ne nécessitent même pas d'inscription. Seul le planificateur de budget 
                    nécessite un compte gratuit pour sauvegarder vos données entre les sessions.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-lg mb-2">Les taux d'imposition sont-ils à jour pour 2025?</h4>
                  <p className="text-muted-foreground">
                    Oui, tous nos calculateurs utilisent les taux d'imposition fédéraux et provinciaux de 2025, ainsi que les taux 
                    de cotisation au RRQ, RQAP et assurance-emploi les plus récents. Nous mettons à jour nos outils chaque année 
                    dès que les nouveaux taux sont annoncés par les gouvernements.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-lg mb-2">Puis-je faire confiance aux résultats des calculateurs?</h4>
                  <p className="text-muted-foreground">
                    Nos calculateurs fournissent des estimations précises basées sur les formules fiscales officielles et les taux 
                    en vigueur. Cependant, votre situation fiscale réelle peut être affectée par d'autres facteurs (crédits spéciaux, 
                    déductions particulières, etc.). Pour une évaluation définitive, consultez toujours un comptable ou fiscaliste qualifié.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-lg mb-2">Le planificateur de budget fonctionne-t-il hors ligne?</h4>
                  <p className="text-muted-foreground">
                    Le planificateur de budget nécessite une connexion internet pour synchroniser vos données de manière sécurisée. 
                    Cependant, les calculateurs de salaire et de retour d'impôt fonctionnent entièrement dans votre navigateur et 
                    peuvent être utilisés hors ligne une fois la page chargée.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </>
  );
};

export default Tools;
