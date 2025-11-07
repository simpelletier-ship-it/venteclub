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
        description="Augmentez la visibilité de votre annonce jusqu'à 5x. Badge en vedette, apparition prioritaire et résultats rapides garantis."
        keywords="mise en avant annonce, visibilité entreprise, vendre rapidement, promotion annonce"
        canonical="/featured-listing"
      />

      {/* Hero Section with Premium Gradient */}
      <section className="relative bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 py-24 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full mb-8 border border-white/20 shadow-lg">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
              <span className="text-white font-semibold tracking-wide">Boostez votre visibilité</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 tracking-tight">
              Mettez votre annonce en vedette
            </h1>
            
            <p className="text-2xl md:text-3xl text-white/90 mb-6 max-w-3xl mx-auto font-light leading-relaxed">
              Apparaissez en premier sur la page principale et devant toutes les autres annonces
            </p>
            
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-8 py-3 rounded-full border border-white/20 shadow-xl">
              <CheckCircle2 className="w-5 h-5 text-white" />
              <span className="text-white font-semibold">Paiement unique • Sans engagement • Aucun renouvellement automatique</span>
            </div>

            {/* Premium Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-12 mb-10">
              {pricingOptions.map((option) => (
                <div
                  key={option.duration}
                  className={`relative group cursor-pointer transition-all duration-300 ${
                    selectedDuration === option.duration ? 'scale-105' : 'hover:scale-102'
                  }`}
                  onClick={() => setSelectedDuration(option.duration)}
                >
                  {option.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 shadow-lg px-4 py-1.5 text-sm font-bold">
                        <Star className="w-3.5 h-3.5 mr-1 fill-white" />
                        Le plus populaire
                      </Badge>
                    </div>
                  )}
                  
                  <Card 
                    className={`relative bg-white/98 backdrop-blur-xl shadow-2xl border-2 transition-all duration-300 overflow-hidden ${
                      selectedDuration === option.duration 
                        ? 'border-violet-400 ring-4 ring-violet-400/30 shadow-violet-500/30' 
                        : 'border-white/50 hover:border-violet-300 hover:shadow-xl'
                    }`}
                  >
                    {/* Gradient overlay on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/5 opacity-0 transition-opacity duration-300 ${
                      selectedDuration === option.duration ? 'opacity-100' : 'group-hover:opacity-100'
                    }`}></div>
                    
                    <CardHeader className="text-center pb-3 pt-8 relative z-10">
                      <CardTitle className="text-5xl font-bold bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
                        {option.price.toFixed(0)}$
                      </CardTitle>
                      <CardDescription className="text-xl font-bold text-gray-700 mb-2">
                        {option.label}
                      </CardDescription>
                      <p className="text-sm text-gray-600 font-medium">
                        Paiement unique • Publicité incluse
                      </p>
                      {option.savings && (
                        <Badge variant="secondary" className="mt-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 px-3 py-1">
                          {option.savings}
                        </Badge>
                      )}
                    </CardHeader>
                    <CardContent className="text-center pb-8 relative z-10">
                      <p className="text-sm text-gray-500 font-medium">
                        {(option.price / (option.duration / 30)).toFixed(2)}$ / mois
                      </p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>

            <Button 
              size="lg" 
              className="text-xl h-16 px-12 bg-white text-violet-600 hover:bg-gray-50 shadow-2xl font-bold rounded-full transition-all duration-300 hover:scale-105"
              onClick={() => handleFeatured(selectedDuration)}
              disabled={isLoading}
            >
              {isLoading ? "Chargement..." : `Mettre en vedette - ${pricingOptions.find(o => o.duration === selectedDuration)?.price.toFixed(0)}$`}
            </Button>
            <p className="text-white/80 mt-6 text-base font-medium">
              Paiement unique • Sans abonnement • Activation immédiate
            </p>
          </div>
        </div>
      </section>

      {/* Premium Benefits Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Tous les avantages de la mise en vedette
              </h2>
              <p className="text-2xl text-gray-600 font-light">
                Donnez à votre annonce la visibilité qu'elle mérite
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <Card 
                  key={index} 
                  className={`group relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border-2 ${
                    benefit.highlight 
                      ? 'border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50' 
                      : 'border-gray-200 bg-white hover:border-violet-300'
                  }`}
                >
                  {benefit.highlight && (
                    <div className="absolute top-0 right-0">
                      <Badge className="rounded-none rounded-bl-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white border-0 px-4 py-1.5">
                        Premium
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="pb-4">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 ${
                      benefit.highlight 
                        ? 'bg-gradient-to-br from-violet-600 to-purple-600 shadow-lg shadow-violet-500/50' 
                        : 'bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-violet-100 group-hover:to-purple-100'
                    }`}>
                      <benefit.icon className={`w-8 h-8 ${
                        benefit.highlight ? 'text-white' : 'text-gray-700 group-hover:text-violet-600'
                      }`} />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 leading-relaxed text-base">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Premium Comparison Table */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Standard vs En Vedette
              </h2>
              <p className="text-2xl text-gray-600 font-light">
                Découvrez tous les avantages de la mise en vedette premium
              </p>
            </div>

            <Card className="border-2 border-gray-200 shadow-2xl overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left p-6 font-bold text-gray-900 text-lg">Fonctionnalité</th>
                        <th className="text-center p-6 font-bold text-gray-600 text-lg bg-gray-50">Standard</th>
                        <th className="text-center p-6 font-bold text-lg bg-gradient-to-br from-violet-50 to-purple-50">
                          <div className="flex items-center justify-center gap-2 text-violet-700">
                            <Sparkles className="w-5 h-5" />
                            En Vedette
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.map((row, index) => (
                        <tr key={index} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors">
                          <td className="p-6 font-semibold text-gray-900">{row.feature}</td>
                          <td className="p-6 text-center text-gray-500 bg-gray-50">{row.standard}</td>
                          <td className="p-6 text-center bg-gradient-to-br from-violet-50 to-purple-50">
                            <div className="flex items-center justify-center gap-2 text-violet-700 font-bold text-lg">
                              <CheckCircle2 className="w-5 h-5" />
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

      {/* Premium Why Featured Section */}
      <section className="py-24 bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="border-2 border-violet-200 shadow-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-br from-violet-100 to-purple-100 border-b-2 border-violet-200">
                <CardTitle className="text-4xl font-bold text-gray-900">
                  Comment fonctionne la mise en vedette ?
                </CardTitle>
                <CardDescription className="text-lg mt-3 text-gray-700 font-medium">
                  Un investissement unique pour maximiser vos chances de vente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 p-8 bg-white">
                <div className="bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200 rounded-2xl p-6 shadow-lg">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-lg font-bold text-violet-900">Investissement publicitaire inclus</p>
                  </div>
                  <p className="text-base text-gray-700 leading-relaxed ml-13">
                    Une portion importante de votre paiement est directement investie dans des campagnes publicitaires 
                    ciblées (Google Ads, Facebook, réseaux sociaux) pour promouvoir votre annonce et attirer des acheteurs 
                    qualifiés vers votre opportunité d'affaires.
                  </p>
                </div>

                <div className="flex gap-5">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                      <TrendingUp className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-3 text-gray-900">Paiement unique, pas d'abonnement</h3>
                    <p className="text-gray-600 leading-relaxed text-base">
                      Payez une seule fois pour la durée choisie. Aucun frais caché, aucun renouvellement automatique. 
                      Votre annonce reste en vedette pendant toute la période sélectionnée.
                    </p>
                  </div>
                </div>

                <div className="flex gap-5">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                      <Eye className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-3 text-gray-900">Publicité ciblée pour votre annonce</h3>
                    <p className="text-gray-600 leading-relaxed text-base">
                      Nous utilisons une partie de votre investissement pour diffuser des publicités ciblées sur Google, 
                      Facebook et autres plateformes, augmentant ainsi le trafic qualifié vers votre annonce.
                    </p>
                  </div>
                </div>

                <div className="flex gap-5">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
                      <Target className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-3 text-gray-900">Attirez les meilleurs acheteurs</h3>
                    <p className="text-gray-600 leading-relaxed text-base">
                      Le badge premium en vedette combiné à nos campagnes publicitaires attire l'attention des acheteurs 
                      qualifiés qui recherchent activement des opportunités dans votre domaine.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Premium CTA Section */}
      <section className="relative py-28 bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/10 backdrop-blur-md mb-8 shadow-2xl">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 leading-tight">
              Prêt à booster votre visibilité ?
            </h2>
            
            <p className="text-2xl text-white/90 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
              Rejoignez les vendeurs qui ont choisi l'excellence avec la mise en vedette premium
            </p>
            
            <Button 
              size="lg" 
              className="text-xl h-16 px-12 bg-white text-violet-600 hover:bg-gray-50 shadow-2xl font-bold rounded-full transition-all duration-300 hover:scale-105"
              onClick={() => handleFeatured(selectedDuration)}
              disabled={isLoading}
            >
              {isLoading ? "Chargement..." : `Mettre en vedette maintenant - ${pricingOptions.find(o => o.duration === selectedDuration)?.price.toFixed(0)}$`}
            </Button>
            
            <p className="text-white/80 mt-6 text-base font-medium">
              Paiement unique • Sans abonnement • Activation immédiate
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FeaturedListing;
