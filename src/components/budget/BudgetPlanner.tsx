import { useState } from "react";
import { Plus, Trash2, PencilLine, CalendarDays, RotateCcw, FileDown, AlertTriangle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { CurrencyInput } from "@/components/CurrencyInput";
import { formatPrice } from "@/lib/priceFormat";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useBudgetRealtime } from "@/hooks/useBudgetRealtime";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { AIBudgetGenerator } from "./AIBudgetGenerator";

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
  
  const queryClient = useQueryClient();
  
  // Activer Supabase Realtime pour synchronisation automatique
  useBudgetRealtime(user?.id);

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
    enabled: isAuthenticated,
    retry: 1,
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
    enabled: isAuthenticated,
    retry: 1,
  });

  // Fetch current month transactions to compare with budget
  const { data: transactions = [], isFetching: isFetchingTransactions } = useQuery({
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
    retry: 1,
  });

  // Fetch assets to include in budget comparison
  const { data: assets = [] } = useQuery({
    queryKey: ['user-assets-for-budget'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_assets')
        .select('*');
      
      if (error) throw error;
      return data;
    },
    enabled: isAuthenticated,
    retry: 1,
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

  // Reset all data mutation
  const resetAll = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Delete all user data in parallel
      const promises = [
        supabase.from('budget_transactions').delete().eq('user_id', user.id),
        supabase.from('budget_goals').delete().eq('user_id', user.id),
        supabase.from('user_assets').delete().eq('user_id', user.id),
        supabase.from('user_debts').delete().eq('user_id', user.id),
        supabase.from('financial_goals').delete().eq('user_id', user.id),
        supabase.from('asset_history').delete().eq('user_id', user.id),
        supabase.from('debt_history').delete().eq('user_id', user.id),
        supabase.from('budget_categories').delete().eq('user_id', user.id).eq('is_custom', true),
      ];

      const results = await Promise.all(promises);
      const error = results.find(r => r.error)?.error;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['budget-goals'] });
      queryClient.invalidateQueries({ queryKey: ['user-assets'] });
      queryClient.invalidateQueries({ queryKey: ['user-debts'] });
      queryClient.invalidateQueries({ queryKey: ['financial-goals'] });
      queryClient.invalidateQueries({ queryKey: ['budget-categories'] });
      toast.success("✅ Toutes les données ont été réinitialisées!", { duration: 3000 });
    },
    onError: (error: any) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Apply AI-generated budget
  const handleAIBudgetApplied = async (budget: {
    income: Array<{ name: string; amount: number; icon: string }>;
    expenses: Array<{ name: string; amount: number; icon: string }>;
    explanation: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Helper function to find best matching category
      const findBestMatch = (itemName: string, type: 'income' | 'expense') => {
        const itemNameLower = itemName.toLowerCase();
        
        return categories?.find(cat => {
          if (cat.type !== type) return false;
          const catNameLower = cat.name.toLowerCase();
          
          // Exact match
          if (catNameLower === itemNameLower) return true;
          
          // Partial match with keywords (min 3 chars)
          const keywords = itemNameLower.split(' ');
          return keywords.some(keyword => 
            keyword.length > 3 && catNameLower.includes(keyword)
          );
        });
      };

      let matchedCount = 0;

      // Process income categories
      for (const item of budget.income) {
        const category = findBestMatch(item.name, 'income');
        
        if (category) {
          matchedCount++;
          const existingGoal = goals?.find(g => g.category_id === category.id);
          
          if (existingGoal) {
            await supabase
              .from('budget_goals')
              .update({ monthly_limit: item.amount })
              .eq('id', existingGoal.id);
          } else {
            await supabase
              .from('budget_goals')
              .insert({
                user_id: user.id,
                category_id: category.id,
                monthly_limit: item.amount,
                frequency: 'monthly',
              });
          }
        }
      }

      // Process expense categories
      for (const item of budget.expenses) {
        const category = findBestMatch(item.name, 'expense');
        
        if (category) {
          matchedCount++;
          const existingGoal = goals?.find(g => g.category_id === category.id);
          
          if (existingGoal) {
            await supabase
              .from('budget_goals')
              .update({ monthly_limit: item.amount })
              .eq('id', existingGoal.id);
          } else {
            await supabase
              .from('budget_goals')
              .insert({
                user_id: user.id,
                category_id: category.id,
                monthly_limit: item.amount,
                frequency: 'monthly',
              });
          }
        }
      }

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['budget-goals'] });
      queryClient.invalidateQueries({ queryKey: ['budget-categories'] });
      
      toast.success(`✨ Budget IA appliqué! ${matchedCount} catégories mises à jour.`, { duration: 3000 });
    } catch (error: any) {
      console.error("Error applying AI budget:", error);
      toast.error("Erreur: " + error.message);
    }
  };

  const exportPDF = () => {
    // First compute the values we need
    const incomeData = incomeCategories.map(cat => ({
      name: cat.name,
      icon: cat.icon,
      budget: getCategoryBudget(cat.id),
      actual: getCategorySpent(cat.id),
    })).filter(c => c.budget > 0);

    const expenseData = expenseCategories.map(cat => ({
      name: cat.name,
      icon: cat.icon,
      budget: getCategoryBudget(cat.id),
      actual: getCategorySpent(cat.id),
    })).filter(c => c.budget > 0);

    // Create a simple text export
    const content = `
RÉSUMÉ BUDGÉTAIRE MENSUEL
Date: ${new Date().toLocaleDateString('fr-CA')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REVENUS
${incomeData.map(c => `${c.icon} ${c.name}: ${formatPrice(c.actual)} / ${formatPrice(c.budget)}`).join('\n')}

Total revenus: ${formatPrice(totalIncomeActual)} / ${formatPrice(totalIncomeBudget)}

DÉPENSES
${expenseData.map(c => `${c.icon} ${c.name}: ${formatPrice(c.actual)} / ${formatPrice(c.budget)}`).join('\n')}

Total dépenses: ${formatPrice(totalExpenseActual)} / ${formatPrice(totalExpenseBudget)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BALANCE: ${formatPrice(totalIncomeActual - totalExpenseActual)}
`;

    // Download as text file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("📄 Résumé exporté!", { duration: 2000 });
  };

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
    const category = categories.find(c => c.id === categoryId);
    if (!category) return 0;
    
    // Filter transactions by category AND by matching type (income/expense)
    return transactions
      .filter(t => t.category_id === categoryId && t.type === category.type)
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

  // Calculate totals including assets as income
  const totalAssetsValue = assets.reduce((sum, asset) => sum + Number(asset.value), 0);
  
  const totalIncomeBudget = incomeCategories.reduce((sum, cat) => sum + getCategoryBudget(cat.id), 0);
  const totalExpenseBudget = expenseCategories.reduce((sum, cat) => sum + getCategoryBudget(cat.id), 0);
  const totalIncomeActual = incomeCategories.reduce((sum, cat) => sum + getCategorySpent(cat.id), 0) + totalAssetsValue;
  const totalExpenseActual = expenseCategories.reduce((sum, cat) => sum + getCategorySpent(cat.id), 0);

  const renderCategoryCard = (category: Category) => {
    const budget = getCategoryBudget(category.id);
    const spent = getCategorySpent(category.id);
    const remaining = budget - spent;
    const percentage = budget > 0 ? (spent / budget) * 100 : 0;
    const freq = getCategoryFrequency(category.id);
    const isIncome = category.type === 'income';

    // For income: good if earned more than budget (surplus)
    // For expense: good if spent less than budget (remaining)
    const isOverBudget = isIncome ? spent < budget : spent > budget;
    const statusLabel = isIncome 
      ? (spent >= budget ? 'Surplus' : 'Manque')
      : 'Restant';

    return (
      <Card key={category.id} className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
...
          {budget > 0 && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{isIncome ? 'Gagné' : 'Dépensé'}</span>
                  <span className={isOverBudget ? 'text-red-600 font-semibold' : 'text-foreground'}>
                    {formatPrice(spent)}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      isIncome 
                        ? (percentage > 100 ? 'bg-green-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-red-500')
                        : (percentage > 100 ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-green-500')
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{statusLabel}</span>
                  <span className={
                    isIncome 
                      ? (remaining >= 0 ? 'text-green-600 font-semibold' : 'text-red-600')
                      : (remaining >= 0 ? 'text-green-600' : 'text-red-600 font-semibold')
                  }>
                    {formatPrice(Math.abs(remaining))}
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-2xl font-bold">Mon Budget Mensuel</h3>
            <p className="text-muted-foreground">Définissez vos objectifs par catégorie</p>
          </div>
          {isFetchingTransactions && (
            <Badge variant="outline" className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Synchronisation...
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <AIBudgetGenerator onBudgetGenerated={handleAIBudgetApplied} />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Actions
              </Button>
            </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={exportPDF}>
              <FileDown className="h-4 w-4 mr-2" />
              Exporter résumé
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Tout réinitialiser
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Réinitialiser toutes les données?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Cette action est irréversible. Toutes vos transactions, budgets, actifs, dettes, objectifs et catégories personnalisées seront supprimés définitivement.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => resetAll.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Confirmer la réinitialisation
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
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

      {/* Budget vs Réel par Catégorie */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Comparatif par Catégorie</CardTitle>
          <CardDescription>Budget planifié vs Dépenses réelles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {expenseCategories
              .filter(cat => getCategoryBudget(cat.id) > 0)
              .map(category => {
                const budget = getCategoryBudget(category.id);
                const spent = getCategorySpent(category.id);
                const difference = budget - spent;
                const percentage = budget > 0 ? (spent / budget) * 100 : 0;
                
                return (
                  <div key={category.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{category.icon}</span>
                        <div>
                          <div className="font-semibold">{category.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {percentage.toFixed(0)}% du budget utilisé
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-3">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Budget</div>
                        <div className="text-lg font-bold">{formatPrice(budget)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Réel</div>
                        <div className={`text-lg font-bold ${spent > budget ? 'text-red-600' : 'text-foreground'}`}>
                          {formatPrice(spent)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Différence</div>
                        <div className={`text-lg font-bold ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {difference >= 0 ? '+' : ''}{formatPrice(difference)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          percentage > 100 ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    
                    {percentage > 100 && (
                      <div className="mt-2 text-xs text-red-600 font-medium">
                        ⚠️ Dépassement de {formatPrice(spent - budget)}
                      </div>
                    )}
                  </div>
                );
              })}
            
            {expenseCategories.filter(cat => getCategoryBudget(cat.id) > 0).length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                Aucun budget défini pour les catégories de dépenses
              </div>
            )}
          </div>
        </CardContent>
      </Card>

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
