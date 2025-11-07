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
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f23] shadow-2xl">
          {/* Decorative gradient orbs */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-600/10 rounded-full blur-3xl" />
          
          <CardHeader className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent">
                  Membre Club Select
                </CardTitle>
              </div>
              <Badge className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black font-bold border-0 px-4 py-1">
                ⭐ ACTIF
              </Badge>
            </div>
            <CardDescription className="text-gray-300 mt-2">
              Vous bénéficiez d'un accès illimité aux contacts des vendeurs
            </CardDescription>
          </CardHeader>
          
          <CardContent className="relative z-10 pt-6 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-white">
                <div className="p-1 rounded-full bg-green-500/20">
                  <Check className="h-4 w-4 text-green-400" />
                </div>
                <span>✨ Accès illimité aux coordonnées de TOUS les vendeurs</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white">
                <div className="p-1 rounded-full bg-green-500/20">
                  <Check className="h-4 w-4 text-green-400" />
                </div>
                <span>💬 Chat illimité avec tous les vendeurs</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white">
                <div className="p-1 rounded-full bg-green-500/20">
                  <Check className="h-4 w-4 text-green-400" />
                </div>
                <span>🚀 Aucune limitation mensuelle</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white">
                <div className="p-1 rounded-full bg-green-500/20">
                  <Check className="h-4 w-4 text-green-400" />
                </div>
                <span>⏱️ Valide pendant 1 mois, renouvelable automatiquement</span>
              </div>
            </div>

            {subscriptionEnd && (
              <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10 space-y-2">
                <p className="text-sm text-gray-300">
                  Renouvellement le{' '}
                  <span className="font-semibold text-white">
                    {new Date(subscriptionEnd).toLocaleDateString('fr-CA', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </p>
                <div className="text-sm font-semibold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
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

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleManageSubscription}
                disabled={processing}
                className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
              >
                {processing ? "Chargement..." : "Gérer mon abonnement"}
              </Button>
              
              <Button
                onClick={checkSubscription}
                disabled={processing || loading}
                variant="ghost"
                className="w-full text-gray-300 hover:text-white hover:bg-white/5"
              >
                {loading ? "Actualisation..." : "Actualiser le statut"}
              </Button>
            </div>
            
            <p className="text-xs text-gray-400 text-center">
              Vous pouvez annuler le renouvellement à tout moment. Votre accès restera actif jusqu'à la fin de la période déjà payée.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f23] shadow-2xl">
          {/* Decorative gradient orbs */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-600/10 rounded-full blur-3xl" />
          
          <CardHeader className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent">
                Rejoindre le Club Select
              </CardTitle>
            </div>
            <CardDescription className="text-gray-300 mt-2">
              Débloquez un accès illimité aux contacts des vendeurs
            </CardDescription>
          </CardHeader>
          
          <CardContent className="relative z-10 space-y-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
                  Club Select
                </h3>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">19,99$</p>
                  <p className="text-sm text-gray-400">CAD / mois</p>
                </div>
              </div>

              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <div className="p-1 rounded-full bg-green-500/20">
                    <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                  </div>
                  <span className="text-sm text-white">Accès illimité aux coordonnées de TOUS les vendeurs</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="p-1 rounded-full bg-green-500/20">
                    <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                  </div>
                  <span className="text-sm text-white">Chat illimité avec tous les vendeurs</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="p-1 rounded-full bg-green-500/20">
                    <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                  </div>
                  <span className="text-sm text-white">Pas de limitation mensuelle</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="p-1 rounded-full bg-green-500/20">
                    <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                  </div>
                  <span className="text-sm text-white">Annulation facile à tout moment</span>
                </li>
              </ul>
            </div>

            <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-white">
                <X className="h-4 w-4 text-gray-400" />
                Plan Gratuit (actuel)
              </h4>
              <ul className="space-y-2 text-sm text-gray-400">
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
              {processing ? "Chargement..." : "⭐ Rejoindre le Club Select - 19,99$/mois"}
            </Button>

            <p className="text-xs text-gray-400 text-center">
              Paiement sécurisé par Stripe • Annulation en un clic
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
