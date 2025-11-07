import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  TrendingUp, 
  Eye, 
  Star, 
  Clock, 
  Target, 
  CheckCircle2, 
  Zap,
  Sparkles
} from "lucide-react";

const FeaturedListing = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const businessId = searchParams.get("businessId");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(30);

  useEffect(() => {
    if (!businessId) {
      toast.error("Aucune annonce sélectionnée");
      navigate("/dashboard");
    }
  }, [businessId, navigate]);

  const handleFeatured = async (duration: number) => {
    try {
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Veuillez vous connecter pour continuer");
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.functions.invoke(
        "create-featured-checkout",
        {
          body: { businessId, duration }
        }
      );

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      toast.error("Erreur lors de la création de la session de paiement");
    } finally {
      setIsLoading(false);
    }
  };

  const benefits = [
    {
      icon: Eye,
      title: "Visibilité maximale",
      description: "Apparaissez systématiquement en premier dans les résultats de recherche et sur la page principale",
      highlight: true
    },
    {
      icon: Star,
      title: "Badge premium en vedette",
      description: "Un badge distinctif premium qui attire immédiatement l'attention des acheteurs qualifiés",
      highlight: true
    },
    {
      icon: Zap,
      title: "Campagnes publicitaires incluses",
      description: "Votre investissement finance des publicités ciblées sur Google et Facebook pour maximiser la portée",
      highlight: true
    },
    {
      icon: TrendingUp,
      title: "Position prioritaire garantie",
      description: "Votre annonce reste en tête de liste pendant toute la durée de la mise en vedette"
    },
    {
      icon: Target,
      title: "Exposition maximale",
      description: "Apparaissez devant tous les acheteurs actifs qui visitent la plateforme"
    },
    {
      icon: Clock,
      title: "Activation instantanée",
      description: "Votre mise en avant démarre immédiatement après le paiement unique"
    }
  ];

  const pricingOptions = [
    {
      duration: 30,
      price: 299.00,
      label: "1 mois",
      popular: false
    },
    {
      duration: 60,
      price: 399.00,
      label: "2 mois",
      popular: true,
      savings: "Économisez 33%"
    },
    {
      duration: 90,
      price: 449.00,
      label: "3 mois",
      popular: false,
      savings: "Économisez 50%"
    }
  ];

  const comparisonData = [
    {
      feature: "Position dans les résultats",
      standard: "Par défaut",
      featured: "En tête de liste"
    },
    {
      feature: "Badge distinctif premium",
      standard: "Non",
      featured: "Oui"
    },
    {
      feature: "Apparition page principale",
      standard: "Aléatoire",
      featured: "Position garantie"
    },
    {
      feature: "Visibilité",
      standard: "Standard",
      featured: "Maximale"
    },
    {
      feature: "Notifications acheteurs",
      standard: "Standard",
      featured: "Prioritaire"
    },
    {
      feature: "Publicités incluses",
      standard: "Non",
      featured: "Oui"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Mettre votre annonce en vedette | Visibilité maximale"
        description="Apparaissez en premier sur la page principale et devant toutes les autres annonces. Publicité incluse."
        keywords="mise en avant annonce, visibilité entreprise, promotion annonce"
        canonical="/featured-listing"
      />

      {/* Hero Section - Style minimaliste Apple */}
      <section className="relative bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#1e3a8a] py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-md px-5 py-2 rounded-full border border-white/10">
              <Sparkles className="w-4 h-4 text-white/80" />
              <span className="text-white/80 text-sm font-medium">Visibilité maximale</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-white leading-tight">
              Mettez votre annonce en vedette
            </h1>
            
            <p className="text-xl sm:text-2xl text-white/70 max-w-2xl mx-auto font-light">
              Apparaissez en premier sur la page principale et devant toutes les autres annonces
            </p>
            
            <div className="inline-flex items-center gap-2 text-white/60 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Paiement unique • Sans engagement • Aucun renouvellement</span>
            </div>

            {/* Pricing Cards - Style minimaliste */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto pt-8">
              {pricingOptions.map((option) => (
                <div
                  key={option.duration}
                  className={`relative cursor-pointer transition-all duration-300 ${
                    selectedDuration === option.duration ? 'scale-105' : ''
                  }`}
                  onClick={() => setSelectedDuration(option.duration)}
                >
                  {option.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className="bg-[#818cf8] text-white border-0 text-xs px-3 py-1">
                        Populaire
                      </Badge>
                    </div>
                  )}
                  
                  <Card 
                    className={`bg-white/5 backdrop-blur-md border transition-all duration-300 ${
                      selectedDuration === option.duration 
                        ? 'border-white/30 shadow-lg' 
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <CardHeader className="text-center pb-3 pt-8">
                      <CardTitle className="text-5xl font-bold text-white mb-2">
                        {option.price.toFixed(0)}$
                      </CardTitle>
                      <CardDescription className="text-lg font-semibold text-white/70">
                        {option.label}
                      </CardDescription>
                      <p className="text-sm text-white/50 mt-2">
                        Paiement unique • Publicité incluse
                      </p>
                      {option.savings && (
                        <Badge variant="secondary" className="mt-3 bg-[#00b894] text-white border-0 text-xs px-2 py-1">
                          {option.savings}
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent className="text-center pb-6">
                      <p className="text-xs text-white/40">
                        {(option.price / (option.duration / 30)).toFixed(2)}$ / mois
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>

            <Button 
              size="lg" 
              className="h-12 px-8 bg-white hover:bg-white/90 text-foreground font-semibold rounded-xl shadow-lg transition-all hover:scale-105"
              onClick={() => handleFeatured(selectedDuration)}
              disabled={isLoading}
            >
              {isLoading ? "Chargement..." : `Mettre en vedette - ${pricingOptions.find(o => o.duration === selectedDuration)?.price.toFixed(0)}$`}
            </Button>
            <p className="text-white/50 text-sm">
              Activation immédiate après paiement
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section - Style minimaliste */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
                Tous les avantages
              </h2>
              <p className="text-lg text-muted-foreground">
                Donnez à votre annonce la visibilité qu'elle mérite
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => (
                <div 
                  key={index} 
                  className="text-center p-6 rounded-xl bg-card border border-border hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table - Style minimaliste */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
                Standard vs En Vedette
              </h2>
            </div>

            <Card className="border border-border shadow-md overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-4 font-semibold text-foreground text-sm">Fonctionnalité</th>
                        <th className="text-center p-4 font-semibold text-muted-foreground text-sm bg-muted/30">Standard</th>
                        <th className="text-center p-4 font-semibold text-foreground text-sm">
                          En Vedette
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.map((row, index) => (
                        <tr key={index} className="border-b border-border last:border-b-0">
                          <td className="p-4 text-sm text-foreground">{row.feature}</td>
                          <td className="p-4 text-center text-sm text-muted-foreground bg-muted/30">{row.standard}</td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1 text-primary font-medium text-sm">
                              <CheckCircle2 className="w-4 h-4" />
                              {row.featured}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works Section - Style minimaliste */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
                Comment ça fonctionne
              </h2>
              <p className="text-lg text-muted-foreground">
                Un investissement unique pour maximiser vos chances de vente
              </p>
            </div>

            <div className="space-y-6">
              <Card className="border border-border">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Investissement publicitaire inclus</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Une portion importante de votre paiement est directement investie dans des campagnes publicitaires 
                        ciblées (Google Ads, Facebook, réseaux sociaux) pour promouvoir votre annonce et attirer des acheteurs 
                        qualifiés vers votre opportunité d'affaires.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-success" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Paiement unique, pas d'abonnement</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Payez une seule fois pour la durée choisie. Aucun frais caché, aucun renouvellement automatique. 
                        Votre annonce reste en vedette pendant toute la période sélectionnée.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Eye className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Publicité ciblée pour votre annonce</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Nous utilisons une partie de votre investissement pour diffuser des publicités ciblées sur Google, 
                        Facebook et autres plateformes, augmentant ainsi le trafic qualifié vers votre annonce.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                        <Target className="w-6 h-6 text-accent" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Attirez les meilleurs acheteurs</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Le badge en vedette combiné à nos campagnes publicitaires attire l'attention des acheteurs 
                        qualifiés qui recherchent activement des opportunités dans votre domaine.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Style minimaliste */}
      <section className="relative py-20 bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#1e3a8a] overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white leading-tight">
              Prêt à booster votre visibilité ?
            </h2>
            
            <p className="text-lg sm:text-xl text-white/70 font-light">
              Donnez à votre annonce la visibilité qu'elle mérite
            </p>
            
            <Button 
              size="lg" 
              className="h-12 px-8 bg-white hover:bg-white/90 text-foreground font-semibold rounded-xl shadow-lg transition-all hover:scale-105"
              onClick={() => handleFeatured(selectedDuration)}
              disabled={isLoading}
            >
              {isLoading ? "Chargement..." : `Mettre en vedette - ${pricingOptions.find(o => o.duration === selectedDuration)?.price.toFixed(0)}$`}
            </Button>
            
            <p className="text-white/50 text-sm">
              Activation immédiate • Aucun engagement
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FeaturedListing;
