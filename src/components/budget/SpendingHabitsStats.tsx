import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";
import { formatPrice } from "@/lib/priceFormat";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#ec4899', '#06b6d4', '#8b5cf6'];

export const SpendingHabitsStats = () => {
  // Fetch transactions from last 30 days
  const { data: transactions = [] } = useQuery({
    queryKey: ['spending-habits'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('budget_transactions')
        .select('*, category:budget_categories(*)')
        .eq('type', 'expense')
        .gte('transaction_date', thirtyDaysAgo.toISOString().split('T')[0]);
      
      if (error) throw error;
      return data;
    },
  });

  // Calculate stats
  const totalSpent = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const avgPerDay = totalSpent / 30;
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

  // Group by day for trend
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  const dailySpending = last7Days.map(date => {
    const total = transactions
      .filter(t => t.transaction_date === date)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    return {
      date: new Date(date).toLocaleDateString('fr-CA', { weekday: 'short' }),
      total,
    };
  });

  // Find top spending category
  const topCategory = categoryData[0];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          Vos Habitudes de Dépenses
        </h3>
        <p className="text-muted-foreground">Analyse des 30 derniers jours</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              Total dépensé (30j)
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
            <CardTitle>Tendance des 7 derniers jours</CardTitle>
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
