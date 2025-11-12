import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Lightbulb, Target, DollarSign } from "lucide-react";
import { formatPrice } from "@/lib/priceFormat";

interface SavingsOpportunitiesDetectorProps {
  transactions: any[];
  categories: any[];
}

export const SavingsOpportunitiesDetector = ({ transactions, categories }: SavingsOpportunitiesDetectorProps) => {
  
  // Calculate average spending per category
  const calculateCategorySpending = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);
    
    return categories
      .filter(cat => cat.type === 'expense')
      .map(category => {
        const currentMonthTxs = transactions.filter(
          t => t.category_id === category.id && t.type === 'expense' && t.transaction_date?.startsWith(currentMonth)
        );
        const lastMonthTxs = transactions.filter(
          t => t.category_id === category.id && t.type === 'expense' && t.transaction_date?.startsWith(lastMonth)
        );
        
        const currentTotal = currentMonthTxs.reduce((sum, t) => sum + Number(t.amount), 0);
        const lastTotal = lastMonthTxs.reduce((sum, t) => sum + Number(t.amount), 0);
        const avgTransaction = currentMonthTxs.length > 0 ? currentTotal / currentMonthTxs.length : 0;
        
        const increase = currentTotal - lastTotal;
        const percentChange = lastTotal > 0 ? ((currentTotal - lastTotal) / lastTotal) * 100 : 0;
        
        return {
          category: category.name,
          icon: category.icon,
          currentTotal,
          lastTotal,
          increase,
          percentChange,
          transactionCount: currentMonthTxs.length,
          avgTransaction,
        };
      })
      .filter(c => c.currentTotal > 0);
  };

  const categoryData = calculateCategorySpending();
  
  // Quebec average spending benchmarks (monthly)
  const benchmarks: { [key: string]: number } = {
    'Alimentation': 800,
    'Épicerie': 600,
    'Restaurant': 200,
    'Transport': 400,
    'Essence': 200,
    'Divertissement': 150,
    'Loisirs': 150,
    'Shopping': 200,
    'Vêtements': 150,
    'Santé': 200,
    'Assurances': 300,
    'Téléphone': 80,
    'Internet': 70,
    'Électricité': 100,
    'Services': 150,
  };

  // Detect opportunities
  const opportunities = categoryData
    .map(cat => {
      const benchmark = benchmarks[cat.category] || 0;
      const overBenchmark = benchmark > 0 ? cat.currentTotal - benchmark : 0;
      const potentialSavings = overBenchmark > 0 ? overBenchmark * 0.3 : 0; // 30% reduction potential
      
      let suggestion = '';
      let priority: 'high' | 'medium' | 'low' = 'low';
      
      if (cat.percentChange > 30) {
        suggestion = `Vos dépenses ont augmenté de ${cat.percentChange.toFixed(0)}% ce mois-ci. Identifiez la cause de cette hausse.`;
        priority = 'high';
      } else if (overBenchmark > 100 && benchmark > 0) {
        suggestion = `Vous dépensez ${formatPrice(overBenchmark)} de plus que la moyenne québécoise. Économie potentielle: ${formatPrice(potentialSavings)}/mois.`;
        priority = 'medium';
      } else if (cat.transactionCount > 15 && cat.avgTransaction < 20) {
        suggestion = `${cat.transactionCount} petites transactions ce mois. Planifiez mieux pour réduire les achats impulsifs.`;
        priority = 'low';
      }
      
      return {
        ...cat,
        benchmark,
        overBenchmark,
        potentialSavings,
        suggestion,
        priority,
      };
    })
    .filter(opp => opp.suggestion !== '')
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

  const totalPotentialSavings = opportunities.reduce((sum, opp) => sum + opp.potentialSavings, 0);
  const highPriorityCount = opportunities.filter(o => o.priority === 'high').length;

  // Additional smart recommendations
  const smartRecommendations = [];
  
  // Check for high restaurant spending
  const restaurant = categoryData.find(c => c.category.toLowerCase().includes('restaurant'));
  if (restaurant && restaurant.currentTotal > 400) {
    smartRecommendations.push({
      title: "Réduisez les sorties au restaurant",
      description: `En cuisinant 2-3 repas de plus par semaine, vous pourriez économiser jusqu'à ${formatPrice((restaurant.currentTotal - 250) * 0.5)}/mois.`,
      impact: (restaurant.currentTotal - 250) * 0.5,
      icon: '🍽️',
    });
  }

  // Check for multiple subscriptions
  const divertissement = categoryData.find(c => c.category.toLowerCase().includes('divertissement'));
  if (divertissement && divertissement.transactionCount > 5) {
    smartRecommendations.push({
      title: "Consolidez vos abonnements",
      description: `Vous avez plusieurs abonnements de divertissement. En partageant ou en annulant certains, économisez ~${formatPrice(divertissement.currentTotal * 0.3)}/mois.`,
      impact: divertissement.currentTotal * 0.3,
      icon: '📺',
    });
  }

  // Check for high coffee/small purchases
  const cafeData = transactions.filter(t => 
    t.type === 'expense' && 
    t.description && 
    (t.description.toLowerCase().includes('café') || 
     t.description.toLowerCase().includes('coffee') ||
     t.description.toLowerCase().includes('starbucks') ||
     t.description.toLowerCase().includes('tim'))
  );
  if (cafeData.length > 10) {
    const cafeTotal = cafeData.reduce((sum, t) => sum + Number(t.amount), 0);
    smartRecommendations.push({
      title: "Réduisez les cafés achetés",
      description: `${cafeData.length} cafés achetés ce mois (${formatPrice(cafeTotal)}). Préparez votre café à la maison pour économiser ~${formatPrice(cafeTotal * 0.7)}/mois.`,
      impact: cafeTotal * 0.7,
      icon: '☕',
    });
  }

  return (
    <div className="space-y-6">
      <Card className="border-green-200 dark:border-green-900 shadow-lg">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-green-600" />
                Opportunités d'économies
              </CardTitle>
              <CardDescription>
                Analyse intelligente de vos habitudes de dépenses
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">{formatPrice(totalPotentialSavings)}</div>
              <div className="text-xs text-muted-foreground">potentiel/mois</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">Opportunités détectées</span>
              </div>
              <div className="text-2xl font-bold">{opportunities.length}</div>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-muted-foreground">Priorité haute</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">{highPriorityCount}</div>
            </div>
            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-900">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">Économies annuelles</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{formatPrice(totalPotentialSavings * 12)}</div>
            </div>
          </div>

          {/* Smart Recommendations */}
          {smartRecommendations.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-600" />
                Recommandations intelligentes
              </h4>
              {smartRecommendations.map((rec, index) => (
                <div key={index} className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-900">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{rec.icon}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-yellow-900 dark:text-yellow-100">{rec.title}</div>
                      <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">{rec.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">{formatPrice(rec.impact)}</div>
                      <div className="text-xs text-muted-foreground">économie/mois</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Category Opportunities */}
          {opportunities.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold">Analyse par catégorie</h4>
              {opportunities.map((opp, index) => (
                <div key={index} className={`p-4 rounded-lg border ${
                  opp.priority === 'high' ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900' :
                  opp.priority === 'medium' ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900' :
                  'bg-muted/30 border-border'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{opp.icon}</span>
                        <span className="font-semibold">{opp.category}</span>
                        <Badge variant={
                          opp.priority === 'high' ? 'destructive' :
                          opp.priority === 'medium' ? 'default' : 'secondary'
                        }>
                          {opp.priority === 'high' ? 'Priorité haute' : 
                           opp.priority === 'medium' ? 'Priorité moyenne' : 'À considérer'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{opp.suggestion}</p>
                      <div className="flex gap-4 text-xs">
                        <span>Ce mois: <strong>{formatPrice(opp.currentTotal)}</strong></span>
                        {opp.benchmark > 0 && (
                          <span>Moyenne QC: <strong>{formatPrice(opp.benchmark)}</strong></span>
                        )}
                        {opp.lastTotal > 0 && (
                          <span className={opp.increase > 0 ? 'text-red-600' : 'text-green-600'}>
                            {opp.increase > 0 ? '↑' : '↓'} {Math.abs(opp.percentChange).toFixed(0)}% vs mois dernier
                          </span>
                        )}
                      </div>
                    </div>
                    {opp.potentialSavings > 0 && (
                      <div className="text-right ml-4">
                        <div className="text-lg font-bold text-green-600">{formatPrice(opp.potentialSavings)}</div>
                        <div className="text-xs text-muted-foreground">potentiel/mois</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {opportunities.length === 0 && smartRecommendations.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Excellent! Vos dépenses semblent bien équilibrées</p>
              <p className="text-sm mt-1">Continuez vos bonnes habitudes financières</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
