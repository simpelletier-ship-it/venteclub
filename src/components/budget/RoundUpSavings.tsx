import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Coins, PiggyBank, TrendingUp, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface RoundUpSavingsProps {
  transactions?: Array<{ amount: number; description?: string | null; transaction_date?: string; date?: string }>;
}

export const RoundUpSavings = ({ transactions = [] }: RoundUpSavingsProps) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [roundUpAmount, setRoundUpAmount] = useState<1 | 2 | 5>(1);

  // Calculate round-ups from transactions
  const calculateRoundUp = (amount: number) => {
    const remainder = amount % roundUpAmount;
    return remainder > 0 ? roundUpAmount - remainder : 0;
  };

  const sampleTransactions = transactions.length > 0 ? transactions.map(t => ({
    amount: t.amount,
    description: t.description || "Transaction",
    date: t.transaction_date || t.date || new Date().toISOString().slice(0, 10)
  })) : [
    { amount: 4.75, description: "Café", date: "2024-01-15" },
    { amount: 23.42, description: "Épicerie", date: "2024-01-14" },
    { amount: 8.99, description: "Netflix", date: "2024-01-13" },
    { amount: 15.33, description: "Restaurant", date: "2024-01-12" },
    { amount: 67.88, description: "Essence", date: "2024-01-11" },
  ];

  const totalRoundUps = sampleTransactions.reduce(
    (acc, t) => acc + calculateRoundUp(t.amount),
    0
  );

  const monthlyEstimate = totalRoundUps * 4;
  const yearlyEstimate = monthlyEstimate * 12;

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-xl bg-amber-500/10">
              <Coins className="w-5 h-5 text-amber-600" />
            </div>
            Épargne Arrondie
          </CardTitle>
          <Switch
            checked={isEnabled}
            onCheckedChange={setIsEnabled}
            className="data-[state=checked]:bg-amber-600"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Round-up amount selector */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Arrondir au:</p>
          <div className="flex gap-2">
            {([1, 2, 5] as const).map((amount) => (
              <Button
                key={amount}
                variant={roundUpAmount === amount ? "default" : "outline"}
                size="sm"
                onClick={() => setRoundUpAmount(amount)}
                className={roundUpAmount === amount ? "bg-amber-600 hover:bg-amber-700" : ""}
              >
                {amount}$ supérieur
              </Button>
            ))}
          </div>
        </div>

        {/* Recent round-ups */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Dernières transactions arrondies</p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {sampleTransactions.slice(0, 5).map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between p-2 rounded-lg bg-white/50 dark:bg-slate-800/50"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{t.description}</span>
                  <span className="text-xs text-muted-foreground">{t.amount.toFixed(2)}$</span>
                </div>
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  +{calculateRoundUp(t.amount).toFixed(2)}$
                </Badge>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Savings summary */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">{totalRoundUps.toFixed(2)}$</p>
            <p className="text-xs text-muted-foreground">Cette semaine</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">{monthlyEstimate.toFixed(0)}$</p>
            <p className="text-xs text-muted-foreground">Est. mensuel</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">{yearlyEstimate.toFixed(0)}$</p>
            <p className="text-xs text-muted-foreground">Est. annuel</p>
          </div>
        </div>

        {/* Progress towards micro-goal */}
        <div className="space-y-2 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PiggyBank className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium">Objectif micro-épargne</span>
            </div>
            <span className="text-sm text-amber-600 font-medium">
              {Math.min(totalRoundUps, 50).toFixed(0)}$ / 50$
            </span>
          </div>
          <Progress value={(totalRoundUps / 50) * 100} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
};
