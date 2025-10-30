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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
    "@graph": [
      {
        "@type": "WebSite",
        "name": "Vente.club",
        "url": "https://vente.club",
        "description": "Plateforme d'achat et vente d'entreprises au Québec",
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://vente.club/?search={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        },
        "publisher": {
          "@type": "Organization",
          "name": "Vente.club",
          "logo": {
            "@type": "ImageObject",
            "url": "https://vente.club/logo.png"
          }
        }
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Comment acheter une entreprise au Québec?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "L'achat d'une entreprise au Québec commence par l'identification d'opportunités sur des plateformes comme Vente.club. Ensuite, effectuez une due diligence approfondie, négociez le prix, organisez le financement et complétez la transaction avec l'aide de professionnels (avocats, comptables)."
            }
          },
          {
            "@type": "Question",
            "name": "Quel est le prix moyen d'une PME au Québec?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Le prix d'une PME varie considérablement selon l'industrie, les revenus et la rentabilité. En général, une PME se vend entre 2 à 5 fois son BAIIA (bénéfice avant intérêts, impôts et amortissement). Vous trouverez des opportunités allant de 50 000$ pour de petits commerces jusqu'à plusieurs millions."
            }
          },
          {
            "@type": "Question",
            "name": "Comment vendre mon entreprise rapidement?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Pour vendre votre entreprise rapidement: préparez des états financiers clairs, fixez un prix réaliste basé sur l'évaluation du marché, créez une annonce détaillée avec photos, et soyez disponible pour répondre aux questions des acheteurs potentiels."
            }
          },
          {
            "@type": "Question",
            "name": "Quels sont les coûts associés à l'achat d'une entreprise?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Les coûts incluent: le prix d'achat de l'entreprise, les frais légaux, les frais comptables, la due diligence, les frais de transfert de permis et licences. Prévoyez aussi un fonds de roulement pour les premiers mois d'opération."
            }
          },
          {
            "@type": "Question",
            "name": "Faut-il un courtier pour vendre son entreprise?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Non, un courtier n'est pas obligatoire. Des plateformes comme Vente.club vous permettent de vendre directement votre entreprise sans commission de courtage élevée, avec tous les outils nécessaires."
            }
          }
        ]
      }
    ]
  };

  return (
    <>
      <SEO 
        title="Entreprises à Vendre au Québec | Achat Vente PME et Franchises"
        description="Plus grande plateforme d'entreprises à vendre au Québec. Trouvez votre commerce, PME ou franchise. Contactez directement les propriétaires. Transactions sécurisées."
        keywords="entreprise à vendre québec, commerce à vendre, PME à vendre, franchise québec, vente entreprise montréal, achat commerce québec, affaires à vendre, transmission entreprise"
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

            {/* SEO Rich Content */}
            <div className="mt-12 max-w-4xl mx-auto space-y-4">
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Vente.club</strong> est la plateforme leader pour l'<strong className="text-foreground">achat et la vente d'entreprises au Québec</strong>. 
                Que vous cherchiez une <strong className="text-foreground">PME à vendre</strong>, un <strong className="text-foreground">commerce établi</strong> ou une <strong className="text-foreground">franchise rentable</strong>, 
                découvrez des centaines d'opportunités à <strong className="text-foreground">Montréal</strong>, <strong className="text-foreground">Québec</strong>, <strong className="text-foreground">Laval</strong> et partout en province.
              </p>
              <p className="text-sm md:text-base text-muted-foreground/80">
                Connectez-vous directement avec les propriétaires pour une <strong className="text-foreground">transaction sécurisée et transparente</strong>. 
                Restaurants, dépanneurs, salons de coiffure, franchises de services - trouvez l'opportunité parfaite pour votre projet entrepreneurial.
              </p>
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

      {/* FAQ Section for SEO */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Questions Fréquentes sur l'Achat et la Vente d'Entreprises au Québec
              </h2>
              <p className="text-muted-foreground text-lg">
                Tout ce que vous devez savoir pour acheter ou vendre une entreprise
              </p>
            </div>

            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="bg-background rounded-lg px-6 border">
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="font-semibold">Comment acheter une entreprise au Québec?</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  L'achat d'une entreprise au Québec commence par l'identification d'opportunités sur des plateformes comme Vente.club. 
                  Ensuite, effectuez une due diligence approfondie, négociez le prix, organisez le financement et complétez la transaction 
                  avec l'aide de professionnels (avocats, comptables). Notre plateforme facilite le contact direct avec les vendeurs.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="bg-background rounded-lg px-6 border">
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="font-semibold">Quel est le prix moyen d'une PME au Québec?</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Le prix d'une PME varie considérablement selon l'industrie, les revenus et la rentabilité. En général, 
                  une PME se vend entre 2 à 5 fois son BAIIA (bénéfice avant intérêts, impôts et amortissement). Sur Vente.club, 
                  vous trouverez des opportunités allant de 50 000$ pour de petits commerces jusqu'à plusieurs millions pour des franchises établies.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="bg-background rounded-lg px-6 border">
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="font-semibold">Comment vendre mon entreprise rapidement?</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Pour vendre votre entreprise rapidement: préparez des états financiers clairs, fixez un prix réaliste basé 
                  sur l'évaluation du marché, créez une annonce détaillée avec photos sur Vente.club, et soyez disponible pour 
                  répondre aux questions des acheteurs potentiels. Notre plateforme met en avant les annonces Premium pour maximiser la visibilité.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="bg-background rounded-lg px-6 border">
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="font-semibold">Quels sont les coûts associés à l'achat d'une entreprise?</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Les coûts incluent: le prix d'achat de l'entreprise, les frais légaux (avocat), les frais comptables, 
                  la due diligence, les frais de transfert de permis et licences, et potentiellement des frais de courtage. 
                  Prévoyez aussi un fonds de roulement pour les premiers mois d'opération. Sur Vente.club, le contact direct 
                  avec les vendeurs élimine les frais de courtage traditionnels.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="bg-background rounded-lg px-6 border">
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="font-semibold">Faut-il un courtier pour vendre son entreprise?</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Non, un courtier n'est pas obligatoire. Vente.club vous permet de vendre directement votre entreprise sans 
                  commission de courtage élevée. Notre plateforme offre tous les outils nécessaires: création d'annonce optimisée, 
                  messagerie sécurisée avec acheteurs, et visibilité maximale. Vous gardez le contrôle total et économisez des milliers en frais.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="bg-background rounded-lg px-6 border">
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="font-semibold">Quelle est la différence entre acheter une franchise et une entreprise indépendante?</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Une franchise offre un modèle d'affaires éprouvé, une marque reconnue et un soutien continu du franchiseur, 
                  mais implique des frais de franchise et des redevances. Une entreprise indépendante offre plus de liberté et 
                  d'autonomie, mais requiert plus d'efforts en marketing et développement. Sur Vente.club, explorez les deux options 
                  pour trouver ce qui correspond à votre vision entrepreneuriale.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
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
