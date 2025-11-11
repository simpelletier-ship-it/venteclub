import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";

const opportunities = [
  { title: "Restaurant Italien", price: "425K$", revenue: "650K$", location: "Montréal", roi: 82 },
  { title: "Café Bistro", price: "185K$", revenue: "280K$", location: "Québec", roi: 68 },
  { title: "Boutique Mode", price: "320K$", revenue: "480K$", location: "Laval", roi: 75 },
  { title: "Garage Mécanique", price: "550K$", revenue: "820K$", location: "Gatineau", roi: 89 },
  { title: "Salon Coiffure", price: "145K$", revenue: "220K$", location: "Sherbrooke", roi: 71 },
];

export const FloatingOpportunities = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [badgeBounce, setBadgeBounce] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % opportunities.length);
        setIsAnimating(false);
      }, 600);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Déclencher l'animation de rebond quand l'index change
    setBadgeBounce(true);
    const timeout = setTimeout(() => setBadgeBounce(false), 600);
    return () => clearTimeout(timeout);
  }, [currentIndex]);

  const getCardStyle = (offset: number) => {
    const position = (offset + opportunities.length) % opportunities.length;
    
    if (position === 0) {
      // Carte centrale
      return {
        transform: 'translateX(0%) translateY(0%) scale(1)',
        opacity: 1,
        zIndex: 30,
        filter: 'blur(0px)',
      };
    } else if (position === 1) {
      // Carte à droite - plus petite, plus bas et floutée
      return {
        transform: 'translateX(90%) translateY(30%) scale(0.68)',
        opacity: 0.3,
        zIndex: 20,
        filter: 'blur(2px)',
      };
    } else if (position === opportunities.length - 1) {
      // Carte à gauche - plus petite, plus bas et floutée
      return {
        transform: 'translateX(-90%) translateY(30%) scale(0.68)',
        opacity: 0.3,
        zIndex: 20,
        filter: 'blur(2px)',
      };
    } else {
      // Cartes cachées
      return {
        transform: position < opportunities.length / 2 ? 'translateX(200%)' : 'translateX(-200%)',
        opacity: 0,
        zIndex: 10,
        filter: 'blur(4px)',
      };
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center px-4">
      <div className="relative w-full max-w-[420px] h-[480px]">
        {/* Carousel Container */}
        <div className="absolute inset-0 flex items-center justify-center">
          {opportunities.map((opp, index) => {
            const offset = index - currentIndex;
            const style = getCardStyle(offset);
            
            return (
              <div
                key={index}
                className="absolute w-[320px] transition-all duration-700 ease-out"
                style={{
                  ...style,
                  willChange: 'transform, opacity',
                  pointerEvents: offset === 0 ? 'auto' : 'none',
                }}
              >
                <div className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl border border-white/40 rounded-xl p-6 shadow-2xl">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 text-lg mb-1 line-clamp-1">{opp.title}</h3>
                      <p className="text-sm text-slate-600">{opp.location}</p>
                    </div>
                    <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5 text-indigo-600" />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Prix demandé</span>
                      <span className="font-bold text-slate-900 text-xl">{opp.price}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Revenus annuels</span>
                      <span className="font-semibold text-slate-900 text-lg">{opp.revenue}</span>
                    </div>
                    
                    <div className="pt-3 border-t border-slate-200">
                      <div className="flex gap-2 items-center">
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-1000 ease-out"
                            style={{ 
                              width: offset === 0 ? `${opp.roi}%` : '0%'
                            }} 
                          />
                        </div>
                        <span className="text-sm text-slate-600 font-medium whitespace-nowrap">{opp.roi}% ROI</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Floating Badge */}
        <div 
          className="absolute -right-2 top-16 bg-white/95 backdrop-blur-xl border border-white/40 rounded-lg px-4 py-2 shadow-xl"
          style={{ animation: "float 6s ease-in-out infinite", willChange: "transform" }}
        >
          {/* Notification indicator */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
          
          <div className="text-xs text-slate-600 font-medium">Nouvelles offres</div>
          <div className={`font-bold text-indigo-600 text-lg transition-all duration-300 ${badgeBounce ? 'animate-bounce-subtle' : ''}`}>
            +{8 + (currentIndex * 2)}
          </div>
        </div>

        {/* Carousel Indicators */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
          {opportunities.map((_, index) => (
            <div
              key={index}
              className={`h-1 rounded-full transition-all duration-500 ${
                index === currentIndex 
                  ? 'w-6 bg-indigo-600' 
                  : 'w-1 bg-slate-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
