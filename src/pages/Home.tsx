import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
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
  Smartphone,
  BarChart3,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  Star
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Vente.Club Budget",
    "url": "https://vente.club",
    "description": "Plateforme intelligente de gestion budgétaire personnelle. Suivez vos dépenses, atteignez vos objectifs financiers et prenez le contrôle de votre argent.",
    "applicationCategory": "FinanceApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "CAD"
    }
  };

  const features = [
    {
      icon: Wallet,
      title: "Suivi des dépenses",
      description: "Catégorisez automatiquement vos transactions et visualisez où va votre argent"
    },
    {
      icon: Target,
      title: "Objectifs financiers",
      description: "Définissez des objectifs d'épargne et suivez votre progression en temps réel"
    },
    {
      icon: TrendingUp,
      title: "Valeur nette",
      description: "Suivez l'évolution de votre patrimoine avec actifs et passifs"
    },
    {
      icon: BarChart3,
      title: "Analyses avancées",
      description: "Graphiques et statistiques pour comprendre vos habitudes financières"
    },
    {
      icon: Receipt,
      title: "Dépenses récurrentes",
      description: "Détectez et gérez vos abonnements et paiements réguliers"
    },
    {
      icon: Sparkles,
      title: "Coach IA",
      description: "Recommandations personnalisées pour optimiser votre budget"
    }
  ];

  const tools = [
    {
      title: "Planificateur de budget",
      description: "Gérez vos revenus, dépenses et objectifs financiers en un seul endroit",
      icon: PiggyBank,
      href: "/outils/budget",
      color: "from-emerald-500 to-teal-600",
      featured: true
    },
    {
      title: "Calculateur de salaire",
      description: "Calculez votre salaire net après impôts et déductions au Québec",
      icon: Calculator,
      href: "/outils/salaire",
      color: "from-blue-500 to-indigo-600"
    },
    {
      title: "Retour d'impôt",
      description: "Estimez votre remboursement d'impôt provincial et fédéral",
      icon: Receipt,
      href: "/outils/retour-impot",
      color: "from-purple-500 to-violet-600"
    }
  ];

  const testimonials = [
    {
      name: "Marie-Claude",
      role: "Enseignante",
      quote: "Grâce au planificateur, j'ai économisé 5 000$ en 6 mois pour mon voyage.",
      rating: 5
    },
    {
      name: "Jean-Philippe",
      role: "Développeur",
      quote: "Interface simple et intuitive. Je comprends enfin où va mon argent!",
      rating: 5
    },
    {
      name: "Sophie",
      role: "Infirmière",
      quote: "Le meilleur outil de budget que j'ai utilisé. Et c'est gratuit!",
      rating: 5
    }
  ];

  return (
    <>
      <SEO 
        title="Gérez votre budget intelligemment - Planificateur financier gratuit" 
        description="Plateforme québécoise de gestion budgétaire. Suivez vos dépenses, atteignez vos objectifs d'épargne et prenez le contrôle de vos finances personnelles. 100% gratuit."
        keywords="budget personnel, planificateur budget, gestion finances, économiser argent, suivi dépenses, Québec"
        canonical="/" 
        structuredData={structuredData} 
      />
      
      {/* Hero Section - Style Mint/YNAB */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, hsl(var(--primary) / 0.1) 0%, transparent 50%),
                             radial-gradient(circle at 75% 75%, hsl(var(--secondary) / 0.1) 0%, transparent 50%)`
          }} />
        </div>
        
        {/* Floating elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-20 right-[15%] w-16 h-16 rounded-2xl bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30"
          />
          <motion.div 
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute top-40 left-[10%] w-12 h-12 rounded-full bg-teal-500/20 backdrop-blur-sm border border-teal-500/30"
          />
          <motion.div 
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-32 right-[25%] w-20 h-20 rounded-3xl bg-cyan-500/20 backdrop-blur-sm border border-cyan-500/30"
          />
        </div>
        
        <div className="container mx-auto px-4 py-16 lg:py-24 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                100% gratuit · Aucune carte de crédit requise
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-[1.1] tracking-tight text-slate-900 dark:text-white mb-6">
                Prenez le contrôle de{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400">
                  vos finances
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
                Le planificateur budgétaire le plus complet et intuitif au Québec. 
                Suivez vos dépenses, atteignez vos objectifs et bâtissez votre liberté financière.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="h-14 px-8 text-lg font-semibold rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all"
                  onClick={() => navigate("/outils/budget")}
                >
                  Commencer gratuitement
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="h-14 px-8 text-lg font-semibold rounded-xl border-2 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Découvrir les fonctionnalités
                </Button>
              </div>
              
              {/* Trust indicators */}
              <div className="flex items-center justify-center gap-6 mt-10 text-sm text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span>Données sécurisées</span>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Mode hors-ligne</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>100% québécois</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
              Vos outils financiers
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Des calculateurs puissants et un planificateur complet pour gérer vos finances
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {tools.map((tool, index) => (
              <motion.div
                key={tool.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card 
                  className={`group relative overflow-hidden cursor-pointer h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${tool.featured ? 'ring-2 ring-emerald-500/50' : ''}`}
                  onClick={() => navigate(tool.href)}
                >
                  {tool.featured && (
                    <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                      Populaire
                    </div>
                  )}
                  <div className="p-8">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${tool.color} flex items-center justify-center mb-6`}>
                      <tool.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {tool.description}
                    </p>
                    <div className="flex items-center text-primary font-medium">
                      Accéder
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Des fonctionnalités pensées pour simplifier la gestion de votre budget
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex gap-4"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
              Ce que nos utilisateurs disent
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="p-6 h-full">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-foreground mb-6 italic">"{testimonial.quote}"</p>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-teal-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-6">
            Prêt à transformer vos finances?
          </h2>
          <p className="text-emerald-100 text-lg max-w-2xl mx-auto mb-8">
            Rejoignez des milliers de Québécois qui ont pris le contrôle de leur budget. 
            C'est gratuit, simple et ça fonctionne.
          </p>
          <Button 
            size="lg" 
            className="h-14 px-10 text-lg font-semibold rounded-xl bg-white text-emerald-700 hover:bg-emerald-50 shadow-lg hover:shadow-xl transition-all"
            onClick={() => navigate(user ? "/outils/budget" : "/auth")}
          >
            {user ? "Ouvrir mon budget" : "Créer un compte gratuit"}
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Business Section - Kept but secondary */}
      <section className="py-16 bg-slate-100 dark:bg-slate-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm text-muted-foreground uppercase tracking-wide mb-4">Pour les entrepreneurs</p>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-4">
              Vous cherchez à acheter ou vendre une entreprise?
            </h2>
            <p className="text-muted-foreground mb-8">
              Découvrez notre marketplace d'opportunités d'affaires au Québec
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="outline"
                size="lg"
                onClick={() => navigate("/entreprises")}
                className="h-12"
              >
                Voir les entreprises à vendre
              </Button>
              <Button 
                variant="ghost"
                size="lg"
                onClick={() => navigate("/sell")}
                className="h-12"
              >
                Vendre mon entreprise
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
