import { useState } from "react";
import { Plus, Flame, Target, Trophy, X, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CurrencyInput } from "@/components/CurrencyInput";
import { formatPrice } from "@/lib/priceFormat";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import confetti from "canvas-confetti";

const CHALLENGE_TYPES = [
  { value: 'no_spend', label: '🚫 Zéro dépense', description: 'Ne rien dépenser dans une catégorie' },
  { value: 'spend_limit', label: '💰 Limite de dépenses', description: 'Ne pas dépasser un montant' },
  { value: 'save_amount', label: '💎 Épargner', description: 'Économiser un montant cible' },
  { value: 'custom', label: '🎯 Personnalisé', description: 'Définir votre propre défi' },
];

export const ChallengesManager = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [challengeType, setChallengeType] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [durationDays, setDurationDays] = useState("30");

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['budget-categories-for-challenges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_categories')
        .select('*')
        .eq('type', 'expense')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch challenges
  const { data: challenges = [] } = useQuery({
    queryKey: ['user-challenges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_challenges')
        .select('*, budget_categories(name, icon)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch transactions for progress tracking
  const { data: transactions = [] } = useQuery({
    queryKey: ['budget-transactions-for-challenges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_transactions')
        .select('category_id, amount, transaction_date')
        .eq('type', 'expense');
      
      if (error) throw error;
      return data;
    },
  });

  // Add challenge mutation
  const addChallenge = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + parseInt(durationDays));

      const { error } = await supabase
        .from('user_challenges')
        .insert({
          user_id: user.id,
          name,
          description: description || null,
          category_id: categoryId || null,
          challenge_type: challengeType,
          target_value: targetValue ? parseFloat(targetValue) : null,
          duration_days: parseInt(durationDays),
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          icon: '🎯',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-challenges'] });
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#f97316', '#ea580c', '#c2410c']
      });
      toast.success("Défi créé! Bonne chance! 🔥", {
        duration: 4000,
        className: "animate-scale-in",
      });
      setDialogOpen(false);
      resetForm();
    },
  });

  // Complete challenge mutation
  const completeChallenge = useMutation({
    mutationFn: async ({ challengeId, status }: { challengeId: string; status: 'completed' | 'failed' }) => {
      const { error } = await supabase
        .from('user_challenges')
        .update({
          status,
          completed_at: new Date().toISOString(),
        })
        .eq('id', challengeId);

      if (error) throw error;

      if (status === 'completed') {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('user_achievements').insert({
            user_id: user.id,
            badge_type: 'challenge_completed',
            badge_name: '🔥 Défi réussi!',
            badge_description: 'Vous avez terminé un défi avec succès!',
            icon: '🔥',
          });
        }
      }
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['user-challenges'] });
      queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
      
      if (status === 'completed') {
        // Celebration for completed challenge
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f97316', '#ea580c', '#fbbf24', '#f59e0b']
        });
        toast.success("🎉 Défi réussi! Incroyable!", {
          duration: 5000,
          className: "animate-scale-in",
        });
      } else {
        toast.success("Défi abandonné", {
          duration: 3000,
        });
      }
    },
  });

  const calculateProgress = (challenge: any) => {
    if (challenge.status !== 'active') return challenge.progress || 0;

    const challengeTransactions = transactions.filter((t: any) => {
      const transDate = new Date(t.transaction_date);
      const startDate = new Date(challenge.start_date);
      const endDate = new Date(challenge.end_date);
      return t.category_id === challenge.category_id && transDate >= startDate && transDate <= endDate;
    });

    const totalSpent = challengeTransactions.reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    if (challenge.challenge_type === 'no_spend') {
      return totalSpent === 0 ? 100 : 0;
    } else if (challenge.challenge_type === 'spend_limit') {
      return Math.min((totalSpent / challenge.target_value) * 100, 100);
    }

    return 0;
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setChallengeType("");
    setCategoryId("");
    setTargetValue("");
    setDurationDays("30");
  };

  const activeChallenges = challenges.filter((c: any) => c.status === 'active');
  const completedChallenges = challenges.filter((c: any) => c.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Flame className="h-6 w-6 text-orange-500" />
            Mes Défis
          </h3>
          <p className="text-muted-foreground">Fixez-vous des défis pour améliorer vos habitudes financières</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau défi
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer un défi</DialogTitle>
              <DialogDescription>Lancez-vous un défi financier</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); addChallenge.mutate(); }} className="space-y-4">
              <div>
                <Label>Type de défi</Label>
                <Select value={challengeType} onValueChange={setChallengeType} required>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {CHALLENGE_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>
                        <div>
                          <div>{t.label}</div>
                          <div className="text-xs text-muted-foreground">{t.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Nom du défi</Label>
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Ex: 0 café restaurant pendant 30 jours" 
                  className="mt-1" 
                  required 
                />
              </div>

              {(challengeType === 'no_spend' || challengeType === 'spend_limit') && (
                <div>
                  <Label>Catégorie de dépenses</Label>
                  <Select value={categoryId} onValueChange={setCategoryId} required>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {(challengeType === 'spend_limit' || challengeType === 'save_amount') && (
                <div>
                  <Label>Montant {challengeType === 'spend_limit' ? 'maximum' : 'cible'}</Label>
                  <CurrencyInput value={targetValue} onChange={setTargetValue} className="mt-1" required />
                </div>
              )}

              <div>
                <Label>Durée (jours)</Label>
                <Input 
                  type="number" 
                  value={durationDays} 
                  onChange={(e) => setDurationDays(e.target.value)} 
                  min="1" 
                  max="365"
                  className="mt-1" 
                  required 
                />
              </div>

              <div>
                <Label>Description (optionnel)</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" rows={2} />
              </div>

              <Button type="submit" className="w-full" disabled={addChallenge.isPending}>
                {addChallenge.isPending ? "Création..." : "Lancer le défi"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Challenges */}
      {activeChallenges.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            En cours
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeChallenges.map((challenge: any) => {
              const progress = calculateProgress(challenge);
              const daysRemaining = Math.ceil((new Date(challenge.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              const isExpired = daysRemaining < 0;

              return (
                <Card key={challenge.id} className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-fade-in border-orange-200 dark:border-orange-800">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Flame className="h-5 w-5 text-orange-500" />
                          {challenge.name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {challenge.budget_categories?.icon} {challenge.budget_categories?.name}
                        </CardDescription>
                      </div>
                      <Badge variant={isExpired ? "destructive" : "default"}>
                        {daysRemaining > 0 ? `${daysRemaining}j restants` : 'Expiré'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {challenge.description && (
                      <p className="text-sm text-muted-foreground">{challenge.description}</p>
                    )}

                    {challenge.challenge_type !== 'custom' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progression</span>
                          <span className="font-semibold">{progress.toFixed(0)}%</span>
                        </div>
                        <Progress 
                          value={progress} 
                          className={`h-3 ${progress === 100 ? '[&>*]:bg-green-500' : ''}`}
                        />
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button 
                        className="flex-1" 
                        variant="default"
                        onClick={() => completeChallenge.mutate({ challengeId: challenge.id, status: 'completed' })}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Réussi!
                      </Button>
                      <Button 
                        className="flex-1" 
                        variant="outline"
                        onClick={() => completeChallenge.mutate({ challengeId: challenge.id, status: 'failed' })}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Abandonner
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Challenges */}
      {completedChallenges.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Défis réussis
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {completedChallenges.slice(0, 6).map((challenge: any) => (
              <Card key={challenge.id} className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="h-6 w-6 text-yellow-500" />
                    <div className="font-semibold text-sm">{challenge.name}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {challenge.duration_days} jours • Terminé
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {challenges.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Flame className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Aucun défi actif</p>
            <p className="text-sm text-muted-foreground mt-2">Lancez-vous un défi pour améliorer vos habitudes!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};