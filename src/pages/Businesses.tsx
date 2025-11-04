import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import BusinessCard from "@/components/BusinessCard";
import BusinessListItem from "@/components/BusinessListItem";
import FilterBar from "@/components/FilterBar";
import { ArrowRight, Grid3x3, List, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";

const Businesses = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [featuredBusinesses, setFeaturedBusinesses] = useState<any[]>([]);
  const [allBusinesses, setAllBusinesses] = useState<any[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      // Fetch only the columns we need for display
      const { data: businesses } = await supabase
        .from('businesses')
        .select('id, slug, title, industry, city, region, annual_revenue, asking_price, baiia, description, featured, status, approval_status, is_franchise, sale_type, property_type, year_built, square_footage, is_rental_property, rental_units, created_at')
        .in('status', ['active', 'sold'])
        .eq('approval_status', 'approved')
        .order('created_at', { ascending: false });

      // Filter out properties (property_type not null OR property-related industries)
      const propertyIndustries = ['immeuble_revenus', 'residentiel'];
      const filtered = businesses?.filter(b => 
        !b.property_type && !propertyIndustries.includes(b.industry)
      ) || [];

      if (filtered) {
        const featured = filtered.filter(b => b.featured && b.status === 'active');
        const regular = filtered.filter(b => !b.featured || b.status === 'sold');
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
    
    if (filters.listingTypes && filters.listingTypes.length > 0) {
      filtered = filtered.filter(business => {
        if (filters.listingTypes!.includes('franchise')) {
          if (business.is_franchise) return true;
        }
        if (filters.listingTypes!.includes('business')) {
          if (!business.is_franchise && business.sale_type !== 'property') return true;
        }
        if (filters.listingTypes!.includes('property')) {
          if (business.sale_type === 'property') return true;
        }
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
    "@type": "ItemList",
    "name": "Entreprises à Vendre au Québec",
    "description": "Découvrez toutes les entreprises, commerces et franchises à vendre au Québec sur Vente.club",
    "numberOfItems": allBusinesses.length + featuredBusinesses.length
  };

  return (
    <>
      <SEO 
        title="Toutes les Entreprises à Vendre au Québec | Vente.club" 
        description="Explorez toutes les entreprises, commerces, franchises et opportunités d'affaires à vendre au Québec. Filtrez par secteur, ville et prix." 
        keywords="entreprises à vendre Québec, commerces à vendre, franchises Québec, PME à vendre, opportunités affaires" 
        canonical="/entreprises" 
        structuredData={structuredData} 
      />
      
      {/* Hero Section */}
      <section className="relative min-h-[50vh] flex items-center overflow-hidden bg-gradient-to-br from-white via-muted to-white" aria-label="Section principale">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-secondary/30 via-primary/20 to-transparent rounded-full blur-3xl animate-float" />
          <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-gradient-to-tr from-accent/30 via-primary/20 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>
        
        <div className="relative container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center space-y-6 animate-slide-up">
            <h1 className="text-2xl sm:text-4xl md:text-6xl lg:text-7xl font-display font-bold leading-[1.1] tracking-tight text-foreground px-4">
              Toutes les entreprises
              <br />
              <span className="text-primary">à vendre au Québec</span>
            </h1>
            
            <p className="text-sm sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Explorez {allBusinesses.length + featuredBusinesses.length} opportunités d'affaires
            </p>
          </div>
        </div>
      </section>

      {/* Featured Businesses */}
      {featuredBusinesses.length > 0 && (
        <section className="py-12 bg-gradient-to-b from-muted/30 to-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8 animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-6">
                <TrendingUp className="w-4 h-4" />
                Annonces en vedette
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                Opportunités mises de l'avant
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredBusinesses.map((business, index) => (
                <div key={business.id} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                  <BusinessCard {...business} />
                </div>
              ))}
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
              Toutes les annonces ({filteredBusinesses.length})
            </h2>
            
            <div className="inline-flex rounded-xl border border-border bg-card p-1.5 shadow-soft">
              <Button 
                variant={viewMode === 'grid' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('grid')} 
                className="gap-1 sm:gap-2 rounded-lg text-xs sm:text-sm px-2 sm:px-3"
              >
                <Grid3x3 className="h-3 sm:h-4 w-3 sm:w-4" />
                <span className="hidden sm:inline">Grille</span>
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setViewMode('list')} 
                className="gap-1 sm:gap-2 rounded-lg text-xs sm:text-sm px-2 sm:px-3"
              >
                <List className="h-3 sm:h-4 w-3 sm:w-4" />
                <span className="hidden sm:inline">Liste</span>
              </Button>
            </div>
          </div>

          <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8" : "space-y-3 sm:space-y-4"}>
            {filteredBusinesses.length > 0 ? (
              filteredBusinesses.map((business) => 
                viewMode === 'grid' ? (
                  <BusinessCard key={business.id} {...business} />
                ) : (
                  <BusinessListItem key={business.id} {...business} />
                )
              )
            ) : (
              <div className={viewMode === 'grid' ? "col-span-full text-center py-16" : "text-center py-16"}>
                <p className="text-lg text-muted-foreground">Aucune entreprise ne correspond à vos critères de recherche</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 overflow-hidden bg-gradient-to-br from-white via-muted to-white">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-secondary/30 via-primary/20 to-transparent rounded-full blur-3xl animate-float" />
        </div>
        
        <div className="relative container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              Vous avez une entreprise à vendre ?
            </h2>
            <p className="text-lg text-muted-foreground">
              Publiez votre annonce gratuitement et trouvez des acheteurs qualifiés
            </p>
            <Button 
              size="lg" 
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground h-14 px-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
              onClick={() => navigate("/sell")}
            >
              Vendre mon entreprise
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default Businesses;
