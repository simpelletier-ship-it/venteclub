import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp, Calendar, DollarSign } from "lucide-react";
import { formatPrice } from "@/lib/priceFormat";
import { Badge } from "@/components/ui/badge";

interface BudgetForecastProps {
  transactions: any[];
}

export const BudgetForecast = ({ transactions }: BudgetForecastProps) => {
  // Calculer les moyennes mensuelles des 6 derniers mois
  const getLast6MonthsData = () => {
    const monthlyData: { [key: string]: { income: number, expenses: number } } = {};
    
    transactions.forEach(t => {
      const date = new Date(t.transaction_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0 };
      }
      
      if (t.type === 'income') {
        monthlyData[monthKey].income += Number(t.amount);
      } else {
        monthlyData[monthKey].expenses += Number(t.amount);
      }
    });
    
    return Object.entries(monthlyData)
      .map(([key, data]) => ({
        monthKey: key,
        ...data,
        balance: data.income - data.expenses
      }))
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .slice(-6);
  };

  const historicalData = getLast6MonthsData();
  
  // Calculer la tendance (régression linéaire simple)
  const calculateTrend = (data: number[]) => {
    const n = data.length;
    if (n === 0) return 0;
    
    const sumX = data.reduce((sum, _, i) => sum + i, 0);
    const sumY = data.reduce((sum, val) => sum + val, 0);
    const sumXY = data.reduce((sum, val, i) => sum + (i * val), 0);
    const sumX2 = data.reduce((sum, _, i) => sum + (i * i), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  };

  const incomeValues = historicalData.map(d => d.income);
  const expenseValues = historicalData.map(d => d.expenses);
  
  const incomeTrend = calculateTrend(incomeValues);
  const expenseTrend = calculateTrend(expenseValues);
  
  const avgIncome = incomeValues.reduce((a, b) => a + b, 0) / incomeValues.length;
  const avgExpenses = expenseValues.reduce((a, b) => a + b, 0) / expenseValues.length;
  
  // Prévoir les 3 prochains mois
  const forecastNextMonths = () => {
    const forecast = [];
    const startMonth = historicalData.length;
    
    for (let i = 1; i <= 3; i++) {
      const month = startMonth + i;
      const predictedIncome = avgIncome + (incomeTrend * month);
      const predictedExpenses = avgExpenses + (expenseTrend * month);
      
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      
      forecast.push({
        month: date.toLocaleDateString('fr-CA', { month: 'short', year: 'numeric' }),
        income: Math.max(0, predictedIncome),
        expenses: Math.max(0, predictedExpenses),
        balance: Math.max(0, predictedIncome) - Math.max(0, predictedExpenses),
        isForecast: true
      });
    }
    
    return forecast;
  };

  const forecastData = forecastNextMonths();
  
  // Combiner données historiques et prévisions
  const chartData = [
    ...historicalData.map(d => ({
      month: new Date(d.monthKey + '-01').toLocaleDateString('fr-CA', { month: 'short', year: 'numeric' }),
      income: d.income,
      expenses: d.expenses,
      balance: d.balance,
      isForecast: false
    })),
    ...forecastData
  ];

  // Calcul de la confiance de la prévision
  const forecastConfidence = () => {
    if (historicalData.length < 3) return 'low';
    if (historicalData.length < 5) return 'medium';
    return 'high';
  };

  const confidence = forecastConfidence();
  const confidenceLabels = {
    low: { label: 'Faible', color: 'destructive' },
    medium: { label: 'Moyenne', color: 'default' },
    high: { label: 'Élevée', color: 'default' }
  } as const;

  // Prédictions clés
  const next3MonthsAvgIncome = forecastData.reduce((sum, d) => sum + d.income, 0) / 3;
  const next3MonthsAvgExpenses = forecastData.reduce((sum, d) => sum + d.expenses, 0) / 3;
  const projectedSavings = next3MonthsAvgIncome - next3MonthsAvgExpenses;

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Prévision budgétaire
            </CardTitle>
            <CardDescription className="mt-2">
              Projection des 3 prochains mois basée sur vos tendances
            </CardDescription>
          </div>
          <Badge variant={confidenceLabels[confidence].color}>
            Confiance: {confidenceLabels[confidence].label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Graphique de prévision */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month" 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => formatPrice(value)}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#10b981"
                  fill="url(#incomeGradient)"
                  strokeWidth={2}
                  name="Revenus"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  fill="url(#expensesGradient)"
                  strokeWidth={2}
                  name="Dépenses"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Statistiques de prévision */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Revenus moyens prévus</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatPrice(next3MonthsAvgIncome)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Dépenses moyennes prévues</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatPrice(next3MonthsAvgExpenses)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Épargne projetée/mois</p>
              <p className={`text-2xl font-bold ${projectedSavings > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatPrice(projectedSavings)}
              </p>
            </div>
          </div>

          {/* Recommandations basées sur la prévision */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Recommandations
            </h4>
            <div className="space-y-2">
              {projectedSavings > 0 && (
                <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg text-sm">
                  <p className="text-green-900 dark:text-green-100">
                    📈 Excellent! Vous devriez épargner environ <strong>{formatPrice(projectedSavings * 3)}</strong> au cours des 3 prochains mois.
                  </p>
                </div>
              )}
              {projectedSavings < 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg text-sm">
                  <p className="text-red-900 dark:text-red-100">
                    ⚠️ Attention! Selon les tendances, vous pourriez dépasser votre budget de <strong>{formatPrice(Math.abs(projectedSavings * 3))}</strong> dans les 3 prochains mois.
                  </p>
                </div>
              )}
              {expenseTrend > 0 && (
                <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg text-sm">
                  <p className="text-orange-900 dark:text-orange-100">
                    📊 Vos dépenses sont en hausse. Considérez réviser votre budget pour les catégories les plus dépensières.
                  </p>
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            * Les prévisions sont basées sur vos habitudes des 6 derniers mois et peuvent varier selon vos dépenses futures.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
