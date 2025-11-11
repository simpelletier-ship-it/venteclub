import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Target, Calendar, Zap } from "lucide-react";
import { formatPrice } from "@/lib/priceFormat";

interface Transaction {
  category_id: string;
  amount: number;
  type: string;
  transaction_date: string;
  is_recurring?: boolean;
  recurring_frequency?: string;
}

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
}

interface BudgetGoal {
  category_id: string;
  monthly_limit: number;
}

interface Debt {
  name: string;
  balance: number;
  interest_rate: number;
  minimum_payment?: number;
  payment_frequency: string;
}

interface BudgetInsightsProps {
  transactions: Transaction[];
  categories: Category[];
  goals: BudgetGoal[];
  debts: Debt[];
  assets: any[];
}

export const BudgetInsights = ({ transactions, categories, goals, debts, assets }: BudgetInsightsProps) => {
  // Calculate insights
  const getInsights = () => {
    const insights: Array<{
      type: 'success' | 'warning' | 'info' | 'danger';
      icon: any;
      title: string;
      description: string;
      action?: string;
    }> = [];

    // 1. High-interest debt alert
    const highInterestDebts = debts.filter(d => d.interest_rate > 15);
    if (highInterestDebts.length > 0) {
      const totalHighInterest = highInterestDebts.reduce((sum, d) => sum + d.balance, 0);
      const monthlyInterest = highInterestDebts.reduce((sum, d) => 
        sum + (d.balance * (d.interest_rate / 100) / 12), 0
      );
      insights.push({
        type: 'danger',
        icon: AlertTriangle,
        title: '⚠️ Taux d\'intérêt élevés détectés',
        description: `Vous payez environ ${formatPrice(monthlyInterest)}/mois en intérêts sur ${formatPrice(totalHighInterest)} de dettes à taux élevé (>${15}%). Priorisez le remboursement de ces dettes.`,
        action: 'Voir stratégie de remboursement'
      });
    }

    // 2. Recurring income vs expenses
    const recurringIncome = transactions
      .filter(t => t.type === 'income' && t.is_recurring)
      .reduce((sum, t) => {
        const monthly = convertToMonthly(t.amount, t.recurring_frequency || 'monthly');
        return sum + monthly;
      }, 0);

    const recurringExpenses = transactions
      .filter(t => t.type === 'expense' && t.is_recurring)
      .reduce((sum, t) => {
        const monthly = convertToMonthly(t.amount, t.recurring_frequency || 'monthly');
        return sum + monthly;
      }, 0);

    const cashflow = recurringIncome - recurringExpenses;
    
    if (cashflow > 0) {
      insights.push({
        type: 'success',
        icon: TrendingUp,
        title: '✅ Cashflow positif',
        description: `Vos revenus récurrents dépassent vos dépenses récurrentes de ${formatPrice(cashflow)}/mois. Excellent! Pensez à automatiser votre épargne.`,
        action: 'Configurer épargne automatique'
      });
    } else if (cashflow < 0) {
      insights.push({
        type: 'warning',
        icon: TrendingDown,
        title: '⚠️ Cashflow négatif',
        description: `Vos dépenses récurrentes dépassent vos revenus de ${formatPrice(Math.abs(cashflow))}/mois. Identifiez les dépenses à réduire.`,
        action: 'Analyser les dépenses'
      });
    }

    // 3. Budget overspending
    const overspentCategories = goals.filter(goal => {
      const spent = transactions
        .filter(t => t.category_id === goal.category_id)
        .reduce((sum, t) => sum + t.amount, 0);
      return spent > goal.monthly_limit;
    });

    if (overspentCategories.length > 0) {
      insights.push({
        type: 'warning',
        icon: Target,
        title: `🎯 ${overspentCategories.length} budget${overspentCategories.length > 1 ? 's' : ''} dépassé${overspentCategories.length > 1 ? 's' : ''}`,
        description: `Vous avez dépassé votre budget dans ${overspentCategories.length} catégorie${overspentCategories.length > 1 ? 's' : ''} ce mois-ci.`,
        action: 'Voir détails'
      });
    }

    // 4. Asset allocation recommendation
    const totalAssets = assets.reduce((sum, a) => sum + Number(a.value), 0);
    const totalDebts = debts.reduce((sum, d) => sum + d.balance, 0);
    const netWorth = totalAssets - totalDebts;

    if (netWorth > 0 && totalAssets > 10000) {
      const rrspAmount = assets.filter(a => a.type === 'rrsp').reduce((sum, a) => sum + Number(a.value), 0);
      const tfsaAmount = assets.filter(a => a.type === 'tfsa').reduce((sum, a) => sum + Number(a.value), 0);
      const investmentAmount = assets.filter(a => a.type === 'investment').reduce((sum, a) => sum + Number(a.value), 0);
      
      const investedAmount = rrspAmount + tfsaAmount + investmentAmount;
      const investmentRatio = (investedAmount / totalAssets) * 100;

      if (investmentRatio < 30) {
        insights.push({
          type: 'info',
          icon: Lightbulb,
          title: '💡 Opportunité d\'investissement',
          description: `Seulement ${investmentRatio.toFixed(0)}% de vos actifs sont investis. Maximisez vos REER et CELI pour profiter des avantages fiscaux et de la croissance composée.`,
          action: 'Voir stratégie d\'investissement'
        });
      }
    }

    // 5. Emergency fund check
    const liquidAssets = assets
      .filter(a => a.type === 'savings' || a.type === 'tfsa')
      .reduce((sum, a) => sum + Number(a.value), 0);
    
    const emergencyFundTarget = recurringExpenses * 6; // 6 months of expenses

    if (liquidAssets < emergencyFundTarget && recurringExpenses > 0) {
      const remaining = emergencyFundTarget - liquidAssets;
      insights.push({
        type: 'info',
        icon: Zap,
        title: '🛡️ Fonds d\'urgence insuffisant',
        description: `Votre fonds d'urgence devrait couvrir 6 mois de dépenses (${formatPrice(emergencyFundTarget)}). Il vous reste ${formatPrice(remaining)} à épargner.`,
        action: 'Créer plan d\'épargne'
      });
    }

    // 6. Upcoming payment reminders
    const today = new Date();
    const dayOfMonth = today.getDate();
    
    if (dayOfMonth >= 1 && dayOfMonth <= 5) {
      const monthlyDebts = debts.filter(d => d.payment_frequency === 'monthly');
      if (monthlyDebts.length > 0) {
        const totalPayments = monthlyDebts.reduce((sum, d) => sum + (d.minimum_payment || 0), 0);
        insights.push({
          type: 'info',
          icon: Calendar,
          title: '📅 Paiements mensuels à venir',
          description: `N'oubliez pas vos paiements mensuels totalisant ${formatPrice(totalPayments)}. Assurez-vous d'avoir les fonds nécessaires.`,
          action: 'Voir calendrier'
        });
      }
    }

    return insights;
  };

  const insights = getInsights();

  const convertToMonthly = (amount: number, frequency: string) => {
    switch (frequency) {
      case 'weekly': return amount * 4.33;
      case 'biweekly': return amount * 2.17;
      case 'yearly': return amount / 12;
      default: return amount;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800';
      case 'warning': return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800';
      case 'danger': return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800';
      default: return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800';
    }
  };

  const getTypeTextColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-700 dark:text-green-400';
      case 'warning': return 'text-yellow-700 dark:text-yellow-400';
      case 'danger': return 'text-red-700 dark:text-red-400';
      default: return 'text-blue-700 dark:text-blue-400';
    }
  };

  if (insights.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          Insights & Recommandations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <Alert key={index} className={`${getTypeColor(insight.type)} border transition-all hover:shadow-md`}>
              <Icon className={`h-4 w-4 ${getTypeTextColor(insight.type)}`} />
              <AlertDescription className="ml-2">
                <div className="space-y-2">
                  <div className={`font-semibold ${getTypeTextColor(insight.type)}`}>
                    {insight.title}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {insight.description}
                  </div>
                  {insight.action && (
                    <Badge variant="outline" className="text-xs cursor-pointer hover:bg-muted">
                      {insight.action}
                    </Badge>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          );
        })}
      </CardContent>
    </Card>
  );
};