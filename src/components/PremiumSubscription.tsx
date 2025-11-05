import { useState, useEffect } from "react";
import { supabase, invokeWithTimeout } from "@/integrations/supabase/client";
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
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  useEffect(() => {
    // Charger une seule fois au montage du composant
    if (userId && !hasLoadedOnce) {
      checkSubscription();
    }
  }, [userId]);

  const checkSubscription = async () => {
    setLoading(true);
    
    try {
      console.log('[CHECK SUBSCRIPTION] Calling check-premium-subscription edge function');
      const { data, error } = await invokeWithTimeout('check-premium-subscription', { timeout: 10000 });
      
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
      setHasLoadedOnce(true);
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
        <Card className="border-2 border-yellow-500/50 shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-yellow-400/10 via-yellow-500/10 to-yellow-600/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="h-6 w-6 text-yellow-600" />
                <CardTitle className="bg-gradient-to-r from-yellow-600 to-yellow-500 bg-clip-text text-transparent">Abonnement Club Select Actif</CardTitle>
              </div>
              <Badge className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black font-bold border-0">
                ⭐ CLUB SELECT
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
                <span>✨ Accès illimité aux coordonnées de TOUS les vendeurs</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                <span>💬 Chat illimité avec tous les vendeurs</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                <span>🚀 Aucune limitation mensuelle</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                <span>⏱️ Valide pendant 1 mois, renouvelable automatiquement</span>
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
              className="w-full mb-2"
            >
              {processing ? "Chargement..." : "Gérer mon abonnement"}
            </Button>
            <p className="text-xs text-muted-foreground text-center mb-2">
              Vous pouvez annuler le renouvellement à tout moment. Votre accès restera actif jusqu&apos;à la fin de la période déjà payée.
            </p>
            <Button
              onClick={checkSubscription}
              disabled={processing || loading}
              variant="outline"
              className="w-full"
            >
              {loading ? "Actualisation..." : "Actualiser le statut"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 border-yellow-500/30 shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Crown className="h-6 w-6 text-yellow-600" />
              <CardTitle className="bg-gradient-to-r from-yellow-600 to-yellow-500 bg-clip-text text-transparent">Rejoindre le Club Select</CardTitle>
            </div>
            <CardDescription>
              Débloquez un accès illimité aux contacts des vendeurs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gradient-to-br from-yellow-400/10 via-yellow-500/10 to-yellow-600/10 border-2 border-yellow-500/30 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-500 bg-clip-text text-transparent">Club Select</h3>
                <div className="text-right">
                  <p className="text-3xl font-bold text-yellow-600">19,99$</p>
                  <p className="text-sm text-muted-foreground">CAD / mois</p>
                </div>
              </div>

              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Accès illimité aux coordonnées de TOUS les vendeurs</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Chat illimité avec tous les vendeurs</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Pas de limitation mensuelle</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm">Annulation facile à tout moment</span>
                </li>
              </ul>
            </div>

            <div className="bg-muted p-4 rounded-lg border border-border/50">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <X className="h-4 w-4 text-muted-foreground" />
                Plan Gratuit (actuel)
              </h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• 1 conversation par jour seulement</li>
                <li>• Accès aux coordonnées limité</li>
                <li>• Fonctionnalités restreintes</li>
              </ul>
            </div>

            <Button
              onClick={handleSubscribe}
              disabled={processing}
              className="w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-500 hover:via-yellow-600 hover:to-yellow-700 text-black font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105"
              size="lg"
            >
              {processing ? "Chargement..." : "⭐ Rejoindre le Club Select"}
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
