import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import BusinessCard from "@/components/BusinessCard";
import { ArrowRight, TrendingUp, Shield, Clock, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { TypewriterAnimation } from "@/components/AnimatedSearchBar";

const Home = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [featuredBusinesses, setFeaturedBusinesses] = useState<any[]>([]);
  
  useEffect(() => {
    fetchFeaturedBusinesses();
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
      <section className="relative min-h-[85vh] flex items-center bg-gradient-to-br from-primary/10 via-background to-accent/10" aria-label="Section principale">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="space-y-8 animate-slide-up">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/10 border border-primary/20">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-foreground/90 text-sm font-medium">
                  Plateforme de confiance pour vos transactions
                </span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-[1.1] tracking-tight text-foreground">
                Le Club de Référence
                <br />
                pour acheter <TypewriterAnimation />
                <br />
                partout au Québec
              </h1>
              
              <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl leading-relaxed text-justify">
                Plateforme intelligente qui connecte acquéreurs et propriétaires d'entreprises. Chaque opportunité publiée est rigoureusement analysée pour garantir votre sécurité. <span className="font-semibold text-foreground">Investissez en toute confiance, reprenez en toute sérénité.</span>
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 text-white h-14 px-10 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all group"
                  onClick={() => document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Explorer les opportunités
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="h-14 px-10 text-base font-semibold rounded-xl border-2 hover:bg-muted/50"
                  onClick={() => navigate("/sell")}
                >
                  Vendre mon entreprise
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Businesses Section */}
      <section id="featured" className="py-8 sm:py-12 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6 sm:mb-8 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-secondary/10 text-secondary text-xs sm:text-sm font-semibold mb-3 sm:mb-4">
              <TrendingUp className="w-3 sm:w-4 h-3 sm:h-4" />
              Opportunités du moment
            </div>
            <h2 id="featured-heading" className="text-2xl sm:text-4xl md:text-5xl font-display font-bold text-foreground mb-2 sm:mb-3 px-4">
              Opportunités en vedette
            </h2>
            <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Découvrez nos meilleures opportunités d'affaires sélectionnées pour vous
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
      <section className="py-12 sm:py-16 bg-background" aria-labelledby="features-heading">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 max-w-3xl mx-auto">
            <h2 id="features-heading" className="text-3xl sm:text-4xl font-display font-bold mb-4">Pour tous les entrepreneurs</h2>
            <p className="text-base sm:text-lg text-muted-foreground">
              Quel que soit votre secteur d'activité, découvrez un large éventail d'opportunités adaptées à vos compétences et à votre budget. Notre <a href="/ressources" className="text-secondary hover:underline font-semibold">plateforme intelligente</a> vous permet d'acquérir une entreprise selon différentes modalités : immobilisation complète incluant bâtiment et équipements, acquisition d'actions pour devenir actionnaire, ou <a href="/blog" className="text-secondary hover:underline font-semibold">rachat de fonds de commerce</a> pour reprendre l'activité existante.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto mb-12">
            <div className="text-center p-5 sm:p-6 rounded-xl bg-card border border-border hover:shadow-lg transition-shadow">
              <TrendingUp className="w-8 sm:w-10 h-8 sm:h-10 mx-auto mb-2 sm:mb-3 text-secondary" />
              <h3 className="text-base sm:text-lg font-bold mb-1.5 sm:mb-2">Recherche optimisée par IA</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Trouvez rapidement les opportunités qui correspondent à votre profil grâce à notre intelligence artificielle</p>
            </div>
            <div className="text-center p-5 sm:p-6 rounded-xl bg-card border border-border hover:shadow-lg transition-shadow">
              <Shield className="w-8 sm:w-10 h-8 sm:h-10 mx-auto mb-2 sm:mb-3 text-secondary" />
              <h3 className="text-base sm:text-lg font-bold mb-1.5 sm:mb-2">Transactions sécurisées</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Plateforme fiable et sécurisée pour toutes vos négociations d'achat ou de vente</p>
            </div>
            <div className="text-center p-5 sm:p-6 rounded-xl bg-card border border-border hover:shadow-lg transition-shadow">
              <Clock className="w-8 sm:w-10 h-8 sm:h-10 mx-auto mb-2 sm:mb-3 text-secondary" />
              <h3 className="text-base sm:text-lg font-bold mb-1.5 sm:mb-2">Interface simplifiée</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Navigation intuitive et gestion facile de vos annonces grâce à notre technologie avancée</p>
            </div>
          </div>
          
          {/* Popular Categories - Internal Links */}
          <div className="max-w-5xl mx-auto mt-12">
            <h3 className="text-2xl font-bold text-center mb-6">Catégories populaires au Québec</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <a href="/entreprises-a-vendre-montreal" className="text-center p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-secondary">
                <p className="font-semibold text-foreground">Montréal</p>
                <p className="text-xs text-muted-foreground mt-1">Entreprises à vendre</p>
              </a>
              <a href="/entreprises-a-vendre-quebec" className="text-center p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-secondary">
                <p className="font-semibold text-foreground">Québec</p>
                <p className="text-xs text-muted-foreground mt-1">Opportunités</p>
              </a>
              <a href="/entreprises-a-vendre-laval" className="text-center p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-secondary">
                <p className="font-semibold text-foreground">Laval</p>
                <p className="text-xs text-muted-foreground mt-1">Commerces</p>
              </a>
              <a href="/immeubles-commerciaux" className="text-center p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-secondary">
                <p className="font-semibold text-foreground">Immeubles</p>
                <p className="text-xs text-muted-foreground mt-1">Commerciaux</p>
              </a>
            </div>
          </div>

          {/* Resources Links */}
          <div className="max-w-5xl mx-auto mt-12 text-center">
            <p className="text-muted-foreground">
              Besoin d'aide pour <a href="/sell" className="text-secondary hover:underline font-semibold">vendre votre entreprise</a> ? 
              Consultez nos <a href="/ressources" className="text-secondary hover:underline font-semibold">ressources</a> et notre 
              <a href="/faq" className="text-secondary hover:underline font-semibold ml-1">FAQ</a> ou 
              <a href="/contact" className="text-secondary hover:underline font-semibold ml-1">contactez-nous</a> pour un accompagnement personnalisé.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 bg-muted/30" aria-labelledby="faq-heading">
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
                <a href="/auth" className="text-secondary hover:underline font-semibold">Créez un compte gratuit</a>, puis <a href="/sell" className="text-secondary hover:underline font-semibold">soumettez votre annonce</a> avec tous les détails de votre entreprise. Notre équipe l'approuvera après vérification. Profitez de notre réseau de plus de 10 000 acheteurs potentiels au Québec.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>À quoi sert le Club Select?</AccordionTrigger>
              <AccordionContent>
                Le Club Select à 19,99$/mois vous offre un accès illimité à tous les vendeurs, des conversations sans limite, et la possibilité de contacter autant d'entreprises que vous le souhaitez chaque jour. Découvrez tous les <a href="/a-propos" className="text-secondary hover:underline font-semibold">avantages du Club Select</a> pour les acheteurs sérieux.
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
      <section className="relative py-20 overflow-hidden bg-gradient-to-br from-white via-muted to-white" aria-labelledby="cta-heading">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-secondary/30 via-primary/20 to-transparent rounded-full blur-3xl animate-float" />
          <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-gradient-to-tr from-accent/30 via-primary/20 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>
        
        <div className="relative container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-8 text-center animate-slide-up">
            <h2 id="cta-heading" className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight">
              Prêt à trouver <span className="text-secondary">votre prochaine opportunité ?</span>
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground">
              Commencez dès maintenant votre recherche ou déposez votre annonce gratuitement
            </p>
            <div className="flex justify-center">
              <Button 
                size="lg" 
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground h-14 px-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
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
