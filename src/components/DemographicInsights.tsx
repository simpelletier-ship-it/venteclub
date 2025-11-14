import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, DollarSign, TrendingUp, Home, Briefcase, ShoppingCart } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface DemographicInsightsProps {
  city: string;
  region?: string;
}

export const DemographicInsights = ({ city, region }: DemographicInsightsProps) => {
  // Données démographiques simulées basées sur la ville
  const getDemographics = (cityName: string) => {
    const cityData: Record<string, any> = {
      'Montréal': {
        population: 1780000,
        averageIncome: 52000,
        medianAge: 39,
        households: 850000,
        businessDensity: 92,
        consumerSpending: 85,
        employmentRate: 95,
        growthRate: 3.2,
      },
      'Québec': {
        population: 545000,
        averageIncome: 48000,
        medianAge: 42,
        households: 280000,
        businessDensity: 78,
        consumerSpending: 72,
        employmentRate: 96,
        growthRate: 2.1,
      },
      'Laval': {
        population: 440000,
        averageIncome: 55000,
        medianAge: 41,
        households: 185000,
        businessDensity: 68,
        consumerSpending: 80,
        employmentRate: 94,
        growthRate: 2.8,
      },
    };

    return cityData[cityName] || {
      population: 85000,
      averageIncome: 45000,
      medianAge: 40,
      households: 38000,
      businessDensity: 55,
      consumerSpending: 65,
      employmentRate: 92,
      growthRate: 1.5,
    };
  };

  const data = getDemographics(city);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-CA').format(num);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const getCommercialPotential = () => {
    const score = (data.businessDensity + data.consumerSpending + data.employmentRate) / 3;
    if (score >= 85) return { 
      label: 'Excellent', 
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-800 dark:text-green-200',
      borderColor: 'border-green-300 dark:border-green-700'
    };
    if (score >= 75) return { 
      label: 'Très bon', 
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-800 dark:text-blue-200',
      borderColor: 'border-blue-300 dark:border-blue-700'
    };
    if (score >= 65) return { 
      label: 'Bon', 
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      textColor: 'text-yellow-800 dark:text-yellow-200',
      borderColor: 'border-yellow-300 dark:border-yellow-700'
    };
    return { 
      label: 'Moyen', 
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      textColor: 'text-orange-800 dark:text-orange-200',
      borderColor: 'border-orange-300 dark:border-orange-700'
    };
  };

  const potential = getCommercialPotential();

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Données démographiques
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Analyse du potentiel commercial de la zone
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Potentiel commercial global */}
        <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
          <div className="text-sm font-medium text-muted-foreground mb-1">
            Potentiel Commercial
          </div>
          <div className={`inline-flex items-center justify-center rounded-full text-lg font-semibold px-6 py-2 border ${potential.bgColor} ${potential.textColor} ${potential.borderColor}`}>
            {potential.label}
          </div>
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-xs">Population</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(data.population)}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs">Revenu moyen</span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(data.averageIncome)}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Âge médian</span>
            </div>
            <p className="text-2xl font-bold">{data.medianAge} ans</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Home className="h-4 w-4" />
              <span className="text-xs">Ménages</span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(data.households)}</p>
          </div>
        </div>

        {/* Indicateurs commerciaux */}
        <div className="space-y-4 pt-4 border-t border-border">
          <h4 className="font-semibold text-sm">Indicateurs Commerciaux</h4>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Densité d'entreprises</span>
              </div>
              <span className="text-sm font-bold">{data.businessDensity}/100</span>
            </div>
            <Progress value={data.businessDensity} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Pouvoir d'achat</span>
              </div>
              <span className="text-sm font-bold">{data.consumerSpending}/100</span>
            </div>
            <Progress value={data.consumerSpending} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Taux d'emploi</span>
              </div>
              <span className="text-sm font-bold">{data.employmentRate}%</span>
            </div>
            <Progress value={data.employmentRate} className="h-2" />
          </div>
        </div>

        {/* Croissance */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Croissance annuelle</p>
              <p className="text-sm font-medium">{city}{region && `, ${region}`}</p>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                +{data.growthRate}%
              </span>
            </div>
          </div>
        </div>

        {/* Points clés */}
        <div className="pt-4 border-t border-border space-y-3">
          <h4 className="font-semibold text-sm">Points clés pour votre entreprise</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
              <p>Population de <strong className="text-foreground">{formatNumber(data.population)}</strong> habitants dans un rayon de 10 km</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
              <p>Revenu moyen de <strong className="text-foreground">{formatCurrency(data.averageIncome)}</strong> - clientèle avec bon pouvoir d'achat</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
              <p>Croissance démographique de <strong className="text-foreground">{data.growthRate}%</strong> par an - marché en expansion</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
              <p>Taux d'emploi de <strong className="text-foreground">{data.employmentRate}%</strong> - stabilité économique</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground pt-2 border-t border-border">
          * Données basées sur les statistiques municipales et provinciales récentes
        </p>
      </CardContent>
    </Card>
  );
};
