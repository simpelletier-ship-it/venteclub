import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import BusinessCard from "@/components/BusinessCard";
import { ArrowRight, TrendingUp, Shield, Clock, Sparkles, Building2, Users, Eye, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { TypewriterAnimation } from "@/components/AnimatedSearchBar";
import { useCountUp } from "@/hooks/useCountUp";
import { FloatingOpportunities } from "@/components/FloatingOpportunities";
import { CircuitBackground } from "@/components/CircuitBackground";
import { trackPageView } from "@/lib/googleAds";

const Home = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [featuredBusinesses, setFeaturedBusinesses] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalBusinesses: 0,
    totalViews: 0,
    totalUsers: 0,
    totalValue: 0
  });
  
  // Compteurs animés pour les statistiques - animation rapide
  const businessesCount = useCountUp({ end: stats.totalBusinesses, duration: 1200, delay: 100 });
  const viewsCount = useCountUp({ end: Math.floor(stats.totalViews / 1000), duration: 1200, delay: 200 });
  const usersCount = useCountUp({ end: 28, duration: 1200, delay: 300 });
  const valueCount = useCountUp({ end: Math.floor(stats.totalValue / 1000000), duration: 1200, delay: 400 });
  
  useEffect(() => {
    fetchFeaturedBusinesses();
    fetchStats();
    
    // Envoyer événement de page vue à Google Ads
    trackPageView();
  }, []);

  useEffect(() => {
    if (searchParams.get('premium_success') === 'true') {
      toast({
        title: "Paiement réussi",
        description: "Votre abonnement Club Select est activé. Rechargez la page pour voir les changements.",
      });
      setSearchParams({});
    } else if (searchParams.get('premium_cancel') === 'true') {
      toast({
        variant: "destructive",
        title: "Abonnement annulé",
        description: "L'abonnement Club Select a été annulé.",
      });
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, toast]);

  const fetchFeaturedBusinesses = async () => {
    try {
      // Fetch only the columns we need for display
      const { data: businesses } = await supabase
        .from('businesses')
        .select('id, slug, title, industry, city, region, annual_revenue, asking_price, baiia, description, featured, status, approval_status, is_franchise, sale_type, property_type, year_built, square_footage, is_rental_property, rental_units, is_demo, created_at')
        .eq('status', 'active')
        .eq('approval_status', 'approved')
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (businesses) {
        setFeaturedBusinesses(businesses);
      }
    } catch (error) {
      console.error('[FETCH-FEATURED] Error:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Utiliser la fonction publique sécurisée pour obtenir toutes les stats
      const { data, error } = await supabase.rpc('get_public_stats');
      
      if (error) {
        console.error('[FETCH-STATS] Error:', error);
        return;
      }

      if (data && data.length > 0) {
        const stats = data[0];
        setStats({
          totalBusinesses: Number(stats.total_businesses) || 0,
          totalViews: Number(stats.total_views) || 0,
          totalUsers: Number(stats.total_users) || 0,
          totalValue: Number(stats.total_value) || 0
        });
      }
    } catch (error) {
      console.error('[FETCH-STATS] Error:', error);
    }
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Vente.Club",
    "url": "https://vente.club",
    "description": "Plateforme intelligente optimisée par IA qui facilite la mise en relation entre acquéreurs et propriétaires d'entreprises au Québec. Tous secteurs d'activité : restauration, hôtellerie, commerce, industrie.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://vente.club/entreprises?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    },
    "provider": {
      "@type": "Organization",
      "name": "Vente.Club",
      "description": "Plateforme spécialisée dans les transactions d'entreprises au Québec",
      "foundingDate": "2024",
      "areaServed": {
        "@type": "State",
        "name": "Québec"
      }
    }
  };

  return (
    <>
      <SEO 
        title="Achat et Vente d'Entreprises au Québec" 
        description="Plateforme québécoise pour acheter et vendre des entreprises : restaurants, commerces, franchises. Connexion directe avec propriétaires. Recherche IA. Transactions sécurisées."
        keywords="achat entreprise Québec, vente entreprise, PME à vendre, commerce à vendre, opportunité affaires, reprise commerce Montréal, cession entreprise, prix entreprise 2025"
        canonical="/" 
        structuredData={structuredData} 
      />
      <BreadcrumbSchema 
        items={[
          { name: "Accueil", url: "/" }
        ]}
      />
      
      {/* Hero Section */}
      <section className="relative min-h-[70vh] sm:min-h-[75vh] lg:min-h-[80vh] flex items-center bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#1e3a8a] overflow-hidden" aria-label="Section principale">
        {/* Circuit Background */}
        <CircuitBackground />
        
        {/* Simplified Background Elements - removed parallax for performance */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 -right-20 w-96 h-96 bg-[#6366f1]/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-20 -left-20 w-96 h-96 bg-[#818cf8]/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#4f46e5]/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '12s', animationDelay: '4s' }} />
        </div>
        
        <div className="container mx-auto px-4 py-6 sm:py-8 lg:py-12 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="space-y-6 sm:space-y-7 lg:space-y-9 animate-slide-up">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-bold leading-[1.15] tracking-tight text-white">
                Achetez ou vendez<br /><TypewriterAnimation />
              </h1>
              
              <p className="text-lg sm:text-xl lg:text-2xl text-white/90 max-w-3xl leading-relaxed">
                La plateforme de référence au Québec pour acquérir une entreprise établie
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 pt-4 sm:pt-6">
                <Button 
                  size="lg" 
                  className="bg-[#6366f1] hover:bg-[#4f46e5] text-white h-14 sm:h-16 lg:h-[4.5rem] px-8 sm:px-10 lg:px-12 text-base sm:text-lg lg:text-xl font-semibold rounded-xl shadow-lg hover:shadow-2xl transition-all group w-full sm:w-auto"
                  onClick={() => navigate("/entreprises")}
                >
                  Explorer les opportunités
                  <ArrowRight className="ml-2 w-5 sm:w-6 h-5 sm:h-6 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg" 
                  className="h-14 sm:h-16 lg:h-[4.5rem] px-8 sm:px-10 lg:px-12 text-base sm:text-lg lg:text-xl font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 shadow-lg hover:shadow-2xl transition-all backdrop-blur-sm w-full sm:w-auto"
                  onClick={() => navigate("/sell")}
                >
                  Vendre mon entreprise
                </Button>
              </div>
            </div>
          </div>
          
          {/* Floating Animation - Positioned Absolutely */}
          <div className="hidden xl:block absolute left-[66%] top-[68%] -translate-y-1/2 w-[300px] pointer-events-none">
            <FloatingOpportunities />
          </div>
        </div>
        
      </section>

      {/* Statistics Section */}
      <section className="py-6 sm:py-8 lg:py-10 bg-[#1e1b4b]" aria-label="Statistiques de la plateforme">
        <div className="container mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-5 text-white">La plateforme de confiance au Québec</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#818cf8]/20 mb-1.5 sm:mb-2">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#818cf8]" />
              </div>
              <div ref={businessesCount.ref} className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-0.5 sm:mb-1 tabular-nums">
                {businessesCount.count}+
              </div>
              <div className="text-xs sm:text-sm text-white/70 leading-tight">entreprises actives</div>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#818cf8]/20 mb-1.5 sm:mb-2">
                <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-[#818cf8]" />
              </div>
              <div ref={viewsCount.ref} className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-0.5 sm:mb-1 tabular-nums">
                {viewsCount.count}k+
              </div>
              <div className="text-xs sm:text-sm text-white/70 leading-tight">vues totales</div>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#818cf8]/20 mb-1.5 sm:mb-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-[#818cf8]" />
              </div>
              <div ref={usersCount.ref} className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-0.5 sm:mb-1 tabular-nums">
                {usersCount.count}+
              </div>
              <div className="text-xs sm:text-sm text-white/70 leading-tight">entrepreneurs inscrits</div>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#818cf8]/20 mb-1.5 sm:mb-2">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-[#818cf8]" />
              </div>
              <div ref={valueCount.ref} className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-0.5 sm:mb-1 tabular-nums">
                {valueCount.count}M+$
              </div>
              <div className="text-xs sm:text-sm text-white/70 leading-tight">valeur totale des annonces</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Businesses Section */}
      <section id="featured" className="py-12 sm:py-16 lg:py-20 bg-background relative">
        {/* Decorative Top Border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-10 lg:mb-12 animate-slide-up">
            <h2 id="featured-heading" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-3 sm:mb-4">
              Opportunités d'affaires en vedette
            </h2>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed px-4 sm:px-0">
              Découvrez notre sélection des meilleures entreprises à vendre, approuvées par notre équipe et prêtes à être acquises
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {featuredBusinesses.map((business, index) => (
              <div key={business.id} className="animate-slide-up h-full" style={{ animationDelay: `${index * 100}ms` }}>
                <BusinessCard {...business} />
              </div>
            ))}
          </div>

          <div className="text-center animate-slide-up">
            <Button 
              size="lg" 
              onClick={() => navigate("/entreprises")}
              className="bg-gradient-to-r from-secondary to-primary hover:from-secondary/90 hover:to-primary/90 text-white h-12 sm:h-14 px-8 sm:px-10 text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
            >
              Voir toutes les entreprises à vendre
              <ArrowRight className="ml-2 w-4 sm:w-5 h-4 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#1e3a8a] border-y border-primary/20" aria-labelledby="features-heading">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-10 max-w-4xl mx-auto">
            <h2 id="features-heading" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-display font-bold mb-4 sm:mb-6 text-white">
              Des solutions adaptées à chaque entrepreneur
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-white/90 leading-relaxed text-justify px-2 sm:px-4">
              Quel que soit votre secteur d'activité, découvrez un large éventail d'opportunités adaptées à vos compétences et à votre budget. Notre <a href="/ressources" className="text-white hover:text-secondary underline font-semibold transition-colors">plateforme intelligente</a> vous permet d'acquérir une entreprise selon différentes modalités : immobilisation complète incluant bâtiment et équipements, acquisition d'actions pour devenir actionnaire, ou <a href="/blog" className="text-white hover:text-secondary underline font-semibold transition-colors">rachat de fonds de commerce</a> pour reprendre l'activité existante.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 max-w-5xl mx-auto mb-10 sm:mb-12">
            <Link to="/entreprises" className="text-center p-5 sm:p-6 lg:p-8 rounded-xl bg-white/10 border border-white/20 hover:bg-white/15 hover:shadow-2xl hover:scale-105 transition-all duration-300 backdrop-blur-sm group">
              <TrendingUp className="w-9 sm:w-10 lg:w-12 h-9 sm:h-10 lg:h-12 mx-auto mb-2 sm:mb-3 lg:mb-4 text-white group-hover:text-[#818cf8] transition-colors" />
              <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-2 sm:mb-2.5 lg:mb-3 text-white">Recherche optimisée par IA</h3>
              <p className="text-xs sm:text-sm lg:text-base text-white/80 leading-relaxed">Trouvez rapidement les opportunités qui correspondent à votre profil grâce à notre intelligence artificielle</p>
            </Link>
            <Link to="/club-select" className="text-center p-5 sm:p-6 lg:p-8 rounded-xl bg-white/10 border border-white/20 hover:bg-white/15 hover:shadow-2xl hover:scale-105 transition-all duration-300 backdrop-blur-sm group">
              <Shield className="w-9 sm:w-10 lg:w-12 h-9 sm:h-10 lg:h-12 mx-auto mb-2 sm:mb-3 lg:mb-4 text-white group-hover:text-[#818cf8] transition-colors" />
              <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-2 sm:mb-2.5 lg:mb-3 text-white">Paiements sécurisés</h3>
              <p className="text-xs sm:text-sm lg:text-base text-white/80 leading-relaxed">Abonnements et achats protégés par une infrastructure de paiement certifiée et conforme aux normes bancaires</p>
            </Link>
            <Link to="/dashboard" className="text-center p-5 sm:p-6 lg:p-8 rounded-xl bg-white/10 border border-white/20 hover:bg-white/15 hover:shadow-2xl hover:scale-105 transition-all duration-300 backdrop-blur-sm group">
              <Clock className="w-9 sm:w-10 lg:w-12 h-9 sm:h-10 lg:h-12 mx-auto mb-2 sm:mb-3 lg:mb-4 text-white group-hover:text-[#818cf8] transition-colors" />
              <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-2 sm:mb-2.5 lg:mb-3 text-white">Interface simplifiée</h3>
              <p className="text-xs sm:text-sm lg:text-base text-white/80 leading-relaxed">Navigation intuitive et gestion facile de vos annonces grâce à notre technologie avancée</p>
            </Link>
          </div>
          
          {/* Popular Cities Section */}
          <div className="max-w-6xl mx-auto mt-12">
            <h3 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-white">Entreprises à vendre par ville au Québec</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <Link to="/entreprises-a-vendre-montreal" className="text-center p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10 hover:border-[#818cf8] group">
                <p className="font-semibold text-white group-hover:text-[#818cf8]">Montréal</p>
                <p className="text-xs text-white/70 mt-1">Entreprises</p>
              </Link>
              <Link to="/entreprises-a-vendre-quebec" className="text-center p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10 hover:border-[#818cf8] group">
                <p className="font-semibold text-white group-hover:text-[#818cf8]">Québec</p>
                <p className="text-xs text-white/70 mt-1">Opportunités</p>
              </Link>
              <Link to="/entreprises-a-vendre-laval" className="text-center p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10 hover:border-[#818cf8] group">
                <p className="font-semibold text-white group-hover:text-[#818cf8]">Laval</p>
                <p className="text-xs text-white/70 mt-1">Commerces</p>
              </Link>
              <Link to="/entreprises-a-vendre-gatineau" className="text-center p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10 hover:border-[#818cf8] group">
                <p className="font-semibold text-white group-hover:text-[#818cf8]">Gatineau</p>
                <p className="text-xs text-white/70 mt-1">Affaires</p>
              </Link>
              <Link to="/entreprises-a-vendre-longueuil" className="text-center p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10 hover:border-[#818cf8] group">
                <p className="font-semibold text-white group-hover:text-[#818cf8]">Longueuil</p>
                <p className="text-xs text-white/70 mt-1">PME</p>
              </Link>
              <Link to="/entreprises-a-vendre-sherbrooke" className="text-center p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10 hover:border-[#818cf8] group">
                <p className="font-semibold text-white group-hover:text-[#818cf8]">Sherbrooke</p>
                <p className="text-xs text-white/70 mt-1">Business</p>
              </Link>
            </div>
          </div>

          {/* Popular Industries Section */}
          <div className="max-w-6xl mx-auto mt-12">
            <h3 className="text-2xl sm:text-3xl font-bold text-center mb-6 text-white">Secteurs d'activité populaires</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <Link to="/entreprises?industry=Restauration" className="text-center p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10 hover:border-[#818cf8] group">
                <p className="font-semibold text-white group-hover:text-[#818cf8]">Restaurants</p>
                <p className="text-xs text-white/70 mt-1">Restauration</p>
              </Link>
              <Link to="/entreprises?industry=Commerce+de+détail" className="text-center p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10 hover:border-[#818cf8] group">
                <p className="font-semibold text-white group-hover:text-[#818cf8]">Commerces</p>
                <p className="text-xs text-white/70 mt-1">Détail</p>
              </Link>
              <Link to="/entreprises?sale_type=franchise" className="text-center p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10 hover:border-[#818cf8] group">
                <p className="font-semibold text-white group-hover:text-[#818cf8]">Franchises</p>
                <p className="text-xs text-white/70 mt-1">Clé en main</p>
              </Link>
              <Link to="/entreprises?industry=Services+professionnels" className="text-center p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10 hover:border-[#818cf8] group">
                <p className="font-semibold text-white group-hover:text-[#818cf8]">Services</p>
                <p className="text-xs text-white/70 mt-1">Professionnels</p>
              </Link>
              <Link to="/immeubles-commerciaux" className="text-center p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10 hover:border-[#818cf8] group">
                <p className="font-semibold text-white group-hover:text-[#818cf8]">Immeubles</p>
                <p className="text-xs text-white/70 mt-1">Commerciaux</p>
              </Link>
            </div>
          </div>

          {/* Resources Links */}
          <div className="max-w-5xl mx-auto mt-12">
            <h3 className="text-xl font-bold text-center mb-4 text-white">Accès rapide aux ressources</h3>
            <div className="flex flex-wrap justify-center gap-3 text-base">
              <Link to="/marche" className="text-[#818cf8] hover:text-white transition-colors underline font-semibold">Analyse de marché</Link>
              <span className="text-white/40">•</span>
              <Link to="/ressources" className="text-[#818cf8] hover:text-white transition-colors underline font-semibold">Guide complet</Link>
              <span className="text-white/40">•</span>
              <Link to="/blog" className="text-[#818cf8] hover:text-white transition-colors underline font-semibold">Conseils d'experts</Link>
              <span className="text-white/40">•</span>
              <Link to="/contact" className="text-[#818cf8] hover:text-white transition-colors underline font-semibold">Support</Link>
            </div>
            <p className="text-white/70 text-center mt-4 text-sm">
              Besoin d'aide ? <Link to="/sell" className="text-[#818cf8] hover:underline font-semibold">Vendre votre entreprise</Link> • 
              <Link to="/faq" className="text-[#818cf8] hover:underline font-semibold ml-1">FAQ</Link> • 
              <Link to="/about" className="text-[#818cf8] hover:underline font-semibold ml-1">À propos</Link> • 
              <Link to="/terms" className="text-[#818cf8] hover:underline font-semibold ml-1">Conditions</Link>
            </p>
          </div>
        </div>
      </section>

      {/* SEO Content Section */}
      <section className="py-16 sm:py-20 bg-background" aria-labelledby="seo-heading">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="prose prose-lg max-w-none">
            <h2 id="seo-heading" className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-6">
              Votre partenaire pour l'achat et la vente d'entreprises au Québec
            </h2>
            
            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <p>
                <strong className="text-foreground">Vente.club</strong> est la <Link to="/marche" className="text-secondary hover:underline font-semibold">plateforme québécoise de référence</Link> qui facilite la mise en relation entre acheteurs et vendeurs d'entreprises. Que vous cherchiez à acquérir un <Link to="/entreprises?industry=Restauration" className="text-secondary hover:underline">restaurant établi</Link>, un <Link to="/entreprises?industry=Commerce+de+détail" className="text-secondary hover:underline">commerce de détail prospère</Link>, une <Link to="/entreprises?sale_type=franchise" className="text-secondary hover:underline">franchise reconnue</Link> ou un <Link to="/immeubles-commerciaux" className="text-secondary hover:underline">immeuble commercial</Link>, notre plateforme vous offre l'accès à des centaines d'opportunités d'affaires vérifiées partout au Québec.
              </p>
              
              <h3 className="text-2xl font-bold text-foreground mt-8 mb-4">
                Des opportunités dans tous les secteurs d'activité
              </h3>
              <p>
                Notre <Link to="/entreprises" className="text-secondary hover:underline font-semibold">catalogue diversifié</Link> couvre l'ensemble des secteurs d'activité au Québec. De la restauration à l'hôtellerie, du commerce de détail aux services professionnels, en passant par l'industrie manufacturière et les franchises établies, vous trouverez des <strong className="text-foreground">entreprises rentables</strong> adaptées à votre budget et à vos compétences. Nos <Link to="/entreprises" className="text-secondary hover:underline">annonces détaillées</Link> incluent les états financiers, les données d'exploitation et les informations clés pour faciliter votre prise de décision.
              </p>
              
              <h3 className="text-2xl font-bold text-foreground mt-8 mb-4">
                Un accompagnement professionnel à chaque étape
              </h3>
              <p>
                Que vous soyez <Link to="/entreprises" className="text-secondary hover:underline">acheteur</Link> ou <Link to="/sell" className="text-secondary hover:underline">vendeur</Link>, nous mettons à votre disposition des <Link to="/ressources" className="text-secondary hover:underline font-semibold">ressources complètes</Link> pour vous guider tout au long du processus. De l'évaluation initiale à la négociation finale, en passant par la due diligence et les aspects juridiques, notre <Link to="/ressources" className="text-secondary hover:underline">centre de ressources</Link> et notre équipe d'experts sont là pour répondre à vos questions et faciliter vos démarches. Consultez notre <Link to="/blog" className="text-secondary hover:underline font-semibold">blog</Link> régulièrement mis à jour avec des conseils pratiques, des analyses de marché et des guides détaillés.
              </p>
              
              <div className="bg-gradient-to-r from-[#6366f1]/10 to-[#818cf8]/10 p-6 rounded-lg border border-[#6366f1]/20 mt-8">
                <h3 className="text-xl font-bold text-foreground mb-3">
                  Pourquoi choisir Vente.club ?
                </h3>
                <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                  <li><strong className="text-foreground">Connexion directe</strong> avec les propriétaires d'entreprises sans intermédiaires</li>
                  <li><strong className="text-foreground">Recherche optimisée par IA</strong> pour trouver rapidement les meilleures opportunités</li>
                  <li><strong className="text-foreground">Réseau établi</strong> de plus de 28 entrepreneurs et investisseurs actifs</li>
                </ul>
              </div>
              
              <p className="mt-8">
                Rejoignez dès aujourd'hui des milliers d'entrepreneurs québécois qui ont fait confiance à Vente.club pour réaliser leur projet d'acquisition ou de cession d'entreprise. <Link to="/auth" className="text-secondary hover:underline font-semibold">Créez votre compte gratuitement</Link> et explorez notre <Link to="/entreprises" className="text-secondary hover:underline font-semibold">catalogue complet</Link> d'opportunités d'affaires disponibles dans toutes les <Link to="/marche" className="text-secondary hover:underline">régions du Québec</Link>.
              </p>
              
              <div className="mt-8 p-6 bg-secondary/5 rounded-lg border border-secondary/10">
                <h4 className="text-lg font-bold text-foreground mb-3">Explorez nos ressources</h4>
                <div className="flex flex-wrap gap-3">
                  <Link to="/entreprises-a-vendre-montreal" className="text-secondary hover:underline">Entreprises à Montréal</Link>
                  <span>•</span>
                  <Link to="/entreprises-a-vendre-quebec" className="text-secondary hover:underline">Entreprises à Québec</Link>
                  <span>•</span>
                  <Link to="/entreprises-a-vendre-laval" className="text-secondary hover:underline">Entreprises à Laval</Link>
                  <span>•</span>
                  <Link to="/club-select" className="text-secondary hover:underline font-semibold">Abonnement Club Select</Link>
                  <span>•</span>
                  <Link to="/marche" className="text-secondary hover:underline">Analyse de marché</Link>
                  <span>•</span>
                  <Link to="/contact" className="text-secondary hover:underline">Contactez-nous</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50" aria-labelledby="faq-heading">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8">
            <h2 id="faq-heading" className="text-4xl font-display font-bold">Questions fréquentes sur l'achat et vente d'entreprises</h2>
            <p className="text-muted-foreground mt-2">Tout ce que vous devez savoir sur l'acquisition et la cession d'entreprises au Québec</p>
          </div>
          <Accordion type="single" collapsible className="w-full mb-8">
            <AccordionItem value="item-1">
              <AccordionTrigger>Comment acheter une entreprise au Québec?</AccordionTrigger>
              <AccordionContent>
                L'<strong>achat d'une entreprise</strong> commence par l'identification d'opportunités sur notre plateforme. <Link to="/entreprises" className="text-secondary hover:underline font-semibold">Explorez les annonces</Link>, contactez les vendeurs directement, effectuez une due diligence complète, négociez le prix et finalisez la transaction avec des professionnels. Consultez notre <Link to="/blog" className="text-secondary hover:underline font-semibold">guide complet</Link> et nos <Link to="/ressources" className="text-secondary hover:underline">ressources</Link> pour plus de détails.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Comment vendre mon entreprise?</AccordionTrigger>
              <AccordionContent>
                <Link to="/auth" className="text-secondary hover:underline font-semibold">Créez un compte gratuit</Link>, puis <Link to="/sell" className="text-secondary hover:underline font-semibold">soumettez votre annonce</Link> avec tous les détails de votre entreprise. Notre équipe approuvera votre annonce pour s'assurer qu'elle respecte nos standards de publication. Profitez de notre réseau de plus de 10 000 acheteurs potentiels au Québec. Consultez notre <Link to="/blog" className="text-secondary hover:underline">blog</Link> pour des conseils sur la préparation de votre vente.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>À quoi sert le Club Select?</AccordionTrigger>
              <AccordionContent>
                Le Club Select à 19,99$/mois vous offre un accès illimité à tous les vendeurs, des conversations sans limite, et la possibilité de contacter autant d'entreprises que vous le souhaitez chaque jour. Découvrez tous les <Link to="/club-select" className="text-secondary hover:underline font-semibold">avantages du Club Select</Link> pour les acheteurs sérieux.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>Quels types d'entreprises puis-je trouver?</AccordionTrigger>
              <AccordionContent>
                <Link to="/entreprises?industry=Restauration" className="text-secondary hover:underline">Restaurants</Link>, cafés, boutiques, garages, salons de beauté, <Link to="/entreprises?sale_type=franchise" className="text-secondary hover:underline">franchises</Link>, <Link to="/immeubles-commerciaux" className="text-secondary hover:underline">immeubles commerciaux</Link> et bien plus. Découvrez toutes les <Link to="/marche" className="text-secondary hover:underline font-semibold">catégories disponibles</Link> dans les villes comme <Link to="/entreprises-a-vendre-montreal" className="text-secondary hover:underline">Montréal</Link>, <Link to="/entreprises-a-vendre-quebec" className="text-secondary hover:underline">Québec</Link> et <Link to="/entreprises-a-vendre-laval" className="text-secondary hover:underline">Laval</Link>.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <div className="text-center">
            <Button 
              variant="outline"
              size="lg"
              onClick={() => navigate("/faq")}
              className="h-12 px-8 text-base font-semibold"
            >
              Voir toutes les questions
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 sm:py-24 overflow-hidden bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#1e3a8a]" aria-labelledby="cta-heading">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 -right-20 w-96 h-96 bg-[#6366f1]/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-20 -left-20 w-96 h-96 bg-[#818cf8]/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        </div>
        
        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8 text-center animate-slide-up">
            <h2 id="cta-heading" className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-white leading-tight">
              Prêt à trouver <span className="text-white">votre<br />prochaine opportunité ?</span>
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-white/90">
              Commencez dès maintenant votre recherche ou déposez votre annonce gratuitement
            </p>
            <div className="flex justify-center pt-4">
              <Button 
                size="lg" 
                className="bg-white hover:bg-white/90 text-[#1e1b4b] h-14 sm:h-16 px-10 sm:px-12 text-base sm:text-lg font-bold shadow-2xl hover:shadow-xl transition-all hover:scale-105 group"
                onClick={() => navigate("/entreprises")}
              >
                Commencer gratuitement
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
