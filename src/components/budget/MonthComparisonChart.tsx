import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { formatPrice } from "@/lib/priceFormat";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowRight, TrendingUp, TrendingDown } from "lucide-react";

interface MonthComparisonChartProps {
  transactions: any[];
  categories: any[];
}

export const MonthComparisonChart = ({ transactions, categories }: MonthComparisonChartProps) => {
  const now = new Date();
  const [month1, setMonth1] = useState<Date>(subMonths(now, 1)); // Previous month
  const [month2, setMonth2] = useState<Date>(now); // Current month

  // Generate list of last 12 months for selection
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(now, i);
    return {
      value: date.toISOString(),
      label: format(date, 'MMMM yyyy', { locale: fr }),
      date,
    };
  });

  // Calculate expenses by category for a given month
  const getExpensesByCategory = (month: Date) => {
    const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
    const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    return categories
      .filter(cat => cat.type === 'expense')
      .map(category => {
        const categoryTransactions = transactions.filter(
          t => t.category_id === category.id && 
          t.type === 'expense' && 
          t.transaction_date >= startStr &&
          t.transaction_date <= endStr
        );
        
        const total = categoryTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
        
        return {
          category: category.name,
          value: total,
          icon: category.icon,
          color: category.color || '#6366f1',
        };
      })
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  };

  const expenses1 = getExpensesByCategory(month1);
  const expenses2 = getExpensesByCategory(month2);

  const total1 = expenses1.reduce((sum, item) => sum + item.value, 0);
  const total2 = expenses2.reduce((sum, item) => sum + item.value, 0);
  const difference = total2 - total1;
  const percentChange = total1 > 0 ? ((difference / total1) * 100) : 0;

  // Combine categories from both months
  const allCategories = Array.from(
    new Set([...expenses1.map(e => e.category), ...expenses2.map(e => e.category)])
  );

  const comparisonData = allCategories.map(categoryName => {
    const exp1 = expenses1.find(e => e.category === categoryName);
    const exp2 = expenses2.find(e => e.category === categoryName);
    
    return {
      category: categoryName,
      icon: exp1?.icon || exp2?.icon || '📊',
      month1: exp1?.value || 0,
      month2: exp2?.value || 0,
      color: exp1?.color || exp2?.color || '#6366f1',
    };
  }).sort((a, b) => (b.month1 + b.month2) - (a.month1 + a.month2));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-semibold mb-2">{payload[0].payload.category}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatPrice(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">📊</span>
          Comparateur de mois
        </CardTitle>
        <CardDescription>
          Comparez vos dépenses entre deux mois différents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Month selectors */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Premier mois</label>
            <Select
              value={month1.toISOString()}
              onValueChange={(value) => setMonth1(new Date(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ArrowRight className="h-5 w-5 text-muted-foreground mt-6" />

          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Deuxième mois</label>
            <Select
              value={month2.toISOString()}
              onValueChange={(value) => setMonth2(new Date(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">
                {format(month1, 'MMMM yyyy', { locale: fr })}
              </p>
              <p className="text-2xl font-bold">{formatPrice(total1)}</p>
            </CardContent>
          </Card>
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">
                {format(month2, 'MMMM yyyy', { locale: fr })}
              </p>
              <p className="text-2xl font-bold">{formatPrice(total2)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Difference indicator */}
        <div className="flex items-center justify-center gap-2 p-4 bg-muted/30 rounded-lg">
          {difference !== 0 ? (
            <>
              {difference > 0 ? (
                <TrendingUp className="h-5 w-5 text-red-500" />
              ) : (
                <TrendingDown className="h-5 w-5 text-green-500" />
              )}
              <span className={`text-lg font-bold ${difference > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {difference > 0 ? '+' : ''}{formatPrice(Math.abs(difference))}
              </span>
              <span className="text-sm text-muted-foreground">
                ({percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%)
              </span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">Dépenses identiques</span>
          )}
        </div>

        {/* Comparison chart */}
        {comparisonData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="category" 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'currentColor' }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="month1" 
                fill="#94a3b8"
                name={format(month1, 'MMM yyyy', { locale: fr })}
              />
              <Bar 
                dataKey="month2" 
                fill="#6366f1"
                name={format(month2, 'MMM yyyy', { locale: fr })}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[400px] text-center">
            <div className="space-y-2">
              <p className="text-4xl">📊</p>
              <p className="text-lg font-semibold">Aucune donnée</p>
              <p className="text-sm text-muted-foreground">
                Aucune dépense pour les mois sélectionnés
              </p>
            </div>
          </div>
        )}

        {/* Category breakdown */}
        {comparisonData.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Détails par catégorie</h4>
            <div className="space-y-2">
              {comparisonData.map(item => {
                const diff = item.month2 - item.month1;
                const percChange = item.month1 > 0 ? ((diff / item.month1) * 100) : 0;
                
                return (
                  <div key={item.category} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{item.icon}</span>
                      <span className="font-medium">{item.category}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {formatPrice(item.month1)}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {formatPrice(item.month2)}
                      </span>
                      {diff !== 0 && (
                        <span className={`text-xs font-medium ${diff > 0 ? 'text-red-500' : 'text-green-500'}`}>
                          ({diff > 0 ? '+' : ''}{percChange.toFixed(0)}%)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
