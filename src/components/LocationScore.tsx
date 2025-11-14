import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { MapPin, Car, ShoppingBag, Bus, Coffee, School, Hospital, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LocationScoreProps {
  city: string;
  region?: string;
}

export const LocationScore = ({ city, region }: LocationScoreProps) => {
  // Scores simulés basés sur la ville (à remplacer par de vraies données API)
  const getScores = (cityName: string) => {
    const majorCities = ['Montréal', 'Québec', 'Laval', 'Gatineau', 'Longueuil'];
    const isMajorCity = majorCities.includes(cityName);

    return {
      overall: isMajorCity ? 85 : 70,
      visibility: isMajorCity ? 88 : 68,
      transit: isMajorCity ? 85 : 60,
      parking: isMajorCity ? 75 : 85,
      customerProximity: isMajorCity ? 90 : 72,
      zoneAttractiveness: isMajorCity ? 82 : 70,
      nearbyServices: isMajorCity ? 88 : 75,
    };
  };

  const scores = getScores(city);

  const getScoreLabel = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-green-600 dark:text-green-400' };
    if (score >= 70) return { label: 'Très bon', color: 'text-blue-600 dark:text-blue-400' };
    if (score >= 60) return { label: 'Bon', color: 'text-yellow-600 dark:text-yellow-400' };
    return { label: 'Moyen', color: 'text-orange-600 dark:text-orange-400' };
  };

  const overallScore = getScoreLabel(scores.overall);

  const categories = [
    { icon: MapPin, label: 'Visibilité & Achalandage', score: scores.visibility, color: 'text-blue-500' },
    { icon: Bus, label: 'Accès Transport', score: scores.transit, color: 'text-green-500' },
    { icon: Car, label: 'Stationnement', score: scores.parking, color: 'text-purple-500' },
    { icon: ShoppingBag, label: 'Proximité Clientèle', score: scores.customerProximity, color: 'text-orange-500' },
    { icon: Star, label: 'Attractivité Zone', score: scores.zoneAttractiveness, color: 'text-indigo-500' },
    { icon: Coffee, label: 'Services à Proximité', score: scores.nearbyServices, color: 'text-red-500' },
  ];

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          Score de localisation
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Évaluation de l'emplacement basée sur différents critères
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center p-6 bg-primary/5 rounded-lg border border-primary/20">
          <div className="text-5xl font-bold text-primary mb-2">
            {scores.overall}
            <span className="text-2xl">/100</span>
          </div>
          <Badge variant="outline" className={`${overallScore.color} border-current`}>
            {overallScore.label}
          </Badge>
          <p className="text-sm text-muted-foreground mt-2">
            {city}{region && `, ${region}`}
          </p>
        </div>

        {/* Category Scores */}
        <div className="space-y-4">
          {categories.map((category, index) => {
            const scoreInfo = getScoreLabel(category.score);
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <category.icon className={`h-4 w-4 ${category.color}`} />
                    <span className="text-sm font-medium">{category.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{category.score}</span>
                    <span className={`text-xs ${scoreInfo.color}`}>
                      {scoreInfo.label}
                    </span>
                  </div>
                </div>
                <Progress value={category.score} className="h-2" />
              </div>
            );
          })}
        </div>

        {/* Nearby Highlights */}
        <div className="pt-4 border-t border-border">
          <h4 className="font-semibold mb-3 text-sm">Atouts de l'emplacement</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Car className="h-3 w-3" />
              <span>Autoroute: 5 min</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShoppingBag className="h-3 w-3" />
              <span>Zone commerciale</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Bus className="h-3 w-3" />
              <span>Transport accessible</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>Forte visibilité</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground pt-2 border-t border-border">
          * Scores calculés en fonction de l'attractivité commerciale et de l'accessibilité de la zone
        </p>
      </CardContent>
    </Card>
  );
};
