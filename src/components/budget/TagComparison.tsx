import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts";
import { formatPrice } from "@/lib/priceFormat";
import { TrendingUp, TrendingDown, Minus, GitCompare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TagComparisonProps {
  isAuthenticated: boolean;
}

interface ComparisonData {
  tag_id: string;
  tag_name: string;
  tag_icon: string;
  tag_color: string;
  period1_amount: number;
  period2_amount: number;
  difference: number;
  percentage_change: number;
}

export const TagComparison = ({ isAuthenticated }: TagComparisonProps) => {
  const [comparisonType, setComparisonType] = useState<'month' | 'year'>('month');

  const { data: comparisonData = [], isLoading } = useQuery({
    queryKey: ['tag-comparison', comparisonType],
    enabled: isAuthenticated,
    queryFn: async () => {
      const now = new Date();
      let period1Start: Date, period1End: Date, period2Start: Date, period2End: Date;

      if (comparisonType === 'month') {
        // Current month
        period1Start = new Date(now.getFullYear(), now.getMonth(), 1);
        period1End = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        // Previous month
        period2Start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        period2End = new Date(now.getFullYear(), now.getMonth(), 0);
      } else {
        // Current year
        period1Start = new Date(now.getFullYear(), 0, 1);
        period1End = new Date(now.getFullYear(), 11, 31);
        
        // Previous year
        period2Start = new Date(now.getFullYear() - 1, 0, 1);
        period2End = new Date(now.getFullYear() - 1, 11, 31);
      }

      // Fetch transactions for both periods
      const { data: period1Txs, error: p1Error } = await supabase
        .from('budget_transactions')
        .select('id, amount, transaction_date, type')
        .eq('type', 'expense')
        .gte('transaction_date', period1Start.toISOString().split('T')[0])
        .lte('transaction_date', period1End.toISOString().split('T')[0]);

      if (p1Error) throw p1Error;

      const { data: period2Txs, error: p2Error } = await supabase
        .from('budget_transactions')
        .select('id, amount, transaction_date, type')
        .eq('type', 'expense')
        .gte('transaction_date', period2Start.toISOString().split('T')[0])
        .lte('transaction_date', period2End.toISOString().split('T')[0]);

      if (p2Error) throw p2Error;

      if ((!period1Txs || period1Txs.length === 0) && (!period2Txs || period2Txs.length === 0)) {
        return [];
      }

      const allTxIds = [
        ...(period1Txs?.map(t => t.id) || []),
        ...(period2Txs?.map(t => t.id) || [])
      ];

      if (allTxIds.length === 0) return [];

      // Get tag links
      const { data: tagLinks, error: linkError } = await supabase
        .from('transaction_tag_links')
        .select('transaction_id, tag_id')
        .in('transaction_id', allTxIds);

      if (linkError) throw linkError;
      if (!tagLinks || tagLinks.length === 0) return [];

      const tagIds = [...new Set(tagLinks.map(l => l.tag_id))];

      // Get tag details
      const { data: tags, error: tagError } = await supabase
        .from('transaction_tags')
        .select('*')
        .in('id', tagIds);

      if (tagError) throw tagError;
      if (!tags) return [];

      // Calculate comparison data
      const comparisonMap = new Map<string, ComparisonData>();

      tagLinks.forEach(link => {
        const tx1 = period1Txs?.find(t => t.id === link.transaction_id);
        const tx2 = period2Txs?.find(t => t.id === link.transaction_id);
        const tag = tags.find(t => t.id === link.tag_id);
        
        if (!tag) return;

        const existing = comparisonMap.get(tag.id);
        if (existing) {
          if (tx1) existing.period1_amount += tx1.amount;
          if (tx2) existing.period2_amount += tx2.amount;
        } else {
          comparisonMap.set(tag.id, {
            tag_id: tag.id,
            tag_name: tag.name,
            tag_icon: tag.icon,
            tag_color: tag.color,
            period1_amount: tx1 ? tx1.amount : 0,
            period2_amount: tx2 ? tx2.amount : 0,
            difference: 0,
            percentage_change: 0,
          });
        }
      });

      // Calculate differences and percentage changes
      const result = Array.from(comparisonMap.values()).map(item => {
        const difference = item.period1_amount - item.period2_amount;
        const percentageChange = item.period2_amount > 0 
          ? ((difference / item.period2_amount) * 100) 
          : 0;
        
        return {
          ...item,
          difference,
          percentage_change: percentageChange,
        };
      }).sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));

      return result;
    },
  });

  const getTrendIcon = (change: number) => {
    if (change > 5) return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (change < -5) return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 5) return 'text-red-600 dark:text-red-400';
    if (change < -5) return 'text-green-600 dark:text-green-400';
    return 'text-muted-foreground';
  };

  const chartData = comparisonData.map(item => ({
    name: item.tag_name,
    [comparisonType === 'month' ? 'Mois actuel' : 'Année actuelle']: item.period1_amount,
    [comparisonType === 'month' ? 'Mois précédent' : 'Année précédente']: item.period2_amount,
  }));

  const period1Label = comparisonType === 'month' ? 'Mois actuel' : 'Année actuelle';
  const period2Label = comparisonType === 'month' ? 'Mois précédent' : 'Année précédente';

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (comparisonData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            Analyse Comparative par Tag
          </CardTitle>
          <CardDescription>Comparez vos dépenses par tag entre deux périodes</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Aucune donnée avec tags pour effectuer une comparaison
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              Analyse Comparative par Tag
            </CardTitle>
            <CardDescription>Comparez vos dépenses par tag entre deux périodes</CardDescription>
          </div>
          <Select value={comparisonType} onValueChange={(v) => setComparisonType(v as any)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mois actuel vs précédent</SelectItem>
              <SelectItem value="year">Année actuelle vs précédente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Bar Chart Comparison */}
        <div>
          <h4 className="text-sm font-medium mb-4">Comparaison visuelle</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                className="text-xs"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis className="text-xs" />
              <Tooltip 
                formatter={(value: number) => formatPrice(value)}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Bar dataKey={period1Label} fill="#6366f1" radius={[8, 8, 0, 0]} />
              <Bar dataKey={period2Label} fill="#94a3b8" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Evolution Line Chart */}
        <div>
          <h4 className="text-sm font-medium mb-4">Évolution des dépenses</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                className="text-xs"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis className="text-xs" />
              <Tooltip 
                formatter={(value: number) => formatPrice(value)}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey={period1Label} 
                stroke="#6366f1" 
                strokeWidth={2}
                dot={{ fill: '#6366f1', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey={period2Label} 
                stroke="#94a3b8" 
                strokeWidth={2}
                dot={{ fill: '#94a3b8', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed Comparison Table */}
        <div>
          <h4 className="text-sm font-medium mb-4">Analyse détaillée</h4>
          <div className="space-y-3">
            {comparisonData.map((item) => (
              <div 
                key={item.tag_id} 
                className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-2xl">{item.tag_icon}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{item.tag_name}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">{period1Label}</p>
                          <p className="font-bold">{formatPrice(item.period1_amount)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{period2Label}</p>
                          <p className="font-bold">{formatPrice(item.period2_amount)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end mb-1">
                      {getTrendIcon(item.percentage_change)}
                      <span className={`font-bold text-lg ${getTrendColor(item.percentage_change)}`}>
                        {item.percentage_change > 0 ? '+' : ''}{item.percentage_change.toFixed(1)}%
                      </span>
                    </div>
                    <p className={`text-sm font-medium ${getTrendColor(item.percentage_change)}`}>
                      {item.difference > 0 ? '+' : ''}{formatPrice(item.difference)}
                    </p>
                    {Math.abs(item.percentage_change) > 20 && (
                      <Badge variant="destructive" className="mt-2 text-xs">
                        Changement significatif
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <h4 className="text-sm font-medium mb-2">💡 Résumé</h4>
          <div className="space-y-2 text-sm">
            {comparisonData.filter(i => i.percentage_change > 20).length > 0 && (
              <p className="text-red-600 dark:text-red-400">
                ⚠️ <strong>{comparisonData.filter(i => i.percentage_change > 20).length}</strong> tag(s) avec augmentation significative (&gt;20%)
              </p>
            )}
            {comparisonData.filter(i => i.percentage_change < -20).length > 0 && (
              <p className="text-green-600 dark:text-green-400">
                ✅ <strong>{comparisonData.filter(i => i.percentage_change < -20).length}</strong> tag(s) avec réduction significative (&gt;20%)
              </p>
            )}
            {comparisonData.filter(i => Math.abs(i.percentage_change) <= 5).length > 0 && (
              <p className="text-muted-foreground">
                📊 <strong>{comparisonData.filter(i => Math.abs(i.percentage_change) <= 5).length}</strong> tag(s) avec dépenses stables (±5%)
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
