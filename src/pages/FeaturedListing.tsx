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
      description: "Apparaissez en premier dans les résultats de recherche et sur la page d'accueil",
      highlight: true
    },
    {
      icon: Star,
      title: "Badge 'En vedette'",
      description: "Un badge distinctif qui attire l'attention des acheteurs sérieux",
      highlight: true
    },
    {
      icon: TrendingUp,
      title: "Jusqu'à 5x plus de vues",
      description: "Les annonces mises en avant reçoivent en moyenne 5 fois plus de consultations"
    },
    {
      icon: Target,
      title: "Ciblage prioritaire",
      description: "Votre annonce est présentée aux acheteurs les plus actifs et qualifiés"
    },
    {
      icon: Zap,
      title: "Résultats rapides",
      description: "Vendez plus rapidement grâce à une visibilité accrue immédiate"
    },
    {
      icon: Clock,
      title: "Activation instantanée",
      description: "Votre mise en avant débute immédiatement après le paiement"
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
      feature: "Badge distinctif",
      standard: "Non",
      featured: "Oui"
    },
    {
      feature: "Apparition page d'accueil",
      standard: "Aléatoire",
      featured: "Garantie"
    },
    {
      feature: "Visibilité moyenne",
      standard: "1x",
      featured: "5x plus"
    },
    {
      feature: "Notifications acheteurs",
      standard: "Standard",
      featured: "Prioritaire"
    },
    {
      feature: "Temps de vente moyen",
      standard: "3-6 mois",
      featured: "1-3 mois"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Mettre votre annonce en vedette | Visibilité maximale"
        description="Augmentez la visibilité de votre annonce jusqu'à 5x. Badge en vedette, apparition prioritaire et résultats rapides garantis."
        keywords="mise en avant annonce, visibilité entreprise, vendre rapidement, promotion annonce"
        canonical="/featured-listing"
      />

      {/* Hero Section with Gradient */}
      <section className="relative bg-gradient-to-br from-primary via-accent to-primary/80 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-20"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full mb-6 border border-white/20">
              <Sparkles className="w-5 h-5 text-white" />
              <span className="text-white font-semibold">Boostez votre visibilité</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Mettez votre annonce en vedette
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto">
              Apparaissez en premier et vendez jusqu'à 5x plus rapidement
            </p>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
              {pricingOptions.map((option) => (
                <Card 
                  key={option.duration}
                  className={`relative bg-white/95 backdrop-blur-sm shadow-2xl border-2 cursor-pointer transition-all hover:scale-105 ${
                    selectedDuration === option.duration 
                      ? 'border-primary ring-2 ring-primary' 
                      : 'border-transparent'
                  }`}
                  onClick={() => setSelectedDuration(option.duration)}
                >
                  {option.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge variant="default" className="px-4 py-1">
                        <Star className="w-3 h-3 mr-1" />
                        Le plus populaire
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2 pt-6">
                    <CardTitle className="text-2xl font-bold">
                      {option.price.toFixed(2)}$
                    </CardTitle>
                    <CardDescription className="text-base font-semibold text-foreground">
                      {option.label}
                    </CardDescription>
                    {option.savings && (
                      <Badge variant="secondary" className="mt-2">
                        {option.savings}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="text-center pb-6">
                    <p className="text-xs text-muted-foreground">
                      {(option.price / (option.duration / 30)).toFixed(2)}$ / mois
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button 
              size="lg" 
              variant="secondary"
              className="text-lg h-14 px-8"
              onClick={() => handleFeatured(selectedDuration)}
              disabled={isLoading}
            >
              {isLoading ? "Chargement..." : `Mettre en vedette - ${pricingOptions.find(o => o.duration === selectedDuration)?.price.toFixed(0)}$`}
            </Button>
            <p className="text-white/70 mt-4 text-sm">
              Paiement sécurisé par Stripe • Activation immédiate
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">
                Tous les avantages de la mise en vedette
              </h2>
              <p className="text-xl text-muted-foreground">
                Maximisez vos chances de vendre rapidement
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {benefits.map((benefit, index) => (
                <Card 
                  key={index} 
                  className={`relative overflow-hidden transition-all hover:shadow-lg ${
                    benefit.highlight ? 'border-primary/50 bg-primary/5' : ''
                  }`}
                >
                  {benefit.highlight && (
                    <div className="absolute top-0 right-0">
                      <Badge variant="default" className="rounded-none rounded-bl-lg">
                        Premium
                      </Badge>
                    </div>
                  )}
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                      benefit.highlight 
                        ? 'bg-gradient-to-br from-primary to-accent' 
                        : 'bg-primary/10'
                    }`}>
                      <benefit.icon className={`w-6 h-6 ${
                        benefit.highlight ? 'text-white' : 'text-primary'
                      }`} />
                    </div>
                    <CardTitle className="text-xl">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">
                Annonce Standard vs En Vedette
              </h2>
              <p className="text-xl text-muted-foreground">
                Comparez les performances et choisissez la visibilité maximale
              </p>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-4 font-semibold">Fonctionnalité</th>
                        <th className="text-center p-4 font-semibold">Standard</th>
                        <th className="text-center p-4 font-semibold bg-primary/5">
                          <div className="flex items-center justify-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            En Vedette
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.map((row, index) => (
                        <tr key={index} className="border-b last:border-b-0">
                          <td className="p-4 font-medium">{row.feature}</td>
                          <td className="p-4 text-center text-muted-foreground">{row.standard}</td>
                          <td className="p-4 text-center bg-primary/5">
                            <div className="flex items-center justify-center gap-2 text-primary font-semibold">
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

      {/* Why Featured Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="text-3xl">
                  Pourquoi mettre mon annonce en vedette ?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Vendez plus rapidement</h3>
                    <p className="text-muted-foreground">
                      Les annonces en vedette se vendent en moyenne 3 fois plus rapidement grâce à leur 
                      visibilité accrue et leur positionnement prioritaire dans les résultats de recherche.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Eye className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Maximisez votre visibilité</h3>
                    <p className="text-muted-foreground">
                      Apparaissez en premier dans toutes les recherches pertinentes et sur la page d'accueil. 
                      Votre annonce sera vue par tous les acheteurs actifs de votre secteur.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Target className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Attirez les meilleurs acheteurs</h3>
                    <p className="text-muted-foreground">
                      Le badge "En vedette" attire l'attention des acheteurs sérieux et qualifiés qui recherchent 
                      activement des opportunités dans votre domaine.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-accent">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Sparkles className="w-16 h-16 text-white mx-auto mb-6" />
            <h2 className="text-4xl font-bold text-white mb-6">
              Prêt à booster votre visibilité ?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Rejoignez les centaines de vendeurs qui ont vendu plus rapidement grâce à la mise en vedette
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              className="text-lg h-14 px-8"
              onClick={() => handleFeatured(selectedDuration)}
              disabled={isLoading}
            >
              {isLoading ? "Chargement..." : `Mettre en vedette maintenant - ${pricingOptions.find(o => o.duration === selectedDuration)?.price.toFixed(0)}$`}
            </Button>
            <p className="text-white/70 mt-4 text-sm">
              Activation immédiate • Paiement sécurisé
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FeaturedListing;
