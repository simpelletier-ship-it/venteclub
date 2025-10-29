import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Crown, Check, X } from "lucide-react";

interface PremiumSubscriptionProps {
  userId: string;
}

export const PremiumSubscription = ({ userId }: PremiumSubscriptionProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    checkSubscription();
    
    // Écouter les changements en temps réel sur l'abonnement Premium
    const channel = supabase
      .channel('premium-subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'premium_subscriptions',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Premium subscription changed:', payload);
          checkSubscription();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const checkSubscription = async () => {
    setLoading(true);
    try {
      console.log('[CHECK SUBSCRIPTION] Calling check-premium-subscription edge function');
      const { data, error } = await supabase.functions.invoke('check-premium-subscription');
      
      if (error) {
        console.error('[CHECK SUBSCRIPTION] Error:', error);
        setIsSubscribed(false);
        setSubscriptionEnd(null);
      } else {
        console.log('[CHECK SUBSCRIPTION] Data received:', data);
        setIsSubscribed(data?.subscribed || false);
        setSubscriptionEnd(data?.subscription_end || null);
      }
    } catch (error: any) {
      console.error('[CHECK SUBSCRIPTION] Exception:', error);
      setIsSubscribed(false);
      setSubscriptionEnd(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-premium-checkout');
      
      if (error) throw error;
      
      if (data?.url) {
        // Ouvrir Stripe dans un nouvel onglet pour éviter de recharger la page
        window.open(data.url, '_blank');
        toast({
          title: "Redirection vers le paiement",
          description: "Une nouvelle fenêtre s'est ouverte pour finaliser votre paiement.",
        });
      }
    } catch (error: any) {
      console.error('Erreur lors de la création de la session de paiement:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de créer la session de paiement",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleManageSubscription = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal-premium');
      
      if (error) throw error;
      
      if (data?.url) {
        // Ouvrir le portail Stripe dans un nouvel onglet
        window.open(data.url, '_blank');
        toast({
          title: "Portail de gestion ouvert",
          description: "Une nouvelle fenêtre s'est ouverte pour gérer votre abonnement.",
        });
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'ouverture du portail:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible d'ouvrir le portail de gestion",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isSubscribed ? (
        <Card className="border-2 border-primary">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="h-6 w-6 text-primary" />
                <CardTitle>Abonnement Premium Actif</CardTitle>
              </div>
              <Badge className="bg-gradient-to-r from-primary to-accent text-white">
                PREMIUM
              </Badge>
            </div>
            <CardDescription>
              Vous bénéficiez d'un accès illimité aux contacts des vendeurs
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                <span>✨ Accès automatique et illimité à TOUS les vendeurs</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                <span>🚀 Déblocage instantané sans limitation de temps</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                <span>💬 Messagerie illimitée avec tous les vendeurs</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                <span>⏱️ Valide pendant toute la durée de l'abonnement (1 mois)</span>
              </div>
            </div>

            {subscriptionEnd && (
              <div className="bg-muted p-3 rounded-lg space-y-2">
                <p className="text-sm text-muted-foreground">
                  Renouvellement le{' '}
                  <span className="font-semibold text-foreground">
                    {new Date(subscriptionEnd).toLocaleDateString('fr-CA', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </p>
                <div className="text-sm font-semibold text-primary">
                  ⏱️ Temps restant: {(() => {
                    const now = new Date();
                    const end = new Date(subscriptionEnd);
                    const diffMs = end.getTime() - now.getTime();
                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    
                    if (diffDays > 0) {
                      return `${diffDays} jour${diffDays > 1 ? 's' : ''} et ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
                    } else if (diffHours > 0) {
                      return `${diffHours} heure${diffHours > 1 ? 's' : ''}`;
                    } else {
                      return 'Expire bientôt';
                    }
                  })()}
                </div>
              </div>
            )}

            <Button
              onClick={handleManageSubscription}
              disabled={processing}
              variant="destructive"
              className="w-full"
            >
              {processing ? 'Chargement...' : 'Annuler mon abonnement'}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Annulez votre abonnement à tout moment. L'accès restera actif jusqu'à la fin de la période payée.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Crown className="h-6 w-6 text-muted-foreground" />
              <CardTitle>Passer à Premium</CardTitle>
            </div>
            <CardDescription>
              Débloquez un accès illimité aux contacts des vendeurs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/30 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold">Premium</h3>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary">4,99$</p>
                  <p className="text-sm text-muted-foreground">CAD / mois</p>
                </div>
              </div>

              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Accès illimité à tous les vendeurs</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Aucune limite de temps d'attente</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Messagerie illimitée avec tous les vendeurs</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Annulation facile à tout moment</span>
                </li>
              </ul>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <X className="h-4 w-4 text-muted-foreground" />
                Plan Gratuit (actuel)
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• 1 accès vendeur par 7 jours</li>
                <li>• Temps d'attente entre chaque accès</li>
                <li>• Accès limité</li>
              </ul>
            </div>

            <Button
              onClick={handleSubscribe}
              disabled={processing}
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
              size="lg"
            >
              {processing ? 'Chargement...' : 'S\'abonner à Premium'}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Paiement sécurisé par Stripe • Annulation en un clic
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
