import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface CoachAdvice {
  type: 'success' | 'warning' | 'info';
  title: string;
  message: string;
  icon: any;
}

export const AIFinancialCoach = () => {
  const { toast } = useToast();
  const [advice, setAdvice] = useState<CoachAdvice[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch user's financial data
  const { data: transactions } = useQuery({
    queryKey: ['budget-transactions-all'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from('budget_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['budget-categories'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from('budget_categories')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    },
  });

  const { data: debts } = useQuery({
    queryKey: ['user-debts'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from('user_debts')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    },
  });

  const generateAdvice = async () => {
    setIsGenerating(true);
    try {
      // Analyse locale des données
      const newAdvice: CoachAdvice[] = [];

      if (!transactions || transactions.length === 0) {
        newAdvice.push({
          type: 'info',
          title: "Commencez votre suivi!",
          message: "Vous n'avez pas encore de transactions enregistrées. Commencez par ajouter vos revenus et dépenses pour recevoir des conseils personnalisés.",
          icon: Sparkles
        });
        setAdvice(newAdvice);
        setIsGenerating(false);
        return;
      }

      // Calcul des revenus et dépenses du mois en cours
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const monthlyTransactions = transactions.filter(t => {
        const date = new Date(t.transaction_date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });

      const monthlyIncome = monthlyTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const monthlyExpenses = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

      // Conseils basés sur le taux d'épargne
      if (savingsRate >= 20) {
        newAdvice.push({
          type: 'success',
          title: "🎉 Excellent taux d'épargne!",
          message: `Bravo! Vous épargnez ${savingsRate.toFixed(1)}% de vos revenus ce mois-ci. C'est bien au-dessus de la recommandation de 20%. Continuez comme ça!`,
          icon: TrendingUp
        });
      } else if (savingsRate >= 10) {
        newAdvice.push({
          type: 'info',
          title: "Bon travail sur l'épargne",
          message: `Vous épargnez ${savingsRate.toFixed(1)}% de vos revenus. Essayez d'augmenter progressivement ce taux vers 20% pour atteindre vos objectifs plus rapidement.`,
          icon: TrendingUp
        });
      } else if (savingsRate > 0) {
        newAdvice.push({
          type: 'warning',
          title: "Potentiel d'amélioration",
          message: `Votre taux d'épargne est de ${savingsRate.toFixed(1)}%. Identifiez une dépense non essentielle que vous pourriez réduire pour augmenter votre épargne.`,
          icon: AlertCircle
        });
      } else {
        newAdvice.push({
          type: 'warning',
          title: "⚠️ Attention aux dépenses",
          message: "Vous dépensez plus que vous gagnez ce mois-ci. Analysez vos dépenses et identifiez des opportunités de réduction.",
          icon: TrendingDown
        });
      }

      // Analyse des dépenses par catégorie - simplifié sans budget
      const expenseCategories = categories?.filter(c => c.type === 'expense') || [];
      const categorySpending = expenseCategories.map(cat => {
        const spent = monthlyTransactions
          .filter(t => t.category_id === cat.id && t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        
        return {
          name: cat.name,
          spent
        };
      }).filter(c => c.spent > 0).sort((a, b) => b.spent - a.spent);

      // Top 3 catégories de dépenses
      if (categorySpending.length >= 3) {
        const top3 = categorySpending.slice(0, 3);
        newAdvice.push({
          type: 'info',
          title: "Vos principales catégories de dépenses",
          message: `Ce mois-ci, vos 3 plus grosses dépenses sont: ${top3.map(c => `${c.name} (${c.spent.toFixed(2)}$)`).join(', ')}.`,
          icon: TrendingUp
        });
      }

      // Analyse des dettes
      if (debts && debts.length > 0) {
        const totalDebt = debts.reduce((sum, d) => sum + d.balance, 0);
        const highInterestDebts = debts.filter(d => d.interest_rate > 10);
        
        if (highInterestDebts.length > 0) {
          newAdvice.push({
            type: 'warning',
            title: "Priorisez vos dettes",
            message: `Vous avez ${highInterestDebts.length} dette(s) à taux d'intérêt élevé (>10%). Concentrez-vous sur leur remboursement en priorité pour économiser sur les intérêts.`,
            icon: AlertCircle
          });
        }

        if (totalDebt > monthlyIncome * 12) {
          newAdvice.push({
            type: 'warning',
            title: "Ratio d'endettement élevé",
            message: "Vos dettes totales dépassent votre revenu annuel. Établissez un plan de remboursement agressif et évitez de nouvelles dettes.",
            icon: TrendingDown
          });
        }
      }

      // Encouragements positifs
      if (monthlyIncome > 0 && monthlyExpenses > 0 && savingsRate > 0) {
        newAdvice.push({
          type: 'success',
          title: "✨ Vous êtes sur la bonne voie!",
          message: "Vous suivez activement votre budget et maintenez un équilibre positif. Continuez d'enregistrer vos transactions pour voir votre progrès!",
          icon: Sparkles
        });
      }

      setAdvice(newAdvice);
      
      toast({
        title: "Analyse terminée",
        description: `${newAdvice.length} conseil(s) personnalisé(s) générés`,
      });
    } catch (error: any) {
      console.error('Error generating advice:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer les conseils",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Coach financier
        </CardTitle>
        <CardDescription>
          Recevez des conseils personnalisés basés sur vos habitudes financières
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={generateAdvice}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyse en cours...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Obtenir des conseils personnalisés
            </>
          )}
        </Button>

        {advice.length > 0 && (
          <div className="space-y-3 mt-4">
            {advice.map((item, index) => {
              const Icon = item.icon;
              const bgColor = item.type === 'success' 
                ? 'bg-green-500/10 border-green-500/20' 
                : item.type === 'warning' 
                ? 'bg-yellow-500/10 border-yellow-500/20'
                : 'bg-blue-500/10 border-blue-500/20';

              return (
                <div key={index} className={`p-4 rounded-lg border ${bgColor}`}>
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      <p className="font-semibold text-sm">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.message}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
