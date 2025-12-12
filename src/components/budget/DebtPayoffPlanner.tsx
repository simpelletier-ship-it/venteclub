import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, TrendingDown, Snowflake, Flame, Calendar, DollarSign, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";

interface Debt {
  id: string;
  name: string;
  balance: number;
  interestRate: number;
  minimumPayment: number;
}

export const DebtPayoffPlanner = () => {
  const [strategy, setStrategy] = useState<"snowball" | "avalanche">("avalanche");
  const [extraPayment, setExtraPayment] = useState(200);

  const [debts] = useState<Debt[]>([
    { id: "1", name: "Carte Visa", balance: 5200, interestRate: 19.99, minimumPayment: 150 },
    { id: "2", name: "Carte Mastercard", balance: 3100, interestRate: 21.99, minimumPayment: 95 },
    { id: "3", name: "Prêt personnel", balance: 8500, interestRate: 9.5, minimumPayment: 220 },
    { id: "4", name: "Marge de crédit", balance: 2000, interestRate: 12.0, minimumPayment: 50 },
  ]);

  const totalDebt = debts.reduce((acc, d) => acc + d.balance, 0);
  const totalMinimum = debts.reduce((acc, d) => acc + d.minimumPayment, 0);
  const avgInterestRate = debts.reduce((acc, d) => acc + d.interestRate * (d.balance / totalDebt), 0);

  // Sort debts based on strategy
  const sortedDebts = useMemo(() => {
    return [...debts].sort((a, b) => {
      if (strategy === "snowball") {
        return a.balance - b.balance; // Smallest balance first
      }
      return b.interestRate - a.interestRate; // Highest interest first
    });
  }, [debts, strategy]);

  // Calculate payoff timeline (simplified)
  const calculatePayoffMonths = (debt: Debt, extra: number = 0) => {
    const monthlyRate = debt.interestRate / 100 / 12;
    const payment = debt.minimumPayment + extra;
    if (payment <= debt.balance * monthlyRate) return Infinity;
    return Math.ceil(
      Math.log(payment / (payment - debt.balance * monthlyRate)) / Math.log(1 + monthlyRate)
    );
  };

  const getPayoffDate = (months: number) => {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return date.toLocaleDateString("fr-CA", { month: "short", year: "numeric" });
  };

  // Calculate total interest saved with extra payments
  const calculateInterestSaved = () => {
    let standardInterest = 0;
    let acceleratedInterest = 0;
    
    debts.forEach((debt) => {
      const standardMonths = calculatePayoffMonths(debt, 0);
      const acceleratedMonths = calculatePayoffMonths(debt, extraPayment / debts.length);
      
      standardInterest += (debt.minimumPayment * standardMonths) - debt.balance;
      acceleratedInterest += ((debt.minimumPayment + extraPayment / debts.length) * acceleratedMonths) - debt.balance;
    });

    return Math.max(0, standardInterest - acceleratedInterest);
  };

  const interestSaved = calculateInterestSaved();

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-xl bg-red-500/10">
              <CreditCard className="w-5 h-5 text-red-600" />
            </div>
            Plan de remboursement des dettes
          </CardTitle>
          <Badge variant="secondary">{debts.length} dettes</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-xl bg-red-50 dark:bg-red-950/20">
            <p className="text-2xl font-bold text-red-600">{totalDebt.toLocaleString()}$</p>
            <p className="text-xs text-muted-foreground">Dette totale</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20">
            <p className="text-2xl font-bold text-amber-600">{avgInterestRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Taux moyen</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20">
            <p className="text-2xl font-bold text-emerald-600">{interestSaved.toFixed(0)}$</p>
            <p className="text-xs text-muted-foreground">Intérêts économisés</p>
          </div>
        </div>

        {/* Strategy selector */}
        <Tabs value={strategy} onValueChange={(v) => setStrategy(v as "snowball" | "avalanche")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="snowball" className="gap-2">
              <Snowflake className="w-4 h-4" />
              Boule de neige
            </TabsTrigger>
            <TabsTrigger value="avalanche" className="gap-2">
              <Flame className="w-4 h-4" />
              Avalanche
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 p-4 rounded-xl bg-muted/50">
            {strategy === "snowball" ? (
              <div className="flex items-start gap-2">
                <Snowflake className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Méthode boule de neige</p>
                  <p className="text-xs text-muted-foreground">
                    Payez d'abord les plus petites dettes pour des victoires rapides et de la motivation.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <Flame className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Méthode avalanche</p>
                  <p className="text-xs text-muted-foreground">
                    Payez d'abord les dettes à taux élevé pour économiser le maximum d'intérêts.
                  </p>
                </div>
              </div>
            )}
          </div>
        </Tabs>

        {/* Extra payment slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Paiement supplémentaire mensuel</span>
            <Badge variant="outline" className="font-mono">{extraPayment}$/mois</Badge>
          </div>
          <input
            type="range"
            min="0"
            max="1000"
            step="50"
            value={extraPayment}
            onChange={(e) => setExtraPayment(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0$</span>
            <span>500$</span>
            <span>1000$</span>
          </div>
        </div>

        {/* Debt list */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Ordre de remboursement recommandé</p>
          {sortedDebts.map((debt, index) => {
            const months = calculatePayoffMonths(debt, index === 0 ? extraPayment : 0);
            const payoffDate = getPayoffDate(months);
            const progressPercent = ((debts.find(d => d.id === debt.id)?.balance || 0) - debt.balance) / (debts.find(d => d.id === debt.id)?.balance || 1) * 100;

            return (
              <motion.div
                key={debt.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-xl border ${index === 0 ? "border-primary bg-primary/5" : "border-border bg-card"}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {index === 0 && <Badge className="bg-primary text-primary-foreground">Priorité</Badge>}
                    <span className="font-medium">{debt.name}</span>
                  </div>
                  <span className="font-bold">{debt.balance.toLocaleString()}$</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>{debt.interestRate}% d'intérêt</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Libéré: {payoffDate}
                  </span>
                </div>
                <Progress value={0} className="h-1.5" />
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
