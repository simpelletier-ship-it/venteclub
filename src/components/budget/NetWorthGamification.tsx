import { TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/priceFormat";

interface NetWorthGamificationProps {
  netWorth: number;
}

export const NetWorthGamification = ({ netWorth }: NetWorthGamificationProps) => {
  // Calcul du pourcentage (0-100%)
  const getPercentage = () => {
    if (netWorth < 0) {
      // Sous l'eau: plus on a de dettes, plus on descend (max -100k = 0%)
      return Math.max(0, ((netWorth + 100000) / 100000) * 25);
    } else if (netWorth <= 1000000) {
      // Progression normale: 0 = 25%, 1M = 75%
      return 25 + (netWorth / 1000000) * 50;
    } else {
      // Richesse: 1M = 75%, 10M+ = 100%
      return Math.min(100, 75 + ((netWorth - 1000000) / 9000000) * 25);
    }
  };

  const percentage = getPercentage();
  const isUnderwater = netWorth < 0;
  const isWealth = netWorth > 1000000;
  
  // Messages de progression
  const getMessage = () => {
    if (netWorth < -50000) return "Remontez à la surface 💪";
    if (netWorth < 0) return "Presque là! Continue 🔥";
    if (netWorth < 100000) return "Excellent début 🚀";
    if (netWorth < 500000) return "Momentum impressionnant ⚡";
    if (netWorth < 1000000) return "Presque millionnaire! 🎯";
    if (netWorth < 5000000) return "Liberté financière atteinte 🌟";
    return "Fortune construite! 👑";
  };

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-muted/20">
      <CardContent className="p-8">
        {/* Header minimaliste */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Valeur nette</h3>
            <div className="flex items-center gap-3 mt-2">
              <span className={`text-4xl font-bold tracking-tight ${netWorth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatPrice(netWorth)}
              </span>
              {netWorth >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400 animate-pulse" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-600 dark:text-red-400 animate-pulse" />
              )}
            </div>
          </div>
          
          {isWealth && (
            <div className="animate-bounce">
              <Sparkles className="h-12 w-12 text-yellow-500" />
            </div>
          )}
        </div>

        {/* Barre de progression professionnelle */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-medium">{getMessage()}</span>
            <span className="text-foreground font-bold">{percentage.toFixed(0)}%</span>
          </div>
          
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            {/* Effet de brillance */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" 
                 style={{ 
                   backgroundSize: '200% 100%',
                   animation: 'shimmer 3s infinite'
                 }} 
            />
            
            {/* Barre de progression avec gradient */}
            <div 
              className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out rounded-full ${
                isUnderwater 
                  ? 'bg-gradient-to-r from-red-600 to-red-400' 
                  : isWealth
                    ? 'bg-gradient-to-r from-yellow-500 via-green-500 to-emerald-500'
                    : 'bg-gradient-to-r from-blue-600 via-cyan-500 to-green-500'
              }`}
              style={{ width: `${percentage}%` }}
            >
              {/* Effet de pulsation sur la barre */}
              <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
            </div>
          </div>

          {/* Milestones minimalistes */}
          <div className="flex justify-between text-xs text-muted-foreground mt-4 px-1">
            <div className="text-center">
              <div className={`w-1.5 h-1.5 rounded-full mx-auto mb-1 ${netWorth >= -100000 ? 'bg-primary' : 'bg-muted'}`} />
              <span>-100k</span>
            </div>
            <div className="text-center">
              <div className={`w-1.5 h-1.5 rounded-full mx-auto mb-1 ${netWorth >= 0 ? 'bg-primary' : 'bg-muted'}`} />
              <span>0</span>
            </div>
            <div className="text-center">
              <div className={`w-1.5 h-1.5 rounded-full mx-auto mb-1 ${netWorth >= 500000 ? 'bg-primary' : 'bg-muted'}`} />
              <span>500k</span>
            </div>
            <div className="text-center">
              <div className={`w-1.5 h-1.5 rounded-full mx-auto mb-1 ${netWorth >= 1000000 ? 'bg-primary' : 'bg-muted'}`} />
              <span>1M</span>
            </div>
            <div className="text-center">
              <div className={`w-1.5 h-1.5 rounded-full mx-auto mb-1 ${netWorth >= 5000000 ? 'bg-primary' : 'bg-muted'}`} />
              <span>5M+</span>
            </div>
          </div>
        </div>

        {/* Stats cards minimalistes */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="bg-muted/50 rounded-lg p-4 text-center hover:bg-muted transition-colors">
            <div className="text-2xl font-bold text-foreground">
              {netWorth >= 0 ? '+' : ''}{((netWorth / 1000000) * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">vers 1M</div>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4 text-center hover:bg-muted transition-colors">
            <div className="text-2xl font-bold text-foreground">
              {Math.abs(netWorth) < 1000 ? formatPrice(netWorth) : `${(Math.abs(netWorth) / 1000).toFixed(0)}k`}
            </div>
            <div className="text-xs text-muted-foreground mt-1">actuel</div>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4 text-center hover:bg-muted transition-colors">
            <div className="text-2xl font-bold text-foreground">
              {netWorth >= 1000000 ? '🏆' : netWorth >= 0 ? '📈' : '💪'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">statut</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
