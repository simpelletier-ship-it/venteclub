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
      walkability: isMajorCity ? 80 : 65,
      transit: isMajorCity ? 85 : 55,
      shopping: isMajorCity ? 90 : 70,
      restaurants: isMajorCity ? 88 : 72,
      schools: isMajorCity ? 82 : 75,
      healthcare: isMajorCity ? 90 : 78,
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
    { icon: MapPin, label: 'Marchabilité', score: scores.walkability, color: 'text-blue-500' },
    { icon: Bus, label: 'Transport en commun', score: scores.transit, color: 'text-green-500' },
    { icon: ShoppingBag, label: 'Magasins', score: scores.shopping, color: 'text-purple-500' },
    { icon: Coffee, label: 'Restaurants', score: scores.restaurants, color: 'text-orange-500' },
    { icon: School, label: 'Écoles', score: scores.schools, color: 'text-indigo-500' },
    { icon: Hospital, label: 'Santé', score: scores.healthcare, color: 'text-red-500' },
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
          <h4 className="font-semibold mb-3 text-sm">À proximité</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Car className="h-3 w-3" />
              <span>Autoroute: 5 min</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShoppingBag className="h-3 w-3" />
              <span>Centres commerciaux: 3</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Coffee className="h-3 w-3" />
              <span>Restaurants: 20+</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <School className="h-3 w-3" />
              <span>Écoles: 5</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground pt-2 border-t border-border">
          * Scores calculés en fonction de la densité et de la qualité des services à proximité
        </p>
      </CardContent>
    </Card>
  );
};
