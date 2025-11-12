import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, AlertCircle, Snowflake, Sun, Leaf, Cloud } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface MonthlyComparisonChartProps {
  transactions: any[];
}

export const MonthlyComparisonChart = ({ transactions }: MonthlyComparisonChartProps) => {
  const [period, setPeriod] = useState<string>("1year");

  // Group transactions by month
  const monthlyData: { [key: string]: { income: number, expenses: number, month: string, year: number } } = {};
  
  transactions.forEach(t => {
    const date = new Date(t.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        income: 0,
        expenses: 0,
        month: date.toLocaleDateString('fr-CA', { month: 'short' }),
        year: date.getFullYear()
      };
    }
    
    if (t.type === 'income') {
      monthlyData[monthKey].income += t.amount;
    } else {
      monthlyData[monthKey].expenses += t.amount;
    }
  });

  // Determine how many months to show based on period
  let monthsToShow = 12;
  switch (period) {
    case "3months":
      monthsToShow = 3;
      break;
    case "6months":
      monthsToShow = 6;
      break;
    case "1year":
      monthsToShow = 12;
      break;
  }

  // Convert to array and sort by date
  const chartData = Object.entries(monthlyData)
    .map(([key, data]) => ({
      monthLabel: `${data.month} ${data.year}`,
      monthKey: key,
      ...data,
      balance: data.income - data.expenses
    }))
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
    .slice(-monthsToShow);

  // Calculate month-over-month changes
  const changes = chartData.map((current, index) => {
    if (index === 0) return null;
    const previous = chartData[index - 1];
    
    const expenseChange = ((current.expenses - previous.expenses) / previous.expenses) * 100;
    const incomeChange = ((current.income - previous.income) / previous.income) * 100;
    
    return {
      month: current.monthLabel,
      expenseChange,
      incomeChange,
      expenseAmount: current.expenses - previous.expenses,
      isAbnormal: Math.abs(expenseChange) > 20 // More than 20% change is abnormal
    };
  }).filter(Boolean);

  // Detect seasonal trends
  const seasonalData: { [key: string]: { expenses: number[], income: number[] } } = {
    'Hiver': { expenses: [], income: [] },
    'Printemps': { expenses: [], income: [] },
    'Été': { expenses: [], income: [] },
    'Automne': { expenses: [], income: [] }
  };

  chartData.forEach(data => {
    const monthNum = new Date(data.monthKey + '-01').getMonth();
    let season = '';
    
    if (monthNum >= 0 && monthNum <= 2) season = 'Hiver';
    else if (monthNum >= 3 && monthNum <= 5) season = 'Printemps';
    else if (monthNum >= 6 && monthNum <= 8) season = 'Été';
    else season = 'Automne';
    
    seasonalData[season].expenses.push(data.expenses);
    seasonalData[season].income.push(data.income);
  });

  const seasonalAverages = Object.entries(seasonalData).map(([season, data]) => ({
    season,
    avgExpenses: data.expenses.length > 0 ? data.expenses.reduce((a, b) => a + b, 0) / data.expenses.length : 0,
    avgIncome: data.income.length > 0 ? data.income.reduce((a, b) => a + b, 0) / data.income.length : 0
  }));

  // Find highest and lowest expense seasons
  const sortedSeasons = [...seasonalAverages].sort((a, b) => b.avgExpenses - a.avgExpenses);
  const highestExpenseSeason = sortedSeasons[0];
  const lowestExpenseSeason = sortedSeasons[sortedSeasons.length - 1];

  // Detect abnormal increases
  const abnormalIncreases = changes.filter(c => c?.isAbnormal && c.expenseChange > 0);

  const getSeasonIcon = (season: string) => {
    switch(season) {
      case 'Hiver': return <Snowflake className="h-4 w-4" />;
      case 'Printemps': return <Leaf className="h-4 w-4" />;
      case 'Été': return <Sun className="h-4 w-4" />;
      case 'Automne': return <Cloud className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Comparaison Mensuelle
            </CardTitle>
            <CardDescription>
              Analyse des variations et tendances saisonnières
            </CardDescription>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">3 mois</SelectItem>
              <SelectItem value="6months">6 mois</SelectItem>
              <SelectItem value="1year">1 an</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Abnormal Increases Alert */}
        {abnormalIncreases.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Augmentations anormales détectées !</strong>
              <ul className="mt-2 list-disc list-inside">
                {abnormalIncreases.map((change, index) => (
                  <li key={index}>
                    {change?.month} : +{change?.expenseChange.toFixed(1)}% 
                    ({change?.expenseAmount > 0 ? '+' : ''}{change?.expenseAmount.toLocaleString('fr-CA')} $)
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Monthly Comparison Chart */}
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="monthLabel" 
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k$`}
              />
              <Tooltip 
                formatter={(value: number) => `${value.toLocaleString('fr-CA')} $`}
                labelStyle={{ color: '#000' }}
              />
              <Legend />
              <Bar dataKey="income" fill="#10b981" name="Revenus" />
              <Bar dataKey="expenses" fill="#ef4444" name="Dépenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Month-over-Month Changes */}
        <div className="space-y-3">
          <h4 className="font-semibold">Variations mensuelles</h4>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {changes.slice(-6).reverse().map((change, index) => (
              <div 
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  change?.isAbnormal ? 'bg-red-50 dark:bg-red-950/20' : 'bg-muted'
                }`}
              >
                <div className="flex items-center gap-2">
                  {change?.expenseChange > 0 ? (
                    <TrendingUp className="h-4 w-4 text-red-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-green-500" />
                  )}
                  <span className="text-sm font-medium">{change?.month}</span>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${
                    change?.expenseChange > 0 ? 'text-red-500' : 'text-green-500'
                  }`}>
                    {change?.expenseChange > 0 ? '+' : ''}{change?.expenseChange.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {change?.expenseAmount > 0 ? '+' : ''}{change?.expenseAmount.toLocaleString('fr-CA')} $
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Seasonal Trends */}
        <div className="space-y-3">
          <h4 className="font-semibold">Tendances saisonnières</h4>
          <div className="grid grid-cols-2 gap-3">
            {seasonalAverages.map((season, index) => (
              <div key={index} className="p-3 bg-muted rounded-lg space-y-1">
                <div className="flex items-center gap-2">
                  {getSeasonIcon(season.season)}
                  <span className="text-sm font-medium">{season.season}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Dépenses moy. : {season.avgExpenses.toLocaleString('fr-CA')} $
                </p>
              </div>
            ))}
          </div>

          {highestExpenseSeason && lowestExpenseSeason && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg space-y-2">
              <p className="text-sm font-medium">📊 Analyse saisonnière</p>
              <p className="text-sm">
                Vos dépenses sont <strong>{((highestExpenseSeason.avgExpenses / lowestExpenseSeason.avgExpenses - 1) * 100).toFixed(0)}% plus élevées</strong> en {highestExpenseSeason.season} qu'en {lowestExpenseSeason.season}.
              </p>
              <p className="text-xs text-muted-foreground">
                Planifiez en conséquence pour lisser vos dépenses tout au long de l'année.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
