import { useState } from "react";
import { Plus, Target, Trash2, Trophy, TrendingUp, Plane, Home, Car, AlertTriangle, Wallet, CreditCard, BarChart3, ShoppingBag, Circle } from "lucide-react";
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
import confetti from "canvas-confetti";

const GOAL_ICONS: Record<string, any> = {
  vacation: Plane,
  house_downpayment: Home,
  car: Car,
  emergency_fund: AlertTriangle,
  savings: Wallet,
  debt_payoff: CreditCard,
  investment: BarChart3,
  purchase: ShoppingBag,
  other: Target,
};

const GOAL_TYPES = [
  { value: 'vacation', label: 'Voyage', icon: Plane },
  { value: 'house_downpayment', label: 'Mise de fond maison', icon: Home },
  { value: 'car', label: 'Voiture', icon: Car },
  { value: 'emergency_fund', label: 'Fonds d\'urgence', icon: AlertTriangle },
  { value: 'savings', label: 'Épargne générale', icon: Wallet },
  { value: 'debt_payoff', label: 'Remboursement de dettes', icon: CreditCard },
  { value: 'investment', label: 'Investissement', icon: BarChart3 },
  { value: 'purchase', label: 'Achat important', icon: ShoppingBag },
  { value: 'other', label: 'Autre', icon: Target },
];

