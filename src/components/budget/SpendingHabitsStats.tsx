import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPrice } from "@/lib/priceFormat";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#ec4899', '#06b6d4', '#8b5cf6'];

const PERIOD_OPTIONS = [
  { value: '7', label: '7 jours' },
  { value: '30', label: '1 mois' },
  { value: '90', label: '3 mois' },
  { value: '180', label: '6 mois' },
  { value: '365', label: '1 an' },
];

export const SpendingHabitsStats = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const [period, setPeriod] = useState('30');
  const [chartPeriod, setChartPeriod] = useState('7');

  // Fetch transactions based on selected period
  const { data: transactions = [], isLoading, isError } = useQuery({
    queryKey: ['spending-habits', period],
    queryFn: async () => {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(period));
      
      const { data, error } = await supabase
        .from('budget_transactions')
        .select('*, category:budget_categories(*)')
        .eq('type', 'expense')
        .gte('transaction_date', daysAgo.toISOString().split('T')[0]);
      
      if (error) throw error;
      return data;
    },
    enabled: isAuthenticated,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Chargement de vos habitudes...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !isAuthenticated) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Aucune donnée disponible</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate stats
  const totalSpent = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const avgPerDay = totalSpent / parseInt(period);
  const avgPerTransaction = transactions.length > 0 ? totalSpent / transactions.length : 0;

  // Group by category
  const spendingByCategory = transactions.reduce((acc: any, t) => {
    const catName = t.category?.name || 'Autre';
    acc[catName] = (acc[catName] || 0) + Number(t.amount);
    return acc;
  }, {});

  const categoryData = Object.entries(spendingByCategory)
    .map(([name, value]) => ({ name, value: value as number }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Group by day for trend chart
  const chartDays = parseInt(chartPeriod);
  const lastDays = Array.from({ length: chartDays }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (chartDays - 1 - i));
    return date.toISOString().split('T')[0];
  });

  const dailySpending = lastDays.map(date => {
    const total = transactions
      .filter(t => t.transaction_date === date)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    return {
      date: new Date(date).toLocaleDateString('fr-CA', chartDays <= 7 ? { weekday: 'short' } : { day: 'numeric', month: 'short' }),
      total,
    };
  });

  // Find top spending category
  const topCategory = categoryData[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Vos Habitudes de Dépenses
          </h3>
          <p className="text-muted-foreground">Analyse de la période sélectionnée</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              Total dépensé ({PERIOD_OPTIONS.find(p => p.value === period)?.label})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatPrice(totalSpent)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Moyenne par jour
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(avgPerDay)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1">
              <TrendingDown className="h-4 w-4" />
              Moyenne par transaction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(avgPerTransaction)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily trend */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Tendance quotidienne</CardTitle>
              <Select value={chartPeriod} onValueChange={setChartPeriod}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailySpending}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatPrice(value)} />
                <Bar dataKey="total" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par catégorie</CardTitle>
            {topCategory && (
              <CardDescription>
                Top: {topCategory.name} ({((topCategory.value / totalSpent) * 100).toFixed(0)}%)
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name} (${formatPrice(entry.value)})`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatPrice(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      {topCategory && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="text-3xl">💡</div>
              <div>
                <h4 className="font-semibold mb-1">Conseil personnalisé</h4>
                <p className="text-sm text-muted-foreground">
                  Votre catégorie de dépense principale est <strong>{topCategory.name}</strong> avec {formatPrice(topCategory.value)} 
                  ({((topCategory.value / totalSpent) * 100).toFixed(0)}% de vos dépenses). 
                  {topCategory.value > avgPerDay * 15 && " Considérez établir un objectif pour mieux contrôler ces dépenses."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
