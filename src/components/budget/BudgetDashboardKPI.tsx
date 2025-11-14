import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, PiggyBank, CreditCard, Target, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { formatPrice } from "@/lib/priceFormat";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface KPICardProps {
  title: string;
  value: number;
  change: number;
  changeLabel: string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
  color: string;
  progressValue?: number;
  target?: number;
}

const KPICard = ({ title, value, change, changeLabel, icon, trend, color, progressValue, target }: KPICardProps) => {
  const getTrendIcon = () => {
    if (trend === 'up') return <ArrowUpRight className="h-4 w-4" />;
    if (trend === 'down') return <ArrowDownRight className="h-4 w-4" />;
    return null;
  };

  const getTrendColor = () => {
    if (title.includes('Dépenses')) {
      return trend === 'down' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    }
    return trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-border hover:shadow-lg transition-shadow duration-300">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
              <motion.p 
                className="text-3xl font-bold mb-3"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                {formatPrice(value)}
              </motion.p>
              
              {progressValue !== undefined && target !== undefined && (
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{Math.round(progressValue)}%</span>
                    <span>Objectif: {formatPrice(target)}</span>
                  </div>
                  <Progress value={progressValue} className="h-2" />
                </div>
              )}
              
              <div className={`flex items-center gap-2 ${getTrendColor()}`}>
                {getTrendIcon()}
                <span className="text-sm font-semibold">
                  {change > 0 ? '+' : ''}{change.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">{changeLabel}</span>
              </div>
            </div>
            
            <div 
              className={`p-3 rounded-lg`}
              style={{ backgroundColor: `${color}15` }}
            >
              <div style={{ color }}>{icon}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

interface BudgetDashboardKPIProps {
  currentMonthIncome: number;
  currentMonthExpenses: number;
  previousMonthIncome: number;
  previousMonthExpenses: number;
  savings: number;
  previousSavings: number;
  netWorth: number;
  previousNetWorth: number;
  savingsGoal?: number;
  monthlyBudget?: number;
}

export const BudgetDashboardKPI = ({
  currentMonthIncome,
  currentMonthExpenses,
  previousMonthIncome,
  previousMonthExpenses,
  savings,
  previousSavings,
  netWorth,
  previousNetWorth,
  savingsGoal,
  monthlyBudget
}: BudgetDashboardKPIProps) => {
  
  const incomeChange = previousMonthIncome > 0 
    ? ((currentMonthIncome - previousMonthIncome) / previousMonthIncome) * 100 
    : 0;
  
  const expensesChange = previousMonthExpenses > 0 
    ? ((currentMonthExpenses - previousMonthExpenses) / previousMonthExpenses) * 100 
    : 0;
  
  const savingsChange = previousSavings > 0 
    ? ((savings - previousSavings) / previousSavings) * 100 
    : 0;
  
  const netWorthChange = previousNetWorth > 0 
    ? ((netWorth - previousNetWorth) / previousNetWorth) * 100 
    : 0;

  const savingsProgress = savingsGoal ? (savings / savingsGoal) * 100 : undefined;
  const budgetUsage = monthlyBudget ? (currentMonthExpenses / monthlyBudget) * 100 : undefined;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <KPICard
        title="Revenus du mois"
        value={currentMonthIncome}
        change={incomeChange}
        changeLabel="vs mois dernier"
        icon={<DollarSign className="h-6 w-6" />}
        trend={incomeChange > 0 ? 'up' : incomeChange < 0 ? 'down' : 'neutral'}
        color="#10b981"
      />
      
      <KPICard
        title="Dépenses du mois"
        value={currentMonthExpenses}
        change={expensesChange}
        changeLabel="vs mois dernier"
        icon={<CreditCard className="h-6 w-6" />}
        trend={expensesChange > 0 ? 'up' : expensesChange < 0 ? 'down' : 'neutral'}
        color="#ef4444"
        progressValue={budgetUsage}
        target={monthlyBudget}
      />
      
      <KPICard
        title="Épargne accumulée"
        value={savings}
        change={savingsChange}
        changeLabel="vs mois dernier"
        icon={<PiggyBank className="h-6 w-6" />}
        trend={savingsChange > 0 ? 'up' : savingsChange < 0 ? 'down' : 'neutral'}
        color="#3b82f6"
        progressValue={savingsProgress}
        target={savingsGoal}
      />
      
      <KPICard
        title="Valeur nette"
        value={netWorth}
        change={netWorthChange}
        changeLabel="vs mois dernier"
        icon={<Target className="h-6 w-6" />}
        trend={netWorthChange > 0 ? 'up' : netWorthChange < 0 ? 'down' : 'neutral'}
        color="#8b5cf6"
      />
    </div>
  );
};
