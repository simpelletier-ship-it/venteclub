import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import BusinessCard from "@/components/BusinessCard";
import { ArrowRight, TrendingUp, Shield, Clock, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import heroImage from "@/assets/hero-business-pro.jpg";

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
        description: "Votre abonnement Premium est activé. Rechargez la page pour voir les changements.",
      });
      setSearchParams({});
    } else if (searchParams.get('premium_cancel') === 'true') {
      toast({
        variant: "destructive",
        title: "Abonnement annulé",
        description: "L'abonnement Premium a été annulé.",
      });
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, toast]);

  const fetchFeaturedBusinesses = async () => {
    try {
      // Fetch only the columns we need for display
      const { data: businesses } = await supabase
        .from('businesses')
        .select('id, slug, title, industry, city, region, annual_revenue, asking_price, baiia, description, featured, status, approval_status, is_franchise, sale_type, property_type, year_built, square_footage, is_rental_property, rental_units, created_at')
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
    "name": "Vente.club",
    "url": "https://vente.club",
    "description": "Plateforme d'achat et vente d'entreprises au Québec"
  };

  return (
    <>
      <SEO 
        title="Achat et Vente d'Entreprises au Québec | Vente.club" 
        description="Découvrez des milliers d'opportunités d'affaires au Québec. Achetez ou vendez votre entreprise en toute sécurité avec Vente.club." 
        keywords="achat entreprise Québec, vente entreprise, PME à vendre, commerce à vendre, franchise Québec, opportunités affaires"
        canonical="/" 
        structuredData={structuredData} 
      />
      
      {/* Hero Section */}
      <section className="relative min-h-[75vh] sm:min-h-[85vh] flex items-center overflow-hidden" aria-label="Section principale">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Espace de travail professionnel moderne" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
        </div>
        
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-gradient-to-br from-secondary/20 via-primary/15 to-transparent rounded-full blur-3xl animate-float" />
          <div className="absolute -bottom-40 -left-40 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-gradient-to-tr from-accent/20 via-primary/15 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>
        
        <div className="relative container mx-auto px-4 py-12 sm:py-20">
          <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-10 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-gradient-to-r from-secondary/10 via-primary/10 to-accent/10 border border-secondary/20 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-secondary/20 hover:border-secondary/40 cursor-pointer group">
              <Sparkles className="w-4 sm:w-5 h-4 sm:h-5 text-secondary animate-glow group-hover:rotate-12 transition-transform duration-300" />
              <span className="text-foreground text-xs sm:text-sm font-semibold tracking-wide group-hover:text-secondary transition-colors duration-300">
                Plateforme de confiance pour vos transactions
              </span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-display font-bold leading-[1.1] tracking-tight text-foreground px-2">
              Trouvez l'entreprise
              <br />
              <span className="text-secondary">de vos rêves au Québec</span>
            </h1>
            
            <p className="text-base sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
              Des milliers d'opportunités d'affaires au Québec
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-4 sm:pt-6 px-4">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-secondary to-primary hover:from-secondary/90 hover:to-primary/90 text-white h-12 sm:h-16 px-8 sm:px-12 text-base sm:text-lg font-semibold shadow-xl hover:shadow-2xl transition-all hover:scale-105 btn-premium group w-full sm:w-auto"
                onClick={() => document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Explorer les opportunités
                <ArrowRight className="ml-2 w-4 sm:w-5 h-4 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="h-12 sm:h-16 px-8 sm:px-12 text-base sm:text-lg font-semibold border-2 border-foreground/20 hover:bg-foreground hover:text-white transition-all w-full sm:w-auto"
                onClick={() => navigate("/sell")}
              >
                Vendre mon entreprise
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Businesses Section */}
      <section id="featured" className="py-12 sm:py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-secondary/10 text-secondary text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
              <TrendingUp className="w-3 sm:w-4 h-3 sm:h-4" />
              Opportunités du moment
            </div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-display font-bold text-foreground mb-3 sm:mb-4 px-4">
              Opportunités en vedette
            </h2>
            <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              Découvrez nos meilleures opportunités d'affaires sélectionnées pour vous
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 mb-8 sm:mb-12">
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
              className="bg-gradient-to-r from-secondary to-primary hover:from-secondary/90 hover:to-primary/90 text-white h-14 px-10 text-base font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
            >
              Voir toutes les entreprises à vendre
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
            <div className="text-center p-6 sm:p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-shadow">
              <TrendingUp className="w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-3 sm:mb-4 text-secondary" />
              <h3 className="text-lg sm:text-xl font-bold mb-2">Statistiques en temps réel</h3>
              <p className="text-sm sm:text-base text-muted-foreground">Suivez la performance de vos annonces avec des statistiques détaillées</p>
            </div>
            <div className="text-center p-6 sm:p-8 rounded-2xl bg-card border border-border hover:shadow-lg transition-shadow">
              <Clock className="w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-3 sm:mb-4 text-secondary" />
              <h3 className="text-lg sm:text-xl font-bold mb-2">Plateforme intelligente</h3>
              <p className="text-sm sm:text-base text-muted-foreground">Gérez vos annonces facilement et voyez leur impact en direct</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-4xl font-display font-bold text-center mb-8">Questions fréquentes</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Comment acheter une entreprise au Québec?</AccordionTrigger>
              <AccordionContent>
                L'achat d'une entreprise commence par l'identification d'opportunités sur Vente.club. Contactez les vendeurs, effectuez une due diligence, négociez le prix et finalisez avec des professionnels.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Comment vendre mon entreprise?</AccordionTrigger>
              <AccordionContent>
                Créez un compte gratuit, soumettez votre annonce avec les détails de votre entreprise. Notre équipe l'approuvera après avoir vérifié que l'annonce est conforme à nos règlements.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-br from-white via-muted to-white">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-secondary/30 via-primary/20 to-transparent rounded-full blur-3xl animate-float" />
          <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-gradient-to-tr from-accent/30 via-primary/20 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>
        
        <div className="relative container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8 animate-slide-up">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight">
              Prêt à trouver <span className="text-secondary">votre prochaine opportunité ?</span>
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground">
              Rejoignez des milliers d'entrepreneurs qui font confiance à Vente.club
            </p>
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
      </section>
    </>
  );
};

export default Home;
