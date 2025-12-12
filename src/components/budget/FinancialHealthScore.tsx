import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, Zap, CheckCircle, TrendingUp } from "lucide-react";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { cn } from "@/lib/utils";

interface FinancialHealthScoreProps {
  transactions: any[];
  debts: any[];
  assets: any[];
}

export const FinancialHealthScore = ({ 
  transactions, 
  debts,
  assets 
}: FinancialHealthScoreProps) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const currentMonthTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const totalIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);
  const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
  const debtToAssetRatio = totalAssets > 0 ? (totalDebt / totalAssets) * 100 : 0;

  const avgMonthlyExpenses = totalExpenses || 1000;
  const emergencyFundTarget = avgMonthlyExpenses * 3;
  const liquidAssets = assets.filter(a => a.type === 'CELI' || a.type === 'Investments').reduce((sum, a) => sum + a.value, 0);
  const emergencyFundScore = Math.min((liquidAssets / emergencyFundTarget) * 100, 100);

  const incomeCategories = new Set(
    currentMonthTransactions.filter(t => t.type === 'income').map(t => t.category_id)
  );
  const diversityScore = Math.min((incomeCategories.size / 3) * 100, 100);

  const overallScore = Math.round(
    (savingsRate * 0.35) +
    (Math.max(100 - debtToAssetRatio, 0) * 0.25) +
    (emergencyFundScore * 0.25) +
    (diversityScore * 0.15)
  );

  const badges = [];
  if (savingsRate >= 20) badges.push({ name: "Épargnant", icon: Trophy, color: "text-amber-500" });
  if (debtToAssetRatio < 30) badges.push({ name: "Faible dette", icon: CheckCircle, color: "text-primary" });
  if (emergencyFundScore >= 100) badges.push({ name: "Fonds OK", icon: Zap, color: "text-blue-500" });
  if (diversityScore >= 66) badges.push({ name: "Diversifié", icon: TrendingUp, color: "text-violet-500" });

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-primary";
    if (score >= 60) return "text-amber-500";
    return "text-slate-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellente";
    if (score >= 60) return "Bonne";
    if (score >= 40) return "Moyenne";
    return "À améliorer";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-primary";
    if (score >= 60) return "bg-amber-500";
    return "bg-slate-400";
  };

  const metrics = [
    { label: "Épargne", value: savingsRate, tooltip: "% de revenus économisés" },
    { label: "Dette/Actifs", value: Math.max(100 - debtToAssetRatio, 0), tooltip: "Ratio dette/actifs inversé" },
    { label: "Fonds urgence", value: emergencyFundScore, tooltip: "Couverture 3 mois" },
    { label: "Diversification", value: diversityScore, tooltip: "Sources de revenus" },
  ];

  return (
    <div className="space-y-5">
      {/* Score principal - Design premium compact */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <div className={cn(
            "w-24 h-24 rounded-full flex items-center justify-center border-4",
            overallScore >= 80 ? "border-primary/30 bg-primary/5" :
            overallScore >= 60 ? "border-amber-500/30 bg-amber-500/5" :
            "border-slate-400/30 bg-slate-400/5"
          )}>
            <div className="text-center">
              <span className={cn("text-3xl font-bold", getScoreColor(overallScore))}>
                {overallScore}
              </span>
              <span className="text-xs text-muted-foreground block">/100</span>
            </div>
          </div>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">{getScoreLabel(overallScore)}</span>
          </div>
          <Progress value={overallScore} className="h-2 mb-3" />
          
          {/* Badges compacts */}
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {badges.slice(0, 3).map((badge, index) => (
                <Badge key={index} variant="secondary" className="gap-1 py-0.5 px-2 text-[10px] bg-muted/50">
                  <badge.icon className={cn("h-3 w-3", badge.color)} />
                  {badge.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Métriques détaillées - Grid compact */}
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="p-3 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                {metric.label}
                <InfoTooltip content={metric.tooltip} />
              </span>
              <span className={cn(
                "text-sm font-bold",
                metric.value >= 60 ? "text-primary" : metric.value >= 40 ? "text-amber-500" : "text-muted-foreground"
              )}>
                {metric.value.toFixed(0)}%
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn("h-full rounded-full transition-all", getProgressColor(metric.value))}
                style={{ width: `${Math.min(metric.value, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
