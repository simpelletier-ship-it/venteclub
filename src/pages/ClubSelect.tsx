import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { 
  Crown, 
  MessageCircle, 
  Users, 
  Clock, 
  Shield, 
  CheckCircle2, 
  Star,
  Zap,
  TrendingUp
} from "lucide-react";

const ClubSelect = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    try {
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Veuillez vous connecter pour continuer");
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.functions.invoke(
        "create-premium-checkout"
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
      icon: MessageCircle,
      title: "Conversations illimitées",
      description: "Contactez autant de vendeurs que vous le souhaitez sans restriction de 24h",
      highlight: true
    },
    {
      icon: Users,
      title: "Coordonnées complètes",
      description: "Accédez directement aux coordonnées de TOUS les vendeurs sans frais supplémentaires",
      highlight: true
    },
    {
      icon: Clock,
      title: "Réponses prioritaires",
      description: "Vos messages sont marqués comme 'Membre Select' auprès des vendeurs"
    },
    {
      icon: Shield,
      title: "Badge de crédibilité",
      description: "Démontrez votre sérieux avec votre badge Club Select visible par les vendeurs"
    },
    {
      icon: Star,
      title: "Alertes premium",
      description: "Recevez les nouvelles opportunités 24h avant les utilisateurs gratuits"
    },
    {
      icon: Zap,
      title: "Support prioritaire",
      description: "Assistance rapide et dédiée pour toutes vos questions"
    },
    {
      icon: TrendingUp,
      title: "Outils d'analyse avancés",
      description: "Accédez à des statistiques détaillées et des comparaisons de marché"
    }
  ];

  const comparisonData = [
    {
      feature: "Nouvelles conversations",
      free: "1 / 24h",
      select: "Illimitées"
    },
    {
      feature: "Accès coordonnées vendeurs",
      free: "19,99$ / accès",
      select: "Inclus"
    },
    {
      feature: "Chat en cours",
      free: "Illimité",
      select: "Illimité"
    },
    {
      feature: "Badge de crédibilité",
      free: "Non",
      select: "Oui"
    },
    {
      feature: "Alertes prioritaires",
      free: "Standard",
      select: "24h d'avance"
    },
    {
      feature: "Support",
      free: "Standard",
      select: "Prioritaire"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Club Select | Accès Premium aux Opportunités d'Affaires"
        description="Rejoignez le Club Select pour des conversations illimitées, accès complet aux coordonnées des vendeurs et avantages exclusifs. 19,99$/mois sans engagement."
        keywords="club select, abonnement premium, achat entreprise, opportunités affaires, vente entreprise quebec"
        canonical="/club-select"
      />

      {/* Hero Section with Gradient */}
      <section className="relative bg-gradient-to-br from-primary via-accent to-primary/80 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-20"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full mb-6 border border-white/20">
              <Crown className="w-5 h-5 text-white" />
              <span className="text-white font-semibold">Offre de lancement</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Bienvenue au Club Select
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto">
              L'accès premium pour les acheteurs sérieux et engagés
            </p>

            {/* Pricing Card */}
            <Card className="max-w-md mx-auto bg-white/95 backdrop-blur-sm shadow-2xl border-0">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <Badge variant="default" className="text-lg px-6 py-2">
                    <Star className="w-4 h-4 mr-2" />
                    Le plus populaire
                  </Badge>
                </div>
                <CardTitle className="text-4xl font-bold">
                  19,99$ <span className="text-lg font-normal text-muted-foreground">/ mois</span>
                </CardTitle>
                <CardDescription className="text-base mt-2">
                  Sans engagement • Annulez quand vous voulez
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  size="lg" 
                  className="w-full text-lg h-14 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  onClick={handleSubscribe}
                  disabled={isLoading}
                >
                  {isLoading ? "Chargement..." : "Devenir Membre Select"}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Paiement sécurisé par Stripe • Facturation mensuelle
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">
                Tous les avantages du Club Select
              </h2>
              <p className="text-xl text-muted-foreground">
                Maximisez vos chances de trouver l'opportunité parfaite
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
                Gratuit vs Club Select
              </h2>
              <p className="text-xl text-muted-foreground">
                Comparez les fonctionnalités et choisissez ce qui vous convient
              </p>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-4 font-semibold">Fonctionnalité</th>
                        <th className="text-center p-4 font-semibold">Gratuit</th>
                        <th className="text-center p-4 font-semibold bg-primary/5">
                          <div className="flex items-center justify-center gap-2">
                            <Crown className="w-4 h-4 text-primary" />
                            Club Select
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.map((row, index) => (
                        <tr key={index} className="border-b last:border-b-0">
                          <td className="p-4 font-medium">{row.feature}</td>
                          <td className="p-4 text-center text-muted-foreground">{row.free}</td>
                          <td className="p-4 text-center bg-primary/5">
                            <div className="flex items-center justify-center gap-2 text-primary font-semibold">
                              <CheckCircle2 className="w-4 h-4" />
                              {row.select}
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

      {/* Why Premium Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle className="text-3xl">
                  Pourquoi un abonnement payant ?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Qualité garantie pour les vendeurs</h3>
                    <p className="text-muted-foreground">
                      Le Club Select garantit que seuls les acheteurs sérieux et engagés contactent les vendeurs. 
                      Cela permet aux vendeurs de recevoir des demandes de qualité et d'investir leur temps avec confiance.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Filtrage du spam et des robots</h3>
                    <p className="text-muted-foreground">
                      L'abonnement filtre automatiquement le spam, les robots automatiques et réduit au maximum 
                      les courtiers opportunistes qui inondent les vendeurs de messages non qualifiés.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Idéal pour les acheteurs actifs</h3>
                    <p className="text-muted-foreground">
                      Si vous recherchez activement plusieurs opportunités et souhaitez être pris au sérieux par les vendeurs, 
                      le Club Select est l'outil parfait pour maximiser vos chances de succès.
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
            <Crown className="w-16 h-16 text-white mx-auto mb-6" />
            <h2 className="text-4xl font-bold text-white mb-6">
              Prêt à passer au niveau supérieur ?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Rejoignez les centaines d'acheteurs qui ont déjà trouvé leur opportunité parfaite avec le Club Select
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              className="text-lg h-14 px-8"
              onClick={handleSubscribe}
              disabled={isLoading}
            >
              {isLoading ? "Chargement..." : "Devenir Membre Select - 19,99$/mois"}
            </Button>
            <p className="text-white/70 mt-4 text-sm">
              Sans engagement • Annulez à tout moment
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ClubSelect;
