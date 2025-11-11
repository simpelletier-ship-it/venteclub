import { TrendingUp, TrendingDown, Sparkles, LineChart as LineChartIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/priceFormat";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

interface NetWorthGamificationProps {
  netWorth: number;
}

export const NetWorthGamification = ({ netWorth }: NetWorthGamificationProps) => {
  const [showChart, setShowChart] = useState(false);

  // Fetch historical data for chart
  const { data: historicalData = [] } = useQuery({
    queryKey: ['net-worth-history'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get last 12 months
      const months = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        date.setDate(1);
        months.push({
          month: date.toISOString().split('T')[0],
          label: date.toLocaleDateString('fr-CA', { month: 'short', year: 'numeric' })
        });
      }

      // Get transactions grouped by month
      const { data: transactions } = await supabase
        .from('budget_transactions')
        .select('transaction_date, amount, type')
        .gte('transaction_date', months[0].month)
        .order('transaction_date');

      // Get assets and debts snapshots (current values only for now)
      const { data: assets } = await supabase
        .from('user_assets')
        .select('value');
      
      const { data: debts } = await supabase
        .from('user_debts')
        .select('balance');

      const totalAssets = assets?.reduce((sum, a) => sum + Number(a.value), 0) || 0;
      const totalDebts = debts?.reduce((sum, d) => sum + Number(d.balance), 0) || 0;

      // Calculate cumulative net worth for each month
      let cumulativeIncome = 0;
      let cumulativeExpenses = 0;

      return months.map((month, index) => {
        const monthTransactions = transactions?.filter(t => {
          const tDate = new Date(t.transaction_date);
          const mDate = new Date(month.month);
          return tDate.getMonth() === mDate.getMonth() && 
                 tDate.getFullYear() === mDate.getFullYear();
        }) || [];

        const monthIncome = monthTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0);
        
        const monthExpenses = monthTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        cumulativeIncome += monthIncome;
        cumulativeExpenses += monthExpenses;

        // Simplified calculation: starting point + cumulative transactions
        const estimatedNetWorth = totalAssets - totalDebts + (cumulativeIncome - cumulativeExpenses);

        return {
          month: month.label,
          actifs: totalAssets,
          dettes: totalDebts,
          valeurNette: estimatedNetWorth,
          revenus: monthIncome,
          dépenses: monthExpenses,
        };
      });
    },
  });

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
          <p className="text-sm font-semibold mb-2">{payload[0].payload.month}</p>
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
        <div className="flex items-center justify-between mb-8">
          <div>
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
          </div>
          
          {isWealth && (
            <div className="animate-bounce">
              <Sparkles className="h-12 w-12 text-yellow-500" />
            </div>
          )}
        </div>

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
          <div className="bg-muted/50 rounded-lg p-4 text-center hover:bg-muted transition-colors">
            <div className="text-2xl font-bold text-foreground">
              {netWorth >= 0 ? '+' : ''}{((netWorth / 1000000) * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">vers 1M</div>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4 text-center hover:bg-muted transition-colors">
            <div className="text-2xl font-bold text-foreground">
              {Math.abs(netWorth) < 1000 ? formatPrice(netWorth) : `${(Math.abs(netWorth) / 1000).toFixed(0)}k`}
            </div>
            <div className="text-xs text-muted-foreground mt-1">actuel</div>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-4 text-center hover:bg-muted transition-colors">
            <div className="text-2xl font-bold text-foreground">
              {netWorth >= 1000000 ? '🏆' : netWorth >= 0 ? '📈' : '💪'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">statut</div>
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
          <button
            onClick={() => setShowChart(!showChart)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showChart ? 'Masquer' : 'Afficher'}
          </button>
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
                  dataKey="month" 
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
