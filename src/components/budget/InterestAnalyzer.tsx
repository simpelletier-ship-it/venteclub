import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, AlertTriangle, DollarSign, Calendar } from "lucide-react";
import { formatPrice } from "@/lib/priceFormat";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface InterestAnalyzerProps {
  debts: any[];
}

export const InterestAnalyzer = ({ debts }: InterestAnalyzerProps) => {
  
  const calculateInterestProjections = (debt: any) => {
    const balance = Number(debt.balance);
    const rate = Number(debt.interest_rate) / 100;
    const minPayment = Number(debt.minimum_payment || balance * 0.02); // 2% min default

    // Calculate how long to pay off with minimum payments
    let remainingBalance = balance;
    let totalInterestPaid = 0;
    let months = 0;
    const monthlyRate = rate / 12;
    
    const projectionData = [];

    while (remainingBalance > 0 && months < 360) { // Max 30 years
      const interestCharge = remainingBalance * monthlyRate;
      const principalPayment = Math.min(minPayment - interestCharge, remainingBalance);
      
      if (principalPayment <= 0) break; // Can't pay off with minimum payment
      
      totalInterestPaid += interestCharge;
      remainingBalance -= principalPayment;
      months++;

      if (months % 12 === 0 || remainingBalance <= 0) {
        projectionData.push({
          year: months / 12,
          balance: Math.max(0, remainingBalance),
          totalInterest: totalInterestPaid,
        });
      }
    }

    // Calculate interest for 1, 5, and 10 years at current balance
    const interest1Year = balance * rate;
    const interest5Years = balance * rate * 5;
    const interest10Years = balance * rate * 10;

    return {
      monthlyInterest: balance * monthlyRate,
      interest1Year,
      interest5Years,
      interest10Years,
      totalInterestWithMinPayments: totalInterestPaid,
      monthsToPayOff: months,
      yearsToPayOff: months / 12,
      projectionData,
    };
  };

  const debtsWithAnalysis = debts.map(debt => ({
    ...debt,
    analysis: calculateInterestProjections(debt),
  }));

  // Sort by highest interest rate first
  const sortedDebts = [...debtsWithAnalysis].sort((a, b) => 
    Number(b.interest_rate) - Number(a.interest_rate)
  );

  const totalMonthlyInterest = debtsWithAnalysis.reduce((sum, d) => 
    sum + d.analysis.monthlyInterest, 0
  );

  const totalAnnualInterest = totalMonthlyInterest * 12;

  const total5YearInterest = debtsWithAnalysis.reduce((sum, d) => 
    sum + d.analysis.interest5Years, 0
  );

  const total10YearInterest = debtsWithAnalysis.reduce((sum, d) => 
    sum + d.analysis.interest10Years, 0
  );

  // Calculate potential savings with snowball method (paying off highest interest first)
  const calculateSnowballSavings = () => {
    const totalMinPayment = debtsWithAnalysis.reduce((sum, d) => 
      sum + Number(d.minimum_payment || d.balance * 0.02), 0
    );
    
    // If user paid 20% extra toward highest interest debt
    const extraPayment = totalMinPayment * 0.2;
    
    let totalInterestWithSnowball = 0;
    const debtsCopy = sortedDebts.map(d => ({
      ...d,
      remainingBalance: Number(d.balance),
    }));

    let months = 0;
    while (debtsCopy.some(d => d.remainingBalance > 0) && months < 360) {
      // Apply minimum payments to all debts
      debtsCopy.forEach(debt => {
        if (debt.remainingBalance > 0) {
          const monthlyRate = Number(debt.interest_rate) / 100 / 12;
          const interestCharge = debt.remainingBalance * monthlyRate;
          const minPayment = Number(debt.minimum_payment || debt.balance * 0.02);
          const principalPayment = Math.min(minPayment - interestCharge, debt.remainingBalance);
          
          totalInterestWithSnowball += interestCharge;
          debt.remainingBalance = Math.max(0, debt.remainingBalance - principalPayment);
        }
      });

      // Apply extra payment to highest interest debt with balance
      const highestInterestDebt = debtsCopy.find(d => d.remainingBalance > 0);
      if (highestInterestDebt) {
        highestInterestDebt.remainingBalance = Math.max(0, highestInterestDebt.remainingBalance - extraPayment);
      }

      months++;
    }

    const regularInterest = debtsWithAnalysis.reduce((sum, d) => 
      d.analysis.totalInterestWithMinPayments, 0
    );

    return {
      savings: regularInterest - totalInterestWithSnowball,
      monthsFaster: debtsWithAnalysis[0]?.analysis.monthsToPayOff - months,
    };
  };

  const snowballSavings = debts.length > 0 ? calculateSnowballSavings() : null;

  if (debts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <TrendingDown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Aucune dette enregistrée</p>
          <p className="text-sm text-muted-foreground mt-2">Ajoutez vos dettes pour voir l'analyse des intérêts</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-red-200 dark:border-red-900 shadow-lg">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                Analyseur d'intérêts sur dettes
              </CardTitle>
              <CardDescription>
                Visualisez combien vous coûtent réellement vos dettes
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-red-600">{formatPrice(totalMonthlyInterest)}</div>
              <div className="text-xs text-muted-foreground">par mois</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-900">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-red-600" />
                <span className="text-sm text-muted-foreground">Intérêts annuels</span>
              </div>
              <div className="text-xl font-bold text-red-600">{formatPrice(totalAnnualInterest)}</div>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Sur 5 ans</span>
              </div>
              <div className="text-xl font-bold">{formatPrice(total5YearInterest)}</div>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Sur 10 ans</span>
              </div>
              <div className="text-xl font-bold">{formatPrice(total10YearInterest)}</div>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-muted-foreground">Nombre de dettes</span>
              </div>
              <div className="text-xl font-bold">{debts.length}</div>
            </div>
          </div>

          {/* Snowball Savings Recommendation */}
          {snowballSavings && snowballSavings.savings > 0 && (
            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-900">
              <div className="flex items-start gap-3">
                <TrendingDown className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-green-900 dark:text-green-100">💡 Opportunité d'économie</div>
                  <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                    En payant 20% de plus sur vos paiements minimums et en ciblant d'abord les dettes à haut taux d'intérêt, 
                    vous pourriez économiser <strong className="font-bold">{formatPrice(snowballSavings.savings)}</strong> en intérêts 
                    et rembourser vos dettes <strong className="font-bold">{Math.abs(snowballSavings.monthsFaster)} mois plus tôt</strong>!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Individual Debt Analysis */}
          <div className="space-y-4">
            <h4 className="font-semibold">Analyse détaillée par dette</h4>
            {sortedDebts.map((debt) => (
              <Card key={debt.id} className="border-l-4 border-l-red-500">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{debt.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Badge variant={Number(debt.interest_rate) > 10 ? "destructive" : "secondary"}>
                          {debt.interest_rate}% intérêt
                        </Badge>
                        <span className="text-xs">Balance: {formatPrice(debt.balance)}</span>
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-red-600">{formatPrice(debt.analysis.monthlyInterest)}</div>
                      <div className="text-xs text-muted-foreground">par mois</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="bg-muted/50 p-2 rounded">
                      <div className="text-xs text-muted-foreground">1 an</div>
                      <div className="font-semibold">{formatPrice(debt.analysis.interest1Year)}</div>
                    </div>
                    <div className="bg-muted/50 p-2 rounded">
                      <div className="text-xs text-muted-foreground">5 ans</div>
                      <div className="font-semibold">{formatPrice(debt.analysis.interest5Years)}</div>
                    </div>
                    <div className="bg-muted/50 p-2 rounded">
                      <div className="text-xs text-muted-foreground">10 ans</div>
                      <div className="font-semibold">{formatPrice(debt.analysis.interest10Years)}</div>
                    </div>
                  </div>
                  
                  {debt.analysis.monthsToPayOff < 360 && (
                    <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded text-sm border border-orange-200 dark:border-orange-900">
                      <div className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                        Avec paiements minimums ({formatPrice(debt.minimum_payment || debt.balance * 0.02)}/mois):
                      </div>
                      <div className="flex justify-between">
                        <span className="text-orange-800 dark:text-orange-200">
                          Temps de remboursement: <strong>{debt.analysis.yearsToPayOff.toFixed(1)} ans</strong>
                        </span>
                        <span className="text-orange-800 dark:text-orange-200">
                          Total intérêts: <strong>{formatPrice(debt.analysis.totalInterestWithMinPayments)}</strong>
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
