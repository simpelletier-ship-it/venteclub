import { useEffect, useState } from "react";
import { Flame, Trophy, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import confetti from "canvas-confetti";

const STREAK_MILESTONES = [
  { days: 3, badge: '🔥 Débutant', reward: 'Premier pas vers la discipline!' },
  { days: 7, badge: '⭐ 1 Semaine', reward: 'Excellente habitude!' },
  { days: 14, badge: '🌟 2 Semaines', reward: 'Vous êtes sur la bonne voie!' },
  { days: 30, badge: '🏆 1 Mois', reward: 'Champion de la gestion!' },
  { days: 60, badge: '💎 2 Mois', reward: 'Discipline exceptionnelle!' },
  { days: 90, badge: '👑 3 Mois', reward: 'Maître du budget!' },
];

export const DailyStreakReward = () => {
  const queryClient = useQueryClient();
  const [showCelebration, setShowCelebration] = useState(false);

  // Fetch user's transaction history to calculate streak
  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions-for-streak'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_transactions')
        .select('transaction_date')
        .order('transaction_date', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
  });

  // Calculate current streak
  const calculateStreak = () => {
    if (transactions.length === 0) return 0;

    const uniqueDates = [...new Set(transactions.map(t => t.transaction_date))].sort().reverse();
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < uniqueDates.length; i++) {
      const transactionDate = new Date(uniqueDates[i]);
      transactionDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);

      if (transactionDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const currentStreak = calculateStreak();
  const nextMilestone = STREAK_MILESTONES.find(m => m.days > currentStreak) || STREAK_MILESTONES[STREAK_MILESTONES.length - 1];
  const lastMilestone = [...STREAK_MILESTONES].reverse().find(m => m.days <= currentStreak);
  const progressToNext = nextMilestone ? ((currentStreak / nextMilestone.days) * 100) : 100;

  // Check for milestone achievement
  useEffect(() => {
    if (lastMilestone && currentStreak === lastMilestone.days) {
      setShowCelebration(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      setTimeout(() => setShowCelebration(false), 5000);
    }
  }, [currentStreak, lastMilestone]);

  const hasEnteredToday = () => {
    if (transactions.length === 0) return false;
    const today = new Date().toISOString().split('T')[0];
    return transactions.some(t => t.transaction_date === today);
  };

  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className={`h-6 w-6 ${currentStreak > 0 ? 'text-orange-500 animate-pulse' : 'text-muted-foreground'}`} />
          Série Quotidienne
          {currentStreak > 0 && (
            <Badge variant="secondary" className="ml-auto text-lg">
              {currentStreak} jour{currentStreak > 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {hasEnteredToday() 
            ? "✅ Entrée enregistrée aujourd'hui!" 
            : "Enregistrez vos dépenses chaque jour pour maintenir votre série"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress to next milestone */}
        {nextMilestone && currentStreak < nextMilestone.days && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Prochain palier: {nextMilestone.badge}</span>
              <span className="font-semibold">{nextMilestone.days - currentStreak} jour{nextMilestone.days - currentStreak > 1 ? 's' : ''}</span>
            </div>
            <Progress value={progressToNext} className="h-3" />
          </div>
        )}

        {/* Current achievement */}
        {lastMilestone && (
          <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <Trophy className="h-8 w-8 text-yellow-500" />
            <div>
              <div className="font-semibold">{lastMilestone.badge}</div>
              <div className="text-xs text-muted-foreground">{lastMilestone.reward}</div>
            </div>
          </div>
        )}

        {/* Milestones list */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Star className="h-4 w-4" />
            Paliers à atteindre
          </h4>
          <div className="space-y-1">
            {STREAK_MILESTONES.map(milestone => (
              <div 
                key={milestone.days}
                className={`flex items-center justify-between text-sm p-2 rounded ${
                  currentStreak >= milestone.days 
                    ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400' 
                    : 'text-muted-foreground'
                }`}
              >
                <span>{milestone.badge}</span>
                <span className="text-xs">{milestone.days} jours</span>
              </div>
            ))}
          </div>
        </div>

        {currentStreak === 0 && (
          <div className="text-center text-sm text-muted-foreground py-2">
            <p>💪 Commencez votre série aujourd'hui!</p>
            <p className="text-xs mt-1">Ajoutez une transaction pour débuter</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
