import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatPrice } from "@/lib/priceFormat";
import { TrendingDown, Calendar, DollarSign } from "lucide-react";

interface Debt {
  id: string;
  name: string;
  balance: number;
  interest_rate: number;
  minimum_payment?: number;
  payment_frequency: string;
}

interface DebtCalculatorProps {
  debts: Debt[];
}

export const DebtCalculator = ({ debts }: DebtCalculatorProps) => {
  if (debts.length === 0) return null;

  const calculateDebtMetrics = (debt: Debt) => {
    const monthlyRate = debt.interest_rate / 100 / 12;
    const payment = debt.minimum_payment || (debt.balance * 0.03); // 3% minimum if not specified
    
    // Monthly interest charge
    const monthlyInterest = debt.balance * monthlyRate;
    
    // Yearly interest cost
    const yearlyInterest = debt.balance * (debt.interest_rate / 100);
    
    // Calculate months to payoff (simplified)
    let remainingBalance = debt.balance;
    let months = 0;
    let totalInterestPaid = 0;
    const maxMonths = 600; // 50 years max
    
    while (remainingBalance > 0 && months < maxMonths) {
      const interestCharge = remainingBalance * monthlyRate;
      const principalPayment = Math.min(payment - interestCharge, remainingBalance);
      
      if (principalPayment <= 0) {
        // Payment doesn't cover interest - will never pay off
        months = maxMonths;
        break;
      }
      
      totalInterestPaid += interestCharge;
      remainingBalance -= principalPayment;
      months++;
    }
    
    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + months);
    
    return {
      monthlyInterest,
      yearlyInterest,
      monthsToPayoff: months < maxMonths ? months : Infinity,
      payoffDate: months < maxMonths ? payoffDate : null,
      totalInterestPaid: months < maxMonths ? totalInterestPaid : Infinity,
      monthlyPayment: payment,
      willPayOff: months < maxMonths
    };
  };

  const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);
  const totalMonthlyInterest = debts.reduce((sum, d) => {
    const metrics = calculateDebtMetrics(d);
    return sum + metrics.monthlyInterest;
  }, 0);
  const totalYearlyInterest = debts.reduce((sum, d) => {
    const metrics = calculateDebtMetrics(d);
    return sum + metrics.yearlyInterest;
  }, 0);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-red-200 dark:border-red-800">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Dette totale
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700 dark:text-red-400">
              {formatPrice(totalDebt)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200 dark:border-yellow-800">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Intérêts mensuels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
              {formatPrice(totalMonthlyInterest)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Argent perdu en intérêts chaque mois
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200 dark:border-orange-800">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Intérêts annuels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">
              {formatPrice(totalYearlyInterest)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Coût annuel de vos dettes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Debt Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Analyse détaillée des dettes</CardTitle>
          <CardDescription>Projection de remboursement basée sur vos paiements actuels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {debts.map(debt => {
              const metrics = calculateDebtMetrics(debt);
              return (
                <div key={debt.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-lg">{debt.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Taux: {debt.interest_rate}% • Paiement: {formatPrice(metrics.monthlyPayment)}/mois
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-red-600">{formatPrice(debt.balance)}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t">
                    <div>
                      <div className="text-xs text-muted-foreground">Intérêt mensuel</div>
                      <div className="font-semibold text-yellow-600">{formatPrice(metrics.monthlyInterest)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Intérêt annuel</div>
                      <div className="font-semibold text-orange-600">{formatPrice(metrics.yearlyInterest)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Durée restante</div>
                      <div className="font-semibold">
                        {metrics.willPayOff 
                          ? `${Math.floor(metrics.monthsToPayoff / 12)}a ${metrics.monthsToPayoff % 12}m`
                          : '∞ (paiement insuffisant)'
                        }
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Total intérêts</div>
                      <div className="font-semibold text-red-600">
                        {metrics.willPayOff 
                          ? formatPrice(metrics.totalInterestPaid)
                          : '∞'
                        }
                      </div>
                    </div>
                  </div>

                  {!metrics.willPayOff && (
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded p-3 text-sm text-red-700 dark:text-red-400">
                      ⚠️ Attention: Votre paiement mensuel ({formatPrice(metrics.monthlyPayment)}) ne couvre pas l'intérêt mensuel ({formatPrice(metrics.monthlyInterest)}). 
                      Augmentez vos paiements pour rembourser cette dette.
                    </div>
                  )}

                  {metrics.willPayOff && metrics.payoffDate && (
                    <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded p-3 text-sm">
                      ✅ Date de remboursement estimée: <span className="font-semibold">
                        {metrics.payoffDate.toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};