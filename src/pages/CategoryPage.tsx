import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import BusinessCard from "@/components/BusinessCard";
import BusinessListItem from "@/components/BusinessListItem";
import FilterBar from "@/components/FilterBar";
import { Grid3x3, List } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { QUEBEC_INDUSTRIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";

const CategoryPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category');
  const [allBusinesses, setAllBusinesses] = useState<any[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Find category details
  const categoryData = QUEBEC_INDUSTRIES.find(ind => ind.value === category);
  
  useEffect(() => {
    if (category) {
      fetchBusinessesByCategory(category);
    }
  }, [category]);

  const fetchBusinessesByCategory = async (industryCategory: string) => {
    try {
      const { data } = await supabase
        .from('businesses')
        .select('*')
        .in('status', ['active', 'sold'])
        .eq('approval_status', 'approved')
        .eq('industry', industryCategory as any)
        .order('created_at', { ascending: false });

      if (data) {
        setAllBusinesses(data);
        setFilteredBusinesses(data);
      }
    } catch (error) {
      console.error('[FETCH-CATEGORY] Error:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les entreprises",
      });
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
    
    if (filters.cities && filters.cities.length > 0) {
      filtered = filtered.filter(business => 
        filters.cities!.some(city => 
          business.city?.toLowerCase().includes(city.toLowerCase())
        )
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
    "name": `${categoryData?.label} à Vendre au Québec`,
    "description": `Découvrez des opportunités d'affaires dans le secteur ${categoryData?.label} au Québec`,
    "numberOfItems": allBusinesses.length,
  };

  if (!categoryData) {
    navigate('/entreprises');
    return null;
  }

  return (
    <>
      <SEO 
        title={`${categoryData.label} à Vendre au Québec | Vente.club`}
        description={`Découvrez des entreprises dans le secteur ${categoryData.label} à vendre au Québec. Contactez directement les vendeurs.`}
        keywords={`${categoryData.label} Québec, entreprise ${categoryData.label}, commerce à vendre`}
        canonical={`/categorie?category=${category}`}
        structuredData={structuredData} 
      />
      
      {/* Hero Section */}
      <section className="relative min-h-[50vh] flex items-center overflow-hidden bg-gradient-to-br from-white via-muted to-white">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-br from-secondary/30 via-primary/20 to-transparent rounded-full blur-3xl animate-float" />
          <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-gradient-to-tr from-accent/30 via-primary/20 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>
        
        <div className="relative container mx-auto px-4 py-12">
          <div className="max-w-5xl mx-auto text-center space-y-6 animate-slide-up">
            <h1 className="text-4xl md:text-6xl font-display font-bold leading-[1.1] tracking-tight text-foreground">
              {categoryData.label}
              <br />
              <span className="text-secondary">à Vendre au Québec</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Découvrez {allBusinesses.length} opportunité{allBusinesses.length > 1 ? 's' : ''} dans ce secteur
            </p>
          </div>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-8 bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <FilterBar onFilter={handleFilter} hideIndustryFilter={true} />
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
                <p className="text-lg text-muted-foreground">Aucune entreprise dans cette catégorie pour le moment</p>
                <Button 
                  onClick={() => navigate("/entreprises")}
                  className="mt-4"
                >
                  Voir toutes les entreprises
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default CategoryPage;
