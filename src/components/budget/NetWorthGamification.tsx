import { TrendingUp, TrendingDown, Sparkles, LineChart as LineChartIcon, Plus, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/priceFormat";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NetWorthGamificationProps {
  netWorth: number;
  isAuthenticated: boolean;
}

export const NetWorthGamification = ({ netWorth, isAuthenticated }: NetWorthGamificationProps) => {
  const [showChart, setShowChart] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Fetch historical data for chart using asset/debt history
  const { data: historicalData = [] } = useQuery({
    queryKey: ['net-worth-history', selectedPeriod],
    enabled: isAuthenticated,
    retry: 1,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Calculate date range based on period
      const now = new Date();
      const startDate = new Date();
      
      switch (selectedPeriod) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Fetch asset history
      const { data: assetHistory } = await supabase
        .from('asset_history')
        .select('*, asset:user_assets(name)')
        .gte('recorded_at', startDate.toISOString())
        .order('recorded_at');

      // Fetch debt history
      const { data: debtHistory } = await supabase
        .from('debt_history')
        .select('*, debt:user_debts(name)')
        .gte('recorded_at', startDate.toISOString())
        .order('recorded_at');

      // Get current values
      const { data: assets } = await supabase
        .from('user_assets')
        .select('value, id, name');
      
      const { data: debts } = await supabase
        .from('user_debts')
        .select('balance, id, name');

      // Group history by date
      const dateMap = new Map<string, { assets: number; debts: number }>();

      // Add asset history
      assetHistory?.forEach(entry => {
        const date = new Date(entry.recorded_at).toISOString().split('T')[0];
        if (!dateMap.has(date)) {
          dateMap.set(date, { assets: 0, debts: 0 });
        }
      });

      // Add debt history
      debtHistory?.forEach(entry => {
        const date = new Date(entry.recorded_at).toISOString().split('T')[0];
        if (!dateMap.has(date)) {
          dateMap.set(date, { assets: 0, debts: 0 });
        }
      });

      // Sort dates
      const sortedDates = Array.from(dateMap.keys()).sort();

      // Calculate cumulative values for each date
      const currentAssetValues = new Map(assets?.map(a => [a.id, Number(a.value)]) || []);
      const currentDebtValues = new Map(debts?.map(d => [d.id, Number(d.balance)]) || []);

      return sortedDates.map(date => {
        // Update asset values based on history
        assetHistory?.filter(h => new Date(h.recorded_at).toISOString().split('T')[0] === date)
          .forEach(h => currentAssetValues.set(h.asset_id, Number(h.value)));

        // Update debt values based on history
        debtHistory?.filter(h => new Date(h.recorded_at).toISOString().split('T')[0] === date)
          .forEach(h => currentDebtValues.set(h.debt_id, Number(h.balance)));

        const totalAssets = Array.from(currentAssetValues.values()).reduce((sum, v) => sum + v, 0);
        const totalDebts = Array.from(currentDebtValues.values()).reduce((sum, v) => sum + v, 0);

        return {
          date: new Date(date).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' }),
          actifs: totalAssets,
          dettes: totalDebts,
          valeurNette: totalAssets - totalDebts,
        };
      });
    },
  });

  // Calculate period-based change
  const calculatePeriodChange = (period: '7d' | '30d' | '90d' | '1y') => {
    if (!historicalData || historicalData.length < 2) return { amount: 0, percentage: 0 };
    
    // Get first and last data points
    const oldDataPoint = historicalData[0];
    const currentDataPoint = historicalData[historicalData.length - 1];
    
    const currentNetWorth = currentDataPoint?.valeurNette || netWorth;
    const oldNetWorth = oldDataPoint.valeurNette;
    
    const amount = currentNetWorth - oldNetWorth;
    const percentage = oldNetWorth !== 0 ? (amount / Math.abs(oldNetWorth)) * 100 : 0;
    
    return { amount, percentage };
  };

  const periodChange = calculatePeriodChange(selectedPeriod);
  const isPositiveChange = periodChange.amount >= 0;

  // Calcul du pourcentage (0-100%)
  const getPercentage = () => {
    if (netWorth < 0) {
      // Sous l'eau: plus on a de dettes, plus on descend (max -100k = 0%)
      return Math.max(0, ((netWorth + 100000) / 100000) * 25);
    } else if (netWorth <= 1000000) {
      // Progression normale: 0 = 0%, 1M = 75%
      return (netWorth / 1000000) * 75;
    } else {
      // Richesse: 1M = 75%, 10M+ = 100%
      return Math.min(100, 75 + ((netWorth - 1000000) / 9000000) * 25);
    }
  };

  const percentage = getPercentage();
  const isUnderwater = netWorth < 0;
  const isWealth = netWorth > 1000000;
  
  // Messages de progression
  const getMessage = () => {
    if (netWorth < -50000) return "Remontez à la surface 💪";
    if (netWorth < 0) return "Presque là! Continue 🔥";
    if (netWorth < 100000) return "Excellent début 🚀";
    if (netWorth < 500000) return "Momentum impressionnant ⚡";
    if (netWorth < 1000000) return "Presque millionnaire! 🎯";
    if (netWorth < 5000000) return "Liberté financière atteinte 🌟";
    return "Fortune construite! 👑";
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-semibold mb-2">{payload[0].payload.date}</p>
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
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-card via-card to-muted/20">
        <CardContent className="p-8">
        {/* Header minimaliste */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Valeur nette</h3>
            <div className="flex items-center gap-3 mt-2">
              <span className={`text-4xl font-bold tracking-tight ${netWorth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatPrice(netWorth)}
              </span>
              {netWorth >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400 animate-pulse" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-600 dark:text-red-400 animate-pulse" />
              )}
            </div>
            
            {/* Period Change Indicator */}
            {historicalData && historicalData.length > 1 && (
              <div className="mt-3">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                  isPositiveChange 
                    ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400' 
                    : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400'
                }`}>
                  {isPositiveChange ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span>
                    {isPositiveChange ? '+' : ''}{formatPrice(periodChange.amount)} ({isPositiveChange ? '+' : ''}{periodChange.percentage.toFixed(2)}%)
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {isWealth && (
            <div className="animate-bounce">
              <Sparkles className="h-12 w-12 text-yellow-500" />
            </div>
          )}
        </div>

        {/* Period Selector */}
        {historicalData && historicalData.length > 1 && (
          <div className="mb-6">
            <Tabs value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as any)}>
              <TabsList className="grid w-full grid-cols-4 bg-muted/50">
                <TabsTrigger value="7d" className="text-xs">7 jours</TabsTrigger>
                <TabsTrigger value="30d" className="text-xs">30 jours</TabsTrigger>
                <TabsTrigger value="90d" className="text-xs">90 jours</TabsTrigger>
                <TabsTrigger value="1y" className="text-xs">1 an</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}

        {/* Barre de progression professionnelle */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-medium">{getMessage()}</span>
            <span className="text-foreground font-bold">{percentage.toFixed(0)}%</span>
          </div>
          
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            {/* Effet de brillance */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" 
                 style={{ 
                   backgroundSize: '200% 100%',
                   animation: 'shimmer 3s infinite'
                 }} 
            />
            
            {/* Barre de progression avec gradient */}
            <div 
              className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out rounded-full ${
                isUnderwater 
                  ? 'bg-gradient-to-r from-red-600 to-red-400' 
                  : isWealth
                    ? 'bg-gradient-to-r from-yellow-500 via-green-500 to-emerald-500'
                    : 'bg-gradient-to-r from-blue-600 via-cyan-500 to-green-500'
              }`}
              style={{ width: `${percentage}%` }}
            >
              {/* Effet de pulsation sur la barre */}
              <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
            </div>
          </div>

          {/* Milestones minimalistes */}
          <div className="flex justify-between text-xs text-muted-foreground mt-4 px-1">
            {netWorth < 0 ? (
              <>
                <div className="text-center">
                  <div className={`w-1.5 h-1.5 rounded-full mx-auto mb-1 ${netWorth >= -100000 ? 'bg-primary' : 'bg-muted'}`} />
                  <span>-100k</span>
                </div>
                <div className="text-center">
                  <div className={`w-1.5 h-1.5 rounded-full mx-auto mb-1 ${netWorth >= -50000 ? 'bg-primary' : 'bg-muted'}`} />
                  <span>-50k</span>
                </div>
                <div className="text-center">
                  <div className={`w-1.5 h-1.5 rounded-full mx-auto mb-1 ${netWorth >= 0 ? 'bg-primary' : 'bg-muted'}`} />
                  <span>0</span>
                </div>
              </>
            ) : (
              <>
                <div className="text-center">
                  <div className={`w-1.5 h-1.5 rounded-full mx-auto mb-1 bg-primary`} />
                  <span>0</span>
                </div>
                <div className="text-center">
                  <div className={`w-1.5 h-1.5 rounded-full mx-auto mb-1 ${netWorth >= 250000 ? 'bg-primary' : 'bg-muted'}`} />
                  <span>250k</span>
                </div>
                <div className="text-center">
                  <div className={`w-1.5 h-1.5 rounded-full mx-auto mb-1 ${netWorth >= 500000 ? 'bg-primary' : 'bg-muted'}`} />
                  <span>500k</span>
                </div>
                <div className="text-center">
                  <div className={`w-1.5 h-1.5 rounded-full mx-auto mb-1 ${netWorth >= 1000000 ? 'bg-primary' : 'bg-muted'}`} />
                  <span>1M</span>
                </div>
                <div className="text-center">
                  <div className={`w-1.5 h-1.5 rounded-full mx-auto mb-1 ${netWorth >= 5000000 ? 'bg-primary' : 'bg-muted'}`} />
                  <span>5M+</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stats cards minimalistes */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          {/* Variation sur période */}
          <div className="bg-muted/50 rounded-lg p-4 text-center hover:bg-muted transition-colors">
            <div className={`text-2xl font-bold ${isPositiveChange ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {historicalData && historicalData.length > 1 ? (
                <>
                  {isPositiveChange ? '+' : ''}{periodChange.percentage.toFixed(1)}%
                </>
              ) : (
                '0%'
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {selectedPeriod === '7d' ? '7 jours' : selectedPeriod === '30d' ? '30 jours' : selectedPeriod === '90d' ? '90 jours' : '1 an'}
            </div>
          </div>
          
          {/* Valeur nette actuelle */}
          <div className="bg-muted/50 rounded-lg p-4 text-center hover:bg-muted transition-colors">
            <div className="text-2xl font-bold text-foreground">
              {Math.abs(netWorth) >= 1000000 
                ? `${(netWorth / 1000000).toFixed(1)}M` 
                : Math.abs(netWorth) >= 1000 
                  ? `${(netWorth / 1000).toFixed(0)}k`
                  : formatPrice(netWorth)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">valeur nette</div>
          </div>
          
          {/* Ratio actifs/dettes */}
          <div className="bg-muted/50 rounded-lg p-4 text-center hover:bg-muted transition-colors">
            <div className="text-2xl font-bold text-foreground">
              {(() => {
                const latestData = historicalData && historicalData.length > 0 
                  ? historicalData[historicalData.length - 1] 
                  : { actifs: 0, dettes: 0 };
                const ratio = latestData.dettes > 0 
                  ? (latestData.actifs / latestData.dettes).toFixed(1)
                  : latestData.actifs > 0 ? '∞' : '0';
                return ratio;
              })()}
            </div>
            <div className="text-xs text-muted-foreground mt-1">ratio A/D</div>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Evolution Chart */}
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LineChartIcon className="h-5 w-5 text-primary" />
            <CardTitle>Évolution de la valeur nette</CardTitle>
          </div>
        </div>
      </CardHeader>
      
      {showChart && (
        <CardContent>
          {historicalData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={historicalData}>
                <defs>
                  <linearGradient id="colorValeurNette" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorActifs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis 
                  className="text-xs"
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(value) => {
                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                    if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                    return value.toString();
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="line"
                />
                <Area
                  type="monotone"
                  dataKey="actifs"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#colorActifs)"
                  name="Actifs"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="dettes"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fill="none"
                  name="Dettes"
                  strokeDasharray="5 5"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="valeurNette"
                  stroke="#10b981"
                  strokeWidth={3}
                  fill="url(#colorValeurNette)"
                  name="Valeur Nette"
                  dot={{ fill: '#10b981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <LineChartIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg mb-2">Pas encore de données</p>
              <p className="text-sm">Ajoutez des transactions pour voir l'évolution</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
    </div>
  );
};
