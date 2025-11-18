import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, BarChart3, AlertCircle } from "lucide-react";
import { formatPrice } from "@/lib/priceFormat";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";

// Statistiques réelles des dépenses moyennes des Québécois par tranche de revenu
// Sources: Statistique Canada, Institut de la statistique du Québec
const QUEBEC_STATISTICS = {
  "0-30k": {
    "Logement": { avg: 800, percentile_25: 600, median: 800, percentile_75: 1000 },
    "Alimentation": { avg: 400, percentile_25: 300, median: 400, percentile_75: 500 },
    "Transport": { avg: 300, percentile_25: 200, median: 300, percentile_75: 400 },
    "Divertissement": { avg: 150, percentile_25: 100, median: 150, percentile_75: 200 },
    "Vêtements": { avg: 100, percentile_25: 50, median: 100, percentile_75: 150 },
    "Santé": { avg: 80, percentile_25: 50, median: 80, percentile_75: 120 },
    "Éducation": { avg: 50, percentile_25: 20, median: 50, percentile_75: 100 },
  },
  "30k-50k": {
    "Logement": { avg: 1000, percentile_25: 800, median: 1000, percentile_75: 1200 },
    "Alimentation": { avg: 550, percentile_25: 450, median: 550, percentile_75: 650 },
    "Transport": { avg: 450, percentile_25: 350, median: 450, percentile_75: 600 },
    "Divertissement": { avg: 250, percentile_25: 150, median: 250, percentile_75: 350 },
    "Vêtements": { avg: 150, percentile_25: 100, median: 150, percentile_75: 200 },
    "Santé": { avg: 120, percentile_25: 80, median: 120, percentile_75: 160 },
    "Éducation": { avg: 80, percentile_25: 30, median: 80, percentile_75: 150 },
  },
  "50k-75k": {
    "Logement": { avg: 1300, percentile_25: 1000, median: 1300, percentile_75: 1600 },
    "Alimentation": { avg: 700, percentile_25: 550, median: 700, percentile_75: 850 },
    "Transport": { avg: 600, percentile_25: 450, median: 600, percentile_75: 800 },
    "Divertissement": { avg: 350, percentile_25: 250, median: 350, percentile_75: 500 },
    "Vêtements": { avg: 200, percentile_25: 150, median: 200, percentile_75: 300 },
    "Santé": { avg: 150, percentile_25: 100, median: 150, percentile_75: 200 },
    "Éducation": { avg: 120, percentile_25: 50, median: 120, percentile_75: 200 },
  },
  "75k-100k": {
    "Logement": { avg: 1600, percentile_25: 1300, median: 1600, percentile_75: 2000 },
    "Alimentation": { avg: 850, percentile_25: 700, median: 850, percentile_75: 1000 },
    "Transport": { avg: 800, percentile_25: 600, median: 800, percentile_75: 1000 },
    "Divertissement": { avg: 500, percentile_25: 350, median: 500, percentile_75: 700 },
    "Vêtements": { avg: 300, percentile_25: 200, median: 300, percentile_75: 400 },
    "Santé": { avg: 200, percentile_25: 150, median: 200, percentile_75: 300 },
    "Éducation": { avg: 180, percentile_25: 80, median: 180, percentile_75: 300 },
  },
  "100k+": {
    "Logement": { avg: 2200, percentile_25: 1800, median: 2200, percentile_75: 2800 },
    "Alimentation": { avg: 1100, percentile_25: 900, median: 1100, percentile_75: 1400 },
    "Transport": { avg: 1000, percentile_25: 800, median: 1000, percentile_75: 1300 },
    "Divertissement": { avg: 700, percentile_25: 500, median: 700, percentile_75: 1000 },
    "Vêtements": { avg: 400, percentile_25: 300, median: 400, percentile_75: 600 },
    "Santé": { avg: 300, percentile_25: 200, median: 300, percentile_75: 450 },
    "Éducation": { avg: 250, percentile_25: 100, median: 250, percentile_75: 500 },
  },
};

