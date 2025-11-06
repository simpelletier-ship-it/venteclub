import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Crown, Sparkles, Zap, MessageSquare, Eye, Star, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PremiumUpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hoursRemaining: number;
  minutesRemaining: number;
}

export const PremiumUpgradeModal = ({ 
  open, 
  onOpenChange,
  hoursRemaining,
  minutesRemaining 
}: PremiumUpgradeModalProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          variant: "destructive",
          title: "Connexion requise",
          description: "Vous devez être connecté pour vous abonner au Club Select.",
        });
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-premium-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        // Ouvrir Stripe Checkout dans un nouvel onglet
        window.open(data.url, '_blank');
        onOpenChange(false);
      }
    } catch (error: any) {
      console.error("Error creating checkout:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de créer la session de paiement. Veuillez réessayer.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-2 border-amber-500/20 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent"></div>
        
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 z-50 rounded-full p-1 bg-slate-800/50 hover:bg-slate-700/50 transition-colors group"
          aria-label="Fermer"
        >
          <X className="w-4 h-4 text-slate-400 group-hover:text-slate-200" />
        </button>
        
        {/* Sparkle effects */}
        <div className="absolute top-6 right-14 animate-pulse">
          <Sparkles className="w-4 h-4 text-amber-400/40" />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <DialogHeader className="p-6 pb-4 space-y-3">
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500 blur-xl opacity-30 animate-pulse"></div>
                <Crown className="w-12 h-12 text-amber-400 relative z-10" />
              </div>
            </div>
            
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold text-white">
                Limite Gratuite Atteinte
              </h2>
              <p className="text-amber-200/60 text-sm">
                Déverrouillez le potentiel complet avec le Club Select
              </p>
            </div>

            {/* Time remaining */}
            <div className="bg-slate-800/50 rounded-lg p-3 border border-amber-500/10">
              <p className="text-center text-slate-300 text-sm">
                Prochain accès gratuit dans{" "}
                <span className="font-bold text-amber-400">
                  {hoursRemaining}h {minutesRemaining}min
                </span>
              </p>
            </div>
          </DialogHeader>

          {/* Features */}
          <div className="px-6 pb-6 space-y-3">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-4 border border-amber-500/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 rounded-lg bg-amber-500/10">
                  <Star className="w-4 h-4 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Club Select - 19,99$/mois
                </h3>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start gap-2 group">
                  <div className="mt-0.5 p-0.5 rounded-full bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                    <Check className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-slate-200 font-medium text-sm">Tchats illimités</p>
                    <p className="text-slate-400 text-xs">Contactez autant de vendeurs que vous le souhaitez</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 group">
                  <div className="mt-0.5 p-0.5 rounded-full bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                    <Check className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-slate-200 font-medium text-sm">Accès aux contacts</p>
                    <p className="text-slate-400 text-xs">Email et téléphone des vendeurs dévoilés instantanément</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 group">
                  <div className="mt-0.5 p-0.5 rounded-full bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                    <Check className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-slate-200 font-medium text-sm">Analyses détaillées</p>
                    <p className="text-slate-400 text-xs">Statistiques avancées sur vos recherches et favoris</p>
                  </div>
                </div>

                <div className="flex items-start gap-2 group">
                  <div className="mt-0.5 p-0.5 rounded-full bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                    <Check className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-slate-200 font-medium text-sm">Support prioritaire</p>
                    <p className="text-slate-400 text-xs">Assistance dédiée et réponse en moins de 2h</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-semibold py-4 text-base shadow-lg shadow-amber-500/20 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                <Crown className="w-4 h-4 mr-2 relative z-10" />
                <span className="relative z-10">
                  {loading ? "Redirection..." : "Devenir Membre Select"}
                </span>
              </Button>

              <Button
                onClick={() => onOpenChange(false)}
                variant="ghost"
                size="sm"
                className="w-full text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              >
                Continuer avec la version gratuite
              </Button>
            </div>

            {/* Trust badge */}
            <div className="text-center pt-1">
              <p className="text-slate-500 text-[10px] flex items-center justify-center gap-1.5">
                <Zap className="w-2.5 h-2.5" />
                Annulation possible à tout moment
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
