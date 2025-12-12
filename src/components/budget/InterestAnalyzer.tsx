import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingDown, AlertTriangle, DollarSign, Calendar, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/priceFormat";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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

interface InterestAnalyzerProps {
  debts: any[];
}

export const InterestAnalyzer = ({ debts }: InterestAnalyzerProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingDebt, setEditingDebt] = useState<any>(null);
  const [debtForm, setDebtForm] = useState<DebtForm>(emptyDebtForm);

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
  
  const calculateInterestProjections = (debt: any) => {
    const balance = Number(debt.balance);
    const rate = Number(debt.interest_rate) / 100;
    const minPayment = Number(debt.minimum_payment || balance * 0.02);

    let remainingBalance = balance;
    let totalInterestPaid = 0;
    let months = 0;
    const monthlyRate = rate / 12;
    
    const projectionData = [];

    while (remainingBalance > 0 && months < 360) {
      const interestCharge = remainingBalance * monthlyRate;
      const principalPayment = Math.min(minPayment - interestCharge, remainingBalance);
      
      if (principalPayment <= 0) break;
      
      totalInterestPaid += interestCharge;
      remainingBalance -= principalPayment;
      months++;

      if (months % 12 === 0 || remainingBalance <= 0) {
        projectionData.push({
          year: months / 12,
          balance: Math.max(0, remainingBalance),
          totalInterest: totalInterestPaid,
        });
      }
    }

    const interest1Year = balance * rate;
    const interest5Years = balance * rate * 5;
    const interest10Years = balance * rate * 10;

    return {
      monthlyInterest: balance * monthlyRate,
      interest1Year,
      interest5Years,
      interest10Years,
      totalInterestWithMinPayments: totalInterestPaid,
      monthsToPayOff: months,
      yearsToPayOff: months / 12,
      projectionData,
    };
  };

  const debtsWithAnalysis = debts.map(debt => ({
    ...debt,
    analysis: calculateInterestProjections(debt),
  }));

  const sortedDebts = [...debtsWithAnalysis].sort((a, b) => 
    Number(b.interest_rate) - Number(a.interest_rate)
  );

  const totalMonthlyInterest = debtsWithAnalysis.reduce((sum, d) => 
    sum + d.analysis.monthlyInterest, 0
  );

  const totalAnnualInterest = totalMonthlyInterest * 12;

  const total5YearInterest = debtsWithAnalysis.reduce((sum, d) => 
    sum + d.analysis.interest5Years, 0
  );

  const total10YearInterest = debtsWithAnalysis.reduce((sum, d) => 
    sum + d.analysis.interest10Years, 0
  );

  const calculateSnowballSavings = () => {
    const totalMinPayment = debtsWithAnalysis.reduce((sum, d) => 
      sum + Number(d.minimum_payment || d.balance * 0.02), 0
    );
    
    const extraPayment = totalMinPayment * 0.2;
    
    let totalInterestWithSnowball = 0;
    const debtsCopy = sortedDebts.map(d => ({
      ...d,
      remainingBalance: Number(d.balance),
    }));

    let months = 0;
    while (debtsCopy.some(d => d.remainingBalance > 0) && months < 360) {
      debtsCopy.forEach(debt => {
        if (debt.remainingBalance > 0) {
          const monthlyRate = Number(debt.interest_rate) / 100 / 12;
          const interestCharge = debt.remainingBalance * monthlyRate;
          const minPayment = Number(debt.minimum_payment || debt.balance * 0.02);
          const principalPayment = Math.min(minPayment - interestCharge, debt.remainingBalance);
          
          totalInterestWithSnowball += interestCharge;
          debt.remainingBalance = Math.max(0, debt.remainingBalance - principalPayment);
        }
      });

      const highestInterestDebt = debtsCopy.find(d => d.remainingBalance > 0);
      if (highestInterestDebt) {
        highestInterestDebt.remainingBalance = Math.max(0, highestInterestDebt.remainingBalance - extraPayment);
      }

      months++;
    }

    const regularInterest = debtsWithAnalysis.reduce((sum, d) => 
      d.analysis.totalInterestWithMinPayments, 0
    );

    return {
      savings: regularInterest - totalInterestWithSnowball,
      monthsFaster: debtsWithAnalysis[0]?.analysis.monthsToPayOff - months,
    };
  };

  const snowballSavings = debts.length > 0 ? calculateSnowballSavings() : null;

  const getDebtTypeLabel = (type: string) => {
    return DEBT_TYPES.find(t => t.value === type)?.label || type;
  };

  if (debts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <TrendingDown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Aucune dette enregistrée</p>
          <p className="text-sm text-muted-foreground mt-2">Ajoutez vos dettes pour voir l'analyse des intérêts</p>
          <Button onClick={handleOpenAdd} className="mt-4 gap-2">
            <Plus className="h-4 w-4" />
            Ajouter une dette
          </Button>
        </CardContent>

        {/* Add Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une dette</DialogTitle>
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
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={handleSubmit} disabled={addDebtMutation.isPending}>
                  {addDebtMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Ajouter
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-red-200 dark:border-red-900 shadow-lg">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600" />
                Analyseur d'intérêts sur dettes
              </CardTitle>
              <CardDescription>
                Visualisez combien vous coûtent réellement vos dettes
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-2xl font-bold text-red-600">{formatPrice(totalMonthlyInterest)}</div>
                <div className="text-xs text-muted-foreground">par mois</div>
              </div>
              <Button size="sm" onClick={handleOpenAdd} className="gap-1.5">
                <Plus className="h-4 w-4" />
                Ajouter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-900">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-red-600" />
                <span className="text-sm text-muted-foreground">Intérêts annuels</span>
              </div>
              <div className="text-xl font-bold text-red-600">{formatPrice(totalAnnualInterest)}</div>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Sur 5 ans</span>
              </div>
              <div className="text-xl font-bold">{formatPrice(total5YearInterest)}</div>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Sur 10 ans</span>
              </div>
              <div className="text-xl font-bold">{formatPrice(total10YearInterest)}</div>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-muted-foreground">Nombre de dettes</span>
              </div>
              <div className="text-xl font-bold">{debts.length}</div>
            </div>
          </div>

          {/* Snowball Savings Recommendation */}
          {snowballSavings && snowballSavings.savings > 0 && (
            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-900">
              <div className="flex items-start gap-3">
                <TrendingDown className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-green-900 dark:text-green-100">💡 Opportunité d'économie</div>
                  <p className="text-sm text-green-800 dark:text-green-200 mt-1">
                    En payant 20% de plus sur vos paiements minimums et en ciblant d'abord les dettes à haut taux d'intérêt, 
                    vous pourriez économiser <strong className="font-bold">{formatPrice(snowballSavings.savings)}</strong> en intérêts 
                    et rembourser vos dettes <strong className="font-bold">{Math.abs(snowballSavings.monthsFaster)} mois plus tôt</strong>!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Individual Debt Analysis */}
          <div className="space-y-4">
            <h4 className="font-semibold">Analyse détaillée par dette</h4>
            {sortedDebts.map((debt) => (
              <Card key={debt.id} className="border-l-4 border-l-red-500">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {debt.name}
                        <Badge variant="outline" className="text-xs">{getDebtTypeLabel(debt.type)}</Badge>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Badge variant={Number(debt.interest_rate) > 10 ? "destructive" : "secondary"}>
                          {debt.interest_rate}% intérêt
                        </Badge>
                        <span className="text-xs">Balance: {formatPrice(debt.balance)}</span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right mr-2">
                        <div className="font-bold text-red-600">{formatPrice(debt.analysis.monthlyInterest)}</div>
                        <div className="text-xs text-muted-foreground">par mois</div>
                      </div>
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
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="bg-muted/50 p-2 rounded">
                      <div className="text-xs text-muted-foreground">1 an</div>
                      <div className="font-semibold">{formatPrice(debt.analysis.interest1Year)}</div>
                    </div>
                    <div className="bg-muted/50 p-2 rounded">
                      <div className="text-xs text-muted-foreground">5 ans</div>
                      <div className="font-semibold">{formatPrice(debt.analysis.interest5Years)}</div>
                    </div>
                    <div className="bg-muted/50 p-2 rounded">
                      <div className="text-xs text-muted-foreground">10 ans</div>
                      <div className="font-semibold">{formatPrice(debt.analysis.interest10Years)}</div>
                    </div>
                  </div>
                  
                  {debt.analysis.monthsToPayOff < 360 && (
                    <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded text-sm border border-orange-200 dark:border-orange-900">
                      <div className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                        Avec paiements minimums ({formatPrice(debt.minimum_payment || debt.balance * 0.02)}/mois):
                      </div>
                      <div className="flex justify-between">
                        <span className="text-orange-800 dark:text-orange-200">
                          Temps de remboursement: <strong>{debt.analysis.yearsToPayOff.toFixed(1)} ans</strong>
                        </span>
                        <span className="text-orange-800 dark:text-orange-200">
                          Total intérêts: <strong>{formatPrice(debt.analysis.totalInterestWithMinPayments)}</strong>
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

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
    </div>
  );
};
