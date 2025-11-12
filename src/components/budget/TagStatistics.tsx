import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { formatPrice } from "@/lib/priceFormat";
import { Tag } from "lucide-react";

interface TagStatisticsProps {
  isAuthenticated: boolean;
}

interface TagStats {
  tag_id: string;
  tag_name: string;
  tag_color: string;
  tag_icon: string;
  total_amount: number;
  transaction_count: number;
}

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#ef4444', '#14b8a6'];

export const TagStatistics = ({ isAuthenticated }: TagStatisticsProps) => {
  const [period, setPeriod] = useState('30');

  const { data: tagStats = [] } = useQuery({
    queryKey: ['tag-statistics', period],
    enabled: isAuthenticated,
    queryFn: async () => {
      const daysAgo = parseInt(period);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Get all transactions with their tags
      const { data: transactions, error: txError } = await supabase
        .from('budget_transactions')
        .select('id, amount, transaction_date, type')
        .eq('type', 'expense')
        .gte('transaction_date', startDate.toISOString().split('T')[0]);

      if (txError) throw txError;
      if (!transactions || transactions.length === 0) return [];

      const transactionIds = transactions.map(t => t.id);

      // Get tag links
      const { data: tagLinks, error: linkError } = await supabase
        .from('transaction_tag_links')
        .select('transaction_id, tag_id')
        .in('transaction_id', transactionIds);

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

      // Calculate stats per tag
      const statsMap = new Map<string, TagStats>();

      tagLinks.forEach(link => {
        const transaction = transactions.find(t => t.id === link.transaction_id);
        const tag = tags.find(t => t.id === link.tag_id);
        
        if (!transaction || !tag) return;

        const existing = statsMap.get(tag.id);
        if (existing) {
          existing.total_amount += transaction.amount;
          existing.transaction_count += 1;
        } else {
          statsMap.set(tag.id, {
            tag_id: tag.id,
            tag_name: tag.name,
            tag_color: tag.color,
            tag_icon: tag.icon,
            total_amount: transaction.amount,
            transaction_count: 1,
          });
        }
      });

      return Array.from(statsMap.values()).sort((a, b) => b.total_amount - a.total_amount);
    },
  });

  if (tagStats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Statistiques par Tag
          </CardTitle>
          <CardDescription>Analysez vos dépenses par étiquette</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Aucune transaction avec tags pour la période sélectionnée
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Statistiques par Tag
            </CardTitle>
            <CardDescription>Analysez vos dépenses par étiquette</CardDescription>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 derniers jours</SelectItem>
              <SelectItem value="30">30 derniers jours</SelectItem>
              <SelectItem value="90">3 mois</SelectItem>
              <SelectItem value="180">6 mois</SelectItem>
              <SelectItem value="365">1 an</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Bar Chart */}
        <div>
          <h4 className="text-sm font-medium mb-4">Montant total par tag</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tagStats}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="tag_name" 
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
              <Bar dataKey="total_amount" radius={[8, 8, 0, 0]}>
                {tagStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.tag_color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div>
          <h4 className="text-sm font-medium mb-4">Répartition des dépenses</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={tagStats}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ tag_name, percent }) => `${tag_name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                dataKey="total_amount"
              >
                {tagStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.tag_color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => formatPrice(value)}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Stats List */}
        <div>
          <h4 className="text-sm font-medium mb-4">Détails par tag</h4>
          <div className="space-y-3">
            {tagStats.map((stat) => (
              <div key={stat.tag_id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{stat.tag_icon}</span>
                  <div>
                    <p className="font-medium">{stat.tag_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {stat.transaction_count} transaction{stat.transaction_count > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{formatPrice(stat.total_amount)}</p>
                  <p className="text-sm text-muted-foreground">
                    Moy: {formatPrice(stat.total_amount / stat.transaction_count)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
