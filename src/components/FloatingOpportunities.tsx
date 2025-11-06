import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";

const opportunities = [
  { title: "Restaurant Italien", price: "425K$", revenue: "650K$", location: "Montréal", gradient: "from-[#c7d2fe]/30 to-[#ddd6fe]/30", border: "border-white/30", icon: "bg-white/20", iconColor: "text-[#818cf8]" },
  { title: "Café Bistro", price: "185K$", revenue: "280K$", location: "Québec", gradient: "from-[#e0e7ff]/30 to-[#c7d2fe]/30", border: "border-white/30", icon: "bg-white/20", iconColor: "text-[#6366f1]" },
  { title: "Boutique Mode", price: "320K$", revenue: "480K$", location: "Laval", gradient: "from-[#ddd6fe]/30 to-[#e0e7ff]/30", border: "border-white/30", icon: "bg-white/20", iconColor: "text-[#a78bfa]" },
  { title: "Garage Mécanique", price: "550K$", revenue: "820K$", location: "Gatineau", gradient: "from-[#c7d2fe]/30 to-[#e0e7ff]/30", border: "border-white/30", icon: "bg-white/20", iconColor: "text-[#818cf8]" },
  { title: "Salon Coiffure", price: "145K$", revenue: "220K$", location: "Sherbrooke", gradient: "from-[#e0e7ff]/30 to-[#ddd6fe]/30", border: "border-white/30", icon: "bg-white/20", iconColor: "text-[#6366f1]" },
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
                  : "opacity-0 translate-y-20 scale-95 pointer-events-none"
              }`}
              style={{
                transitionDelay: visibleCards.includes(index) ? "0ms" : "300ms",
              }}
            >
              <div className={`bg-gradient-to-br ${opp.gradient} backdrop-blur-xl border ${opp.border} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-lg mb-1">{opp.title}</h3>
                    <p className="text-xs text-white/70">{opp.location}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-full ${opp.icon} flex items-center justify-center`}>
                    <TrendingUp className={`w-5 h-5 ${opp.iconColor}`} />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white/70">Prix demandé</span>
                    <span className="font-bold text-white text-lg">{opp.price}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-white/70">Revenus annuels</span>
                    <span className="font-semibold text-white">{opp.revenue}</span>
                  </div>
                  
                  <div className="pt-3 border-t border-white/20">
                    <div className="flex gap-2 items-center">
                      <div className="flex-1 h-2 bg-white/30 rounded-full overflow-hidden">
                        <div className={`h-full ${opp.iconColor.replace('text-', 'bg-')} w-3/4`} />
                      </div>
                      <span className="text-xs text-white/70 font-medium">75% ROI</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Floating Stats */}
        <div className="absolute -right-4 top-20 animate-float" style={{ animationDelay: "0s", animationDuration: "4s" }}>
          <div className="bg-card/90 backdrop-blur-xl border border-border rounded-xl px-4 py-2 shadow-lg">
            <div className="text-xs text-muted-foreground">Nouveau</div>
            <div className="font-bold text-primary">+12</div>
          </div>
        </div>
      </div>
    </div>
  );
};