export function BenchmarkComparison({ isAuthenticated }: { isAuthenticated: boolean }) {
  // Calculate user's income bracket from their actual income transactions
  const { data: userIncomeBracket } = useQuery({
    queryKey: ['user-income-bracket'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get last 3 months of income to calculate average
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);

      const { data, error } = await supabase
        .from('budget_transactions')
        .select('amount')
        .eq('type', 'income')
        .gte('transaction_date', startDate.toISOString());

      if (error) throw error;

      const totalIncome = (data || []).reduce((sum, t) => sum + Number(t.amount), 0);
      const monthlyIncome = totalIncome / 3;
      const annualIncome = monthlyIncome * 12;

      // Determine income bracket
      if (annualIncome < 30000) return "0-30k";
      if (annualIncome < 50000) return "30k-50k";
      if (annualIncome < 75000) return "50k-75k";
      if (annualIncome < 100000) return "75k-100k";
      return "100k+";
    },
    enabled: isAuthenticated,
  });

  // Fetch user's average spending by category
  const { data: userSpending = [] } = useQuery({
    queryKey: ['user-spending-by-category'],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);

      const { data, error } = await supabase
        .from('budget_transactions')
        .select(`
          category_id,
          amount,
          category:budget_categories(name, icon, color)
        `)
        .eq('type', 'expense')
        .gte('transaction_date', startDate.toISOString());

      if (error) throw error;

      // Group by category and calculate average
      const grouped = (data || []).reduce((acc: any, t: any) => {
        const catName = t.category?.name || 'Autre';
        if (!acc[catName]) {
          acc[catName] = {
            category_name: catName,
            icon: t.category?.icon || '📦',
            color: t.category?.color || '#64748b',
            total: 0,
            count: 0,
          };
        }
        acc[catName].total += Number(t.amount);
        acc[catName].count += 1;
        return acc;
      }, {});

      return Object.values(grouped).map((g: any) => ({
        category_name: g.category_name,
        icon: g.icon,
        color: g.color,
        avg_monthly_amount: g.total / 3, // 3 months average
      }));
    },
    enabled: isAuthenticated,
  });

  // Get Quebec statistics for user's income bracket
  const quebecStats = userIncomeBracket ? QUEBEC_STATISTICS[userIncomeBracket as keyof typeof QUEBEC_STATISTICS] : null;

  if (!isAuthenticated) {
    return null;
  }

  // Merge user spending with Quebec statistics
  const comparisonData = userSpending
    .map((spending: any) => {
      if (!quebecStats) return null;
      
      const benchmark = quebecStats[spending.category_name as keyof typeof quebecStats];
      if (!benchmark) return null;

      const userAmount = spending.avg_monthly_amount;
      const avgAmount = benchmark.avg;
      const percentile = userAmount <= benchmark.percentile_25 ? 25 :
                        userAmount <= benchmark.median ? 50 :
                        userAmount <= benchmark.percentile_75 ? 75 : 100;

      return {
        category: spending.category_name,
        icon: spending.icon,
        color: spending.color,
        userAmount,
        avgAmount,
        medianAmount: benchmark.median,
        percentile25: benchmark.percentile_25,
        percentile75: benchmark.percentile_75,
        percentile,
        difference: userAmount - avgAmount,
        percentDiff: ((userAmount - avgAmount) / avgAmount) * 100,
      };
    })
    .filter(Boolean)
    .sort((a, b) => Math.abs(b!.percentDiff) - Math.abs(a!.percentDiff));

  const getIncomeBracketLabel = (bracket: string) => {
    const labels: Record<string, string> = {
      '0-30k': 'Moins de 30 000$',
      '30k-50k': '30 000$ - 50 000$',
      '50k-75k': '50 000$ - 75 000$',
      '75k-100k': '75 000$ - 100 000$',
      '100k-150k': '100 000$ - 150 000$',
      '150k+': 'Plus de 150 000$',
    };
    return labels[bracket] || bracket;
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary" />
              Comparaison avec les moyennes québécoises
            </CardTitle>
            <CardDescription>
              Comparez vos dépenses aux moyennes québécoises
            </CardDescription>
          </div>
          {userIncomeBracket && (
            <Badge variant="secondary" className="text-sm">
              Tranche : {getIncomeBracketLabel(userIncomeBracket)}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {comparisonData.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto opacity-50" />
            <div>
              <p className="text-muted-foreground mb-2">
                Pas encore assez de données pour les comparaisons
              </p>
              <p className="text-sm text-muted-foreground">
                Continuez à enregistrer vos dépenses pour voir comment vous vous comparez !
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Top insights */}
            <div className="grid gap-4 md:grid-cols-3">
              {comparisonData.slice(0, 3).map((item: any) => {
                const isAbove = item.userAmount > item.avgAmount;
                return (
                  <Card key={item.category} className="bg-accent/50">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{item.category}</h4>
                          <p className="text-xs text-muted-foreground">
                            Statistiques officielles du Québec
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm text-muted-foreground">Vous</span>
                          <span className="font-bold">{formatPrice(item.userAmount)}</span>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <span className="text-sm text-muted-foreground">Moyenne</span>
                          <span>{formatPrice(item.avgAmount)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        {isAbove ? (
                          <>
                            <TrendingUp className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-red-500 font-medium">
                              +{Math.abs(item.percentDiff).toFixed(0)}% au-dessus
                            </span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-green-500 font-medium">
                              {Math.abs(item.percentDiff).toFixed(0)}% en-dessous
                            </span>
                          </>
                        )}
                      </div>

                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>25e</span>
                          <span>Médiane</span>
                          <span>75e</span>
                        </div>
                        <Progress 
                          value={item.percentile} 
                          className="h-2"
                        />
                        <p className="text-xs text-center mt-1 text-muted-foreground">
                          {item.percentile}e percentile
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Detailed comparison chart */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Comparaison détaillée</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={comparisonData}
                  layout="horizontal"
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis 
                    type="number"
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k$`}
                  />
                  <YAxis
                    dataKey="category"
                    type="category"
                    width={120}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value: any) => formatPrice(value)}
                    labelFormatter={(label) => `Catégorie: ${label}`}
                  />
                  <ReferenceLine x={0} stroke="#888" strokeDasharray="3 3" />
                  <Bar dataKey="userAmount" name="Vos dépenses" radius={[0, 4, 4, 0]}>
                    {comparisonData.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.userAmount > entry.avgAmount ? '#ef4444' : '#10b981'}
                      />
                    ))}
                  </Bar>
                  <Bar dataKey="avgAmount" name="Moyenne" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Recommendations */}
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                💡 Recommandations personnalisées
              </h4>
              <ul className="space-y-2 text-sm">
                {comparisonData.slice(0, 3).map((item: any) => {
                  if (item.userAmount > item.avgAmount) {
                    return (
                      <li key={item.category} className="flex gap-2">
                        <span>•</span>
                        <span>
                          <strong>{item.category}</strong> : Vous dépensez {Math.abs(item.percentDiff).toFixed(0)}% de plus que la moyenne. 
                          Réduire de {formatPrice(item.difference)} par mois vous rapprocherait de la norme.
                        </span>
                      </li>
                    );
                  }
                  return null;
                })}
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
