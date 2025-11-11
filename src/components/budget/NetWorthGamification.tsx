import { Building2, Waves, Rocket } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/priceFormat";

interface NetWorthGamificationProps {
  netWorth: number;
}

export const NetWorthGamification = ({ netWorth }: NetWorthGamificationProps) => {
  // Calcul de la position (de -100 à +100)
  // Négatif = sous l'eau, 0-1M = rez-de-chaussée à mi-bâtiment, >1M = vers l'espace
  const getPosition = () => {
    if (netWorth < 0) {
      // Sous l'eau: -100k = -100%, 0 = 0%
      return Math.max(-100, (netWorth / 100000) * 100);
    } else if (netWorth <= 1000000) {
      // Bâtiment: 0 = 0%, 1M = 50%
      return (netWorth / 1000000) * 50;
    } else {
      // Espace: 1M = 50%, 10M = 100%
      return Math.min(100, 50 + ((netWorth - 1000000) / 9000000) * 50);
    }
  };

  const position = getPosition();
  const isUnderwater = netWorth < 0;
  const isInSpace = netWorth > 1000000;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Votre Voyage Financier</CardTitle>
        <CardDescription>
          {isUnderwater && "Continuez! Chaque paiement vous rapproche de la surface"}
          {!isUnderwater && !isInSpace && "En progression! Votre richesse grandit"}
          {isInSpace && "Félicitations! Vous volez vers les étoiles 🌟"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative h-96 bg-gradient-to-b from-blue-900 via-blue-600 to-cyan-400 rounded-lg overflow-hidden">
          {/* Zone espace (top 25%) */}
          <div className="absolute top-0 left-0 right-0 h-1/4 bg-gradient-to-b from-purple-900 via-indigo-900 to-blue-900">
            <div className="absolute inset-0 opacity-30">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute bg-white rounded-full"
                  style={{
                    width: Math.random() * 3 + 1 + 'px',
                    height: Math.random() * 3 + 1 + 'px',
                    left: Math.random() * 100 + '%',
                    top: Math.random() * 100 + '%',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Zone bâtiment (middle 50%) */}
          <div className="absolute top-1/4 left-0 right-0 h-1/2 bg-gradient-to-b from-blue-600 via-sky-400 to-blue-300 flex items-end justify-center pb-8">
            <Building2 className="w-32 h-32 text-gray-700 opacity-30" />
          </div>

          {/* Zone sous-marine (bottom 25%) */}
          <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-b from-cyan-400 via-blue-500 to-blue-700">
            <div className="absolute inset-0">
              <Waves className="absolute bottom-4 left-1/4 w-8 h-8 text-blue-300 opacity-50 animate-pulse" />
              <Waves className="absolute bottom-8 right-1/4 w-6 h-6 text-blue-300 opacity-40 animate-pulse" />
            </div>
          </div>

          {/* Indicateur de position */}
          <div
            className="absolute left-1/2 -translate-x-1/2 transition-all duration-1000 ease-out"
            style={{
              bottom: `${Math.max(0, Math.min(100, position))}%`,
            }}
          >
            {isInSpace ? (
              <Rocket className="w-12 h-12 text-yellow-400 drop-shadow-lg animate-bounce" />
            ) : (
              <div className="w-12 h-12 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                <span className="text-white font-bold">$</span>
              </div>
            )}
          </div>

          {/* Légende sur le côté */}
          <div className="absolute left-2 top-2 bottom-2 flex flex-col justify-between text-white text-xs font-semibold">
            <div className="bg-purple-900/80 px-2 py-1 rounded">10M+</div>
            <div className="bg-blue-600/80 px-2 py-1 rounded">1M</div>
            <div className="bg-cyan-600/80 px-2 py-1 rounded">0</div>
            <div className="bg-blue-700/80 px-2 py-1 rounded">-100k</div>
          </div>
        </div>

        {/* Valeur nette actuelle */}
        <div className="mt-6 text-center">
          <div className="text-sm text-muted-foreground mb-1">Valeur nette</div>
          <div className={`text-3xl font-bold ${netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatPrice(netWorth)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
