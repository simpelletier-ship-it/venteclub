import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Crown, Sparkles, Zap, MessageSquare, Eye, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

  const handleUpgrade = () => {
    navigate("/dashboard?tab=premium");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-2 border-amber-500/20 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent"></div>
        
        {/* Sparkle effects */}
        <div className="absolute top-10 right-10 animate-pulse">
          <Sparkles className="w-6 h-6 text-amber-400/40" />
        </div>
        <div className="absolute bottom-20 left-10 animate-pulse delay-700">
          <Sparkles className="w-4 h-4 text-amber-400/30" />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <DialogHeader className="p-8 pb-6 space-y-4">
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500 blur-2xl opacity-30 animate-pulse"></div>
                <Crown className="w-16 h-16 text-amber-400 relative z-10" />
              </div>
            </div>
            
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-white">
                Limite Gratuite Atteinte
              </h2>
              <p className="text-amber-200/60 text-lg">
                Déverrouillez le potentiel complet avec le Club Select
              </p>
            </div>

            {/* Time remaining */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-amber-500/10">
              <p className="text-center text-slate-300">
                Prochain accès gratuit dans{" "}
                <span className="font-bold text-amber-400">
                  {hoursRemaining}h {minutesRemaining}min
                </span>
              </p>
            </div>
          </DialogHeader>

          {/* Features */}
          <div className="px-8 pb-6 space-y-4">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-xl p-6 border border-amber-500/10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Star className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">
                  Club Select - 19,99$/mois
                </h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 group">
                  <div className="mt-1 p-1 rounded-full bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                    <Check className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-slate-200 font-medium">Tchats illimités</p>
                    <p className="text-slate-400 text-sm">Contactez autant de vendeurs que vous le souhaitez</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 group">
                  <div className="mt-1 p-1 rounded-full bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                    <Check className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-slate-200 font-medium">Accès aux contacts</p>
                    <p className="text-slate-400 text-sm">Email et téléphone des vendeurs dévoilés instantanément</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 group">
                  <div className="mt-1 p-1 rounded-full bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                    <Check className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-slate-200 font-medium">Badge Select exclusif</p>
                    <p className="text-slate-400 text-sm">Soyez identifié comme membre premium auprès des vendeurs</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 group">
                  <div className="mt-1 p-1 rounded-full bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                    <Check className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-slate-200 font-medium">Notifications prioritaires</p>
                    <p className="text-slate-400 text-sm">Soyez alerté en premier des nouvelles opportunités</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 group">
                  <div className="mt-1 p-1 rounded-full bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                    <Check className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-slate-200 font-medium">Analyses détaillées</p>
                    <p className="text-slate-400 text-sm">Statistiques avancées sur vos recherches et favoris</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 group">
                  <div className="mt-1 p-1 rounded-full bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                    <Check className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-slate-200 font-medium">Support prioritaire</p>
                    <p className="text-slate-400 text-sm">Assistance dédiée et réponse en moins de 2h</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleUpgrade}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-semibold py-6 text-lg shadow-lg shadow-amber-500/20 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                <Crown className="w-5 h-5 mr-2 relative z-10" />
                <span className="relative z-10">Devenir Membre Select</span>
              </Button>

              <Button
                onClick={() => onOpenChange(false)}
                variant="ghost"
                className="w-full text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              >
                Continuer avec la version gratuite
              </Button>
            </div>

            {/* Trust badge */}
            <div className="text-center pt-2">
              <p className="text-slate-500 text-xs flex items-center justify-center gap-2">
                <Zap className="w-3 h-3" />
                Annulation possible à tout moment
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
