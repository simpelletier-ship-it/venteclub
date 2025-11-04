import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import BusinessCard from "@/components/BusinessCard";
import BusinessListItem from "@/components/BusinessListItem";
import FilterBar from "@/components/FilterBar";
import { ArrowRight, Grid3x3, List, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";

const PropertyListings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [featuredProperties, setFeaturedProperties] = useState<any[]>([]);
  const [allProperties, setAllProperties] = useState<any[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      // Fetch properties by checking if is_franchise is false and sale_type is not 'shares' or 'assets'
      // This is a workaround until we add 'property' to the sale_type enum
      const { data: allData } = await supabase
        .from('businesses')
        .select('*')
        .in('status', ['active', 'sold'])
        .eq('approval_status', 'approved')
        .order('created_at', { ascending: false });

      // Filter for properties (property_type not null OR property-related industries)
      const propertyIndustries = ['immeuble_revenus', 'residentiel'];
      const properties = allData?.filter(b => 
        b.property_type || propertyIndustries.includes(b.industry)
      ) || [];

      if (properties) {
        const featured = properties.filter(p => p.featured && p.status === 'active').slice(0, 3);
        const regular = properties.filter(p => !p.featured || p.status === 'sold');
        setFeaturedProperties(featured);
        setAllProperties(regular);
        setFilteredProperties(regular);
      }
    } catch (error) {
      console.error('[FETCH-PROPERTIES] Error:', error);
    }
  };

  const handleFilter = (filters: {
    cities?: string[];
    industries?: string[];
    listingTypes?: string[];
    minPrice?: number;
    maxPrice?: number;
  }) => {
    let filtered = [...allProperties];
    
    if (filters.cities && filters.cities.length > 0) {
      filtered = filtered.filter(property => 
        filters.cities!.some(city => 
          property.city?.toLowerCase().includes(city.toLowerCase())
        )
      );
    }
    if (filters.industries && filters.industries.length > 0) {
      filtered = filtered.filter(property => 
        filters.industries!.includes(property.industry)
      );
    }
    if (filters.minPrice !== undefined) {
      filtered = filtered.filter(property => property.asking_price >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter(property => property.asking_price <= filters.maxPrice!);
    }
    setFilteredProperties(filtered);
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Immobilier à Vendre au Québec",
    "description": "Découvrez des propriétés immobilières, bureaux et espaces commerciaux à vendre au Québec",
    "numberOfItems": allProperties.length,
    "itemListElement": featuredProperties.map((property, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "RealEstateListing",
        "name": property.title,
        "description": property.description,
        "price": property.asking_price,
        "priceCurrency": property.currency || "CAD",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": property.city,
          "addressRegion": property.province
        }
      }
    }))
  };

  return (
    <>
      <SEO 
        title="Immobilier à Vendre au Québec | Vente.club" 
        description="Découvrez des propriétés immobilières, bureaux, espaces commerciaux et bâtiments industriels à vendre au Québec. Contactez directement les propriétaires." 
        keywords="immobilier Québec, bureau à vendre Montréal, propriété commerciale, espace commercial, bâtiment industriel, terrain commercial" 
        canonical="/immeubles-commerciaux" 
        structuredData={structuredData} 
      />
      
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden bg-gradient-to-br from-white via-muted to-white" aria-label="Section principale">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-secondary/30 via-primary/20 to-transparent rounded-full blur-3xl animate-float" />
          <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-gradient-to-tr from-accent/30 via-primary/20 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(0 0 0) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        <div className="relative container mx-auto px-4 py-20">
          <div className="max-w-5xl mx-auto text-center space-y-8 animate-slide-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-secondary/10 via-primary/10 to-accent/10 border border-secondary/20 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-secondary/20 hover:border-secondary/40 cursor-pointer group">
              <Building2 className="w-5 h-5 text-secondary animate-glow group-hover:rotate-12 transition-transform duration-300" />
              <span className="text-foreground text-sm font-semibold tracking-wide group-hover:text-secondary transition-colors duration-300">
                Immobilier et Propriétés d'Affaires
              </span>
            </div>
            
            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold leading-[1.1] tracking-tight text-foreground">
              Immobilier
              <br />
              <span className="text-secondary">à Vendre au Québec</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Découvrez des opportunités d'investissement immobilier au Québec
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-secondary to-primary hover:from-secondary/90 hover:to-primary/90 text-white h-16 px-12 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all hover:scale-105 btn-premium group"
                onClick={() => document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Explorer les propriétés
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="h-16 px-12 text-lg font-semibold border-2 border-foreground/20 hover:bg-foreground hover:text-white transition-all"
                onClick={() => navigate("/list-property")}
              >
                Vendre ma propriété
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      {featuredProperties.length > 0 && (
        <section id="featured" className="py-12 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-6">
              <Building2 className="w-4 h-4" />
              Propriétés en vedette
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
              Découvrez nos meilleures opportunités
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Propriétés immobilières, bureaux et espaces commerciaux sélectionnés
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProperties.length > 0 ? (
              featuredProperties.map((property, index) => (
                <div key={property.id} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                  <BusinessCard {...property} />
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-16">
                <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold mb-2">Fonctionnalité à venir</h3>
                <p className="text-lg text-muted-foreground mb-6">
                  La section immobilier sera bientôt disponible.
                </p>
                <Button onClick={() => navigate("/list-property")} className="bg-secondary hover:bg-secondary/90">
                  Inscrivez votre propriété dès maintenant
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
      )}

      {/* Filter Section */}
      <section className="py-8 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <FilterBar onFilter={handleFilter} />
        </div>
      </section>

      {/* All Listings */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-3xl font-display font-bold text-foreground">
              Toutes les propriétés ({filteredProperties.length})
            </h2>
            
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

          <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8" : "space-y-3 sm:space-y-4"}>
            {allProperties.length === 0 && (
              <div className={viewMode === 'grid' ? "col-span-full text-center py-16" : "text-center py-16"}>
                <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold mb-2">Fonctionnalité à venir</h3>
                <p className="text-lg text-muted-foreground mb-6">
                  La section immobilier sera bientôt disponible.
                  <br />
                  En attendant, vous pouvez dès maintenant inscrire votre propriété.
                </p>
                <Button onClick={() => navigate("/list-property")} className="bg-secondary hover:bg-secondary/90">
                  Inscrire ma propriété
                </Button>
              </div>
            )}
            {filteredProperties.length > 0 ? (
              filteredProperties.map((property) => 
                viewMode === 'grid' ? (
                  <BusinessCard key={property.id} {...property} />
                ) : (
                  <BusinessListItem key={property.id} {...property} />
                )
              )
            ) : allProperties.length > 0 ? (
              <div className={viewMode === 'grid' ? "col-span-full text-center py-16" : "text-center py-16"}>
                <p className="text-lg text-muted-foreground">Aucune propriété ne correspond à vos critères de recherche</p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 overflow-hidden bg-gradient-to-br from-white via-muted to-white">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-secondary/30 via-primary/20 to-transparent rounded-full blur-3xl animate-float" />
          <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-gradient-to-tr from-accent/30 via-primary/20 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(0 0 0) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        <div className="relative container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8 animate-slide-up">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight">
              Prêt à Investir dans <span className="text-secondary whitespace-nowrap">l'Immobilier ?</span>
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground">
              Rejoignez des investisseurs qui font confiance à Vente.club
            </p>
            <Button 
              size="lg" 
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground h-14 px-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
              onClick={() => navigate("/list-property")}
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

export default PropertyListings;
