import { useState } from "react";
import { Plus, Trash2, PencilLine, CalendarDays } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CurrencyInput } from "@/components/CurrencyInput";
import { formatPrice } from "@/lib/priceFormat";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
}

interface BudgetGoal {
  id: string;
  category_id: string;
  monthly_limit: number;
  frequency?: string;
}

export const BudgetPlanner = () => {
  const [open, setOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<{ categoryId: string; currentLimit: number; currentFrequency?: string } | null>(null);
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  
  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['budget-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_categories')
        .select('*')
        .order('type', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as Category[];
    },
  });

  // Fetch budget goals
  const { data: goals = [] } = useQuery({
    queryKey: ['budget-goals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_goals')
        .select('*');
      
      if (error) throw error;
      return data as BudgetGoal[];
    },
  });

  // Fetch current month transactions to compare with budget
  const { data: transactions = [] } = useQuery({
    queryKey: ['budget-transactions-current-month'],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('budget_transactions')
        .select('category_id, amount, type')
        .gte('transaction_date', startOfMonth.toISOString().split('T')[0]);
      
      if (error) throw error;
      return data;
    },
  });

  // Add/Update budget goal mutation
  const saveGoal = useMutation({
    mutationFn: async ({ categoryId, limit, freq }: { categoryId: string; limit: number; freq: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const existingGoal = goals.find(g => g.category_id === categoryId);

      // Convert to monthly amount based on frequency
      let monthlyAmount = limit;
      if (freq === 'weekly') monthlyAmount = limit * 4.33;
      else if (freq === 'biweekly') monthlyAmount = limit * 2.17;
      else if (freq === 'yearly') monthlyAmount = limit / 12;

      if (existingGoal) {
        const { error } = await supabase
          .from('budget_goals')
          .update({ monthly_limit: monthlyAmount, frequency: freq })
          .eq('id', existingGoal.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('budget_goals')
          .insert({
            user_id: user.id,
            category_id: categoryId,
            monthly_limit: monthlyAmount,
            frequency: freq,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-goals'] });
      toast.success("Budget défini avec succès");
      setOpen(false);
      setEditingGoal(null);
      setMonthlyLimit("");
      setFrequency("monthly");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Delete budget goal mutation
  const deleteGoal = useMutation({
    mutationFn: async (categoryId: string) => {
      const goal = goals.find(g => g.category_id === categoryId);
      if (!goal) return;

      const { error } = await supabase
        .from('budget_goals')
        .delete()
        .eq('id', goal.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-goals'] });
      toast.success("Budget supprimé");
    },
  });

  const handleSubmit = (e: React.FormEvent, categoryId: string) => {
    e.preventDefault();
    saveGoal.mutate({ categoryId, limit: parseFloat(monthlyLimit), freq: frequency });
  };

  const handleEdit = (categoryId: string, currentLimit: number, currentFreq?: string) => {
    setEditingGoal({ categoryId, currentLimit, currentFrequency: currentFreq || 'monthly' });
    setMonthlyLimit(currentLimit.toString());
    setFrequency(currentFreq || 'monthly');
    setOpen(true);
  };

  const getCategorySpent = (categoryId: string) => {
    return transactions
      .filter(t => t.category_id === categoryId)
      .reduce((sum, t) => sum + Number(t.amount), 0);
  };

  const getCategoryBudget = (categoryId: string) => {
    const goal = goals.find(g => g.category_id === categoryId);
    return goal ? Number(goal.monthly_limit) : 0;
  };

  const getCategoryFrequency = (categoryId: string) => {
    const goal = goals.find(g => g.category_id === categoryId);
    return goal?.frequency || 'monthly';
  };

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'weekly': return 'semaine';
      case 'biweekly': return '2 sem.';
      case 'yearly': return 'année';
      default: return 'mois';
    }
  };

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  const totalIncomeBudget = incomeCategories.reduce((sum, cat) => sum + getCategoryBudget(cat.id), 0);
  const totalExpenseBudget = expenseCategories.reduce((sum, cat) => sum + getCategoryBudget(cat.id), 0);
  const totalIncomeActual = incomeCategories.reduce((sum, cat) => sum + getCategorySpent(cat.id), 0);
  const totalExpenseActual = expenseCategories.reduce((sum, cat) => sum + getCategorySpent(cat.id), 0);

  const renderCategoryCard = (category: Category) => {
    const budget = getCategoryBudget(category.id);
    const spent = getCategorySpent(category.id);
    const remaining = budget - spent;
    const percentage = budget > 0 ? (spent / budget) * 100 : 0;
    const freq = getCategoryFrequency(category.id);

    return (
      <Card key={category.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{category.icon}</span>
              <div>
                <div className="font-medium">{category.name}</div>
                {budget > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarDays className="h-3 w-3" />
                    <span>{formatPrice(budget)}/mois ({getFrequencyLabel(freq)})</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              {budget > 0 ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(category.id, budget, freq)}
                  >
                    <PencilLine className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => deleteGoal.mutate(category.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </>
              ) : (
                <Dialog open={open && editingGoal?.categoryId === category.id} onOpenChange={(isOpen) => {
                  setOpen(isOpen);
                  if (!isOpen) {
                    setEditingGoal(null);
                    setMonthlyLimit("");
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingGoal({ categoryId: category.id, currentLimit: 0 });
                        setOpen(true);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Définir
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Définir le budget</DialogTitle>
                      <DialogDescription>
                        Pour {category.icon} {category.name}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={(e) => handleSubmit(e, category.id)} className="space-y-4">
                      <div>
                        <Label>Fréquence</Label>
                        <Select value={frequency} onValueChange={setFrequency}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">📅 Hebdomadaire (par semaine)</SelectItem>
                            <SelectItem value="biweekly">📆 Aux 2 semaines</SelectItem>
                            <SelectItem value="monthly">🗓️ Mensuel (par mois)</SelectItem>
                            <SelectItem value="yearly">📊 Annuel (par année)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Montant {frequency === 'weekly' ? 'hebdomadaire' : frequency === 'biweekly' ? 'aux 2 semaines' : frequency === 'yearly' ? 'annuel' : 'mensuel'}</Label>
                        <CurrencyInput 
                          value={monthlyLimit} 
                          onChange={setMonthlyLimit} 
                          className="mt-1" 
                          required 
                          placeholder={frequency === 'weekly' ? 'Ex: 500 $/semaine' : frequency === 'biweekly' ? 'Ex: 1000 $/2 sem.' : frequency === 'yearly' ? 'Ex: 60000 $/an' : 'Ex: 2000 $/mois'}
                        />
                        {frequency !== 'monthly' && monthlyLimit && (
                          <p className="text-xs text-muted-foreground mt-1">
                            ≈ {formatPrice(
                              frequency === 'weekly' ? parseFloat(monthlyLimit) * 4.33 :
                              frequency === 'biweekly' ? parseFloat(monthlyLimit) * 2.17 :
                              parseFloat(monthlyLimit) / 12
                            )}/mois
                          </p>
                        )}
                      </div>
                      <Button type="submit" className="w-full" disabled={saveGoal.isPending}>
                        {saveGoal.isPending ? "Enregistrement..." : "Enregistrer"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {budget > 0 && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Dépensé</span>
                  <span className={spent > budget ? 'text-red-600 font-semibold' : 'text-foreground'}>
                    {formatPrice(spent)}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      percentage > 100 ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Restant</span>
                  <span className={remaining < 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                    {formatPrice(remaining)}
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold">Mon Budget Mensuel</h3>
        <p className="text-muted-foreground">Définissez vos objectifs par catégorie</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-green-700 dark:text-green-400">Revenus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Budget</span>
                <span className="font-semibold">{formatPrice(totalIncomeBudget)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Réel</span>
                <span className="font-semibold text-green-600">{formatPrice(totalIncomeActual)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-sm font-medium">Différence</span>
                <span className={`font-bold ${totalIncomeActual >= totalIncomeBudget ? 'text-green-600' : 'text-yellow-600'}`}>
                  {totalIncomeActual >= totalIncomeBudget ? '+' : ''}{formatPrice(totalIncomeActual - totalIncomeBudget)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-red-200 dark:border-red-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-700 dark:text-red-400">Dépenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Budget</span>
                <span className="font-semibold">{formatPrice(totalExpenseBudget)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Réel</span>
                <span className="font-semibold text-red-600">{formatPrice(totalExpenseActual)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-sm font-medium">Restant</span>
                <span className={`font-bold ${totalExpenseActual <= totalExpenseBudget ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPrice(totalExpenseBudget - totalExpenseActual)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Income Categories */}
      <div>
        <h4 className="text-lg font-semibold mb-3 text-green-600 dark:text-green-400">💰 Revenus</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {incomeCategories.map(renderCategoryCard)}
        </div>
      </div>

      {/* Expense Categories */}
      <div>
        <h4 className="text-lg font-semibold mb-3 text-red-600 dark:text-red-400">💳 Dépenses</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {expenseCategories.map(renderCategoryCard)}
        </div>
      </div>

      {/* Edit dialog for existing budgets */}
      {editingGoal && editingGoal.currentLimit > 0 && (
        <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setEditingGoal(null);
            setMonthlyLimit("");
            setFrequency("monthly");
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Modifier le budget</DialogTitle>
              <DialogDescription>
                Ajustez le montant et la fréquence
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => handleSubmit(e, editingGoal.categoryId)} className="space-y-4">
              <div>
                <Label>Fréquence</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">📅 Hebdomadaire</SelectItem>
                    <SelectItem value="biweekly">📆 Aux 2 semaines</SelectItem>
                    <SelectItem value="monthly">🗓️ Mensuel</SelectItem>
                    <SelectItem value="yearly">📊 Annuel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Montant {frequency === 'weekly' ? 'hebdomadaire' : frequency === 'biweekly' ? 'aux 2 semaines' : frequency === 'yearly' ? 'annuel' : 'mensuel'}</Label>
                <CurrencyInput 
                  value={monthlyLimit} 
                  onChange={setMonthlyLimit} 
                  className="mt-1" 
                  required 
                />
                {frequency !== 'monthly' && monthlyLimit && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ≈ {formatPrice(
                      frequency === 'weekly' ? parseFloat(monthlyLimit) * 4.33 :
                      frequency === 'biweekly' ? parseFloat(monthlyLimit) * 2.17 :
                      parseFloat(monthlyLimit) / 12
                    )}/mois
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={saveGoal.isPending}>
                {saveGoal.isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
