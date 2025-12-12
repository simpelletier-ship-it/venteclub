import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, TrendingUp, Info, Target, Lightbulb } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion } from "framer-motion";

interface AgeOfMoneyProps {
  monthlyIncome?: number;
  monthlyExpenses?: number;
  currentBalance?: number;
}

export const AgeOfMoney = ({ 
  monthlyIncome = 5000, 
  monthlyExpenses = 4200,
  currentBalance = 8500 
}: AgeOfMoneyProps) => {
  // Calculate age of money (days your current money could last)
  const dailyExpenses = monthlyExpenses / 30;
  const ageOfMoney = Math.floor(currentBalance / dailyExpenses);
  
  // Calculate days of buffering (full months ahead)
  const daysOfBuffering = Math.floor(currentBalance / dailyExpenses);
  const monthsOfBuffering = (daysOfBuffering / 30).toFixed(1);
  
  // Calculate savings rate
  const savingsRate = ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100;
  
  // Age of money benchmarks
  const getBenchmarkStatus = (age: number) => {
    if (age >= 30) return { label: "Excellent", color: "text-emerald-600", bgColor: "bg-emerald-100 dark:bg-emerald-900/30" };
    if (age >= 14) return { label: "Bon", color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30" };
    if (age >= 7) return { label: "Moyen", color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/30" };
    return { label: "À améliorer", color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/30" };
  };

  const status = getBenchmarkStatus(ageOfMoney);

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-xl bg-violet-500/10">
              <Clock className="w-5 h-5 text-violet-600" />
            </div>
            Âge de votre argent
          </CardTitle>
          <Badge className={status.bgColor + " " + status.color + " border-0"}>
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Explanation Card */}
        <div className="p-4 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-violet-200/50 dark:border-violet-800/30">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-violet-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground mb-1">C'est quoi l'âge de l'argent?</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                C'est le nombre de jours que votre argent reste dans votre compte avant d'être dépensé. 
                Plus ce nombre est élevé, plus vous avez une marge de sécurité financière.
              </p>
              <p className="text-xs text-violet-600 dark:text-violet-400 mt-2 font-medium">
                Calcul: Solde actuel ÷ Dépenses quotidiennes moyennes
              </p>
            </div>
          </div>
        </div>

        {/* Main metric */}
        <div className="text-center py-4">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <p className="text-6xl font-bold text-violet-600">{ageOfMoney}</p>
            <p className="text-lg text-muted-foreground">jours</p>
          </motion.div>
        </div>

        {/* Progress towards goal */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Objectif: 30 jours</span>
            <span className="font-medium">{Math.min((ageOfMoney / 30) * 100, 100).toFixed(0)}%</span>
          </div>
          <Progress value={Math.min((ageOfMoney / 30) * 100, 100)} className="h-3" />
        </div>

        {/* Additional metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white/50 dark:bg-slate-800/50 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="w-4 h-4 text-violet-600" />
              <span className="text-xs text-muted-foreground">Mois de tampon</span>
            </div>
            <p className="text-2xl font-bold">{monthsOfBuffering}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/50 dark:bg-slate-800/50 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span className="text-xs text-muted-foreground">Taux d'épargne</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{savingsRate.toFixed(0)}%</p>
          </div>
        </div>

        {/* Tips */}
        <div className="p-4 rounded-xl bg-violet-100/50 dark:bg-violet-900/20 space-y-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-violet-700 dark:text-violet-300" />
            <p className="text-sm font-medium text-violet-700 dark:text-violet-300">
              Conseil pour augmenter l'âge de votre argent
            </p>
          </div>
          <p className="text-xs text-violet-600/80 dark:text-violet-400/80">
            {ageOfMoney < 7 
              ? "Essayez de réduire vos dépenses non-essentielles pour créer un coussin financier."
              : ageOfMoney < 14
              ? "Vous êtes sur la bonne voie! Continuez à épargner régulièrement."
              : ageOfMoney < 30
              ? "Excellent progrès! Visez 30 jours pour une sécurité financière optimale."
              : "Félicitations! Vous avez une excellente marge de sécurité financière."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
