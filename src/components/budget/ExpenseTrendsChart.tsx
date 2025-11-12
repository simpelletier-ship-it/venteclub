import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatPrice } from "@/lib/priceFormat";
import { TrendingUp, TrendingDown } from "lucide-react";

interface ExpenseTrendsChartProps {
  transactions: any[];
}

export const ExpenseTrendsChart = ({ transactions }: ExpenseTrendsChartProps) => {
  // Get last 6 months data
  const getLast6MonthsData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7);
      const monthName = date.toLocaleDateString('fr-CA', { month: 'short', year: 'numeric' });
      
      const monthTransactions = transactions.filter(t => 
        t.transaction_date?.startsWith(monthKey)
      );
      
      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      data.push({
        month: monthName,
        expenses,
        income,
        net: income - expenses,
      });
    }
    
    return data;
  };

  const chartData = getLast6MonthsData();
  
  // Calculate trend
  const currentMonth = chartData[chartData.length - 1]?.expenses || 0;
  const previousMonth = chartData[chartData.length - 2]?.expenses || 0;
  const trend = previousMonth > 0 ? ((currentMonth - previousMonth) / previousMonth) * 100 : 0;
  const isIncreasing = trend > 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-semibold mb-2">{payload[0].payload.month}</p>
          <div className="space-y-1">
            <p className="text-sm flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Dépenses:</span>
              <span className="font-bold text-red-600 dark:text-red-400">
                {formatPrice(payload[0].value)}
              </span>
            </p>
            <p className="text-sm flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Revenus:</span>
              <span className="font-bold text-green-600 dark:text-green-400">
                {formatPrice(payload[1].value)}
              </span>
            </p>
            <p className="text-sm flex items-center justify-between gap-4 pt-1 border-t">
              <span className="text-muted-foreground">Net:</span>
              <span className={`font-bold ${payload[0].payload.net >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatPrice(payload[0].payload.net)}
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">📈 Évolution des dépenses</CardTitle>
            <CardDescription>6 derniers mois</CardDescription>
          </div>
          {previousMonth > 0 && (
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
              isIncreasing 
                ? 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400' 
                : 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400'
            }`}>
              {isIncreasing ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {Math.abs(trend).toFixed(1)}%
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {chartData.every(d => d.expenses === 0 && d.income === 0) ? (
          <p className="text-center text-muted-foreground py-12">
            Aucune donnée disponible pour les 6 derniers mois
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
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
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value) => value === 'expenses' ? 'Dépenses' : 'Revenus'}
              />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="#ef4444" 
                strokeWidth={3}
                dot={{ fill: '#ef4444', r: 5 }}
                activeDot={{ r: 7 }}
              />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
