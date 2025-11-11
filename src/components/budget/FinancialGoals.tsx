import { useState } from "react";
import { Plus, Target, Trash2, Trophy, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { CurrencyInput } from "@/components/CurrencyInput";
import { formatPrice } from "@/lib/priceFormat";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const GOAL_TYPES = [
  { value: 'savings', label: '💰 Épargne', icon: '💰' },
  { value: 'debt_payoff', label: '💳 Remboursement de dettes', icon: '💳' },
  { value: 'investment', label: '📈 Investissement', icon: '📈' },
  { value: 'emergency_fund', label: '🚨 Fonds d\'urgence', icon: '🚨' },
  { value: 'purchase', label: '🛍️ Achat important', icon: '🛍️' },
  { value: 'other', label: '🎯 Autre', icon: '🎯' },
];

export const FinancialGoals = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [amountToAdd, setAmountToAdd] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch goals
  const { data: goals = [] } = useQuery({
    queryKey: ['financial-goals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_goals')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Add goal mutation
  const addGoal = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const goalType = GOAL_TYPES.find(t => t.value === type);
      const { error } = await supabase
        .from('financial_goals')
        .insert({
          user_id: user.id,
          name,
          type,
          target_amount: parseFloat(targetAmount),
          deadline: deadline || null,
          icon: goalType?.icon || '🎯',
          notes: notes || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-goals'] });
      toast.success("Objectif créé avec succès! 🎯");
      setDialogOpen(false);
      resetForm();
    },
  });

  // Update goal progress mutation
  const updateProgress = useMutation({
    mutationFn: async ({ goalId, newAmount }: { goalId: string; newAmount: number }) => {
      const goal = goals.find((g: any) => g.id === goalId);
      if (!goal) throw new Error("Objectif introuvable");

      const updatedAmount = Number(goal.current_amount) + newAmount;
      const completed = updatedAmount >= Number(goal.target_amount);

      const { error } = await supabase
        .from('financial_goals')
        .update({
          current_amount: updatedAmount,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', goalId);

      if (error) throw error;

      // Award achievement if goal completed
      if (completed) {
        await awardAchievement('goal_completed', '🏆 Objectif atteint!', `Vous avez atteint votre objectif: ${goal.name}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-goals'] });
      queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
      toast.success("Progression mise à jour! 📈");
      setUpdateDialogOpen(false);
      setSelectedGoal(null);
      setAmountToAdd("");
    },
  });

  // Delete goal mutation
  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('financial_goals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-goals'] });
      toast.success("Objectif supprimé");
    },
  });

  const awardAchievement = async (badgeType: string, badgeName: string, description: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('user_achievements').insert({
      user_id: user.id,
      badge_type: badgeType,
      badge_name: badgeName,
      badge_description: description,
      icon: '🏆',
    });
  };

  const resetForm = () => {
    setName("");
    setType("");
    setTargetAmount("");
    setDeadline("");
    setNotes("");
  };

  const activeGoals = goals.filter((g: any) => !g.completed);
  const completedGoals = goals.filter((g: any) => g.completed);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Mes Objectifs Financiers
          </h3>
          <p className="text-muted-foreground">Définissez et suivez vos objectifs d'épargne</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouvel objectif
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Créer un objectif</DialogTitle>
              <DialogDescription>Définissez un nouvel objectif financier à atteindre</DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); addGoal.mutate(); }} className="space-y-4">
              <div>
                <Label>Nom de l'objectif</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Vacances en Europe" className="mt-1" required />
              </div>
              <div>
                <Label>Type d'objectif</Label>
                <Select value={type} onValueChange={setType} required>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {GOAL_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Montant cible</Label>
                <CurrencyInput value={targetAmount} onChange={setTargetAmount} className="mt-1" required />
              </div>
              <div>
                <Label>Date limite (optionnel)</Label>
                <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Notes (optionnel)</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" rows={2} />
              </div>
              <Button type="submit" className="w-full" disabled={addGoal.isPending}>
                {addGoal.isPending ? "Création..." : "Créer l'objectif"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold">En cours</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGoals.map((goal: any) => {
              const progress = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
              const remaining = Number(goal.target_amount) - Number(goal.current_amount);
              const daysRemaining = goal.deadline ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

              return (
                <Card key={goal.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-3xl">{goal.icon}</span>
                        <div>
                          <CardTitle className="text-lg">{goal.name}</CardTitle>
                          <CardDescription>
                            {GOAL_TYPES.find(t => t.value === goal.type)?.label.replace(/^[^\s]+ /, '')}
                          </CardDescription>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteGoal.mutate(goal.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progression</span>
                        <span className="font-semibold">{progress.toFixed(0)}%</span>
                      </div>
                      <Progress value={progress} className="h-3" />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{formatPrice(goal.current_amount)}</span>
                        <span className="font-semibold">{formatPrice(goal.target_amount)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Reste à économiser:</span>
                      <span className="font-bold text-lg text-primary">{formatPrice(remaining)}</span>
                    </div>

                    {daysRemaining !== null && (
                      <div className={`text-xs ${daysRemaining < 30 ? 'text-orange-600' : 'text-muted-foreground'}`}>
                        ⏰ {daysRemaining > 0 ? `${daysRemaining} jours restants` : 'Date limite dépassée'}
                      </div>
                    )}

                    {goal.notes && (
                      <p className="text-xs text-muted-foreground italic">{goal.notes}</p>
                    )}

                    <Button 
                      className="w-full" 
                      variant="outline"
                      onClick={() => {
                        setSelectedGoal(goal);
                        setUpdateDialogOpen(true);
                      }}
                    >
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Mettre à jour la progression
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Objectifs atteints
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedGoals.map((goal: any) => (
              <Card key={goal.id} className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{goal.icon}</span>
                    <div>
                      <div className="font-semibold">{goal.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Atteint le {new Date(goal.completed_at).toLocaleDateString('fr-CA')}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-2xl font-bold text-green-600">{formatPrice(goal.target_amount)}</span>
                    <Trophy className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {goals.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Aucun objectif défini pour le moment</p>
            <p className="text-sm text-muted-foreground mt-2">Créez votre premier objectif financier!</p>
          </CardContent>
        </Card>
      )}

      {/* Update Progress Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mettre à jour la progression</DialogTitle>
            <DialogDescription>
              Ajoutez un montant à votre objectif: {selectedGoal?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (selectedGoal) {
              updateProgress.mutate({ goalId: selectedGoal.id, newAmount: parseFloat(amountToAdd) });
            }
          }} className="space-y-4">
            <div>
              <Label>Montant à ajouter</Label>
              <CurrencyInput value={amountToAdd} onChange={setAmountToAdd} className="mt-1" required />
              <p className="text-xs text-muted-foreground mt-1">
                Progression actuelle: {formatPrice(selectedGoal?.current_amount || 0)} / {formatPrice(selectedGoal?.target_amount || 0)}
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={updateProgress.isPending}>
              {updateProgress.isPending ? "Mise à jour..." : "Mettre à jour"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};