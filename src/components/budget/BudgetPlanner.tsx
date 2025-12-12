import { useState, useMemo } from "react";
import { Plus, Trash2, PencilLine, GripVertical, TrendingUp, TrendingDown, Settings2 } from "lucide-react";
import { CategoryIcon } from "@/components/budget/CategoryIcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CurrencyInput } from "@/components/CurrencyInput";
import { formatPrice } from "@/lib/priceFormat";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useBudgetRealtime } from "@/hooks/useBudgetRealtime";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
  display_order?: number;
}

interface BudgetGoal {
  id: string;
  category_id: string;
  monthly_limit: number;
  frequency?: string;
}

interface SortableBudgetRowProps {
  category: Category;
  budget: number;
  spent: number;
  onEdit: () => void;
  onDelete: () => void;
  hasBudget: boolean;
}

const SortableBudgetRow = ({ category, budget, spent, onEdit, onDelete, hasBudget }: SortableBudgetRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  const percentage = budget > 0 ? (spent / budget) * 100 : 0;
  const isOver = category.type === 'expense' ? spent > budget : spent < budget;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2.5 py-2.5 px-3 rounded-xl",
        "hover:bg-muted/30 transition-all group",
        isDragging && "bg-muted/50 shadow-lg"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none opacity-0 group-hover:opacity-60 transition-opacity"
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      
      <CategoryIcon icon={category.icon} color={category.color} size="md" />
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{category.name}</p>
        {hasBudget && (
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden max-w-[100px]">
              <div 
                className={cn(
                  "h-full transition-all rounded-full",
                  category.type === 'expense'
                    ? percentage > 100 ? 'bg-red-500' : percentage > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                    : percentage >= 100 ? 'bg-emerald-500' : 'bg-amber-500'
                )}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
      </div>
      
      <div className="text-right">
        <p className={cn(
          "font-medium text-sm tabular-nums",
          hasBudget && isOver && category.type === 'expense' && "text-red-500"
        )}>
          {formatPrice(spent)}
        </p>
        {hasBudget && (
          <p className="text-[11px] text-muted-foreground tabular-nums">/ {formatPrice(budget)}</p>
        )}
      </div>
      
      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          onClick={onEdit}
        >
          {hasBudget ? <PencilLine className="h-3.5 w-3.5 text-muted-foreground" /> : <Plus className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>
        {hasBudget && (
          <button 
            className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" />
          </button>
        )}
      </div>
    </div>
  );
};

export const BudgetPlanner = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const { user } = useAuth();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  const queryClient = useQueryClient();
  useBudgetRealtime(user?.id);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: categories = [] } = useQuery({
    queryKey: ['budget-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_categories')
        .select('*')
        .order('display_order', { ascending: true })
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

  const reorderCategories = useMutation({
    mutationFn: async (updates: { id: string; display_order: number }[]) => {
      const promises = updates.map(({ id, display_order }) =>
        supabase
          .from('budget_categories')
          .update({ display_order })
          .eq('id', id)
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-categories'] });
    },
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
      setEditingCategory(null);
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
      setDeleteConfirm(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    saveGoal.mutate({ categoryId: editingCategory.id, limit: parseFloat(monthlyLimit), freq: frequency });
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

  const handleDragEnd = (event: DragEndEvent, type: 'expense' | 'income') => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const cats = type === 'expense' ? expenseCategories : incomeCategories;
    const oldIndex = cats.findIndex(c => c.id === active.id);
    const newIndex = cats.findIndex(c => c.id === over.id);

    const reordered = arrayMove(cats, oldIndex, newIndex);
    const updates = reordered.map((cat, index) => ({
      id: cat.id,
      display_order: index,
    }));

    reorderCategories.mutate(updates);
  };

  const openEditDialog = (category: Category) => {
    const budget = getCategoryBudget(category.id);
    setEditingCategory(category);
    setMonthlyLimit(budget > 0 ? budget.toString() : "");
    setFrequency(goals.find(g => g.category_id === category.id)?.frequency || "monthly");
  };

  const incomeCategories = useMemo(() => 
    categories.filter(c => c.type === 'income'), [categories]);
  const expenseCategories = useMemo(() => 
    categories.filter(c => c.type === 'expense'), [categories]);

  const totalIncomeBudget = incomeCategories.reduce((sum, cat) => sum + getCategoryBudget(cat.id), 0);
  const totalExpenseBudget = expenseCategories.reduce((sum, cat) => sum + getCategoryBudget(cat.id), 0);
  const totalIncomeActual = incomeCategories.reduce((sum, cat) => sum + getCategorySpent(cat.id), 0);
  const totalExpenseActual = expenseCategories.reduce((sum, cat) => sum + getCategorySpent(cat.id), 0);
  const balance = totalIncomeActual - totalExpenseActual;

  return (
    <div className="space-y-6">
      {/* Summary Cards - Minimal */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-medium text-muted-foreground">Revenus</span>
          </div>
          <p className="text-lg sm:text-xl font-semibold text-emerald-600 tabular-nums">{formatPrice(totalIncomeActual)}</p>
          {totalIncomeBudget > 0 && (
            <p className="text-xs text-muted-foreground mt-1.5">sur {formatPrice(totalIncomeBudget)}</p>
          )}
        </div>

        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="h-4 w-4 text-red-500" />
            <span className="text-xs font-medium text-muted-foreground">Dépenses</span>
          </div>
          <p className="text-lg sm:text-xl font-semibold text-red-500 tabular-nums">{formatPrice(totalExpenseActual)}</p>
          {totalExpenseBudget > 0 && (
            <p className="text-xs text-muted-foreground mt-1.5">sur {formatPrice(totalExpenseBudget)}</p>
          )}
        </div>

        <div className={cn(
          "p-4 rounded-xl border",
          balance >= 0 
            ? "bg-blue-500/5 border-blue-500/10" 
            : "bg-orange-500/5 border-orange-500/10"
        )}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-medium text-muted-foreground">Balance</span>
          </div>
          <p className={cn(
            "text-lg sm:text-xl font-semibold tabular-nums",
            balance >= 0 ? "text-blue-600" : "text-orange-500"
          )}>
            {balance >= 0 ? '+' : ''}{formatPrice(balance)}
          </p>
          <p className="text-xs text-muted-foreground mt-1.5">ce mois</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Expenses */}
        <section className="bg-card rounded-2xl border border-border/50 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <h3 className="font-medium">Dépenses</h3>
            </div>
            <span className="text-xs text-muted-foreground">Glissez pour réorganiser</span>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(e) => handleDragEnd(e, 'expense')}
          >
            <SortableContext
              items={expenseCategories.map(c => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1.5 max-h-[380px] overflow-y-auto">
                {expenseCategories.map(category => (
                  <SortableBudgetRow
                    key={category.id}
                    category={category}
                    budget={getCategoryBudget(category.id)}
                    spent={getCategorySpent(category.id)}
                    hasBudget={getCategoryBudget(category.id) > 0}
                    onEdit={() => openEditDialog(category)}
                    onDelete={() => setDeleteConfirm(category.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>

        {/* Income */}
        <section className="bg-card rounded-2xl border border-border/50 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <h3 className="font-medium">Revenus</h3>
            </div>
            <span className="text-xs text-muted-foreground">Glissez pour réorganiser</span>
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(e) => handleDragEnd(e, 'income')}
          >
            <SortableContext
              items={incomeCategories.map(c => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1.5 max-h-[380px] overflow-y-auto">
                {incomeCategories.map(category => (
                  <SortableBudgetRow
                    key={category.id}
                    category={category}
                    budget={getCategoryBudget(category.id)}
                    spent={getCategorySpent(category.id)}
                    hasBudget={getCategoryBudget(category.id) > 0}
                    onEdit={() => openEditDialog(category)}
                    onDelete={() => setDeleteConfirm(category.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>
      </div>

      {/* Edit Budget Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingCategory && (
                <>
                  <CategoryIcon icon={editingCategory.icon} color={editingCategory.color} size="md" />
                  {editingCategory.name}
                </>
              )}
            </DialogTitle>
            <DialogDescription>Définir un budget mensuel</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <DialogFooter>
              <Button type="submit" className="w-full" disabled={saveGoal.isPending || !monthlyLimit}>
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce budget?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera le budget défini pour cette catégorie.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteConfirm && deleteGoal.mutate(deleteConfirm)} 
              className="bg-destructive text-destructive-foreground"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
