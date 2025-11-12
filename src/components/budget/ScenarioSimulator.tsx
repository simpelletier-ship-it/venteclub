import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { AlertTriangle, TrendingDown, TrendingUp, Calendar } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface ScenarioSimulatorProps {
  transactions: any[];
  assets: any[];
  debts: any[];
  categories: any[];
  goals: any[];
}

export const ScenarioSimulator = ({ transactions, assets, debts }: ScenarioSimulatorProps) => {
  const last6Months = new Date();
  last6Months.setMonth(last6Months.getMonth() - 6);

  const recentTransactions = transactions.filter(t => new Date(t.date) >= last6Months);

  const monthlyData: { [key: string]: { income: number, expenses: number } } = {};
  
  recentTransactions.forEach(t => {
    const date = new Date(t.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { income: 0, expenses: 0 };
    }
    
    if (t.type === 'income') {
      monthlyData[monthKey].income += t.amount;
    } else {
      monthlyData[monthKey].expenses += t.amount;
    }
  });

  const monthlyValues = Object.values(monthlyData);
  const avgMonthlyIncome = monthlyValues.length > 0 
    ? monthlyValues.reduce((sum, m) => sum + m.income, 0) / monthlyValues.length 
    : 0;
  const avgMonthlyExpenses = monthlyValues.length > 0
    ? monthlyValues.reduce((sum, m) => sum + m.expenses, 0) / monthlyValues.length
    : 0;

  const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
  const totalDebts = debts.reduce((sum, d) => sum + d.balance, 0);
  let currentBalance = totalAssets - totalDebts;

  const projectionData = [];
  const today = new Date();

  for (let i = 0; i <= 12; i++) {
    const projectionDate = new Date(today);
    projectionDate.setMonth(projectionDate.getMonth() + i);
    
    const monthLabel = projectionDate.toLocaleDateString('fr-CA', { month: 'short', year: 'numeric' });
    
    const projectedIncome = avgMonthlyIncome;
    const projectedExpenses = avgMonthlyExpenses;
    
    const debtPayments = totalDebts * 0.02;
    
    const netFlow = projectedIncome - projectedExpenses - debtPayments;
    currentBalance += netFlow;

    projectionData.push({
      month: monthLabel,
      balance: Math.round(currentBalance),
      income: Math.round(projectedIncome),
      expenses: Math.round(projectedExpenses),
      netFlow: Math.round(netFlow)
    });
  }

  const overdraftMonths = projectionData.filter(m => m.balance < 0);
  const negativeFlowMonths = projectionData.filter(m => m.netFlow < 0);

  const safetyBuffer = avgMonthlyExpenses * 3;
  const maxSafePurchase = projectionData[projectionData.length - 1].balance - safetyBuffer;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Prédicteur de Flux de Trésorerie
        </CardTitle>
        <CardDescription>
          Projection sur 12 mois basée sur votre historique
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {overdraftMonths.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Attention !</strong> Risque de découvert détecté dans {overdraftMonths.length} mois : {
                overdraftMonths.map(m => m.month).join(', ')
              }
            </AlertDescription>
          </Alert>
        )}

        {negativeFlowMonths.length > 0 && overdraftMonths.length === 0 && (
          <Alert>
            <TrendingDown className="h-4 w-4" />
            <AlertDescription>
              Flux négatif prévu dans {negativeFlowMonths.length} mois. Surveillez vos dépenses.
            </AlertDescription>
          </Alert>
        )}

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k$`}
              />
              <Tooltip 
                formatter={(value: number) => `${value.toLocaleString('fr-CA')} $`}
                labelStyle={{ color: '#000' }}
              />
              <Legend />
              <ReferenceLine y={0} stroke="red" strokeDasharray="3 3" />
              <Line 
                type="monotone" 
                dataKey="balance" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Solde projeté"
              />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="#10b981" 
                strokeWidth={1}
                strokeDasharray="5 5"
                name="Revenus"
              />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="#ef4444" 
                strokeWidth={1}
                strokeDasharray="5 5"
                name="Dépenses"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Revenus moyens</p>
            <p className="text-xl font-bold text-green-500">
              {avgMonthlyIncome.toLocaleString('fr-CA')} $
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Dépenses moyennes</p>
            <p className="text-xl font-bold text-red-500">
              {avgMonthlyExpenses.toLocaleString('fr-CA')} $
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Flux net mensuel</p>
            <p className={`text-xl font-bold ${(avgMonthlyIncome - avgMonthlyExpenses) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {(avgMonthlyIncome - avgMonthlyExpenses).toLocaleString('fr-CA')} $
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Solde dans 1 an</p>
            <p className={`text-xl font-bold ${projectionData[12]?.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {projectionData[12]?.balance.toLocaleString('fr-CA')} $
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Recommandations pour gros achats
          </h4>
          
          {maxSafePurchase > 0 ? (
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg space-y-2">
              <p className="text-sm">
                Basé sur vos projections, vous pouvez effectuer un achat jusqu'à :
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {maxSafePurchase.toLocaleString('fr-CA')} $
              </p>
              <p className="text-xs text-muted-foreground">
                Tout en conservant un fonds d'urgence de 3 mois ({safetyBuffer.toLocaleString('fr-CA')} $)
              </p>
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
              <p className="text-sm">
                Il est recommandé de constituer un fonds d'urgence avant d'effectuer des gros achats.
                Objectif : {safetyBuffer.toLocaleString('fr-CA')} $ (3 mois de dépenses)
              </p>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm font-medium">Meilleurs mois pour dépenser :</p>
            <div className="flex flex-wrap gap-2">
              {projectionData
                .filter(m => m.netFlow > 0)
                .slice(0, 3)
                .map((m, index) => (
                  <Badge key={index} variant="secondary">
                    {m.month} (+{m.netFlow.toLocaleString('fr-CA')} $)
                  </Badge>
                ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
