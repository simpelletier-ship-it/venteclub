import { useState } from "react";
import { Plus, Trash2, PencilLine, ChevronDown, ChevronUp } from "lucide-react";
import { CategoryIcon } from "@/components/budget/CategoryIcon";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CurrencyInput } from "@/components/CurrencyInput";
import { formatPrice } from "@/lib/priceFormat";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useBudgetRealtime } from "@/hooks/useBudgetRealtime";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

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

export const BudgetPlanner = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<{ categoryId: string; currentLimit: number; currentFrequency?: string } | null>(null);
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [showAllExpenses, setShowAllExpenses] = useState(false);
  const [showAllIncome, setShowAllIncome] = useState(false);
  
  const queryClient = useQueryClient();
  useBudgetRealtime(user?.id);

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
    enabled: isAuthenticated,
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['budget-goals'],
    queryFn: async () => {
      const { data, error } = await supabase.from('budget_goals').select('*');
      if (error) throw error;
      return data as BudgetGoal[];
    },
    enabled: isAuthenticated,
  });

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
    enabled: isAuthenticated,
  });

  const saveGoal = useMutation({
    mutationFn: async ({ categoryId, limit, freq }: { categoryId: string; limit: number; freq: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const existingGoal = goals.find(g => g.category_id === categoryId);
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
          .insert({ user_id: user.id, category_id: categoryId, monthly_limit: monthlyAmount, frequency: freq });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-goals'] });
      toast.success("Budget enregistré");
      setOpen(false);
      setEditingGoal(null);
      setMonthlyLimit("");
      setFrequency("monthly");
    },
  });

  const deleteGoal = useMutation({
    mutationFn: async (categoryId: string) => {
      const goal = goals.find(g => g.category_id === categoryId);
      if (!goal) return;
      const { error } = await supabase.from('budget_goals').delete().eq('id', goal.id);
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

  const getCategorySpent = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return 0;
    return transactions
      .filter(t => t.category_id === categoryId && t.type === category.type)
      .reduce((sum, t) => sum + Number(t.amount), 0);
  };

  const getCategoryBudget = (categoryId: string) => {
    const goal = goals.find(g => g.category_id === categoryId);
    return goal ? Number(goal.monthly_limit) : 0;
  };

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  const totalIncomeBudget = incomeCategories.reduce((sum, cat) => sum + getCategoryBudget(cat.id), 0);
  const totalExpenseBudget = expenseCategories.reduce((sum, cat) => sum + getCategoryBudget(cat.id), 0);
  const totalIncomeActual = incomeCategories.reduce((sum, cat) => sum + getCategorySpent(cat.id), 0);
  const totalExpenseActual = expenseCategories.reduce((sum, cat) => sum + getCategorySpent(cat.id), 0);

  const renderBudgetRow = (category: Category) => {
    const budget = getCategoryBudget(category.id);
    const spent = getCategorySpent(category.id);
    const percentage = budget > 0 ? (spent / budget) * 100 : 0;
    const isOver = category.type === 'expense' ? spent > budget : spent < budget;
    const hasBudget = budget > 0;

    return (
      <div 
        key={category.id} 
        className="flex items-center gap-4 py-3 px-4 rounded-xl hover:bg-muted/50 transition-colors group"
      >
        <CategoryIcon icon={category.icon} color={category.color} size="lg" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{category.name}</p>
          {hasBudget && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all",
                    category.type === 'expense'
                      ? percentage > 100 ? 'bg-red-500' : percentage > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                      : percentage >= 100 ? 'bg-emerald-500' : 'bg-amber-500'
                  )}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-10 text-right">
                {Math.round(percentage)}%
              </span>
            </div>
          )}
        </div>
        <div className="text-right">
          <p className={cn(
            "font-semibold text-sm",
            hasBudget && isOver && category.type === 'expense' && "text-red-500"
          )}>
            {formatPrice(spent)}
          </p>
          {hasBudget && (
            <p className="text-xs text-muted-foreground">/ {formatPrice(budget)}</p>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Dialog open={open && editingGoal?.categoryId === category.id} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
              setEditingGoal(null);
              setMonthlyLimit("");
              setFrequency("monthly");
            }
          }}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setEditingGoal({ categoryId: category.id, currentLimit: budget });
                  setMonthlyLimit(budget.toString());
                  setOpen(true);
                }}
              >
                {hasBudget ? <PencilLine className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CategoryIcon icon={category.icon} color={category.color} size="md" />
                  {category.name}
                </DialogTitle>
                <DialogDescription>Définir un budget mensuel</DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => handleSubmit(e, category.id)} className="space-y-4">
                <div>
                  <Label className="text-sm">Montant</Label>
                  <CurrencyInput
                    value={monthlyLimit}
                    onChange={setMonthlyLimit}
                    placeholder="0 $"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Fréquence</Label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      <SelectItem value="biweekly">Aux 2 semaines</SelectItem>
                      <SelectItem value="monthly">Mensuel</SelectItem>
                      <SelectItem value="yearly">Annuel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={saveGoal.isPending}>
                  Enregistrer
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          {hasBudget && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer ce budget?</AlertDialogTitle>
                  <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteGoal.mutate(category.id)} className="bg-destructive text-destructive-foreground">
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    );
  };

  const displayedExpenses = showAllExpenses ? expenseCategories : expenseCategories.slice(0, 6);
  const displayedIncome = showAllIncome ? incomeCategories : incomeCategories.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-emerald-200 dark:border-emerald-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Revenus</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                {totalIncomeBudget > 0 ? `${Math.round((totalIncomeActual / totalIncomeBudget) * 100)}%` : '—'}
              </span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{formatPrice(totalIncomeActual)}</p>
            {totalIncomeBudget > 0 && (
              <p className="text-xs text-muted-foreground mt-1">sur {formatPrice(totalIncomeBudget)} budgété</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Dépenses</span>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                totalExpenseActual > totalExpenseBudget 
                  ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                  : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
              )}>
                {totalExpenseBudget > 0 ? `${Math.round((totalExpenseActual / totalExpenseBudget) * 100)}%` : '—'}
              </span>
            </div>
            <p className="text-2xl font-bold text-red-600">{formatPrice(totalExpenseActual)}</p>
            {totalExpenseBudget > 0 && (
              <p className="text-xs text-muted-foreground mt-1">sur {formatPrice(totalExpenseBudget)} budgété</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expense Categories */}
      <Card>
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold">Dépenses par catégorie</h3>
          </div>
          <div className="divide-y divide-border">
            {displayedExpenses.map(renderBudgetRow)}
          </div>
          {expenseCategories.length > 6 && (
            <button
              onClick={() => setShowAllExpenses(!showAllExpenses)}
              className="w-full py-3 text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 transition-colors"
            >
              {showAllExpenses ? (
                <>Voir moins <ChevronUp className="h-4 w-4" /></>
              ) : (
                <>Voir tout ({expenseCategories.length}) <ChevronDown className="h-4 w-4" /></>
              )}
            </button>
          )}
        </CardContent>
      </Card>

      {/* Income Categories */}
      <Card>
        <CardContent className="p-0">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold">Revenus par catégorie</h3>
          </div>
          <div className="divide-y divide-border">
            {displayedIncome.map(renderBudgetRow)}
          </div>
          {incomeCategories.length > 4 && (
            <button
              onClick={() => setShowAllIncome(!showAllIncome)}
              className="w-full py-3 text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 transition-colors"
            >
              {showAllIncome ? (
                <>Voir moins <ChevronUp className="h-4 w-4" /></>
              ) : (
                <>Voir tout ({incomeCategories.length}) <ChevronDown className="h-4 w-4" /></>
              )}
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
