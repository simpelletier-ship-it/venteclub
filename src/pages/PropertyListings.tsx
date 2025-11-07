import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import BusinessCard from "@/components/BusinessCard";
import BusinessListItem from "@/components/BusinessListItem";
import FilterBar from "@/components/FilterBar";
import { ArrowRight, Grid3x3, List, TrendingUp, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { CircuitBackground } from "@/components/CircuitBackground";
import { useScrollParallax } from "@/hooks/useScrollParallax";

const PropertyListings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [featuredProperties, setFeaturedProperties] = useState<any[]>([]);
  const [allProperties, setAllProperties] = useState<any[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const scrollY = useScrollParallax();
  
  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const { data: allData } = await supabase
        .from('businesses')
        .select('id, slug, title, industry, city, region, annual_revenue, asking_price, baiia, description, featured, status, approval_status, is_franchise, sale_type, property_type, year_built, square_footage, is_rental_property, rental_units, is_demo, created_at')
        .in('status', ['active', 'sold'])
        .eq('approval_status', 'approved')
        .order('created_at', { ascending: false });

      // Filter for properties (property_type not null OR property-related industries)
      const propertyIndustries = ['immeuble_revenus', 'residentiel'];
      const properties = allData?.filter(b => 
        b.property_type || propertyIndustries.includes(b.industry)
      ) || [];

      if (properties) {
        const featured = properties.filter(p => p.featured && p.status === 'active');
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
    "numberOfItems": allProperties.length + featuredProperties.length
  };

  return (
    <>
      <SEO 
        title="Tous les Immeubles à Vendre au Québec | Vente.club" 
        description="Explorez tous les immeubles commerciaux, propriétés et espaces commerciaux à vendre au Québec. Filtrez par type, ville et prix." 
        keywords="immobilier Québec, bureau à vendre, propriété commerciale, espace commercial, bâtiment industriel" 
        canonical="/immeubles-commerciaux" 
        structuredData={structuredData} 
      />
      
      {/* Hero Section - Bleu riche */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden bg-gradient-to-br from-[#1a2332] via-[#1e3a5f] to-[#0f1821]" aria-label="Section principale">
        {/* Circuit Background Animation */}
        <CircuitBackground />
        
        {/* Gradient Orbs - Bleu */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/30 via-blue-600/20 to-transparent rounded-full blur-3xl animate-pulse"
            style={{ transform: `translateY(${scrollY * 0.5}px)` }}
          />
          <div 
            className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-gradient-to-tr from-cyan-500/30 via-blue-500/20 to-transparent rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '2s', transform: `translateY(${scrollY * 0.3}px)` }}
          />
        </div>
        
        <div className="relative container mx-auto px-4 py-20">
          <div className="max-w-5xl mx-auto text-center space-y-8 animate-fade-in">
            {/* Badge - Bleu */}
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-semibold animate-scale-in">
              <Sparkles className="w-4 h-4 text-blue-400" />
              {allProperties.length + featuredProperties.length}+ propriétés disponibles
            </div>
            
            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold leading-[1.1] tracking-tight">
              <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">Immobilier</span>
              <br />
              <span className="text-white">
                à vendre au Québec
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-white/70 max-w-3xl mx-auto leading-relaxed">
              Explorez notre catalogue complet de propriétés commerciales, bureaux et espaces industriels. 
              Filtrez par type, ville et budget pour trouver l'opportunité parfaite.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Properties - Bleu */}
      {featuredProperties.length > 0 && (
        <section className="py-12 bg-gradient-to-b from-muted/30 to-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 text-sm font-semibold mb-6">
              <TrendingUp className="w-4 h-4" />
              Propriétés en vedette
            </div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                Opportunités mises de l'avant
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProperties.map((property, index) => (
                <div key={property.id} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                  <BusinessCard {...property} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Filter Section */}
      <section className="py-8 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <FilterBar onFilter={handleFilter} accentColor="blue" />
        </div>
      </section>

      {/* All Listings */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-3xl font-display font-bold text-foreground">
              Toutes les propriétés ({filteredProperties.length})
            </h2>
            
            <div className="inline-flex rounded-xl border border-blue-600/20 bg-card p-1.5 shadow-soft">
              <Button 
                variant="ghost"
                size="sm" 
                onClick={() => setViewMode('grid')} 
                className={`gap-1 sm:gap-2 rounded-lg text-xs sm:text-sm px-2 sm:px-3 ${
                  viewMode === 'grid' 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'hover:bg-blue-600/10'
                }`}
              >
                <Grid3x3 className="h-3 sm:h-4 w-3 sm:w-4" />
                <span className="hidden sm:inline">Grille</span>
              </Button>
              <Button 
                variant="ghost"
                size="sm" 
                onClick={() => setViewMode('list')} 
                className={`gap-1 sm:gap-2 rounded-lg text-xs sm:text-sm px-2 sm:px-3 ${
                  viewMode === 'list' 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'hover:bg-blue-600/10'
                }`}
              >
                <List className="h-3 sm:h-4 w-3 sm:w-4" />
                <span className="hidden sm:inline">Liste</span>
              </Button>
            </div>
          </div>

          <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8" : "space-y-3 sm:space-y-4"}>
            {filteredProperties.length > 0 ? (
              filteredProperties.map((property) => 
                viewMode === 'grid' ? (
                  <BusinessCard key={property.id} {...property} />
                ) : (
                  <BusinessListItem key={property.id} {...property} />
                )
              )
            ) : (
              <div className={viewMode === 'grid' ? "col-span-full text-center py-16" : "text-center py-16"}>
                <p className="text-lg text-muted-foreground">Aucune propriété ne correspond à vos critères de recherche</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section - Bleu */}
      <section className="relative py-16 overflow-hidden bg-gradient-to-br from-white via-muted to-white">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-blue-500/30 via-cyan-500/20 to-transparent rounded-full blur-3xl animate-float" />
        </div>
        
        <div className="relative container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              Vous avez une propriété à vendre ?
            </h2>
            <p className="text-lg text-muted-foreground">
              Publiez votre annonce gratuitement et trouvez des acheteurs qualifiés
            </p>
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white h-14 px-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
              onClick={() => navigate("/list-property")}
            >
              Vendre ma propriété
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default PropertyListings;
