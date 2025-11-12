import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertCircle, CheckCircle, Trophy, Target, Zap } from "lucide-react";

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
  if (savingsRate >= 20) badges.push({ name: "Épargnant", icon: Trophy, color: "text-yellow-500" });
  if (savingsRate >= 30) badges.push({ name: "Super Épargnant", icon: Target, color: "text-yellow-600" });
  if (debtToAssetRatio < 30) badges.push({ name: "Faible Endettement", icon: CheckCircle, color: "text-green-500" });
  if (emergencyFundScore >= 100) badges.push({ name: "Fonds d'Urgence", icon: Zap, color: "text-blue-500" });
  if (diversityScore >= 66) badges.push({ name: "Revenus Diversifiés", icon: TrendingUp, color: "text-indigo-500" });

  const recommendations = [];
  if (savingsRate < 20) {
    recommendations.push({
      type: "warning",
      message: "Votre taux d'épargne est inférieur à 20%. Essayez de réduire vos dépenses non-essentielles."
    });
  }
  if (debtToAssetRatio > 50) {
    recommendations.push({
      type: "alert",
      message: "Votre ratio dette/actifs est élevé. Priorisez le remboursement des dettes à taux d'intérêt élevé."
    });
  }
  if (emergencyFundScore < 100) {
    recommendations.push({
      type: "info",
      message: `Il vous manque ${(emergencyFundTarget - liquidAssets).toLocaleString('fr-CA')} $ pour atteindre votre fonds d'urgence de 3 mois.`
    });
  }
  if (diversityScore < 50) {
    recommendations.push({
      type: "info",
      message: "Diversifiez vos sources de revenus pour plus de stabilité financière."
    });
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellente";
    if (score >= 60) return "Bonne";
    if (score >= 40) return "Moyenne";
    return "À améliorer";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Score de Santé Financière
        </CardTitle>
        <CardDescription>
          Évaluation globale de votre situation financière
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-2">
          <div className={`text-6xl font-bold ${getScoreColor(overallScore)}`}>
            {overallScore}/100
          </div>
          <p className="text-lg text-muted-foreground">
            Santé financière : {getScoreLabel(overallScore)}
          </p>
          <Progress value={overallScore} className="h-3" />
        </div>

        {badges.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3">🏆 Badges débloqués</h4>
            <div className="flex flex-wrap gap-2">
              {badges.map((badge, index) => (
                <Badge key={index} variant="secondary" className="gap-1.5 py-1.5">
                  <badge.icon className={`h-4 w-4 ${badge.color}`} />
                  {badge.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <h4 className="font-semibold">Détails du score</h4>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Taux d'épargne</span>
              <span className="font-medium">{savingsRate.toFixed(1)}%</span>
            </div>
            <Progress value={Math.min(savingsRate, 100)} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Ratio dette/actifs</span>
              <span className="font-medium">{debtToAssetRatio.toFixed(1)}%</span>
            </div>
            <Progress value={Math.max(100 - debtToAssetRatio, 0)} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Fonds d'urgence</span>
              <span className="font-medium">{emergencyFundScore.toFixed(0)}%</span>
            </div>
            <Progress value={emergencyFundScore} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Diversification</span>
              <span className="font-medium">{diversityScore.toFixed(0)}%</span>
            </div>
            <Progress value={diversityScore} className="h-2" />
          </div>
        </div>

        {recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold">💡 Recommandations</h4>
            {recommendations.map((rec, index) => (
              <div 
                key={index}
                className={`flex items-start gap-2 p-3 rounded-lg ${
                  rec.type === 'alert' ? 'bg-red-50 dark:bg-red-950/20' :
                  rec.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-950/20' :
                  'bg-blue-50 dark:bg-blue-950/20'
                }`}
              >
                {rec.type === 'alert' ? (
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                ) : rec.type === 'warning' ? (
                  <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                )}
                <p className="text-sm">{rec.message}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
