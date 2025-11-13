import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calculator, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const RetirementProjection = () => {
  const [currentAge, setCurrentAge] = useState<number>(30);
  const [retirementAge, setRetirementAge] = useState<number>(65);
  const [currentSavings, setCurrentSavings] = useState<number>(50000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(500);
  const [expectedReturn, setExpectedReturn] = useState<number>(6);
  const [desiredMonthlyIncome, setDesiredMonthlyIncome] = useState<number>(4000);
  const [showResults, setShowResults] = useState(false);

  const calculateRetirement = () => {
    const yearsToRetirement = retirementAge - currentAge;
    const monthsToRetirement = yearsToRetirement * 12;
    const monthlyRate = expectedReturn / 100 / 12;

    // Valeur future de l'épargne actuelle
    const futureValueOfCurrentSavings = currentSavings * Math.pow(1 + monthlyRate, monthsToRetirement);

    // Valeur future des contributions mensuelles
    const futureValueOfContributions = monthlyContribution * ((Math.pow(1 + monthlyRate, monthsToRetirement) - 1) / monthlyRate);

    const totalAtRetirement = futureValueOfCurrentSavings + futureValueOfContributions;

    // Calcul du revenu mensuel possible pendant 25 ans (safe withdrawal rate ~4% annuel)
    const sustainableMonthlyIncome = (totalAtRetirement * 0.04) / 12;

    // Capital nécessaire pour le revenu souhaité
    const requiredCapital = (desiredMonthlyIncome * 12) / 0.04;

    // Contribution mensuelle nécessaire pour atteindre l'objectif
    const requiredMonthlyContribution = 
      (requiredCapital - futureValueOfCurrentSavings) * monthlyRate / 
      (Math.pow(1 + monthlyRate, monthsToRetirement) - 1);

    return {
      totalAtRetirement,
      sustainableMonthlyIncome,
      requiredCapital,
      requiredMonthlyContribution,
      yearsToRetirement,
      isOnTrack: totalAtRetirement >= requiredCapital,
      shortfall: Math.max(0, requiredCapital - totalAtRetirement)
    };
  };

  const results = showResults ? calculateRetirement() : null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <CardTitle>Projection de retraite</CardTitle>
        </div>
        <CardDescription>
          Calculez combien vous aurez à la retraite et si c'est suffisant pour vos besoins
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="currentAge">Âge actuel</Label>
            <Input
              id="currentAge"
              type="number"
              value={currentAge}
              onChange={(e) => setCurrentAge(Number(e.target.value))}
              min="18"
              max="100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="retirementAge">Âge de retraite souhaité</Label>
            <Input
              id="retirementAge"
              type="number"
              value={retirementAge}
              onChange={(e) => setRetirementAge(Number(e.target.value))}
              min="50"
              max="100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentSavings">Épargne retraite actuelle</Label>
            <Input
              id="currentSavings"
              type="number"
              value={currentSavings}
              onChange={(e) => setCurrentSavings(Number(e.target.value))}
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthlyContribution">Contribution mensuelle prévue</Label>
            <Input
              id="monthlyContribution"
              type="number"
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(Number(e.target.value))}
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedReturn">Rendement annuel attendu (%)</Label>
            <Input
              id="expectedReturn"
              type="number"
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(Number(e.target.value))}
              min="0"
              max="20"
              step="0.5"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="desiredMonthlyIncome">Revenu mensuel souhaité à la retraite</Label>
            <Input
              id="desiredMonthlyIncome"
              type="number"
              value={desiredMonthlyIncome}
              onChange={(e) => setDesiredMonthlyIncome(Number(e.target.value))}
              min="0"
            />
          </div>
        </div>

        <Button 
          onClick={() => setShowResults(true)} 
          className="w-full"
          size="lg"
        >
          <Calculator className="mr-2 h-4 w-4" />
          Calculer ma projection
        </Button>

        {results && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Capital à la retraite</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(results.totalAtRetirement)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Dans {results.yearsToRetirement} ans
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-primary/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Revenu mensuel possible</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(results.sustainableMonthlyIncome)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pendant 25 ans (retrait sécuritaire 4%)
                  </p>
                </CardContent>
              </Card>
            </div>

            {results.isOnTrack ? (
              <Alert className="border-green-500/50 bg-green-500/10">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription className="text-green-700 dark:text-green-400">
                  <strong>Excellent!</strong> Vous êtes sur la bonne voie pour atteindre votre objectif de retraite.
                  Votre revenu mensuel projeté ({formatCurrency(results.sustainableMonthlyIncome)}) dépasse 
                  votre objectif ({formatCurrency(desiredMonthlyIncome)}).
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-orange-500/50 bg-orange-500/10">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <AlertDescription className="text-orange-700 dark:text-orange-400">
                  <strong>Attention:</strong> Il vous manquera environ {formatCurrency(results.shortfall)} 
                  pour atteindre votre objectif de revenu de retraite.
                </AlertDescription>
              </Alert>
            )}

            <Card className="bg-accent/50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Recommandations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {!results.isOnTrack && (
                  <div className="flex items-start gap-2">
                    <div className="mt-1">💡</div>
                    <div>
                      <p className="font-medium">Augmentez vos contributions mensuelles</p>
                      <p className="text-muted-foreground">
                        Pour atteindre votre objectif, cotisez {formatCurrency(results.requiredMonthlyContribution)}/mois 
                        (au lieu de {formatCurrency(monthlyContribution)})
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start gap-2">
                  <div className="mt-1">🎯</div>
                  <div>
                    <p className="font-medium">Maximisez vos REER et CELI</p>
                    <p className="text-muted-foreground">
                      Profitez des avantages fiscaux pour accélérer votre épargne retraite
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="mt-1">📊</div>
                  <div>
                    <p className="font-medium">Révisez votre plan annuellement</p>
                    <p className="text-muted-foreground">
                      Ajustez vos contributions selon l'évolution de vos revenus et vos objectifs
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <div className="mt-1">💼</div>
                  <div>
                    <p className="font-medium">Considérez la diversification</p>
                    <p className="text-muted-foreground">
                      Un portefeuille diversifié aide à atteindre vos objectifs de rendement
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="text-xs text-muted-foreground space-y-1 pt-2">
              <p>
                💡 <strong>Note:</strong> Cette projection utilise un taux de retrait sécuritaire de 4% annuel, 
                considéré comme durable pendant 25-30 ans selon les études financières.
              </p>
              <p>
                ⚠️ Ces calculs sont des estimations basées sur vos hypothèses. 
                Consultez un conseiller financier pour une planification personnalisée.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
