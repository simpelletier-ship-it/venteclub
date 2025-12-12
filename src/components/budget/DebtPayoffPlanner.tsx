import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, TrendingDown, Snowflake, Flame, Calendar, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatPrice } from "@/lib/priceFormat";

const DEBT_TYPES = [
  { value: 'mortgage', label: 'Hypothèque' },
  { value: 'car_loan', label: 'Prêt auto' },
  { value: 'credit_card', label: 'Carte de crédit' },
  { value: 'student_loan', label: 'Prêt étudiant' },
  { value: 'personal_loan', label: 'Prêt personnel' },
  { value: 'line_of_credit', label: 'Marge de crédit' },
  { value: 'other', label: 'Autre' },
];

interface DebtForm {
  name: string;
  type: string;
  balance: string;
  interest_rate: string;
  minimum_payment: string;
}

const emptyDebtForm: DebtForm = {
  name: '',
  type: 'credit_card',
  balance: '',
  interest_rate: '',
  minimum_payment: '',
};

export const DebtPayoffPlanner = () => {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const queryClient = useQueryClient();
  
  const [strategy, setStrategy] = useState<"snowball" | "avalanche">("avalanche");
  const [extraPayment, setExtraPayment] = useState(200);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingDebt, setEditingDebt] = useState<any>(null);
  const [debtForm, setDebtForm] = useState<DebtForm>(emptyDebtForm);

  // Fetch debts from Supabase
  const { data: debts = [], isLoading } = useQuery({
    queryKey: ['user-debts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_debts').select('*');
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthenticated,
  });

  // Add debt mutation
  const addDebtMutation = useMutation({
    mutationFn: async (newDebt: any) => {
      const { data, error } = await supabase.from('user_debts').insert({
        user_id: user?.id,
        name: newDebt.name,
        type: newDebt.type,
        balance: parseFloat(newDebt.balance),
        interest_rate: parseFloat(newDebt.interest_rate),
        minimum_payment: parseFloat(newDebt.minimum_payment) || null,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-debts'] });
      toast.success('Dette ajoutée');
      setShowAddDialog(false);
      setDebtForm(emptyDebtForm);
    },
    onError: () => toast.error('Erreur lors de l\'ajout'),
  });

  // Update debt mutation
  const updateDebtMutation = useMutation({
    mutationFn: async (debt: any) => {
      const { error } = await supabase.from('user_debts').update({
        name: debt.name,
        type: debt.type,
        balance: parseFloat(debt.balance),
        interest_rate: parseFloat(debt.interest_rate),
        minimum_payment: parseFloat(debt.minimum_payment) || null,
        updated_at: new Date().toISOString(),
      }).eq('id', debt.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-debts'] });
      toast.success('Dette modifiée');
      setEditingDebt(null);
      setDebtForm(emptyDebtForm);
    },
    onError: () => toast.error('Erreur lors de la modification'),
  });

  // Delete debt mutation
  const deleteDebtMutation = useMutation({
    mutationFn: async (debtId: string) => {
      const { error } = await supabase.from('user_debts').delete().eq('id', debtId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-debts'] });
      toast.success('Dette supprimée');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const totalDebt = debts.reduce((acc, d) => acc + Number(d.balance), 0);
  const totalMinimum = debts.reduce((acc, d) => acc + Number(d.minimum_payment || 0), 0);
  const avgInterestRate = totalDebt > 0 
    ? debts.reduce((acc, d) => acc + Number(d.interest_rate) * (Number(d.balance) / totalDebt), 0)
    : 0;

  // Sort debts based on strategy
  const sortedDebts = useMemo(() => {
    return [...debts].sort((a, b) => {
      if (strategy === "snowball") {
        return Number(a.balance) - Number(b.balance);
      }
      return Number(b.interest_rate) - Number(a.interest_rate);
    });
  }, [debts, strategy]);

  // Calculate payoff timeline
  const calculatePayoffMonths = (debt: any, extra: number = 0) => {
    const balance = Number(debt.balance);
    const interestRate = Number(debt.interest_rate);
    const minPayment = Number(debt.minimum_payment || balance * 0.02);
    const monthlyRate = interestRate / 100 / 12;
    const payment = minPayment + extra;
    if (payment <= balance * monthlyRate) return Infinity;
    return Math.ceil(
      Math.log(payment / (payment - balance * monthlyRate)) / Math.log(1 + monthlyRate)
    );
  };

  const getPayoffDate = (months: number) => {
    if (!isFinite(months)) return "∞";
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return date.toLocaleDateString("fr-CA", { month: "short", year: "numeric" });
  };

  const calculateInterestSaved = () => {
    if (debts.length === 0) return 0;
    let standardInterest = 0;
    let acceleratedInterest = 0;
    
    debts.forEach((debt) => {
      const balance = Number(debt.balance);
      const minPayment = Number(debt.minimum_payment || balance * 0.02);
      const standardMonths = calculatePayoffMonths(debt, 0);
      const acceleratedMonths = calculatePayoffMonths(debt, extraPayment / debts.length);
      
      if (isFinite(standardMonths) && isFinite(acceleratedMonths)) {
        standardInterest += (minPayment * standardMonths) - balance;
        acceleratedInterest += ((minPayment + extraPayment / debts.length) * acceleratedMonths) - balance;
      }
    });

    return Math.max(0, standardInterest - acceleratedInterest);
  };

  const interestSaved = calculateInterestSaved();

  const handleOpenAdd = () => {
    setDebtForm(emptyDebtForm);
    setShowAddDialog(true);
  };

  const handleOpenEdit = (debt: any) => {
    setDebtForm({
      name: debt.name,
      type: debt.type,
      balance: String(debt.balance),
      interest_rate: String(debt.interest_rate),
      minimum_payment: String(debt.minimum_payment || ''),
    });
    setEditingDebt(debt);
  };

  const handleSubmit = () => {
    if (!debtForm.name || !debtForm.balance || !debtForm.interest_rate) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (editingDebt) {
      updateDebtMutation.mutate({ ...debtForm, id: editingDebt.id });
    } else {
      addDebtMutation.mutate(debtForm);
    }
  };

  const getDebtTypeLabel = (type: string) => {
    return DEBT_TYPES.find(t => t.value === type)?.label || type;
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="py-12 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-xl bg-red-500/10">
              <CreditCard className="w-5 h-5 text-red-600" />
            </div>
            Plan de remboursement des dettes
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{debts.length} dettes</Badge>
            <Button size="sm" onClick={handleOpenAdd} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {debts.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Aucune dette enregistrée</p>
            <p className="text-sm text-muted-foreground mt-1">Ajoutez vos dettes pour planifier leur remboursement</p>
            <Button onClick={handleOpenAdd} className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Ajouter une dette
            </Button>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-xl bg-red-50 dark:bg-red-950/20">
                <p className="text-2xl font-bold text-red-600">{formatPrice(totalDebt)}</p>
                <p className="text-xs text-muted-foreground">Dette totale</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20">
                <p className="text-2xl font-bold text-amber-600">{avgInterestRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Taux moyen</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20">
                <p className="text-2xl font-bold text-emerald-600">{formatPrice(interestSaved)}</p>
                <p className="text-xs text-muted-foreground">Intérêts économisés</p>
              </div>
            </div>

            {/* Strategy selector */}
            <Tabs value={strategy} onValueChange={(v) => setStrategy(v as "snowball" | "avalanche")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="snowball" className="gap-2">
                  <Snowflake className="w-4 h-4" />
                  Boule de neige
                </TabsTrigger>
                <TabsTrigger value="avalanche" className="gap-2">
                  <Flame className="w-4 h-4" />
                  Avalanche
                </TabsTrigger>
              </TabsList>

              <div className="mt-4 p-4 rounded-xl bg-muted/50">
                {strategy === "snowball" ? (
                  <div className="flex items-start gap-2">
                    <Snowflake className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Méthode boule de neige</p>
                      <p className="text-xs text-muted-foreground">
                        Payez d'abord les plus petites dettes pour des victoires rapides et de la motivation.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <Flame className="w-5 h-5 text-orange-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Méthode avalanche</p>
                      <p className="text-xs text-muted-foreground">
                        Payez d'abord les dettes à taux élevé pour économiser le maximum d'intérêts.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Tabs>

            {/* Extra payment slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Paiement supplémentaire mensuel</span>
                <Badge variant="outline" className="font-mono">{extraPayment}$/mois</Badge>
              </div>
              <input
                type="range"
                min="0"
                max="1000"
                step="50"
                value={extraPayment}
                onChange={(e) => setExtraPayment(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0$</span>
                <span>500$</span>
                <span>1000$</span>
              </div>
            </div>

            {/* Debt list */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Ordre de remboursement recommandé</p>
              {sortedDebts.map((debt, index) => {
                const months = calculatePayoffMonths(debt, index === 0 ? extraPayment : 0);
                const payoffDate = getPayoffDate(months);
                const balance = Number(debt.balance);
                const interestRate = Number(debt.interest_rate);
                const annualInterest = balance * (interestRate / 100);
                const monthlyInterest = annualInterest / 12;

                return (
                  <motion.div
                    key={debt.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-xl border ${index === 0 ? "border-primary bg-primary/5" : "border-border bg-card"}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {index === 0 && <Badge className="bg-primary text-primary-foreground">Priorité</Badge>}
                        <span className="font-medium">{debt.name}</span>
                        <Badge variant="outline" className="text-xs">{getDebtTypeLabel(debt.type)}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{formatPrice(balance)}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleOpenEdit(debt)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteDebtMutation.mutate(debt.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <div className="flex items-center gap-3">
                        <span>{interestRate}% d'intérêt</span>
                        <span className="text-red-500 font-medium">
                          ~{formatPrice(monthlyInterest)}/mois en intérêts
                        </span>
                        <span className="text-red-600/70">
                          ({formatPrice(annualInterest)}/an)
                        </span>
                      </div>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Libéré: {payoffDate}
                      </span>
                    </div>
                    <Progress value={0} className="h-1.5" />
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog || !!editingDebt} onOpenChange={(open) => {
        if (!open) {
          setShowAddDialog(false);
          setEditingDebt(null);
          setDebtForm(emptyDebtForm);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDebt ? 'Modifier la dette' : 'Ajouter une dette'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Nom *</Label>
              <Input
                placeholder="Ex: Carte Visa"
                value={debtForm.name}
                onChange={(e) => setDebtForm({ ...debtForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={debtForm.type} onValueChange={(v) => setDebtForm({ ...debtForm, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEBT_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Solde actuel ($) *</Label>
                <Input
                  type="number"
                  placeholder="5000"
                  value={debtForm.balance}
                  onChange={(e) => setDebtForm({ ...debtForm, balance: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Taux d'intérêt (%) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="19.99"
                  value={debtForm.interest_rate}
                  onChange={(e) => setDebtForm({ ...debtForm, interest_rate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Paiement minimum mensuel ($)</Label>
              <Input
                type="number"
                placeholder="150"
                value={debtForm.minimum_payment}
                onChange={(e) => setDebtForm({ ...debtForm, minimum_payment: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => {
                setShowAddDialog(false);
                setEditingDebt(null);
              }}>
                Annuler
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={addDebtMutation.isPending || updateDebtMutation.isPending}
              >
                {(addDebtMutation.isPending || updateDebtMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingDebt ? 'Modifier' : 'Ajouter'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
