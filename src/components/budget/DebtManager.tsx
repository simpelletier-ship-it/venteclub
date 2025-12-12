import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, CreditCard, Building, Car, GraduationCap, HelpCircle, AlertTriangle, DollarSign, Percent, X, Check } from "lucide-react";
import { formatPrice } from "@/lib/priceFormat";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

const DEBT_TYPES = [
  { value: 'mortgage', label: 'Hypothèque', icon: Building, description: 'Prêt pour acheter une maison' },
  { value: 'car_loan', label: 'Prêt auto', icon: Car, description: 'Prêt pour acheter un véhicule' },
  { value: 'student_loan', label: 'Prêt étudiant', icon: GraduationCap, description: 'Prêt pour les études' },
  { value: 'credit_card', label: 'Carte de crédit', icon: CreditCard, description: 'Solde de carte de crédit' },
  { value: 'personal_loan', label: 'Prêt personnel', icon: CreditCard, description: 'Prêt personnel non garanti' },
  { value: 'line_of_credit', label: 'Marge de crédit', icon: CreditCard, description: 'Marge de crédit personnelle' },
];

const calculateMonthlyInterest = (balance: number, rate: number) => {
  if (!rate || rate <= 0) return 0;
  return (balance * (rate / 100)) / 12;
};

export const DebtManager = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'credit_card',
    balance: '',
    interestRate: '',
    minimumPayment: '',
  });

  const { data: debts = [], isLoading } = useQuery({
    queryKey: ['user-debts'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_debts')
        .select('*')
        .order('balance', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addDebt = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await supabase.from('user_debts').insert({
        user_id: user.id,
        name: formData.name,
        type: formData.type,
        balance: parseFloat(formData.balance) || 0,
        interest_rate: parseFloat(formData.interestRate) || 0,
        minimum_payment: parseFloat(formData.minimumPayment) || 0,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-debts'] });
      toast.success("Dette ajoutée");
      resetForm();
    },
    onError: () => {
      toast.error("Erreur lors de l'ajout");
    },
  });

  const updateDebt = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_debts')
        .update({
          name: formData.name,
          type: formData.type,
          balance: parseFloat(formData.balance) || 0,
          interest_rate: parseFloat(formData.interestRate) || 0,
          minimum_payment: parseFloat(formData.minimumPayment) || 0,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-debts'] });
      toast.success("Dette mise à jour");
      resetForm();
    },
    onError: () => {
      toast.error("Erreur lors de la modification");
    },
  });

  const deleteDebt = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('user_debts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-debts'] });
      toast.success("Dette supprimée");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });

  const resetForm = () => {
    setFormData({ name: '', type: 'credit_card', balance: '', interestRate: '', minimumPayment: '' });
    setShowAddForm(false);
    setEditingId(null);
  };

  const startEdit = (debt: any) => {
    setFormData({
      name: debt.name,
      type: debt.type,
      balance: debt.balance?.toString() || '',
      interestRate: debt.interest_rate?.toString() || '',
      minimumPayment: debt.minimum_payment?.toString() || '',
    });
    setEditingId(debt.id);
    setShowAddForm(true);
  };

  const totalDebt = debts.reduce((sum: number, d: any) => sum + Number(d.balance), 0);
  const totalMonthlyInterest = debts.reduce((sum: number, d: any) => 
    sum + calculateMonthlyInterest(Number(d.balance), Number(d.interest_rate || 0)), 0
  );
  const highestRate = Math.max(...debts.map((d: any) => Number(d.interest_rate || 0)), 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total des dettes</p>
                <p className="text-2xl font-bold text-red-600">{formatPrice(totalDebt)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="pt-5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-3 cursor-help">
                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        Intérêts/mois
                        <HelpCircle className="w-3 h-3" />
                      </p>
                      <p className="text-2xl font-bold text-amber-600">{formatPrice(totalMonthlyInterest)}</p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Combien tu paies en intérêts chaque mois sur toutes tes dettes</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardContent>
        </Card>

        <Card className="border-orange-200 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-950/20">
          <CardContent className="pt-5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-3 cursor-help">
                    <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <Percent className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        Taux le plus élevé
                        <HelpCircle className="w-3 h-3" />
                      </p>
                      <p className="text-2xl font-bold text-orange-600">{highestRate.toFixed(1)}%</p>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Rembourse d'abord la dette avec le taux le plus élevé pour économiser!</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardContent>
        </Card>
      </div>

      {/* Contextual Help */}
      {totalMonthlyInterest > 100 && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">Conseil</p>
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Tu paies {formatPrice(totalMonthlyInterest)} par mois juste en intérêts. 
              En remboursant plus vite, tu pourrais économiser beaucoup!
            </p>
          </div>
        </div>
      )}

      {/* Add Debt Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Mes dettes</h2>
        <Button onClick={() => setShowAddForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Ajouter une dette
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card className="border-primary/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">{editingId ? 'Modifier la dette' : 'Nouvelle dette'}</CardTitle>
            <CardDescription>
              {editingId ? 'Modifie les informations de ta dette' : 'Ajoute une nouvelle dette à suivre'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nom de la dette</Label>
                <Input
                  placeholder="Ex: Visa, Prêt auto..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Type de dette</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEBT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="flex items-center gap-1">
                  Solde actuel
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger><HelpCircle className="w-3 h-3 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent>Combien tu dois en ce moment</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <CurrencyInput
                  value={formData.balance}
                  onChange={(v) => setFormData({ ...formData, balance: v })}
                  placeholder="0 $"
                />
              </div>
              <div>
                <Label className="flex items-center gap-1">
                  Taux d'intérêt (%)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger><HelpCircle className="w-3 h-3 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent>Le pourcentage annuel que tu paies en intérêts</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 19.99"
                  value={formData.interestRate}
                  onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={resetForm}>
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
              <Button 
                onClick={() => editingId ? updateDebt.mutate(editingId) : addDebt.mutate()}
                disabled={!formData.name || !formData.balance}
              >
                <Check className="w-4 h-4 mr-2" />
                {editingId ? 'Enregistrer' : 'Ajouter'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debts List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Chargement...</div>
      ) : debts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Aucune dette enregistrée</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ajoute tes dettes pour suivre tes remboursements et calculer les intérêts
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter ma première dette
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {debts.map((debt: any) => {
            const type = DEBT_TYPES.find(t => t.value === debt.type);
            const Icon = type?.icon || CreditCard;
            const monthlyInterest = calculateMonthlyInterest(Number(debt.balance), Number(debt.interest_rate || 0));
            const isHighRate = Number(debt.interest_rate) === highestRate && highestRate > 10;

            return (
              <Card key={debt.id} className={isHighRate ? 'border-orange-300 dark:border-orange-800' : ''}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      isHighRate ? 'bg-orange-100 dark:bg-orange-950' : 'bg-muted'
                    }`}>
                      <Icon className={`w-6 h-6 ${isHighRate ? 'text-orange-600' : 'text-muted-foreground'}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{debt.name}</h3>
                        {isHighRate && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300">
                            Priorité
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{type?.label || 'Autre'}</p>
                      {debt.interest_rate > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {debt.interest_rate}% • {formatPrice(monthlyInterest)}/mois en intérêts
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-bold text-red-600">{formatPrice(Number(debt.balance))}</p>
                    </div>

                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => startEdit(debt)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer cette dette?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Cette action est irréversible. La dette "{debt.name}" sera supprimée.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteDebt.mutate(debt.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
