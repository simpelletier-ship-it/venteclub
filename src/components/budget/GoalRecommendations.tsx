import { useState, useEffect } from "react";
import { Sparkles, Target, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/priceFormat";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface Recommendation {
  type: string;
  name: string;
  target: number;
  reason: string;
  icon: string;
}

export const GoalRecommendations = () => {
  const queryClient = useQueryClient();
  const [selectedReco, setSelectedReco] = useState<Recommendation | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Check auth first
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsReady(!!session);
    };
    checkAuth();
  }, []);

  // Fetch user data for recommendations
  const { data: transactions = [], isError: transactionsError } = useQuery({
    queryKey: ['transactions-for-reco'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_transactions')
        .select('*')
        .eq('type', 'income')
        .order('transaction_date', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: isReady,
    retry: 1,
  });

  const { data: existingGoals = [], isError: goalsError } = useQuery({
    queryKey: ['financial-goals'],
    queryFn: async () => {
      const { data, error } = await supabase.from('financial_goals').select('*');
      if (error) throw error;
      return data || [];
    },
    enabled: isReady,
    retry: 1,
  });

  const { data: debts = [], isError: debtsError } = useQuery({
    queryKey: ['user-debts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_debts').select('*');
      if (error) throw error;
      return data || [];
    },
    enabled: isReady,
    retry: 1,
  });

  // Calculate personalized recommendations
  const generateRecommendations = (): Recommendation[] => {
    const recommendations: Recommendation[] = [];
    
    // Average monthly income
    const avgIncome = transactions.length > 0 
      ? transactions.reduce((sum, t) => sum + Number(t.amount), 0) / transactions.length 
      : 4000;

    // Emergency fund (3-6 months of expenses)
    if (!existingGoals.some(g => g.type === 'emergency_fund')) {
      recommendations.push({
        type: 'emergency_fund',
        name: 'Fonds d\'urgence',
        target: avgIncome * 3,
        reason: `Recommandé: 3 mois de dépenses (${formatPrice(avgIncome)}/mois)`,
        icon: '🚨'
      });
    }

    // Debt payoff if user has debts
    const totalDebt = debts.reduce((sum, d) => sum + Number(d.balance), 0);
    if (totalDebt > 0 && !existingGoals.some(g => g.type === 'debt_payoff')) {
      recommendations.push({
        type: 'debt_payoff',
        name: 'Remboursement de dettes',
        target: totalDebt,
        reason: `Vous avez ${formatPrice(totalDebt)} en dettes à rembourser`,
        icon: '💳'
      });
    }

    // Vacation savings (20% of annual income)
    if (!existingGoals.some(g => g.name.toLowerCase().includes('vacan'))) {
      recommendations.push({
        type: 'savings',
        name: 'Vacances annuelles',
        target: avgIncome * 12 * 0.2,
        reason: 'Budget recommandé: 20% de votre revenu annuel',
        icon: '✈️'
      });
    }

    // Investment goal
    if (!existingGoals.some(g => g.type === 'investment')) {
      recommendations.push({
        type: 'investment',
        name: 'Investissements',
        target: avgIncome * 6,
        reason: 'Commencez à investir pour votre futur',
        icon: '📈'
      });
    }

    return recommendations.slice(0, 3); // Top 3 recommendations
  };

  // Handle errors gracefully
  if (transactionsError || goalsError || debtsError || !isReady) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">Chargement des recommandations...</p>
        </CardContent>
      </Card>
    );
  }

  const recommendations = generateRecommendations();

  // Accept recommendation mutation
  const acceptRecommendation = useMutation({
    mutationFn: async (reco: Recommendation) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await supabase
        .from('financial_goals')
        .insert({
          user_id: user.id,
          name: reco.name,
          type: reco.type,
          target_amount: reco.target,
          icon: reco.icon,
          notes: reco.reason,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-goals'] });
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.7 }
      });
      toast.success("🎯 Objectif créé avec succès!", { duration: 4000 });
      setSelectedReco(null);
    },
  });

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Aucune recommandation pour le moment</p>
          <p className="text-sm text-muted-foreground mt-1">Ajoutez plus de transactions pour des suggestions personnalisées</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Objectifs Recommandés Pour Vous
        </h3>
        <p className="text-sm text-muted-foreground">Basés sur vos revenus et habitudes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommendations.map((reco, idx) => (
          <Card key={idx} className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-3xl">{reco.icon}</span>
                <CardTitle className="text-lg">{reco.name}</CardTitle>
              </div>
              <CardDescription className="text-xs">{reco.reason}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-2xl font-bold text-primary">{formatPrice(reco.target)}</div>
              <Button 
                className="w-full"
                onClick={() => acceptRecommendation.mutate(reco)}
                disabled={acceptRecommendation.isPending}
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Créer cet objectif
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
