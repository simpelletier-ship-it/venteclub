import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Crown, Check, ArrowRight, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

const PremiumSuccess = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Déclencher les confettis
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#fbbf24', '#f59e0b', '#d97706', '#b45309']
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#fbbf24', '#f59e0b', '#d97706', '#b45309']
      });
    }, 250);

    // Récupérer les informations de l'utilisateur
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, first_name')
          .eq('id', user.id)
          .single();
        
        setUserName(profile?.first_name || profile?.full_name || user.email?.split('@')[0] || 'Membre');
      }
      setLoading(false);
    };

    fetchUser();
    
    // Événement de conversion Google Ads - Abonnement premium
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'conversion', {
        'send_to': 'AW-974642760/z7Q0CLnYktUDEMi839AD',
        'value': 99.0,
        'currency': 'CAD',
        'transaction_id': Date.now().toString()
      });
      
      // Google Analytics 4 - Achat premium
      (window as any).gtag('event', 'purchase', {
        'transaction_id': Date.now().toString(),
        'value': 99.0,
        'currency': 'CAD',
        'items': [{
          'item_id': 'premium_subscription',
          'item_name': 'Club Select Premium',
          'price': 99.0,
          'quantity': 1
        }]
      });
    }

    return () => clearInterval(interval);
  }, []);

  const benefits = [
    {
      icon: "💬",
      title: "Conversations illimitées",
      description: "Contactez autant de vendeurs que vous le souhaitez"
    },
    {
      icon: "📞",
      title: "Accès aux coordonnées complètes",
      description: "Email et téléphone de tous les vendeurs instantanément"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 py-12 px-4 relative overflow-hidden">
      {/* Fond animé */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent"></div>
      
      {/* Étoiles scintillantes */}
      <div className="absolute top-20 left-10 animate-pulse">
        <Sparkles className="w-6 h-6 text-amber-400/40" />
      </div>
      <div className="absolute top-40 right-20 animate-pulse delay-100">
        <Sparkles className="w-4 h-4 text-amber-400/30" />
      </div>
      <div className="absolute bottom-40 left-1/4 animate-pulse delay-200">
        <Sparkles className="w-5 h-5 text-amber-400/35" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* En-tête avec animation */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500 blur-2xl opacity-40 animate-pulse"></div>
              <Crown className="w-20 h-20 text-amber-400 relative z-10 animate-scale-in" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Bienvenue au Club Select, {userName} !
          </h1>
          
          <p className="text-xl text-amber-200/80 mb-2">
            🎉 Votre abonnement premium est maintenant actif
          </p>
          
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/30 rounded-full px-6 py-2 mt-4">
            <Check className="w-5 h-5 text-amber-400" />
            <span className="text-amber-200 font-semibold">Paiement confirmé</span>
          </div>
        </div>

        {/* Carte principale */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border-2 border-amber-500/20 p-8 md:p-12 backdrop-blur-sm shadow-2xl mb-8 animate-scale-in">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-3 flex items-center justify-center gap-3">
              <Sparkles className="w-6 h-6 text-amber-400" />
              Vos avantages activés
              <Sparkles className="w-6 h-6 text-amber-400" />
            </h2>
            <p className="text-slate-300">
              Profitez dès maintenant de tous ces privilèges exclusifs
            </p>
          </div>

          {/* Grille des avantages */}
          <div className="grid md:grid-cols-2 gap-6 mb-10 max-w-3xl mx-auto">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-slate-700/30 to-slate-800/30 rounded-xl p-8 border border-amber-500/10 hover:border-amber-500/30 transition-all duration-300 hover:scale-105 group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl group-hover:scale-110 transition-transform duration-300">
                    {benefit.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                      {benefit.title}
                      <Check className="w-5 h-5 text-amber-400" />
                    </h3>
                    <p className="text-base text-slate-400">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Message personnalisé */}
          <div className="bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/30 rounded-xl p-6 mb-8">
            <p className="text-slate-200 text-center text-lg leading-relaxed">
              <span className="font-semibold text-amber-400">Félicitations !</span> Vous faites maintenant partie d'une communauté exclusive d'entrepreneurs et d'investisseurs qui prennent le contrôle de leur avenir. Explorez les opportunités qui vous attendent et connectez-vous sans limites.
            </p>
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/entreprises')}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-semibold text-lg px-8 py-6 shadow-lg shadow-amber-500/20 group"
            >
              Explorer les opportunités
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button
              onClick={() => navigate('/dashboard')}
              className="bg-slate-800/80 hover:bg-slate-700/80 border-2 border-amber-500/30 text-white hover:border-amber-500/50 text-lg px-8 py-6 font-semibold"
            >
              Mon tableau de bord
            </Button>
          </div>
        </div>

        {/* Note en bas */}
        <div className="text-center">
          <p className="text-slate-500 text-sm">
            Des questions ? Notre équipe est disponible 24/7 pour les membres Select
          </p>
        </div>
      </div>
    </div>
  );
};

export default PremiumSuccess;
