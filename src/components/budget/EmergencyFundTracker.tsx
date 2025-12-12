import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ShieldCheck, TrendingUp, Pencil, Check, X, Info } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface EmergencyFundTrackerProps {
  isAuthenticated: boolean;
}

const MONTHS_TARGET_OPTIONS = [3, 6, 9, 12];

export const EmergencyFundTracker = ({ isAuthenticated }: EmergencyFundTrackerProps) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [currentAmount, setCurrentAmount] = useState("");
  const [monthsTarget, setMonthsTarget] = useState(6);
  const [monthlyExpenses, setMonthlyExpenses] = useState("");

  // Fetch transactions to calculate average monthly expenses
  const { data: transactions = [] } = useQuery({
    queryKey: ['budget-transactions-expenses'],
    queryFn: async () => {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      const { data, error } = await supabase
        .from('budget_transactions')
        .select('amount, transaction_date')
        .eq('type', 'expense')
        .gte('transaction_date', threeMonthsAgo.toISOString().split('T')[0]);
      
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthenticated,
  });

  // Fetch existing emergency fund goal
  const { data: emergencyGoal } = useQuery({
    queryKey: ['emergency-fund-goal'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('financial_goals')
        .select('*')
        .eq('type', 'emergency_fund')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: isAuthenticated,
  });

  // Calculate average monthly expenses
  const avgMonthlyExpenses = transactions.length > 0
    ? transactions.reduce((sum, t) => sum + Number(t.amount), 0) / 3
    : 0;

  // Initialize form values from existing goal
  useEffect(() => {
    if (emergencyGoal) {
      setCurrentAmount(emergencyGoal.current_amount?.toString() || "0");
      setMonthsTarget(Math.round(emergencyGoal.target_amount / (avgMonthlyExpenses || 1)) || 6);
      if (emergencyGoal.notes) {
        const parsed = JSON.parse(emergencyGoal.notes);
        if (parsed.monthlyExpenses) {
          setMonthlyExpenses(parsed.monthlyExpenses.toString());
        }
      }
    }
  }, [emergencyGoal, avgMonthlyExpenses]);

  const saveGoalMutation = useMutation({
    mutationFn: async (data: { currentAmount: number; targetAmount: number; monthlyExpenses: number }) => {
      const goalData = {
        name: "Fonds d'urgence",
        type: 'emergency_fund',
        target_amount: data.targetAmount,
        current_amount: data.currentAmount,
        icon: '🛡️',
        color: '#10b981',
        notes: JSON.stringify({ monthlyExpenses: data.monthlyExpenses, monthsTarget }),
      };

      if (emergencyGoal) {
        const { error } = await supabase
          .from('financial_goals')
          .update(goalData)
          .eq('id', emergencyGoal.id);
        if (error) throw error;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        
        const { error } = await supabase
          .from('financial_goals')
          .insert({ ...goalData, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency-fund-goal'] });
      queryClient.invalidateQueries({ queryKey: ['financial-goals'] });
      toast.success('Fonds d\'urgence mis à jour');
      setIsEditing(false);
    },
    onError: () => toast.error('Erreur lors de la sauvegarde'),
  });

  const handleSave = () => {
    const current = parseFloat(currentAmount.replace(/[^\d.-]/g, '')) || 0;
    const expenses = parseFloat(monthlyExpenses.replace(/[^\d.-]/g, '')) || avgMonthlyExpenses;
    const target = expenses * monthsTarget;

    if (expenses <= 0) {
      toast.error('Veuillez entrer vos dépenses mensuelles');
      return;
    }

    saveGoalMutation.mutate({ currentAmount: current, targetAmount: target, monthlyExpenses: expenses });
  };

  const effectiveMonthlyExpenses = parseFloat(monthlyExpenses.replace(/[^\d.-]/g, '')) || avgMonthlyExpenses;
  const targetAmount = effectiveMonthlyExpenses * monthsTarget;
  const current = parseFloat(currentAmount.replace(/[^\d.-]/g, '')) || emergencyGoal?.current_amount || 0;
  const progress = targetAmount > 0 ? Math.min((current / targetAmount) * 100, 100) : 0;
  const monthsCovered = effectiveMonthlyExpenses > 0 ? current / effectiveMonthlyExpenses : 0;

  const getStatusColor = () => {
    if (monthsCovered >= 6) return 'text-emerald-500';
    if (monthsCovered >= 3) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getStatusMessage = () => {
    if (monthsCovered >= 6) return 'Excellent! Vous êtes bien protégé.';
    if (monthsCovered >= 3) return 'Bon début, continuez!';
    if (monthsCovered >= 1) return 'Vous êtes sur la bonne voie.';
    return 'Commencez à épargner pour les urgences.';
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            <CardTitle className="text-base font-medium">Fonds d'urgence</CardTitle>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Un fonds d'urgence devrait couvrir 3 à 6 mois de dépenses pour faire face aux imprévus (perte d'emploi, réparations, etc.)</p>
              </TooltipContent>
            </Tooltip>
          </div>
          {!isEditing ? (
            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-8 w-8 p-0">
              <Pencil className="h-4 w-4" />
            </Button>
          ) : (
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={handleSave} className="h-8 w-8 p-0 text-emerald-500">
                <Check className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Montant actuel</Label>
              <Input
                placeholder="0 $"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                className="h-9 text-sm mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Dépenses mensuelles moyennes</Label>
              <Input
                placeholder={avgMonthlyExpenses > 0 ? `${avgMonthlyExpenses.toFixed(0)} $ (calculé)` : "0 $"}
                value={monthlyExpenses}
                onChange={(e) => setMonthlyExpenses(e.target.value)}
                className="h-9 text-sm mt-1"
              />
              {avgMonthlyExpenses > 0 && !monthlyExpenses && (
                <p className="text-xs text-muted-foreground mt-1">
                  Basé sur vos 3 derniers mois: {avgMonthlyExpenses.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
                </p>
              )}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Objectif (mois de dépenses)</Label>
              <div className="flex gap-2 mt-1">
                {MONTHS_TARGET_OPTIONS.map((m) => (
                  <Button
                    key={m}
                    variant={monthsTarget === m ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMonthsTarget(m)}
                    className="flex-1"
                  >
                    {m} mois
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Main display */}
            <div className="text-center">
              <div className="text-3xl font-semibold text-foreground">
                {current.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                sur {targetAmount.toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })} ({monthsTarget} mois)
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <Progress value={progress} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{progress.toFixed(0)}% atteint</span>
                <span className={getStatusColor()}>
                  {monthsCovered.toFixed(1)} mois couverts
                </span>
              </div>
            </div>

            {/* Status message */}
            <div className={`flex items-center gap-2 p-3 rounded-lg bg-muted/50 ${getStatusColor()}`}>
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">{getStatusMessage()}</span>
            </div>

            {/* Amount remaining */}
            {targetAmount - current > 0 && (
              <p className="text-xs text-center text-muted-foreground">
                Il vous reste {(targetAmount - current).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })} à épargner
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
