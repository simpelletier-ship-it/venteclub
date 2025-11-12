import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertCircle, Lightbulb, Target, DollarSign } from "lucide-react";
import { formatPrice } from "@/lib/priceFormat";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  transaction_date: string;
  category_id: string;
  description?: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
  icon?: string;
}

interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
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

interface BudgetInsightsProps {
  transactions: Transaction[];
  categories: Category[];
  goals?: Goal[];
  assets?: Asset[];
  debts?: Debt[];
}

interface Insight {
  type: 'warning' | 'tip' | 'success' | 'info';
  title: string;
  description: string;
  action?: string;
  savings?: number;
  icon: 'trending-up' | 'trending-down' | 'alert' | 'lightbulb' | 'target' | 'dollar';
}

export const BudgetInsights = ({ 
  transactions, 
  categories, 
  goals = [], 
  assets = [], 
  debts = [] 
}: BudgetInsightsProps) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const lastMonth = currentMonth - 1;
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

  // Fonction helper pour obtenir le nom d'une catégorie
  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'Autre';
  };

  // Analyser les insights
  const generateInsights = (): Insight[] => {
    const insights: Insight[] = [];

    // 1. Comparer les dépenses ce mois vs mois dernier
    const thisMonthExpenses = transactions
      .filter(t => t.type === 'expense' && new Date(t.transaction_date).getMonth() === currentMonth)
      .reduce((sum, t) => sum + t.amount, 0);

    const lastMonthExpenses = transactions
      .filter(t => t.type === 'expense' && new Date(t.transaction_date).getMonth() === lastMonth)
      .reduce((sum, t) => sum + t.amount, 0);

    if (lastMonthExpenses > 0) {
      const changePercent = ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100;
      
      if (changePercent > 15) {
        insights.push({
          type: 'warning',
          title: 'Dépenses en hausse',
          description: `+${changePercent.toFixed(0)}% (${formatPrice(thisMonthExpenses - lastMonthExpenses)})`,
          action: 'Vérifiez les catégories en hausse.',
          icon: 'trending-up'
        });
      } else if (changePercent < -10) {
        insights.push({
          type: 'success',
          title: 'Belles économies',
          description: `-${Math.abs(changePercent).toFixed(0)}%`,
          savings: Math.abs(thisMonthExpenses - lastMonthExpenses),
          icon: 'trending-down'
        });
      }
    }

    // 2. Catégorie la plus dépensière
    const expensesByCategory = transactions
      .filter(t => t.type === 'expense' && new Date(t.transaction_date) >= threeMonthsAgo)
      .reduce((acc, t) => {
        acc[t.category_id] = (acc[t.category_id] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const topCategory = Object.entries(expensesByCategory)
      .sort(([, a], [, b]) => b - a)[0];

    if (topCategory) {
      const [categoryId, amount] = topCategory;
      const categoryName = getCategoryName(categoryId);
      const totalExpenses = Object.values(expensesByCategory).reduce((a, b) => a + b, 0);
      const percentage = (amount / totalExpenses) * 100;

      if (percentage > 30) {
        insights.push({
          type: 'info',
          title: `${categoryName}: ${percentage.toFixed(0)}%`,
          description: `${formatPrice(amount)} en 3 mois`,
          action: `Optimisez cette catégorie.`,
          icon: 'dollar'
        });
      }
    }

    // 3. Augmentations par catégorie
    const thisMonthByCategory = transactions
      .filter(t => t.type === 'expense' && new Date(t.transaction_date).getMonth() === currentMonth)
      .reduce((acc, t) => {
        acc[t.category_id] = (acc[t.category_id] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    const lastMonthByCategory = transactions
      .filter(t => t.type === 'expense' && new Date(t.transaction_date).getMonth() === lastMonth)
      .reduce((acc, t) => {
        acc[t.category_id] = (acc[t.category_id] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    Object.keys(thisMonthByCategory).forEach(categoryId => {
      const thisMonth = thisMonthByCategory[categoryId];
      const lastMonth = lastMonthByCategory[categoryId] || 0;
      
      if (lastMonth > 0 && thisMonth > lastMonth * 1.5 && thisMonth > 100) {
        const categoryName = getCategoryName(categoryId);
        
        insights.push({
          type: 'warning',
          title: `${categoryName} en hausse`,
          description: `+${formatPrice(thisMonth - lastMonth)}`,
          action: `Surveillez cette catégorie.`,
          icon: 'alert'
        });
      }
    });

    // 4. Petites dépenses fréquentes
    const smallFrequentExpenses = transactions
      .filter(t => 
        t.type === 'expense' && 
        t.amount < 20 && 
        new Date(t.transaction_date).getMonth() === currentMonth
      );

    if (smallFrequentExpenses.length > 20) {
      const total = smallFrequentExpenses.reduce((sum, t) => sum + t.amount, 0);
      insights.push({
        type: 'tip',
        title: 'Micro-dépenses',
        description: `${smallFrequentExpenses.length} × <20$ = ${formatPrice(total)}`,
        action: `Réduisez ces petites dépenses.`,
        savings: total * 0.3,
        icon: 'lightbulb'
      });
    }

    // 5. Taux d'épargne
    const thisMonthIncome = transactions
      .filter(t => t.type === 'income' && new Date(t.transaction_date).getMonth() === currentMonth)
      .reduce((sum, t) => sum + t.amount, 0);

    if (thisMonthIncome > 0) {
      const savingsRate = ((thisMonthIncome - thisMonthExpenses) / thisMonthIncome) * 100;
      
      if (savingsRate < 5) {
        insights.push({
          type: 'warning',
          title: 'Épargne faible',
          description: `${savingsRate.toFixed(1)}%`,
          action: `Cible: 10-15%`,
          icon: 'target'
        });
      } else if (savingsRate >= 20) {
        insights.push({
          type: 'success',
          title: 'Excellent!',
          description: `${savingsRate.toFixed(0)}% épargnés`,
          icon: 'target'
        });
      }
    }

    // 6. Économies sur restaurants
    const restaurantCategories = categories
      .filter(c => c.name.toLowerCase().includes('restaurant') || c.name.toLowerCase().includes('café'))
      .map(c => c.id);

    const restaurantExpenses = transactions
      .filter(t => 
        t.type === 'expense' && 
        restaurantCategories.includes(t.category_id) &&
        new Date(t.transaction_date) >= threeMonthsAgo
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyRestaurant = restaurantExpenses / 3;

    if (monthlyRestaurant > 200) {
      const potentialSavings = monthlyRestaurant * 0.3;
      insights.push({
        type: 'tip',
        title: 'Restaurants',
        description: `${formatPrice(monthlyRestaurant)}/mois`,
        action: `Cuisinez plus: ~${formatPrice(potentialSavings)}/mois`,
        savings: potentialSavings,
        icon: 'lightbulb'
      });
    }

    return insights.slice(0, 6); // Limiter à 6 insights max
  };

  const insights = generateInsights();

  const getIcon = (iconType: Insight['icon']) => {
    switch (iconType) {
      case 'trending-up': return TrendingUp;
      case 'trending-down': return TrendingDown;
      case 'alert': return AlertCircle;
      case 'lightbulb': return Lightbulb;
      case 'target': return Target;
      case 'dollar': return DollarSign;
    }
  };

  const getIconColor = (type: Insight['type']) => {
    switch (type) {
      case 'warning': return 'text-red-500';
      case 'success': return 'text-green-500';
      case 'tip': return 'text-blue-500';
      case 'info': return 'text-yellow-500';
    }
  };

  const getBorderColor = (type: Insight['type']) => {
    switch (type) {
      case 'warning': return 'border-red-200 dark:border-red-800';
      case 'success': return 'border-green-200 dark:border-green-800';
      case 'tip': return 'border-blue-200 dark:border-blue-800';
      case 'info': return 'border-yellow-200 dark:border-yellow-800';
    }
  };

  const getBgColor = (type: Insight['type']) => {
    switch (type) {
      case 'warning': return 'bg-red-50 dark:bg-red-950/20';
      case 'success': return 'bg-green-50 dark:bg-green-950/20';
      case 'tip': return 'bg-blue-50 dark:bg-blue-950/20';
      case 'info': return 'bg-yellow-50 dark:bg-yellow-950/20';
    }
  };

  if (insights.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">Ajoutez des transactions pour recevoir des conseils.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">💡 Coach financier</h3>
          <Badge variant="outline" className="text-xs">
            {insights.length}
          </Badge>
        </div>

        <div className="space-y-2">
          {insights.map((insight, idx) => {
            const Icon = getIcon(insight.icon);
            return (
              <div 
                key={idx}
                className={`p-3 rounded-lg border-l-2 ${getBorderColor(insight.type)} ${getBgColor(insight.type)}`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 flex-shrink-0 ${getIconColor(insight.type)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <h4 className="font-medium text-sm">{insight.title}</h4>
                      <span className="text-xs text-muted-foreground">{insight.description}</span>
                    </div>
                    {insight.action && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {insight.action}
                      </p>
                    )}
                    {insight.savings && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        Économie: {formatPrice(insight.savings)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
