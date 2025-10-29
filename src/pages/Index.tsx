import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import BusinessCard from "@/components/BusinessCard";
import BusinessListItem from "@/components/BusinessListItem";
import FilterBar from "@/components/FilterBar";
import { ArrowRight, Grid3x3, List, TrendingUp, Shield, Clock, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import heroImage from "@/assets/hero-business-pro.jpg";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [featuredBusinesses, setFeaturedBusinesses] = useState<any[]>([]);
  const [allBusinesses, setAllBusinesses] = useState<any[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  useEffect(() => {
    fetchBusinesses();
  }, []);

  useEffect(() => {
    if (searchParams.get('premium_success') === 'true') {
      console.log('[PREMIUM-SUCCESS] Payment successful');
      toast({
        title: "Paiement réussi!",
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

  const fetchBusinesses = async () => {
    try {
      const { data: businesses } = await supabase
        .from('businesses')
        .select('*')
        .in('status', ['active', 'sold'])
        .eq('approval_status', 'approved')
        .order('created_at', { ascending: false });

      if (businesses) {
        const featured = businesses.filter(b => b.featured && b.status === 'active').slice(0, 3);
        const regular = businesses.filter(b => !b.featured || b.status === 'sold');
        setFeaturedBusinesses(featured);
        setAllBusinesses(regular);
        setFilteredBusinesses(regular);
      }
    } catch (error) {
      console.error('[FETCH-BUSINESSES] Error:', error);
    }
  };

  const handleFilter = (filters: {
    city?: string;
    industry?: string;
    minPrice?: number;
    maxPrice?: number;
  }) => {
    let filtered = [...allBusinesses];
    if (filters.city) {
      filtered = filtered.filter(business => business.city?.toLowerCase().includes(filters.city!.toLowerCase()));
    }
    if (filters.industry) {
      filtered = filtered.filter(business => business.industry === filters.industry);
    }
    if (filters.minPrice !== undefined) {
      filtered = filtered.filter(business => business.asking_price >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter(business => business.asking_price <= filters.maxPrice!);
    }
    setFilteredBusinesses(filtered);
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Vente.club",
    "url": "https://vente.club",
    "description": "Plateforme québécoise pour acheter et vendre des entreprises",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://vente.club/?search={search_term_string}",
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Vente.club",
      "url": "https://vente.club"
    }
  };

  return (
    <>
      <SEO 
        title="Vente.club - Achat et Vente d'Entreprises au Québec | Opportunités Vérifiées" 
        description="Découvrez plus de 100 entreprises à vendre au Québec : restaurants, commerces, franchises. Plateforme sécurisée avec vérification des annonces. Contactez directement les vendeurs." 
        keywords="vente entreprise Québec, achat commerce Montréal, vendre restaurant, acheter franchise, opportunité affaires, cession entreprise, reprise commerce" 
        canonical="/" 
        structuredData={structuredData} 
      />
      
      {/* Hero Section - Premium Design */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-primary via-primary-light to-secondary" aria-label="Section principale">
        <div className="absolute inset-0">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }} role="img" aria-label="Image d'arrière-plan montrant des entrepreneurs en action" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/90 via-primary-light/80 to-secondary/90" />
          
          {/* Animated gradient orbs */}
          <div className="absolute top-20 right-20 w-96 h-96 bg-secondary/30 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="relative container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center space-y-8 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass-effect border-white/20">
              <Sparkles className="w-5 h-5 text-accent animate-glow" />
              <span className="text-white text-sm font-semibold tracking-wide">
                La plateforme d'acquisition et de vente d'entreprise au Québec
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold leading-tight text-white">
              Achetez & Vendez
              <br />
              <span className="text-gradient" style={{ backgroundImage: 'linear-gradient(135deg, #FCD34D 0%, #FBBF24 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                des Entreprises
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 max-w-2xl mx-auto font-light">
              Découvrez des opportunités d'affaires vérifiées et connectez-vous directement avec les propriétaires
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                className="bg-accent hover:bg-accent/90 text-accent-foreground h-14 px-10 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all hover:scale-105 btn-premium group"
                onClick={() => document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Explorer les opportunités
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="h-14 px-10 text-lg font-semibold border-2 border-white/30 text-white hover:bg-white/10 glass-effect backdrop-blur-md"
                onClick={() => navigate("/list-business")}
              >
                Vendre mon entreprise
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="grid grid-cols-3 gap-8 pt-12 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 backdrop-blur-md mb-3">
                  <Shield className="w-6 h-6 text-accent" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">100+</div>
                <div className="text-sm text-white/70">Annonces vérifiées</div>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 backdrop-blur-md mb-3">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">34K+</div>
                <div className="text-sm text-white/70">Opportunités au QC</div>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/10 backdrop-blur-md mb-3">
                  <Clock className="w-6 h-6 text-accent" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">24h</div>
                <div className="text-sm text-white/70">Réponse moyenne</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Businesses - Premium Cards */}
      <section id="featured" className="py-24 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              Opportunités en vedette
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              Découvrez nos meilleures opportunités
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Plus de 34 000 propriétaires au Québec envisagent de vendre ou de transférer leur entreprise dans les prochaines années
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredBusinesses.length > 0 ? (
              featuredBusinesses.map((business, index) => (
                <div key={business.id} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                  <BusinessCard {...business} />
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-16">
                <p className="text-lg text-muted-foreground">Aucune annonce en vedette pour le moment</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* All Listings */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              Toutes les Annonces
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Explorez toutes les entreprises à vendre
            </p>
          </div>

          <div className="mb-10">
            <FilterBar onFilter={handleFilter} />
          </div>

          <div className="flex justify-end mb-8">
            <div className="inline-flex rounded-xl border border-border bg-card p-1.5 shadow-soft">
              <Button 
                variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('grid')} 
                className="gap-2 rounded-lg"
              >
                <Grid3x3 className="h-4 w-4" />
                Grille
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('list')} 
                className="gap-2 rounded-lg"
              >
                <List className="h-4 w-4" />
                Liste
              </Button>
            </div>
          </div>

          <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" : "space-y-4"}>
            {filteredBusinesses.length > 0 ? (
              filteredBusinesses.map((business) => 
                viewMode === 'grid' ? (
                  <BusinessCard key={business.id} {...business} />
                ) : (
                  <BusinessListItem key={business.id} {...business} />
                )
              )
            ) : allBusinesses.length > 0 ? (
              <div className={viewMode === 'grid' ? "col-span-full text-center py-16" : "text-center py-16"}>
                <p className="text-lg text-muted-foreground">Aucune annonce ne correspond à vos critères de recherche</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? "col-span-full text-center py-16" : "text-center py-16"}>
                <p className="text-lg text-muted-foreground">Aucune annonce disponible pour le moment</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section - Premium Gradient */}
      <section className="py-32 bg-gradient-to-br from-primary via-primary-light to-secondary relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-secondary/30 rounded-full blur-3xl" />
        </div>
        <div className="relative container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white leading-tight">
              Prêt à Trouver Votre
              <br />
              Prochaine Opportunité ?
            </h2>
            <p className="text-xl md:text-2xl text-white/90 font-light">
              Rejoignez des milliers d'entrepreneurs qui font confiance à Vente.club
            </p>
            <Button 
              size="lg" 
              className="bg-white hover:bg-white/90 text-primary h-14 px-12 text-lg font-semibold shadow-2xl hover:shadow-xl transition-all hover:scale-105 btn-premium group"
              onClick={() => navigate("/list-business")}
            >
              Commencer gratuitement
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center">
              <span className="text-3xl font-display font-bold">
                Vente<span className="text-accent">.Club</span>
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Un réseau d'entrepreneurs en action
            </div>
          </div>
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 Vente.club. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Index;
