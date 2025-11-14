import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, Activity } from 'lucide-react';
import { formatPrice } from '@/lib/priceFormat';

interface MarketEstimateProps {
  askingPrice: number;
  revenue: number;
  baiia: number;
  industry: string;
  city: string;
}

export const MarketEstimate = ({ 
  askingPrice, 
  revenue, 
  baiia, 
  industry,
  city 
}: MarketEstimateProps) => {
  // Calculs d'estimation (simulés - à remplacer par une vraie analyse)
  const revenueMultiple = revenue > 0 ? (askingPrice / revenue) : 0;
  const baiiaMultiple = baiia > 0 ? (askingPrice / baiia) : 0;
  
  // Multiples moyens par industrie (simulés)
  const industryMultiples = {
    revenue: 1.5,
    baiia: 4.0
  };

  const estimatedValueByRevenue = revenue * industryMultiples.revenue;
  const estimatedValueByBaiia = baiia * industryMultiples.baiia;
  const averageEstimate = (estimatedValueByRevenue + estimatedValueByBaiia) / 2;

  const priceDifference = ((askingPrice - averageEstimate) / averageEstimate) * 100;
  const isOverpriced = priceDifference > 10;
  const isUnderpriced = priceDifference < -10;
  const isFairPrice = !isOverpriced && !isUnderpriced;

  const priceScore = Math.max(0, Math.min(100, 100 - Math.abs(priceDifference)));

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Estimation de marché
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Analyse comparative basée sur les standards de l'industrie
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Price Analysis */}
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Prix demandé</p>
              <p className="text-2xl font-bold text-primary">
                {formatPrice(askingPrice)}
              </p>
            </div>
            <Badge 
              variant={isFairPrice ? 'default' : isUnderpriced ? 'secondary' : 'destructive'}
              className="gap-1"
            >
              {isFairPrice && <Activity className="h-3 w-3" />}
              {isUnderpriced && <TrendingDown className="h-3 w-3" />}
              {isOverpriced && <TrendingUp className="h-3 w-3" />}
              {isFairPrice && 'Prix juste'}
              {isUnderpriced && 'Bon prix'}
              {isOverpriced && 'Prix élevé'}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Valeur estimée du marché</span>
              <span className="font-semibold">{formatPrice(averageEstimate)}</span>
            </div>
            <Progress value={priceScore} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Score de prix: {priceScore.toFixed(0)}/100
            </p>
          </div>
        </div>

        {/* Multiples Comparison */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Multiples d'évaluation
          </h4>

          {revenue > 0 && (
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Multiple de revenus</span>
                <div className="text-right">
                  <p className="font-semibold">{revenueMultiple.toFixed(2)}x</p>
                  <p className="text-xs text-muted-foreground">
                    Moyenne industrie: {industryMultiples.revenue}x
                  </p>
                </div>
              </div>
              <Progress 
                value={Math.min(100, (revenueMultiple / industryMultiples.revenue) * 100)} 
                className="h-1.5"
              />
            </div>
          )}

          {baiia > 0 && (
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Multiple de BAIIA</span>
                <div className="text-right">
                  <p className="font-semibold">{baiiaMultiple.toFixed(2)}x</p>
                  <p className="text-xs text-muted-foreground">
                    Moyenne industrie: {industryMultiples.baiia}x
                  </p>
                </div>
              </div>
              <Progress 
                value={Math.min(100, (baiiaMultiple / industryMultiples.baiia) * 100)} 
                className="h-1.5"
              />
            </div>
          )}
        </div>

        {/* Market Insights */}
        <div className="pt-4 border-t border-border space-y-3">
          <h4 className="font-semibold text-sm">Aperçu du marché</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
              <p className="text-muted-foreground flex-1">
                <strong>Industrie:</strong> {industry} - Croissance stable au Québec
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5"></div>
              <p className="text-muted-foreground flex-1">
                <strong>Localisation:</strong> {city} - Marché dynamique
              </p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5"></div>
              <p className="text-muted-foreground flex-1">
                <strong>Demande:</strong> Intérêt élevé pour ce type d'entreprise
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground pt-2 border-t border-border">
          * Estimation basée sur les multiples d'évaluation standards de l'industrie. 
          Cette analyse ne constitue pas un avis financier professionnel.
        </p>
      </CardContent>
    </Card>
  );
};