export const FinancialGoals = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
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
    enabled: isAuthenticated,
    retry: 1,
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

      // Validate required fields
      if (!name || !type || !targetAmount) {
        throw new Error("Veuillez remplir tous les champs obligatoires");
      }

      const amount = parseFloat(targetAmount.replace(/\s/g, ''));
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Le montant doit être supérieur à 0");
      }

      const goalType = GOAL_TYPES.find(t => t.value === type);
      const IconComponent = goalType?.icon || Target;
      const { error } = await supabase
        .from('financial_goals')
        .insert({
          user_id: user.id,
          name: name.trim(),
          type,
          target_amount: amount,
          deadline: deadline || null,
          icon: goalType?.value || 'other',
          notes: notes?.trim() || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-goals'] });
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
      toast.success("Objectif créé avec succès! 🎯", {
        duration: 4000,
        className: "animate-scale-in",
      });
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error('Error creating goal:', error);
      toast.error(error.message || "Erreur lors de la création de l'objectif");
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
        
        // Big celebration for completed goal
        confetti({
          particleCount: 150,
          spread: 120,
          origin: { y: 0.5 },
          colors: ['#fbbf24', '#f59e0b', '#d97706', '#b45309']
        });
        setTimeout(() => {
          confetti({
            particleCount: 100,
            angle: 60,
            spread: 55,
            origin: { x: 0 }
          });
        }, 250);
        setTimeout(() => {
          confetti({
            particleCount: 100,
            angle: 120,
            spread: 55,
            origin: { x: 1 }
          });
        }, 400);
      }
    },
    onSuccess: (_, { goalId }) => {
      queryClient.invalidateQueries({ queryKey: ['financial-goals'] });
      queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
      
      const goal = goals.find((g: any) => g.id === goalId);
      const updatedAmount = Number(goal?.current_amount || 0) + parseFloat(amountToAdd);
      const isCompleted = updatedAmount >= Number(goal?.target_amount || 0);
      
      toast.success(
        isCompleted ? "🎉 Objectif atteint! Félicitations!" : "Progression mise à jour! 📈", 
        {
          duration: isCompleted ? 6000 : 4000,
          className: "animate-scale-in",
        }
      );
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
                    {GOAL_TYPES.map(t => {
                      const Icon = t.icon;
                      return (
                        <SelectItem key={t.value} value={t.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-primary" />
                            <span>{t.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
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
              
              // Calculate average monthly savings needed
              const monthlyNeeded = daysRemaining && daysRemaining > 0 ? (remaining / (daysRemaining / 30)) : 0;
              
              // Calculate estimated months to complete (if no deadline but has progress)
              const avgMonthlySavings = Number(goal.current_amount) > 0 && goal.created_at ? 
                (Number(goal.current_amount) / Math.max(1, (Date.now() - new Date(goal.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30))) : 0;
              const estimatedMonths = avgMonthlySavings > 0 ? Math.ceil(remaining / avgMonthlySavings) : null;

              return (
                <Card key={goal.id} className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-fade-in border-border">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          {(() => {
                            const Icon = GOAL_ICONS[goal.type] || Target;
                            return <Icon className="h-5 w-5 text-primary" />;
                          })()}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{goal.name}</CardTitle>
                          <CardDescription>
                            {GOAL_TYPES.find(t => t.value === goal.type)?.label}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => {
                            setSelectedGoal(goal);
                            setUpdateDialogOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Ajouter
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteGoal.mutate(goal.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
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

                    <div className="space-y-3 bg-muted/30 p-3 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Reste à économiser:</span>
                        <span className="font-bold text-lg text-primary">{formatPrice(remaining)}</span>
                      </div>

                      {daysRemaining !== null && daysRemaining > 0 && (
                        <>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">📅 Temps restant:</span>
                            <span className={daysRemaining < 30 ? 'text-orange-600 font-semibold' : 'font-semibold'}>
                              {Math.floor(daysRemaining / 30)} mois {daysRemaining % 30} jours
                            </span>
                          </div>
                          {monthlyNeeded > 0 && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">💰 Épargne mensuelle requise:</span>
                              <span className="font-semibold text-primary">{formatPrice(monthlyNeeded)}/mois</span>
                            </div>
                          )}
                        </>
                      )}

                      {!goal.deadline && estimatedMonths && estimatedMonths > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">⏱️ Temps estimé restant:</span>
                          <span className="font-semibold">~{estimatedMonths} mois</span>
                        </div>
                      )}

                      {daysRemaining !== null && daysRemaining <= 0 && (
                        <div className="text-xs text-orange-600 font-semibold">
                          ⚠️ Date limite dépassée
                        </div>
                      )}
                    </div>

                    {goal.notes && (
                      <p className="text-xs text-muted-foreground italic bg-muted/20 p-2 rounded">{goal.notes}</p>
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
              <Card key={goal.id} className="border-success/20 bg-success/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                      {(() => {
                        const Icon = GOAL_ICONS[goal.type] || Target;
                        return <Icon className="h-5 w-5 text-success" />;
                      })()}
                    </div>
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
            <p className="text-muted-foreground mb-4">Aucun objectif défini pour le moment</p>
            <p className="text-sm text-muted-foreground mb-6">Commencez par définir vos objectifs financiers!</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
              <button 
                onClick={() => {
                  setType('vacation');
                  setName('Voyage');
                  setDialogOpen(true);
                }}
                className="p-4 bg-muted/30 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all cursor-pointer text-left"
              >
                <div className="text-2xl mb-2">✈️</div>
                <div className="font-semibold mb-1">Voyage</div>
                <div className="text-xs text-muted-foreground">Économisez pour vos prochaines vacances de rêve</div>
              </button>
              <button 
                onClick={() => {
                  setType('house_downpayment');
                  setName('Mise de fond maison');
                  setDialogOpen(true);
                }}
                className="p-4 bg-muted/30 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all cursor-pointer text-left"
              >
                <div className="text-2xl mb-2">🏠</div>
                <div className="font-semibold mb-1">Mise de fond</div>
                <div className="text-xs text-muted-foreground">Accumulez votre mise de fond pour votre première maison</div>
              </button>
              <button 
                onClick={() => {
                  setType('car');
                  setName('Voiture');
                  setDialogOpen(true);
                }}
                className="p-4 bg-muted/30 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all cursor-pointer text-left"
              >
                <div className="text-2xl mb-2">🚗</div>
                <div className="font-semibold mb-1">Voiture</div>
                <div className="text-xs text-muted-foreground">Préparez l'achat de votre prochaine voiture</div>
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Update Progress Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>💰 Ajouter de l'argent vers l'objectif</DialogTitle>
            <DialogDescription>
              {selectedGoal && (
                <div className="space-y-1 mt-2">
                  <div className="font-medium text-foreground">{selectedGoal.name}</div>
                  <div className="text-sm">
                    Progression: <span className="font-semibold text-primary">{formatPrice(selectedGoal.current_amount)}</span> / {formatPrice(selectedGoal.target_amount)}
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!amountToAdd || parseFloat(amountToAdd) <= 0) {
              toast.error("⚠️ Veuillez entrer un montant supérieur à 0$");
              return;
            }
            if (selectedGoal) {
              updateProgress.mutate({ goalId: selectedGoal.id, newAmount: parseFloat(amountToAdd) });
            }
          }} className="space-y-4 pt-4">
            <div>
              <Label className="text-base mb-2 block">Combien ajoutez-vous aujourd'hui?</Label>
              <CurrencyInput 
                value={amountToAdd} 
                onChange={setAmountToAdd} 
                placeholder="Ex: 100"
                className="mt-1 h-12 text-lg"
                required 
              />
              <p className="text-xs text-muted-foreground mt-2 flex items-start gap-1">
                <span>💡</span>
                <span>Chaque petit montant vous rapproche de votre objectif! L'important c'est la constance.</span>
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => { 
                  setUpdateDialogOpen(false); 
                  setSelectedGoal(null); 
                  setAmountToAdd(""); 
                }}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={updateProgress.isPending}>
                {updateProgress.isPending ? "Enregistrement..." : "✅ Confirmer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};