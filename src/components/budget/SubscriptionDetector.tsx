import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, Calendar, DollarSign, TrendingUp, X } from "lucide-react";
import { formatPrice } from "@/lib/priceFormat";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SubscriptionDetectorProps {
  transactions: any[];
  categories: any[];
}

export const SubscriptionDetector = ({ transactions, categories }: SubscriptionDetectorProps) => {
  const [dismissedSubscriptions, setDismissedSubscriptions] = useState<string[]>([]);

  // Detect recurring transactions (potential subscriptions)
  const detectSubscriptions = () => {
    const transactionsByDescription = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc: any, t: any) => {
        const desc = t.description?.toLowerCase().trim() || 'sans description';
        if (!acc[desc]) {
          acc[desc] = [];
        }
        acc[desc].push(t);
        return acc;
      }, {});

    const potentialSubscriptions = Object.entries(transactionsByDescription)
      .map(([description, txs]: [string, any]) => {
        if (txs.length < 2) return null;

        // Sort by date
        const sorted = txs.sort((a: any, b: any) => 
          new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
        );

        // Calculate average interval between transactions (in days)
        const intervals = [];
        for (let i = 1; i < sorted.length; i++) {
          const days = Math.round(
            (new Date(sorted[i].transaction_date).getTime() - 
             new Date(sorted[i - 1].transaction_date).getTime()) / 
            (1000 * 60 * 60 * 24)
          );
          intervals.push(days);
        }

        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const isRegular = intervals.every(i => Math.abs(i - avgInterval) < 7); // Within 7 days variance

        // Check if it's monthly (28-32 days), bi-weekly (~14 days), or yearly (~365 days)
        const isMonthly = avgInterval >= 28 && avgInterval <= 32;
        const isBiWeekly = avgInterval >= 12 && avgInterval <= 16;
        const isYearly = avgInterval >= 350 && avgInterval <= 380;

        if (!isRegular || (!isMonthly && !isBiWeekly && !isYearly)) return null;

        const avgAmount = sorted.reduce((sum: number, t: any) => sum + Number(t.amount), 0) / sorted.length;
        const lastTransaction = sorted[sorted.length - 1];
        const daysSinceLastTransaction = Math.round(
          (Date.now() - new Date(lastTransaction.transaction_date).getTime()) / (1000 * 60 * 60 * 24)
        );

        // Flag as potentially cancelled if no transaction in expected interval + 14 days buffer
        const expectedNextDate = new Date(lastTransaction.transaction_date);
        expectedNextDate.setDate(expectedNextDate.getDate() + avgInterval);
        const isPotentiallyCancelled = daysSinceLastTransaction > (avgInterval + 14);

        let frequency = 'Mensuel';
        let annualCost = avgAmount * 12;
        if (isBiWeekly) {
          frequency = 'Aux 2 semaines';
          annualCost = avgAmount * 26;
        } else if (isYearly) {
          frequency = 'Annuel';
          annualCost = avgAmount;
        }

        const category = categories.find((c: any) => c.id === lastTransaction.category_id);

        return {
          id: `${description}-${lastTransaction.category_id}`,
          description: description.charAt(0).toUpperCase() + description.slice(1),
          avgAmount,
          frequency,
          annualCost,
          occurrences: sorted.length,
          lastDate: lastTransaction.transaction_date,
          daysSinceLastTransaction,
          isPotentiallyCancelled,
          category: category?.name || 'Non catégorisé',
          categoryIcon: category?.icon || '📄',
        };
      })
      .filter(Boolean)
      .filter((sub: any) => !dismissedSubscriptions.includes(sub.id));

    return potentialSubscriptions as any[];
  };

  const subscriptions = detectSubscriptions();
  const activeSubscriptions = subscriptions.filter(s => !s.isPotentiallyCancelled);
  const possibleCancelledSubscriptions = subscriptions.filter(s => s.isPotentiallyCancelled);
  const totalMonthlySubscriptions = activeSubscriptions.reduce((sum, s) => {
    if (s.frequency === 'Mensuel') return sum + s.avgAmount;
    if (s.frequency === 'Aux 2 semaines') return sum + (s.avgAmount * 26 / 12);
    if (s.frequency === 'Annuel') return sum + (s.avgAmount / 12);
    return sum;
  }, 0);
  const totalAnnualSubscriptions = activeSubscriptions.reduce((sum, s) => sum + s.annualCost, 0);

  const handleDismiss = (subscriptionId: string) => {
    setDismissedSubscriptions([...dismissedSubscriptions, subscriptionId]);
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 shadow-lg">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Détecteur d'abonnements récurrents
              </CardTitle>
              <CardDescription>
                Analyse intelligente de vos dépenses récurrentes
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{formatPrice(totalMonthlySubscriptions)}</div>
              <div className="text-xs text-muted-foreground">par mois</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Coût annuel total</span>
              </div>
              <div className="text-2xl font-bold">{formatPrice(totalAnnualSubscriptions)}</div>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm text-muted-foreground">Abonnements actifs</span>
              </div>
              <div className="text-2xl font-bold">{activeSubscriptions.length}</div>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-muted-foreground">Potentiellement annulés</span>
              </div>
              <div className="text-2xl font-bold text-orange-600">{possibleCancelledSubscriptions.length}</div>
            </div>
          </div>

          {/* Potentially Cancelled Subscriptions Alert */}
          {possibleCancelledSubscriptions.length > 0 && (
            <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-900 dark:text-orange-200">
                <strong className="font-semibold">Attention!</strong> {possibleCancelledSubscriptions.length} abonnement(s) n'ont pas été détecté(s) récemment. 
                Vérifiez si vous les avez annulés ou s'ils sont toujours actifs.
              </AlertDescription>
            </Alert>
          )}

          {/* Possibly Cancelled Subscriptions List */}
          {possibleCancelledSubscriptions.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                Abonnements potentiellement annulés
              </h4>
              {possibleCancelledSubscriptions.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between p-4 border border-orange-200 bg-orange-50/50 dark:bg-orange-950/10 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{sub.categoryIcon}</span>
                      <span className="font-semibold">{sub.description}</span>
                      <Badge variant="outline" className="text-xs">{sub.frequency}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Dernière transaction: {new Date(sub.lastDate).toLocaleDateString('fr-CA')} 
                      <span className="text-orange-600 font-semibold ml-2">
                        (Il y a {sub.daysSinceLastTransaction} jours)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold">{formatPrice(sub.avgAmount)}</div>
                      <div className="text-xs text-muted-foreground">{formatPrice(sub.annualCost)}/an</div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDismiss(sub.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Active Subscriptions List */}
          {activeSubscriptions.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Abonnements actifs détectés
              </h4>
              {activeSubscriptions.map((sub) => (
                <div key={sub.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{sub.categoryIcon}</span>
                      <span className="font-semibold">{sub.description}</span>
                      <Badge variant="secondary" className="text-xs">{sub.frequency}</Badge>
                      <Badge variant="outline" className="text-xs">{sub.category}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {sub.occurrences} transactions détectées • Dernière: {new Date(sub.lastDate).toLocaleDateString('fr-CA')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{formatPrice(sub.avgAmount)}</div>
                    <div className="text-xs text-muted-foreground">{formatPrice(sub.annualCost)}/an</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {subscriptions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucun abonnement récurrent détecté</p>
              <p className="text-sm mt-1">Ajoutez plus de transactions pour une meilleure analyse</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
