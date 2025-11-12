import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/priceFormat";
import { TrendingUp, TrendingDown, Target, Clock, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  type: 'income' | 'expense';
}

interface FinancialGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
}

interface Asset {
  id: string;
  value: number;
}

interface Debt {
  id: string;
  balance: number;
}

interface ScenarioSimulatorProps {
  transactions: Transaction[];
  categories: Category[];
  goals: FinancialGoal[];
  assets: Asset[];
  debts: Debt[];
}

export const ScenarioSimulator = ({ 
  transactions, 
  categories, 
  goals,
  assets,
  debts 
}: ScenarioSimulatorProps) => {
  const [reductions, setReductions] = useState<Record<string, number>>({});

  // Calculer les dépenses mensuelles par catégorie
  const monthlyExpensesByCategory = categories
    .filter(c => c.type === 'expense')
    .map(category => {
      const categoryTransactions = transactions.filter(
        t => t.category_id === category.id && t.type === 'expense'
      );
      const total = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      // Moyenne sur 3 mois
      const monthlyAverage = total / 3;
      
      return {
        id: category.id,
        name: category.name,
        icon: category.icon,
        monthlyAmount: monthlyAverage,
      };
    })
    .filter(c => c.monthlyAmount > 0)
    .sort((a, b) => b.monthlyAmount - a.monthlyAmount);

  // Calculer revenus mensuels moyens
  const monthlyIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0) / 3;

  // Calculer dépenses mensuelles moyennes
  const totalMonthlyExpenses = monthlyExpensesByCategory.reduce(
    (sum, c) => sum + c.monthlyAmount,
    0
  );

  // Calculer les économies actuelles
  const currentMonthlySavings = monthlyIncome - totalMonthlyExpenses;

  // Calculer les économies avec réductions
  const totalReductions = monthlyExpensesByCategory.reduce((sum, category) => {
    const reduction = reductions[category.id] || 0;
    return sum + (category.monthlyAmount * reduction / 100);
  }, 0);

  const newMonthlySavings = currentMonthlySavings + totalReductions;
  const savingsIncrease = totalReductions;
  const savingsIncreasePercent = currentMonthlySavings > 0 
    ? (savingsIncrease / currentMonthlySavings) * 100 
    : 0;

  // Calculer valeur nette actuelle
  const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
  const totalDebts = debts.reduce((sum, d) => sum + d.balance, 0);
  const currentNetWorth = totalAssets - totalDebts;

  // Projeter valeur nette future
  const projectNetWorth = (months: number, monthlySavings: number) => {
    return currentNetWorth + (monthlySavings * months);
  };

  // Calculer temps pour atteindre les objectifs
  const calculateTimeToGoal = (goalAmount: number, monthlySavings: number) => {
    if (monthlySavings <= 0) return null;
    const remaining = goalAmount - currentNetWorth;
    if (remaining <= 0) return 0;
    return Math.ceil(remaining / monthlySavings);
  };

  // Données pour graphique comparatif (projection 12 mois)
  const projectionData = Array.from({ length: 13 }, (_, i) => ({
    month: i,
    current: projectNetWorth(i, currentMonthlySavings),
    withReductions: projectNetWorth(i, newMonthlySavings),
  }));

  // Données pour graphique des réductions par catégorie
  const reductionsData = monthlyExpensesByCategory
    .filter(c => (reductions[c.id] || 0) > 0)
    .map(category => ({
      name: `${category.icon} ${category.name}`,
      current: category.monthlyAmount,
      reduced: category.monthlyAmount * (1 - (reductions[category.id] || 0) / 100),
      savings: category.monthlyAmount * (reductions[category.id] || 0) / 100,
    }));

  const handleReductionChange = (categoryId: string, value: number[]) => {
    setReductions(prev => ({
      ...prev,
      [categoryId]: value[0],
    }));
  };

  const resetScenario = () => {
    setReductions({});
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-6 w-6 text-primary" />
          Simulateur de Scénarios Financiers
        </CardTitle>
        <CardDescription>
          Visualisez l'impact de la réduction de vos dépenses sur vos objectifs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Résumé actuel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground mb-1">Épargne mensuelle actuelle</div>
              <div className={`text-2xl font-bold ${currentMonthlySavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPrice(currentMonthlySavings)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground mb-1">Épargne avec réductions</div>
              <div className="text-2xl font-bold text-green-600">
                {formatPrice(newMonthlySavings)}
              </div>
              {savingsIncrease > 0 && (
                <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  +{formatPrice(savingsIncrease)} ({savingsIncreasePercent.toFixed(0)}%)
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground mb-1">Valeur nette actuelle</div>
              <div className={`text-2xl font-bold ${currentNetWorth >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                {formatPrice(currentNetWorth)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contrôles de réduction par catégorie */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold">Réduire les dépenses par catégorie</h4>
            <Button variant="outline" size="sm" onClick={resetScenario}>
              Réinitialiser
            </Button>
          </div>
          
          <div className="space-y-4">
            {monthlyExpensesByCategory.slice(0, 6).map((category) => (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{category.icon}</span>
                    <span className="font-medium">{category.name}</span>
                    <Badge variant="outline">
                      {formatPrice(category.monthlyAmount)}/mois
                    </Badge>
                  </div>
                  <div className="text-sm font-semibold">
                    {reductions[category.id] || 0}% de réduction
                  </div>
                </div>
                <Slider
                  value={[reductions[category.id] || 0]}
                  onValueChange={(value) => handleReductionChange(category.id, value)}
                  max={100}
                  step={5}
                  className="w-full"
                />
                {(reductions[category.id] || 0) > 0 && (
                  <div className="text-sm text-green-600 dark:text-green-400">
                    💰 Économies: {formatPrice(category.monthlyAmount * (reductions[category.id] || 0) / 100)}/mois
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Graphique: Projection 12 mois */}
        {savingsIncrease > 0 && (
          <div>
            <h4 className="font-semibold mb-4">📈 Projection de valeur nette (12 mois)</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={projectionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  label={{ value: 'Mois', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number) => formatPrice(value)}
                  labelFormatter={(label) => `Mois ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="current" 
                  stroke="#3b82f6" 
                  name="Scénario actuel"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="withReductions" 
                  stroke="#10b981" 
                  name="Avec réductions"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Graphique: Réductions par catégorie */}
        {reductionsData.length > 0 && (
          <div>
            <h4 className="font-semibold mb-4">💸 Impact des réductions par catégorie</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reductionsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `${value.toFixed(0)}$`} />
                <Tooltip formatter={(value: number) => formatPrice(value)} />
                <Legend />
                <Bar dataKey="current" fill="#ef4444" name="Actuel" />
                <Bar dataKey="reduced" fill="#3b82f6" name="Réduit" />
                <Bar dataKey="savings" fill="#10b981" name="Économies" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        <Separator />

        {/* Temps pour atteindre les objectifs */}
        {goals.length > 0 && (
          <div>
            <h4 className="font-semibold mb-4">🎯 Temps pour atteindre vos objectifs</h4>
            <div className="space-y-3">
              {goals.map((goal) => {
                const currentTime = calculateTimeToGoal(goal.target_amount, currentMonthlySavings);
                const newTime = calculateTimeToGoal(goal.target_amount, newMonthlySavings);
                const timeSaved = currentTime && newTime ? currentTime - newTime : 0;

                return (
                  <Card key={goal.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-medium">{goal.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Objectif: {formatPrice(goal.target_amount)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Scénario actuel</div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-blue-500" />
                          <span className="font-semibold">
                            {currentTime === null ? 'Impossible' : currentTime === 0 ? 'Atteint!' : `${currentTime} mois`}
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Avec réductions</div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-green-500" />
                          <span className="font-semibold text-green-600">
                            {newTime === null ? 'Impossible' : newTime === 0 ? 'Atteint!' : `${newTime} mois`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {timeSaved > 0 && (
                      <div className="mt-3 text-sm text-green-600 bg-green-50 dark:bg-green-950/20 p-2 rounded">
                        ⚡ Vous atteindrez cet objectif {timeSaved} mois plus tôt!
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Messages motivants */}
        {savingsIncrease > 0 && (
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <DollarSign className="h-6 w-6 text-green-600 mt-1" />
                <div>
                  <div className="font-semibold text-green-800 dark:text-green-400 mb-2">
                    Impact sur 1 an
                  </div>
                  <div className="space-y-1 text-sm text-green-700 dark:text-green-300">
                    <p>• Économies annuelles: <strong>{formatPrice(savingsIncrease * 12)}</strong></p>
                    <p>• Valeur nette dans 12 mois: <strong>{formatPrice(projectNetWorth(12, newMonthlySavings))}</strong></p>
                    <p>• Amélioration: <strong>+{formatPrice(savingsIncrease * 12)}</strong> comparé au scénario actuel</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {savingsIncrease === 0 && (
          <div className="text-center text-muted-foreground py-6">
            👆 Ajustez les curseurs ci-dessus pour simuler différents scénarios
          </div>
        )}
      </CardContent>
    </Card>
  );
};
