import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Users, AlertCircle } from "lucide-react";
import { formatPrice } from "@/lib/priceFormat";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";

export function BenchmarkComparison({ isAuthenticated }: { isAuthenticated: boolean }) {
  // Fetch user's income bracket
  const { data: userIncomeBracket } = useQuery({
    queryKey: ['user-income-bracket'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.rpc('get_user_income_bracket', {
        p_user_id: user.id
      });
      
      if (error) throw error;
      return data as string;
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

  // Fetch benchmarks for user's income bracket
  const { data: benchmarks = [] } = useQuery({
    queryKey: ['user-benchmarks', userIncomeBracket],
    queryFn: async () => {
      if (!userIncomeBracket) return [];

      const { data, error } = await supabase
        .from('user_benchmarks')
        .select('*')
        .eq('income_bracket', userIncomeBracket);

      if (error) throw error;
      return data || [];
    },
    enabled: isAuthenticated && !!userIncomeBracket,
  });

  if (!isAuthenticated) {
    return null;
  }

  // Merge user spending with benchmarks
  const comparisonData = userSpending
    .map((spending: any) => {
      const benchmark = benchmarks.find(b => b.category_name === spending.category_name);
      if (!benchmark) return null;

      const userAmount = spending.avg_monthly_amount;
      const avgAmount = benchmark.avg_monthly_amount;
      const percentile = userAmount <= benchmark.percentile_25 ? 25 :
                        userAmount <= benchmark.median_monthly_amount ? 50 :
                        userAmount <= benchmark.percentile_75 ? 75 : 100;

      return {
        category: spending.category_name,
        icon: spending.icon,
        color: spending.color,
        userAmount,
        avgAmount,
        medianAmount: benchmark.median_monthly_amount,
        percentile25: benchmark.percentile_25,
        percentile75: benchmark.percentile_75,
        percentile,
        difference: userAmount - avgAmount,
        percentDiff: ((userAmount - avgAmount) / avgAmount) * 100,
        sampleSize: benchmark.sample_size,
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
              <Users className="w-6 h-6 text-primary" />
              Comparaison anonymisée
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
                            {item.sampleSize} utilisateurs
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
