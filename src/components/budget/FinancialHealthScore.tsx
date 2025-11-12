import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PiggyBank, 
  AlertCircle,
  CheckCircle,
  Activity
} from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  transaction_date: string;
  category_id: string;
}

interface Asset {
  id: string;
  value: number;
  type: string;
}

interface Debt {
  id: string;
  balance: number;
  interest_rate: number;
}

interface FinancialHealthScoreProps {
  transactions: Transaction[];
  assets: Asset[];
  debts: Debt[];
}

export const FinancialHealthScore = ({ transactions, assets, debts }: FinancialHealthScoreProps) => {
  // Calculer les métriques
  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  
  const recentTransactions = transactions.filter(
    t => new Date(t.transaction_date) >= threeMonthsAgo
  );

  // 1. Score de régularité des dépenses (0-25 points)
  const calculateRegularityScore = (): number => {
    if (recentTransactions.length < 10) return 10; // Pas assez de données
    
    const monthlyExpenses = recentTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        const month = new Date(t.transaction_date).getMonth();
        acc[month] = (acc[month] || 0) + t.amount;
        return acc;
      }, {} as Record<number, number>);
    
    const expenses = Object.values(monthlyExpenses);
    if (expenses.length < 2) return 10;
    
    const avg = expenses.reduce((a, b) => a + b, 0) / expenses.length;
    const variance = expenses.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / expenses.length;
    const coeffVariation = Math.sqrt(variance) / avg;
    
    // Moins de variation = meilleur score
    if (coeffVariation < 0.15) return 25;
    if (coeffVariation < 0.30) return 20;
    if (coeffVariation < 0.50) return 15;
    return 10;
  };

  // 2. Score de stabilité des revenus (0-25 points)
  const calculateIncomeStabilityScore = (): number => {
    const incomes = recentTransactions.filter(t => t.type === 'income');
    if (incomes.length < 3) return 10;
    
    const monthlyIncomes = incomes.reduce((acc, t) => {
      const month = new Date(t.transaction_date).getMonth();
      acc[month] = (acc[month] || 0) + t.amount;
      return acc;
    }, {} as Record<number, number>);
    
    const revenues = Object.values(monthlyIncomes);
    const avg = revenues.reduce((a, b) => a + b, 0) / revenues.length;
    const hasRegularIncome = revenues.every(r => r > avg * 0.8);
    
    if (hasRegularIncome && revenues.length >= 3) return 25;
    if (revenues.length >= 2) return 15;
    return 10;
  };

  // 3. Score de structure financière (0-25 points)
  const calculateStructureScore = (): number => {
    const totalIncome = recentTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = recentTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    if (totalIncome === 0) return 0;
    
    const savingsRate = ((totalIncome - totalExpenses) / totalIncome) * 100;
    
    // Taux d'épargne idéal: 20%+
    if (savingsRate >= 20) return 25;
    if (savingsRate >= 15) return 20;
    if (savingsRate >= 10) return 15;
    if (savingsRate >= 5) return 10;
    return 5;
  };

  // 4. Score de gestion des actifs et dettes (0-25 points)
  const calculateAssetsDebtsScore = (): number => {
    const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
    const totalDebts = debts.reduce((sum, d) => sum + d.balance, 0);
    const netWorth = totalAssets - totalDebts;
    
    let score = 0;
    
    // Fonds d'urgence (actifs liquides)
    const liquidAssets = assets
      .filter(a => a.type === 'savings' || a.type === 'checking')
      .reduce((sum, a) => sum + a.value, 0);
    
    if (liquidAssets > 10000) score += 10;
    else if (liquidAssets > 5000) score += 7;
    else if (liquidAssets > 2000) score += 5;
    
    // Ratio actifs/dettes
    if (totalDebts === 0 && totalAssets > 0) score += 15;
    else if (netWorth > 0) score += 10;
    else if (netWorth > -50000) score += 5;
    
    return score;
  };

  const regularityScore = calculateRegularityScore();
  const stabilityScore = calculateIncomeStabilityScore();
  const structureScore = calculateStructureScore();
  const assetsScore = calculateAssetsDebtsScore();
  
  const totalScore = regularityScore + stabilityScore + structureScore + assetsScore;

  // Déterminer le niveau de santé
  const getHealthLevel = (score: number) => {
    if (score >= 80) return { label: "Excellente", color: "text-green-500", bg: "bg-green-500/10" };
    if (score >= 60) return { label: "Bonne", color: "text-blue-500", bg: "bg-blue-500/10" };
    if (score >= 40) return { label: "Moyenne", color: "text-yellow-500", bg: "bg-yellow-500/10" };
    return { label: "À améliorer", color: "text-red-500", bg: "bg-red-500/10" };
  };

  const healthLevel = getHealthLevel(totalScore);

  // Recommandations
  const getRecommendations = () => {
    const recommendations = [];
    
    if (regularityScore < 15) {
      recommendations.push("Stabilisez vos dépenses mensuelles pour une meilleure prévisibilité");
    }
    if (stabilityScore < 15) {
      recommendations.push("Diversifiez vos sources de revenus pour plus de stabilité");
    }
    if (structureScore < 15) {
      recommendations.push("Augmentez votre taux d'épargne à au moins 15% de vos revenus");
    }
    if (assetsScore < 15) {
      recommendations.push("Constituez un fonds d'urgence de 3-6 mois de dépenses");
    }
    
    return recommendations;
  };

  const recommendations = getRecommendations();

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Score principal */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <h3 className="text-2xl font-semibold">Score de Santé Financière</h3>
          </div>
          
          <div className="relative inline-flex items-center justify-center">
            <div className={`text-6xl font-bold ${healthLevel.color}`}>
              {totalScore}
            </div>
            <span className="text-2xl text-muted-foreground ml-2">/100</span>
          </div>
          
          <Badge className={`${healthLevel.bg} ${healthLevel.color} border-0 px-4 py-1 text-sm`}>
            {healthLevel.label}
          </Badge>
          
          <Progress value={totalScore} className="h-3" />
        </div>

        {/* Détails des scores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Régularité */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Régularité</span>
              </div>
              <span className="text-sm font-semibold">{regularityScore}/25</span>
            </div>
            <Progress value={(regularityScore / 25) * 100} className="h-2" />
          </div>

          {/* Stabilité */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Stabilité revenus</span>
              </div>
              <span className="text-sm font-semibold">{stabilityScore}/25</span>
            </div>
            <Progress value={(stabilityScore / 25) * 100} className="h-2" />
          </div>

          {/* Structure */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PiggyBank className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Taux d'épargne</span>
              </div>
              <span className="text-sm font-semibold">{structureScore}/25</span>
            </div>
            <Progress value={(structureScore / 25) * 100} className="h-2" />
          </div>

          {/* Actifs/Dettes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Actifs & Dettes</span>
              </div>
              <span className="text-sm font-semibold">{assetsScore}/25</span>
            </div>
            <Progress value={(assetsScore / 25) * 100} className="h-2" />
          </div>
        </div>

        {/* Recommandations */}
        {recommendations.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-primary" />
              Recommandations pour améliorer votre score
            </h4>
            <ul className="space-y-2">
              {recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Message de motivation */}
        {totalScore >= 80 && (
          <div className="text-center text-sm text-muted-foreground pt-2 border-t">
            🎉 Excellente gestion financière! Continuez sur cette lancée!
          </div>
        )}
      </div>
    </Card>
  );
};
