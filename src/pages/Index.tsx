import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BusinessCard from "@/components/BusinessCard";
import BusinessListItem from "@/components/BusinessListItem";
import FilterBar from "@/components/FilterBar";
import { ArrowRight, Grid3x3, List } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-business-pro.jpg";

const Index = () => {
  const navigate = useNavigate();
  const [featuredBusinesses, setFeaturedBusinesses] = useState<any[]>([]);
  const [allBusinesses, setAllBusinesses] = useState<any[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    // Fetch all approved businesses (active or sold within 3 months)
    const { data: businesses } = await supabase
      .from('businesses')
      .select('*')
      .in('status', ['active', 'sold'])
      .eq('approval_status', 'approved')
      .order('created_at', { ascending: false });

    if (businesses) {
      // Check which ones are featured
      const businessesWithFeature = await Promise.all(
        businesses.map(async (business) => {
          const { data: isFeatured } = await supabase
            .rpc('is_business_featured', { business_uuid: business.id });
          return { ...business, featured: !!isFeatured };
        })
      );

      // Separate featured and regular businesses
      const featured = businessesWithFeature
        .filter(b => b.featured && b.status === 'active')
        .slice(0, 3);
      const regular = businessesWithFeature.filter(b => !b.featured || b.status === 'sold');

      setFeaturedBusinesses(featured);
      setAllBusinesses(regular);
      setFilteredBusinesses(regular);
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
      filtered = filtered.filter(business => 
        business.city?.toLowerCase().includes(filters.city!.toLowerCase())
      );
    }
    
    if (filters.industry) {
      filtered = filtered.filter(business => 
        business.industry === filters.industry
      );
    }

    if (filters.minPrice !== undefined) {
      filtered = filtered.filter(business => 
        business.asking_price >= filters.minPrice!
      );
    }

    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter(business => 
        business.asking_price <= filters.maxPrice!
      );
    }
    
    setFilteredBusinesses(filtered);
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-accent/10">
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url(${heroImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        </div>
        
        <div className="relative container mx-auto px-4 py-16 md:py-20 pb-8 md:pb-12">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-block">
              <span className="px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-semibold border border-accent/20">
                La plateforme d'acquisition et de vente d'entreprise au Québec
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-foreground via-foreground to-accent bg-clip-text text-transparent">
                Achetez & Vendez
              </span>
              <br />
              <span className="text-accent">des Entreprises</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              La plateforme d'acquisition et de vente d'entreprise au Québec
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <Button 
                size="lg" 
                className="bg-accent hover:bg-accent/90 text-accent-foreground h-14 px-8 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                onClick={() => document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Explorer les opportunités
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="h-14 px-8 text-lg font-semibold border-2 hover:bg-accent/5"
                onClick={() => navigate("/list-business")}
              >
                Vendre mon entreprise
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Businesses */}
      <section id="featured" className="pt-8 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Opportunités En Vedette</h2>
            <p className="text-lg text-muted-foreground">
              Entreprises sélectionnées avec un potentiel de croissance exceptionnel
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredBusinesses.length > 0 ? (
              featuredBusinesses.map((business) => (
                <BusinessCard key={business.id} {...business} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-lg text-muted-foreground">Aucune annonce en vedette pour le moment</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* All Listings */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Toutes les Annonces</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Explorez toutes les entreprises à vendre
            </p>
          </div>

          {/* Filter Section */}
          <div className="mb-8">
            <FilterBar onFilter={handleFilter} />
          </div>

          {/* View Mode Toggle */}
          <div className="flex justify-end mb-6">
            <div className="inline-flex rounded-lg border border-border bg-card p-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="gap-2"
              >
                <Grid3x3 className="h-4 w-4" />
                Grille
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="gap-2"
              >
                <List className="h-4 w-4" />
                Liste
              </Button>
            </div>
          </div>

          <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {filteredBusinesses.length > 0 ? (
              filteredBusinesses.map((business) => (
                viewMode === 'grid' ? (
                  <BusinessCard key={business.id} {...business} />
                ) : (
                  <BusinessListItem key={business.id} {...business} />
                )
              ))
            ) : allBusinesses.length > 0 ? (
              <div className={viewMode === 'grid' ? "col-span-full text-center py-12" : "text-center py-12"}>
                <p className="text-lg text-muted-foreground">Aucune annonce ne correspond à vos critères de recherche</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? "col-span-full text-center py-12" : "text-center py-12"}>
                <p className="text-lg text-muted-foreground">Aucune annonce disponible pour le moment</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary via-primary to-primary/90 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5" />
        <div className="relative container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Prêt à Trouver Votre Prochaine Opportunité ?
          </h2>
          <p className="text-lg text-white/90 mb-6 max-w-2xl mx-auto">
            Rejoignez des milliers d'entrepreneurs
          </p>
          <Button size="lg" className="bg-white hover:bg-white/90 text-primary h-12 px-8 text-lg font-semibold" onClick={() => navigate("/list-business")}>
            Commencer
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center">
              <span className="text-2xl font-bold">
                Vente<span className="text-accent">.Club</span>
              </span>
            </div>
            <div className="text-sm text-muted-foreground">
              Un réseau d'entrepreneurs en action
            </div>
          </div>
          <div className="border-t border-border mt-6 pt-6 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 Vente.club. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Index;