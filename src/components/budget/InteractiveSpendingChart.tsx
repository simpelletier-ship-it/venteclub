import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area } from "recharts";
import { formatPrice } from "@/lib/priceFormat";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface InteractiveSpendingChartProps {
  transactions: any[];
  categories: any[];
}

export const InteractiveSpendingChart = ({ transactions, categories }: InteractiveSpendingChartProps) => {
  const [timeRange, setTimeRange] = useState<string>("6months");
  const [chartView, setChartView] = useState<string>("combo");

  const getMonthsData = (months: number) => {
    const monthlyData: { [key: string]: { income: number, expenses: number, categories: { [key: string]: number } } } = {};
    
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months);
    
    transactions
      .filter(t => new Date(t.transaction_date) >= cutoffDate)
      .forEach(t => {
        const date = new Date(t.transaction_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { income: 0, expenses: 0, categories: {} };
        }
        
        if (t.type === 'income') {
          monthlyData[monthKey].income += Number(t.amount);
        } else {
          monthlyData[monthKey].expenses += Number(t.amount);
          
          const category = categories.find(c => c.id === t.category_id);
          if (category) {
            if (!monthlyData[monthKey].categories[category.name]) {
              monthlyData[monthKey].categories[category.name] = 0;
            }
            monthlyData[monthKey].categories[category.name] += Number(t.amount);
          }
        }
      });
    
    return Object.entries(monthlyData)
      .map(([key, data]) => {
        const date = new Date(key + '-01');
        return {
          month: date.toLocaleDateString('fr-CA', { month: 'short', year: '2-digit' }),
          monthKey: key,
          ...data,
          balance: data.income - data.expenses,
          savingsRate: data.income > 0 ? ((data.income - data.expenses) / data.income) * 100 : 0
        };
      })
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  };

  const monthsMap = {
    "3months": 3,
    "6months": 6,
    "12months": 12,
    "24months": 24
  };

  const chartData = getMonthsData(monthsMap[timeRange as keyof typeof monthsMap]);

  // Calculer les tendances
  const avgIncome = chartData.reduce((sum, d) => sum + d.income, 0) / chartData.length || 0;
  const avgExpenses = chartData.reduce((sum, d) => sum + d.expenses, 0) / chartData.length || 0;
  const avgSavingsRate = chartData.reduce((sum, d) => sum + d.savingsRate, 0) / chartData.length || 0;

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Analyse des dépenses
            </CardTitle>
            <CardDescription>
              Vue interactive de vos revenus et dépenses
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3months">3 mois</SelectItem>
                <SelectItem value="6months">6 mois</SelectItem>
                <SelectItem value="12months">12 mois</SelectItem>
                <SelectItem value="24months">24 mois</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={chartView} onValueChange={setChartView}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="combo">Combiné</TabsTrigger>
            <TabsTrigger value="bars">Barres</TabsTrigger>
            <TabsTrigger value="trends">Tendances</TabsTrigger>
          </TabsList>

          <TabsContent value="combo" className="space-y-6">
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
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
                  <Bar dataKey="expenses" fill="#ef4444" name="Dépenses" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="income" fill="#10b981" name="Revenus" radius={[8, 8, 0, 0]} />
                  <Line 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    name="Solde"
                    dot={{ fill: '#3b82f6', r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="bars" className="space-y-6">
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
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
                  <Bar dataKey="income" fill="#10b981" name="Revenus" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="expenses" fill="#ef4444" name="Dépenses" radius={[8, 8, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <defs>
                    <linearGradient id="incomeAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="expensesAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
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
                    fill="url(#incomeAreaGradient)"
                    strokeWidth={2}
                    name="Revenus"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="#ef4444" 
                    fill="url(#expensesAreaGradient)"
                    strokeWidth={2}
                    name="Dépenses"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>

        {/* Statistiques clés */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Revenu moyen</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatPrice(avgIncome)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Dépenses moyennes</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatPrice(avgExpenses)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Taux d'épargne moyen</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {avgSavingsRate.toFixed(1)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
