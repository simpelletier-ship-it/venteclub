import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import BusinessCard from "@/components/BusinessCard";
import { ArrowRight, TrendingUp, Shield, Clock, Sparkles, Building2, Users, Eye, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { TypewriterAnimation } from "@/components/AnimatedSearchBar";
import { useScrollParallax } from "@/hooks/useScrollParallax";
import { FloatingOpportunities } from "@/components/FloatingOpportunities";
import { CircuitBackground } from "@/components/CircuitBackground";
import { useCountUp } from "@/hooks/useCountUp";

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
  const scrollY = useScrollParallax();
  
  // Compteurs animés pour les statistiques
  const businessesCount = useCountUp({ end: stats.totalBusinesses, duration: 2000, delay: 200 });
  const viewsCount = useCountUp({ end: Math.floor(stats.totalViews / 1000), duration: 2000, delay: 400 });
  const usersCount = useCountUp({ end: stats.totalUsers, duration: 2000, delay: 600 });
  const valueCount = useCountUp({ end: Math.floor(stats.totalValue / 1000000), duration: 2000, delay: 800 });
  
  useEffect(() => {
    fetchFeaturedBusinesses();
    fetchStats();
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
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "287"
      }
    }
  };

  return (
    <>
      <SEO 
        title="Achat et Vente d'Entreprises au Québec - Plateforme #1 pour Trouver Votre Opportunité" 
        description="Découvrez des centaines d'entreprises à vendre au Québec : restaurants, commerces, franchises. Connexion directe avec les propriétaires. Recherche optimisée par IA. Transactions sécurisées. Rejoignez plus de 10 000 entrepreneurs québécois."
        keywords="achat entreprise Québec, vente entreprise, PME à vendre, commerce à vendre, opportunité affaires, reprise commerce Montréal, cession entreprise, prix entreprise 2025"
        canonical="/" 
        structuredData={structuredData} 
      />
      
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#1e3a8a] overflow-hidden" aria-label="Section principale">
        {/* Circuit Background */}
        <CircuitBackground />
        
        {/* Animated Background Elements with Parallax */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute top-20 -right-20 w-96 h-96 bg-[#6366f1]/20 rounded-full blur-3xl animate-pulse transition-transform duration-100" 
            style={{ 
              animationDuration: '8s',
              transform: `translate(${scrollY * 0.15}px, ${scrollY * 0.1}px)`
            }} 
          />
          <div 
            className="absolute bottom-20 -left-20 w-96 h-96 bg-[#818cf8]/20 rounded-full blur-3xl animate-pulse transition-transform duration-100" 
            style={{ 
              animationDuration: '10s', 
              animationDelay: '2s',
              transform: `translate(${-scrollY * 0.1}px, ${scrollY * 0.15}px)`
            }} 
          />
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#4f46e5]/10 rounded-full blur-3xl animate-pulse transition-transform duration-100" 
            style={{ 
              animationDuration: '12s', 
              animationDelay: '4s',
              transform: `translate(-50%, -50%) scale(${1 + scrollY * 0.0005})`
            }} 
          />
        </div>
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div 
              className="space-y-8 animate-slide-up transition-transform duration-100" 
              style={{ 
                transform: `translateY(${scrollY * 0.05}px)` 
              }}
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-[1.1] tracking-tight text-white">
                <span className="text-[#818cf8] font-extrabold">Le Club</span> de Référence
                <br />
                pour acheter <TypewriterAnimation />
                <br />
                partout au Québec
              </h1>
              
              <p className="text-lg sm:text-xl text-white/80 max-w-3xl leading-relaxed text-justify">
                Plateforme intelligente qui rapproche acquéreurs et propriétaires d'entreprises. Nous favorisons la transparence et la fiabilité pour que vos transactions se déroulent en toute confiance.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  size="lg" 
                  className="bg-[#6366f1] hover:bg-[#4f46e5] text-white h-14 px-10 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all group"
                  onClick={() => document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Explorer les opportunités
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg" 
                  className="h-14 px-10 text-base font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-lg hover:shadow-xl transition-all backdrop-blur-sm"
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
      <section className="py-12 sm:py-16 bg-[#1e1b4b]" aria-label="Statistiques de la plateforme">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#818cf8]/20 mb-3">
                <Building2 className="w-6 h-6 text-[#818cf8]" />
              </div>
              <div ref={businessesCount.ref} className="text-3xl sm:text-4xl font-bold text-white mb-2 tabular-nums">
                {businessesCount.count}+
              </div>
              <div className="text-sm sm:text-base text-white/70">entreprises actives</div>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#818cf8]/20 mb-3">
                <Eye className="w-6 h-6 text-[#818cf8]" />
              </div>
              <div ref={viewsCount.ref} className="text-3xl sm:text-4xl font-bold text-white mb-2 tabular-nums">
                {viewsCount.count}k+
              </div>
              <div className="text-sm sm:text-base text-white/70">vues totales</div>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#818cf8]/20 mb-3">
                <Users className="w-6 h-6 text-[#818cf8]" />
              </div>
              <div ref={usersCount.ref} className="text-3xl sm:text-4xl font-bold text-white mb-2 tabular-nums">
                {usersCount.count}+
              </div>
              <div className="text-sm sm:text-base text-white/70">entrepreneurs inscrits</div>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#818cf8]/20 mb-3">
                <DollarSign className="w-6 h-6 text-[#818cf8]" />
              </div>
              <div ref={valueCount.ref} className="text-3xl sm:text-4xl font-bold text-white mb-2 tabular-nums">
                {valueCount.count}M+$
              </div>
              <div className="text-sm sm:text-base text-white/70">valeur totale des annonces</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Businesses Section */}
      <section id="featured" className="py-16 sm:py-20 bg-background relative">
        {/* Decorative Top Border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 animate-slide-up">
            <h2 id="featured-heading" className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              Opportunités d'affaires en vedette
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
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
      <section className="py-16 sm:py-20 bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#1e3a8a] border-y border-primary/20" aria-labelledby="features-heading">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 max-w-4xl mx-auto">
            <h2 id="features-heading" className="text-3xl sm:text-4xl md:text-5xl font-display font-bold mb-6 text-white">
              Des solutions adaptées à chaque entrepreneur
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-white/90 leading-relaxed text-justify px-4">
              Quel que soit votre secteur d'activité, découvrez un large éventail d'opportunités adaptées à vos compétences et à votre budget. Notre <a href="/ressources" className="text-white hover:text-secondary underline font-semibold transition-colors">plateforme intelligente</a> vous permet d'acquérir une entreprise selon différentes modalités : immobilisation complète incluant bâtiment et équipements, acquisition d'actions pour devenir actionnaire, ou <a href="/blog" className="text-white hover:text-secondary underline font-semibold transition-colors">rachat de fonds de commerce</a> pour reprendre l'activité existante.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto mb-12">
            <div className="text-center p-6 sm:p-8 rounded-xl bg-white/10 border border-white/20 hover:bg-white/15 hover:shadow-2xl hover:scale-105 transition-all duration-300 backdrop-blur-sm">
              <TrendingUp className="w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-3 sm:mb-4 text-white" />
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-white">Recherche optimisée par IA</h3>
              <p className="text-sm sm:text-base text-white/80 leading-relaxed">Trouvez rapidement les opportunités qui correspondent à votre profil grâce à notre intelligence artificielle</p>
            </div>
            <div className="text-center p-6 sm:p-8 rounded-xl bg-white/10 border border-white/20 hover:bg-white/15 hover:shadow-2xl hover:scale-105 transition-all duration-300 backdrop-blur-sm">
              <Shield className="w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-3 sm:mb-4 text-white" />
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-white">Paiements sécurisés</h3>
              <p className="text-sm sm:text-base text-white/80 leading-relaxed">Abonnements et achats protégés par une infrastructure de paiement certifiée et conforme aux normes bancaires</p>
            </div>
            <div className="text-center p-6 sm:p-8 rounded-xl bg-white/10 border border-white/20 hover:bg-white/15 hover:shadow-2xl hover:scale-105 transition-all duration-300 backdrop-blur-sm">
              <Clock className="w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-3 sm:mb-4 text-white" />
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-white">Interface simplifiée</h3>
              <p className="text-sm sm:text-base text-white/80 leading-relaxed">Navigation intuitive et gestion facile de vos annonces grâce à notre technologie avancée</p>
            </div>
          </div>
          
          {/* Popular Categories - Internal Links */}
          <div className="max-w-5xl mx-auto mt-12">
            <h3 className="text-2xl font-bold text-center mb-6 text-white">Catégories populaires au Québec</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <a href="/entreprises-a-vendre-montreal" className="text-center p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10 hover:border-[#818cf8]">
                <p className="font-semibold text-white">Montréal</p>
                <p className="text-xs text-white/70 mt-1">Entreprises à vendre</p>
              </a>
              <a href="/entreprises-a-vendre-quebec" className="text-center p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10 hover:border-[#818cf8]">
                <p className="font-semibold text-white">Québec</p>
                <p className="text-xs text-white/70 mt-1">Opportunités</p>
              </a>
              <a href="/entreprises-a-vendre-laval" className="text-center p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10 hover:border-[#818cf8]">
                <p className="font-semibold text-white">Laval</p>
                <p className="text-xs text-white/70 mt-1">Commerces</p>
              </a>
              <a href="/immeubles-commerciaux" className="text-center p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10 hover:border-[#818cf8]">
                <p className="font-semibold text-white">Immeubles</p>
                <p className="text-xs text-white/70 mt-1">Commerciaux</p>
              </a>
            </div>
          </div>

          {/* Resources Links */}
          <div className="max-w-5xl mx-auto mt-12 text-center">
            <p className="text-white/80">
              Besoin d'aide pour <a href="/sell" className="text-[#818cf8] hover:underline font-semibold">vendre votre entreprise</a> ? 
              Consultez nos <a href="/ressources" className="text-[#818cf8] hover:underline font-semibold">ressources</a> et notre 
              <a href="/faq" className="text-[#818cf8] hover:underline font-semibold ml-1">FAQ</a> ou 
              <a href="/contact" className="text-[#818cf8] hover:underline font-semibold ml-1">contactez-nous</a> pour un accompagnement personnalisé.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50" aria-labelledby="faq-heading">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8">
            <h2 id="faq-heading" className="text-4xl font-display font-bold">Questions fréquentes</h2>
            <p className="text-muted-foreground mt-2">Tout ce que vous devez savoir sur l'achat et la vente d'entreprises</p>
          </div>
          <Accordion type="single" collapsible className="w-full mb-8">
            <AccordionItem value="item-1">
              <AccordionTrigger>Comment acheter une entreprise au Québec?</AccordionTrigger>
              <AccordionContent>
                L'achat d'une entreprise commence par l'identification d'opportunités sur notre plateforme. <a href="/entreprises" className="text-secondary hover:underline font-semibold">Explorez les annonces</a>, contactez les vendeurs directement, effectuez une due diligence complète, négociez le prix et finalisez la transaction avec des professionnels. Consultez notre <a href="/blog" className="text-secondary hover:underline font-semibold">guide complet</a> pour plus de détails.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Comment vendre mon entreprise?</AccordionTrigger>
              <AccordionContent>
                <a href="/auth" className="text-secondary hover:underline font-semibold">Créez un compte gratuit</a>, puis <a href="/sell" className="text-secondary hover:underline font-semibold">soumettez votre annonce</a> avec tous les détails de votre entreprise. Notre équipe approuvera votre annonce pour s'assurer qu'elle respecte nos standards de publication. Profitez de notre réseau de plus de 10 000 acheteurs potentiels au Québec.
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
                Restaurants, cafés, boutiques, garages, salons de beauté, franchises, immeubles commerciaux et bien plus. Découvrez toutes les <a href="/marche" className="text-secondary hover:underline font-semibold">catégories disponibles</a> et trouvez l'opportunité qui correspond à vos compétences.
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
