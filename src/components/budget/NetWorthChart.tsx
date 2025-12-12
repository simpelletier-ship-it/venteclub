import { TrendingUp, CreditCard, Home } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/priceFormat";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

interface NetWorthChartProps {
  netWorth: number;
  totalAssets: number;
  totalDebts: number;
  assetNames: string[];
  debtNames: string[];
  isAuthenticated: boolean;
}

export const NetWorthChart = ({ 
  netWorth, 
  totalAssets, 
  totalDebts, 
  assetNames, 
  debtNames,
  isAuthenticated 
}: NetWorthChartProps) => {
  const queryClient = useQueryClient();

  // Subscribe to realtime changes
  useEffect(() => {
    if (!isAuthenticated) return;

    const channel = supabase
      .channel('net-worth-chart-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_assets' }, () => {
        queryClient.invalidateQueries({ queryKey: ['net-worth-chart-history'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_debts' }, () => {
        queryClient.invalidateQueries({ queryKey: ['net-worth-chart-history'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'asset_history' }, () => {
        queryClient.invalidateQueries({ queryKey: ['net-worth-chart-history'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'debt_history' }, () => {
        queryClient.invalidateQueries({ queryKey: ['net-worth-chart-history'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, queryClient]);

  // Fetch 1 year historical data
  const { data: chartData = [] } = useQuery({
    queryKey: ['net-worth-chart-history'],
    enabled: isAuthenticated,
    retry: 1,
    staleTime: 0,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);

      const { data: assetHistory } = await supabase
        .from('asset_history')
        .select('*, asset:user_assets(name)')
        .eq('user_id', user.id)
        .gte('recorded_at', startDate.toISOString())
        .order('recorded_at');

      const { data: debtHistory } = await supabase
        .from('debt_history')
        .select('*, debt:user_debts(name)')
        .eq('user_id', user.id)
        .gte('recorded_at', startDate.toISOString())
        .order('recorded_at');

      const { data: assets } = await supabase
        .from('user_assets')
        .select('value, id')
        .eq('user_id', user.id);
      
      const { data: debts } = await supabase
        .from('user_debts')
        .select('balance, id')
        .eq('user_id', user.id);

      // Generate monthly data points
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
      const today = new Date();
      const result = [];

      // Track values by asset/debt
      const assetValues = new Map<string, number>();
      const debtValues = new Map<string, number>();
      assets?.forEach(a => assetValues.set(a.id, 0));
      debts?.forEach(d => debtValues.set(d.id, 0));

      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(today);
        monthDate.setMonth(today.getMonth() - i);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
        const monthLabel = months[monthDate.getMonth()];

        // Update values from history up to this month
        assetHistory?.filter(h => new Date(h.recorded_at) <= monthEnd)
          .forEach(h => assetValues.set(h.asset_id, Number(h.value)));
        debtHistory?.filter(h => new Date(h.recorded_at) <= monthEnd)
          .forEach(h => debtValues.set(h.debt_id, Number(h.balance)));

        const totalA = Array.from(assetValues.values()).reduce((sum, v) => sum + v, 0);
        const totalD = Array.from(debtValues.values()).reduce((sum, v) => sum + v, 0);

        result.push({
          month: monthLabel,
          valeurNette: totalA - totalD,
        });
      }

      // Replace last point with current values
      const currentAssets = assets?.reduce((sum, a) => sum + Number(a.value), 0) || 0;
      const currentDebts = debts?.reduce((sum, d) => sum + Number(d.balance), 0) || 0;
      if (result.length > 0) {
        result[result.length - 1].valeurNette = currentAssets - currentDebts;
      }

      return result;
    },
  });

  // Calculate year change
  const calculateYearChange = () => {
    if (!chartData || chartData.length < 2) return 0;
    const firstValue = chartData[0]?.valeurNette || 0;
    const lastValue = chartData[chartData.length - 1]?.valeurNette || netWorth;
    if (firstValue === 0) return 0;
    return ((lastValue - firstValue) / Math.abs(firstValue)) * 100;
  };

  const yearChange = calculateYearChange();
  const isPositive = yearChange >= 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg px-3 py-2">
          <p className="text-sm font-medium">{formatPrice(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="overflow-hidden border-border shadow-sm">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              PATRIMOINE NET
            </p>
            <p className={`text-4xl font-bold tracking-tight ${netWorth >= 0 ? 'text-foreground' : 'text-destructive'}`}>
              {formatPrice(netWorth)}
            </p>
          </div>
          
          {/* Year Change Badge */}
          {chartData.length > 1 && (
            <div className="flex flex-col items-end">
              <div className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold ${
                isPositive 
                  ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400' 
                  : 'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400'
              }`}>
                <TrendingUp className={`h-4 w-4 ${!isPositive && 'rotate-180'}`} />
                <span>{isPositive ? '+' : ''}{yearChange.toFixed(1)}%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">vs année dernière</p>
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="h-40 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                dy={10}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="valeurNette"
                stroke="hsl(var(--success))"
                strokeWidth={2.5}
                fill="url(#netWorthGradient)"
                dot={false}
                activeDot={{ r: 4, fill: 'hsl(var(--success))', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Assets & Debts Summary */}
        <div className="grid grid-cols-2 gap-8 mt-6 pt-6 border-t border-border">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Actifs</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatPrice(totalAssets)}
            </p>
            {assetNames.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                <CreditCard className="h-3.5 w-3.5" />
                <span>{assetNames.slice(0, 3).join(', ')}{assetNames.length > 3 ? '...' : ''}</span>
              </div>
            )}
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-1">Passifs</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatPrice(totalDebts)}
            </p>
            {debtNames.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                <Home className="h-3.5 w-3.5" />
                <span>{debtNames.slice(0, 3).join(', ')}{debtNames.length > 3 ? '...' : ''}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
