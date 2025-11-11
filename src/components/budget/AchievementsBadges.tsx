import { Trophy, Award, Star, Zap, Crown, Heart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import { useEffect } from "react";

export const AchievementsBadges = ({ isAuthenticated }: { isAuthenticated: boolean }) => {

  // Fetch achievements
  const { data: achievements = [], isError, isLoading } = useQuery({
    queryKey: ['user-achievements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .order('earned_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthenticated,
    retry: 1,
  });

  // Show loading state
  if (!isAuthenticated || isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50 animate-pulse" />
          <p className="text-muted-foreground">Chargement de vos récompenses...</p>
        </CardContent>
      </Card>
    );
  }

  // Handle errors
  if (isError) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">Aucun badge pour le moment</p>
          <p className="text-sm text-muted-foreground mt-2">
            Complétez des objectifs pour débloquer des badges!
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show confetti for new unviewed achievements
  useEffect(() => {
    const unviewedAchievements = achievements.filter((a: any) => !a.viewed);
    if (unviewedAchievements.length > 0) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Mark as viewed
      unviewedAchievements.forEach(async (achievement: any) => {
        await supabase
          .from('user_achievements')
          .update({ viewed: true })
          .eq('id', achievement.id);
      });
    }
  }, [achievements]);

  const getIconForBadge = (badgeType: string) => {
    switch (badgeType) {
      case 'goal_completed': return <Trophy className="h-6 w-6" />;
      case 'challenge_completed': return <Zap className="h-6 w-6" />;
      case 'savings_milestone': return <Star className="h-6 w-6" />;
      case 'budget_master': return <Crown className="h-6 w-6" />;
      case 'consistency': return <Heart className="h-6 w-6" />;
      default: return <Award className="h-6 w-6" />;
    }
  };

  const recentAchievements = achievements.slice(0, 10);
  const totalAchievements = achievements.length;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
          Récompenses & Badges
        </h3>
        <p className="text-muted-foreground">Célébrez vos succès financiers</p>
      </div>

      {/* Summary */}
      <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200 dark:border-yellow-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">{totalAchievements}</div>
              <div className="text-sm text-muted-foreground">Badges débloqués</div>
            </div>
            <Trophy className="h-12 w-12 text-yellow-500" />
          </div>
        </CardContent>
      </Card>

      {/* Achievements Grid */}
      {recentAchievements.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentAchievements.map((achievement: any) => (
            <Card 
              key={achievement.id} 
              className="hover:shadow-lg transition-all hover:scale-105 border-2"
              style={{ borderColor: achievement.color || '#fbbf24' }}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div 
                    className="p-3 rounded-full"
                    style={{ backgroundColor: `${achievement.color || '#fbbf24'}20` }}
                  >
                    <span className="text-2xl">{achievement.icon}</span>
                  </div>
                  <div>
                    <CardTitle className="text-lg">{achievement.badge_name}</CardTitle>
                    <CardDescription className="text-xs">
                      {new Date(achievement.earned_at).toLocaleDateString('fr-CA')}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{achievement.badge_description}</p>
                {!achievement.viewed && (
                  <Badge variant="secondary" className="mt-2">
                    ✨ Nouveau!
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">Aucun badge pour le moment</p>
            <p className="text-sm text-muted-foreground mt-2">
              Complétez des objectifs et défis pour débloquer des badges!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Motivational Messages */}
      {achievements.length > 0 && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-purple-500" />
              <div>
                <div className="font-semibold text-lg">Excellent travail! 🎉</div>
                <div className="text-sm text-muted-foreground">
                  Continuez comme ça - chaque petit progrès compte vers vos objectifs financiers!
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};