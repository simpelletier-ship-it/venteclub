import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";

const opportunities = [
  { title: "Restaurant Italien", price: "425K$", revenue: "650K$", location: "Montréal", color: "from-blue-500/20 to-cyan-500/20" },
  { title: "Café Bistro", price: "185K$", revenue: "280K$", location: "Québec", color: "from-green-500/20 to-emerald-500/20" },
  { title: "Boutique Mode", price: "320K$", revenue: "480K$", location: "Laval", color: "from-purple-500/20 to-pink-500/20" },
  { title: "Garage Mécanique", price: "550K$", revenue: "820K$", location: "Gatineau", color: "from-orange-500/20 to-red-500/20" },
  { title: "Salon Coiffure", price: "145K$", revenue: "220K$", location: "Sherbrooke", color: "from-indigo-500/20 to-blue-500/20" },
];

export const FloatingOpportunities = () => {
  const [visibleCards, setVisibleCards] = useState<number[]>([0]);

  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % opportunities.length;
      setVisibleCards([currentIndex]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Phone Frame Mock */}
      <div className="relative w-[280px] h-[500px]">
        {/* Floating Cards */}
        <div className="absolute inset-0 flex items-center justify-center">
          {opportunities.map((opp, index) => (
            <div
              key={index}
              className={`absolute w-full transition-all duration-1000 ${
                visibleCards.includes(index)
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-0 -translate-y-20 scale-95 pointer-events-none"
              }`}
              style={{
                transitionDelay: visibleCards.includes(index) ? "0ms" : "300ms",
              }}
            >
              <div className={`bg-gradient-to-br ${opp.color} backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground text-lg mb-1">{opp.title}</h3>
                    <p className="text-xs text-muted-foreground">{opp.location}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Prix demandé</span>
                    <span className="font-bold text-foreground text-lg">{opp.price}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Revenus annuels</span>
                    <span className="font-semibold text-foreground">{opp.revenue}</span>
                  </div>
                  
                  <div className="pt-3 border-t border-white/10">
                    <div className="flex gap-2">
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 w-3/4 animate-pulse" />
                      </div>
                      <span className="text-xs text-muted-foreground">75% ROI</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Floating Stats */}
        <div className="absolute -right-4 top-20 animate-float" style={{ animationDelay: "0s", animationDuration: "4s" }}>
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl px-4 py-2 shadow-lg">
            <div className="text-xs text-muted-foreground">Nouveau</div>
            <div className="font-bold text-foreground">+12</div>
          </div>
        </div>

        <div className="absolute -left-4 top-60 animate-float" style={{ animationDelay: "1s", animationDuration: "5s" }}>
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl px-4 py-2 shadow-lg">
            <div className="text-xs text-muted-foreground">Actives</div>
            <div className="font-bold text-foreground">487</div>
          </div>
        </div>

        <div className="absolute -right-8 bottom-32 animate-float" style={{ animationDelay: "2s", animationDuration: "4.5s" }}>
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl px-4 py-2 shadow-lg">
            <div className="text-xs text-muted-foreground">Vendues</div>
            <div className="font-bold text-foreground">1.2K</div>
          </div>
        </div>
      </div>
    </div>
  );
};
