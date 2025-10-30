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
    cities?: string[];
    industries?: string[];
    listingTypes?: string[];
    minPrice?: number;
    maxPrice?: number;
  }) => {
    let filtered = [...allBusinesses];
    
    // Filter by listing type (this is a placeholder - actual implementation would need a listing_type field in the businesses table)
    // For now we'll filter by is_franchise to demonstrate the concept
    if (filters.listingTypes && filters.listingTypes.length > 0) {
      filtered = filtered.filter(business => {
        if (filters.listingTypes!.includes('franchise')) {
          if (business.is_franchise) return true;
        }
        if (filters.listingTypes!.includes('business')) {
          if (!business.is_franchise) return true;
        }
        // Property type would need to be added to the database schema
        return false;
      });
    }
    
    if (filters.cities && filters.cities.length > 0) {
      filtered = filtered.filter(business => 
        filters.cities!.some(city => 
          business.city?.toLowerCase().includes(city.toLowerCase())
        )
      );
    }
    if (filters.industries && filters.industries.length > 0) {
      filtered = filtered.filter(business => 
        filters.industries!.includes(business.industry)
      );
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
      
      {/* Hero Section - Modern Gradient Design */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-white via-muted to-white" aria-label="Section principale">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Large gradient orbs */}
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-accent/30 via-primary/20 to-transparent rounded-full blur-3xl animate-float" />
          <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-gradient-to-tr from-secondary/30 via-primary/20 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-accent/10 via-transparent to-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
          
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(0 0 0) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        <div className="relative container mx-auto px-4 py-20">
          <div className="max-w-5xl mx-auto text-center space-y-8 animate-slide-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-accent/10 via-primary/10 to-secondary/10 border border-accent/20 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/20 hover:border-primary/40 hover:from-accent/20 hover:via-primary/20 hover:to-secondary/20 cursor-pointer group">
              <Sparkles className="w-5 h-5 text-accent animate-glow group-hover:rotate-12 transition-transform duration-300" />
              <span className="text-foreground text-sm font-semibold tracking-wide group-hover:text-primary transition-colors duration-300">
                La plateforme d'acquisition et de vente d'entreprise au Québec
              </span>
            </div>
            
            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold leading-[1.1] tracking-tight text-foreground">
              Entreprises et Franchises
              <br />
              <span className="text-primary">à Vendre au Québec</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Découvrez des opportunités d'affaires et connectez-vous directement avec les propriétaires
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90 text-white h-16 px-12 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all hover:scale-105 btn-premium group"
                onClick={() => document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Explorer les opportunités
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="h-16 px-12 text-lg font-semibold border-2 border-foreground/20 hover:bg-foreground hover:text-white transition-all"
                onClick={() => navigate("/list-business")}
              >
                Vendre mon entreprise
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Businesses - Premium Cards */}
      <section id="featured" className="py-12 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 animate-slide-up">
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
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
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

      {/* CTA Section - Modern Gradient Design like Hero */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-br from-white via-muted to-white">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Large gradient orbs */}
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-accent/30 via-primary/20 to-transparent rounded-full blur-3xl animate-float" />
          <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-gradient-to-tr from-secondary/30 via-primary/20 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-accent/10 via-transparent to-secondary/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
          
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(0 0 0) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        <div className="relative container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8 animate-slide-up">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight">
              Prêt à Trouver Votre
              <br />
              <span className="text-primary">Prochaine Opportunité ?</span>
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground">
              Rejoignez des milliers d'entrepreneurs qui font confiance à Vente.club
            </p>
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-14 px-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
              onClick={() => navigate("/list-business")}
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

export default Index;
