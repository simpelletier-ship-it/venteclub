import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, TrendingUp, AlertTriangle, Lightbulb, Target, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { formatPrice } from "@/lib/priceFormat";
import { Button } from "@/components/ui/button";

interface Insight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'opportunity';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface SmartBudgetInsightsProps {
  transactions: any[];
  categories: any[];
  goals: any[];
  monthlyIncome: number;
  monthlyExpenses: number;
}

export const SmartBudgetInsights = ({ 
  transactions, 
  categories, 
  goals,
  monthlyIncome,
  monthlyExpenses 
}: SmartBudgetInsightsProps) => {
  
  const generateInsights = (): Insight[] => {
    const insights: Insight[] = [];
    
    // Insight 1: Taux d'épargne
    const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;
    if (savingsRate < 10 && monthlyIncome > 0) {
      insights.push({
        id: 'low-savings',
        type: 'warning',
        title: 'Taux d\'épargne faible',
        description: `Votre taux d'épargne est de ${savingsRate.toFixed(1)}%. Les experts recommandent au moins 20% de vos revenus.`,
        impact: 'high',
        action: {
          label: 'Voir recommandations',
          onClick: () => console.log('Show savings recommendations')
        }
      });
    } else if (savingsRate >= 20) {
      insights.push({
        id: 'good-savings',
        type: 'success',
        title: 'Excellent taux d\'épargne!',
        description: `Bravo! Vous épargnez ${savingsRate.toFixed(1)}% de vos revenus. Continuez ainsi!`,
        impact: 'high'
      });
    }
    
    // Insight 2: Catégorie la plus dépensière
    const expensesByCategory = categories
      .filter(cat => cat.type === 'expense')
      .map(category => ({
        ...category,
        total: transactions
          .filter(t => t.category_id === category.id && t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0)
      }))
      .filter(cat => cat.total > 0)
      .sort((a, b) => b.total - a.total);
    
    if (expensesByCategory.length > 0) {
      const topCategory = expensesByCategory[0];
      const percentage = monthlyExpenses > 0 ? (topCategory.total / monthlyExpenses) * 100 : 0;
      
      if (percentage > 40) {
        insights.push({
          id: 'high-category-spending',
          type: 'warning',
          title: `${topCategory.name} représente ${percentage.toFixed(0)}% de vos dépenses`,
          description: `Vous dépensez ${formatPrice(topCategory.total)} en ${topCategory.name}. C'est une part importante de votre budget.`,
          impact: 'medium'
        });
      }
    }
    
    // Insight 3: Dépenses récurrentes détectées
    const recurringTransactions = transactions.filter(t => t.is_recurring && t.type === 'expense');
    if (recurringTransactions.length > 0) {
      const recurringTotal = recurringTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      insights.push({
        id: 'recurring-expenses',
        type: 'info',
        title: `${recurringTransactions.length} dépenses récurrentes détectées`,
        description: `Vos abonnements et dépenses récurrentes totalisent ${formatPrice(recurringTotal)}/mois.`,
        impact: 'medium',
        action: {
          label: 'Gérer les récurrences',
          onClick: () => console.log('Manage recurring')
        }
      });
    }
    
    // Insight 4: Objectifs proches
    const closeGoals = goals.filter(goal => {
      const progress = (goal.current_amount / goal.target_amount) * 100;
      return progress >= 80 && progress < 100;
    });
    
    if (closeGoals.length > 0) {
      insights.push({
        id: 'close-goals',
        type: 'success',
        title: `${closeGoals.length} objectif(s) presque atteint(s)!`,
        description: 'Vous êtes à plus de 80% de vos objectifs. Encore un petit effort!',
        impact: 'high',
        action: {
          label: 'Voir objectifs',
          onClick: () => console.log('Show goals')
        }
      });
    }
    
    // Insight 5: Potentiel d'épargne
    if (expensesByCategory.length > 0 && monthlyIncome > monthlyExpenses) {
      const potentialSavings = (monthlyIncome - monthlyExpenses) * 0.5;
      if (potentialSavings > 100) {
        insights.push({
          id: 'savings-opportunity',
          type: 'opportunity',
          title: 'Opportunité d\'épargne supplémentaire',
          description: `Vous pourriez épargner ${formatPrice(potentialSavings)} de plus en optimisant vos dépenses variables.`,
          impact: 'medium'
        });
      }
    }
    
    // Insight 6: Comparaison avec le mois précédent
    const lastMonthExpenses = transactions
      .filter(t => {
        const date = new Date(t.transaction_date);
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        return date.getMonth() === lastMonth.getMonth() && 
               date.getFullYear() === lastMonth.getFullYear() &&
               t.type === 'expense';
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    if (lastMonthExpenses > 0) {
      const change = ((monthlyExpenses - lastMonthExpenses) / lastMonthExpenses) * 100;
      if (change > 15) {
        insights.push({
          id: 'expense-increase',
          type: 'warning',
          title: `Dépenses en hausse de ${change.toFixed(1)}%`,
          description: `Vous dépensez ${formatPrice(monthlyExpenses - lastMonthExpenses)} de plus que le mois dernier.`,
          impact: 'high'
        });
      } else if (change < -10) {
        insights.push({
          id: 'expense-decrease',
          type: 'success',
          title: `Dépenses en baisse de ${Math.abs(change).toFixed(1)}%`,
          description: `Excellent! Vous économisez ${formatPrice(lastMonthExpenses - monthlyExpenses)} par rapport au mois dernier.`,
          impact: 'high'
        });
      }
    }
    
    return insights;
  };

  const insights = generateInsights();

  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'success':
        return <TrendingUp className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'opportunity':
        return <Sparkles className="h-5 w-5" />;
      default:
        return <Lightbulb className="h-5 w-5" />;
    }
  };

  const getInsightColor = (type: Insight['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30';
      case 'warning':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30';
      case 'opportunity':
        return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30';
      default:
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30';
    }
  };

  const getImpactBadge = (impact: Insight['impact']) => {
    const variants = {
      high: 'destructive',
      medium: 'default',
      low: 'secondary'
    } as const;
    
    const labels = {
      high: 'Impact élevé',
      medium: 'Impact moyen',
      low: 'Impact faible'
    };
    
    return <Badge variant={variants[impact]}>{labels[impact]}</Badge>;
  };

  if (insights.length === 0) {
    return null;
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Insights Intelligents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-lg ${getInsightColor(insight.type)}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm">{insight.title}</h4>
                    {getImpactBadge(insight.impact)}
                  </div>
                  <p className="text-sm opacity-90 mb-3">{insight.description}</p>
                  {insight.action && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={insight.action.onClick}
                      className="text-xs"
                    >
                      {insight.action.label}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
