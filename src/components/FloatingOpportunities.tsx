import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";

const opportunities = [
  { title: "Restaurant Italien", price: "425K$", revenue: "650K$", location: "Montréal" },
  { title: "Café Bistro", price: "185K$", revenue: "280K$", location: "Québec" },
  { title: "Boutique Mode", price: "320K$", revenue: "480K$", location: "Laval" },
  { title: "Garage Mécanique", price: "550K$", revenue: "820K$", location: "Gatineau" },
  { title: "Salon Coiffure", price: "145K$", revenue: "220K$", location: "Sherbrooke" },
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
              <div className="bg-card/95 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground text-lg mb-1">{opp.title}</h3>
                    <p className="text-xs text-muted-foreground">{opp.location}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary" />
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
                  
                  <div className="pt-3 border-t border-border">
                    <div className="flex gap-2 items-center">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-3/4" />
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">75% ROI</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Floating Stats */}
        <div className="absolute -right-4 top-20 animate-float" style={{ animationDelay: "0s", animationDuration: "4s" }}>
          <div className="bg-card/95 backdrop-blur-xl border border-border rounded-xl px-4 py-2 shadow-lg">
            <div className="text-xs text-muted-foreground">Nouveau</div>
            <div className="font-bold text-primary">+12</div>
          </div>
        </div>
      </div>
    </div>
  );
};
