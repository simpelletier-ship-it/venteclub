import { useState } from "react";
import { Plus, Trash2, Search, Calendar as CalendarIcon, List, Tag as TagIcon, Pencil, FileText } from "lucide-react";
import { CategoryIcon, ICON_MAP } from "./CategoryIcon";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { CurrencyInput } from "@/components/CurrencyInput";
import { formatPrice } from "@/lib/priceFormat";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { TransactionsCalendar } from "./TransactionsCalendar";
import { CreateDefaultCategories } from "./CreateDefaultCategories";
import { Badge } from "@/components/ui/badge";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
}

interface Transaction {
  id: string;
  amount: number;
  description: string;
  transaction_date: string;
  type: string;
  category_id: string;
  category: Category;
  tag_ids?: string[];
  is_recurring?: boolean;
  recurring_frequency?: string;
}

export const BudgetTransactions = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState("monthly");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Advanced filters
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDateStart, setFilterDateStart] = useState("");
  const [filterDateEnd, setFilterDateEnd] = useState("");
  const [filterTag, setFilterTag] = useState<string>('all');
  
  // View mode
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  
  // States for adding custom categories
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("file-text");
  const [newCategoryType, setNewCategoryType] = useState<'income' | 'expense'>('expense');
  const [newCategoryColor, setNewCategoryColor] = useState("#3b82f6");
  
  const queryClient = useQueryClient();

  // Fetch categories and create defaults if needed
  const { data: categories = [] } = useQuery({
    queryKey: ['budget-categories'],
    enabled: isAuthenticated,
    retry: 1,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from('budget_categories')
        .select('*')
        .order('type', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      // Check if user has specific default categories (check by name)
      const defaultCategoryNames = ["Salaire", "Logement", "Alimentation", "Transport"];
      const hasDefaultCategories = data && defaultCategoryNames.some(name => 
        data.some(cat => cat.name === name && cat.is_custom === false)
      );
      
      // Create default categories if user doesn't have them yet
      if (!hasDefaultCategories) {
        const defaultCategories = [
          // Revenus
          { name: "Salaire", icon: "banknote", color: "#10b981", type: "income", user_id: user.id, is_custom: false },
          { name: "Freelance", icon: "briefcase", color: "#06b6d4", type: "income", user_id: user.id, is_custom: false },
          { name: "Investissements", icon: "trending-up", color: "#8b5cf6", type: "income", user_id: user.id, is_custom: false },
          { name: "Autre revenu", icon: "coins", color: "#14b8a6", type: "income", user_id: user.id, is_custom: false },
          
          // Dépenses
          { name: "Logement", icon: "home", color: "#ef4444", type: "expense", user_id: user.id, is_custom: false },
          { name: "Alimentation", icon: "utensils", color: "#f59e0b", type: "expense", user_id: user.id, is_custom: false },
          { name: "Transport", icon: "car", color: "#3b82f6", type: "expense", user_id: user.id, is_custom: false },
          { name: "Divertissement", icon: "film", color: "#ec4899", type: "expense", user_id: user.id, is_custom: false },
          { name: "Santé", icon: "heart-pulse", color: "#06b6d4", type: "expense", user_id: user.id, is_custom: false },
          { name: "Éducation", icon: "graduation-cap", color: "#8b5cf6", type: "expense", user_id: user.id, is_custom: false },
          { name: "Services publics", icon: "lightbulb", color: "#f59e0b", type: "expense", user_id: user.id, is_custom: false },
          { name: "Assurances", icon: "shield", color: "#6366f1", type: "expense", user_id: user.id, is_custom: false },
          { name: "Vêtements", icon: "shirt", color: "#ec4899", type: "expense", user_id: user.id, is_custom: false },
          { name: "Autre dépense", icon: "credit-card", color: "#64748b", type: "expense", user_id: user.id, is_custom: false },
        ];

        const { error: insertError } = await supabase
          .from('budget_categories')
          .insert(defaultCategories);

        if (insertError) {
          console.error("Error creating default categories:", insertError);
          // Return existing data if insert fails
          return data as Category[];
        }
        
        // Re-fetch all categories (default + custom)
        const { data: newData, error: refetchError } = await supabase
          .from('budget_categories')
          .select('*')
          .order('type', { ascending: true })
          .order('name', { ascending: true });
        
        if (refetchError) {
          console.error("Error refetching categories:", refetchError);
          return data as Category[];
        }
        
        return newData as Category[];
      }
      
      return data as Category[];
    },
  });

  // Fetch transactions with tags
  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ['budget-transactions'],
    enabled: isAuthenticated,
    retry: 1,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_transactions')
        .select('*, category:budget_categories(*)')
        .order('transaction_date', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      
      // Fetch tag links for all transactions
      if (data && data.length > 0) {
        const txIds = data.map(t => t.id);
        const { data: tagLinks } = await supabase
          .from('transaction_tag_links')
          .select('transaction_id, tag_id')
          .in('transaction_id', txIds);
        
        // Add tag_ids to transactions
        return data.map(tx => ({
          ...tx,
          tag_ids: tagLinks?.filter(l => l.transaction_id === tx.id).map(l => l.tag_id) || []
        })) as Transaction[];
      }
      
      return data as Transaction[];
    },
  });

  // Fetch tags
  const { data: tags = [] } = useQuery({
    queryKey: ['transaction-tags'],
    enabled: isAuthenticated,
    retry: 1,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transaction_tags')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Add transaction mutation
  const addTransaction = useMutation({
    mutationFn: async () => {
      const category = categories.find(c => c.id === selectedCategory);
      if (!category) throw new Error("Catégorie introuvable");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await supabase
        .from('budget_transactions')
        .insert({
          user_id: user.id,
          category_id: selectedCategory,
          amount: parseFloat(amount),
          description,
          transaction_date: transactionDate,
          type: category.type,
          is_recurring: isRecurring,
          recurring_frequency: isRecurring ? recurringFrequency : null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalider TOUTES les queries liées au budget pour synchronisation complète
      queryClient.invalidateQueries({ queryKey: ['budget-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['budget-transactions-all'] });
      queryClient.invalidateQueries({ queryKey: ['user-assets'] });
      queryClient.invalidateQueries({ queryKey: ['user-debts'] });
      queryClient.invalidateQueries({ queryKey: ['financial-goals'] });
      
      // Check if it was an income transaction for celebration
      const category = categories.find(c => c.id === selectedCategory);
      if (category?.type === 'income') {
        confetti({
          particleCount: 30,
          spread: 45,
          origin: { y: 0.7 },
          colors: ['#10b981', '#059669', '#047857']
        });
      }
      
      toast.success("Transaction ajoutée avec succès", {
        duration: 3000,
        className: "animate-fade-in",
      });
      setOpen(false);
      setAmount("");
      setDescription("");
      setSelectedCategory("");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Update transaction mutation
  const updateTransaction = useMutation({
    mutationFn: async () => {
      if (!editingTransaction) throw new Error("Aucune transaction à modifier");
      
      const category = categories.find(c => c.id === selectedCategory);
      if (!category) throw new Error("Catégorie introuvable");

      const { error } = await supabase
        .from('budget_transactions')
        .update({
          category_id: selectedCategory,
          amount: parseFloat(amount),
          description,
          transaction_date: transactionDate,
          type: category.type,
          is_recurring: isRecurring,
          recurring_frequency: isRecurring ? recurringFrequency : null,
        })
        .eq('id', editingTransaction.id);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalider TOUTES les queries liées au budget pour synchronisation complète
      queryClient.invalidateQueries({ queryKey: ['budget-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['budget-transactions-all'] });
      queryClient.invalidateQueries({ queryKey: ['user-assets'] });
      queryClient.invalidateQueries({ queryKey: ['user-debts'] });
      queryClient.invalidateQueries({ queryKey: ['financial-goals'] });
      toast.success("Transaction modifiée avec succès");
      setEditOpen(false);
      setEditingTransaction(null);
      setAmount("");
      setDescription("");
      setSelectedCategory("");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Delete transaction mutation
  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('budget_transactions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalider TOUTES les queries liées au budget pour synchronisation complète
      queryClient.invalidateQueries({ queryKey: ['budget-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['budget-transactions-all'] });
      queryClient.invalidateQueries({ queryKey: ['user-assets'] });
      queryClient.invalidateQueries({ queryKey: ['user-debts'] });
      queryClient.invalidateQueries({ queryKey: ['financial-goals'] });
      toast.success("Transaction supprimée");
    },
  });

  // Add custom category mutation
  const addCategory = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await supabase
        .from('budget_categories')
        .insert({
          user_id: user.id,
          name: newCategoryName,
          icon: newCategoryIcon,
          color: newCategoryColor,
          type: newCategoryType,
          is_custom: true,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-categories'] });
      toast.success("Catégorie ajoutée avec succès");
      setCategoryDialogOpen(false);
      setNewCategoryName("");
      setNewCategoryIcon("📝");
      setNewCategoryType("expense");
      setNewCategoryColor("#3b82f6");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTransaction.mutate();
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCategory.mutate();
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTransaction.mutate();
  };

  const openEditDialog = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setAmount(transaction.amount.toString());
    setDescription(transaction.description || "");
    setSelectedCategory(transaction.category_id);
    setTransactionDate(transaction.transaction_date);
    setIsRecurring(transaction.is_recurring || false);
    setRecurringFrequency(transaction.recurring_frequency || "monthly");
    setEditOpen(true);
  };

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  // Filter transactions based on search query and advanced filters
  const filteredTransactions = transactions.filter(transaction => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const categoryName = transaction.category?.name?.toLowerCase() || '';
      const desc = transaction.description?.toLowerCase() || '';
      const amount = transaction.amount?.toString() || '';
      if (!categoryName.includes(query) && !desc.includes(query) && !amount.includes(query)) {
        return false;
      }
    }

    // Type filter
    if (filterType !== 'all' && transaction.type !== filterType) {
      return false;
    }

    // Category filter
    if (filterCategory !== 'all' && transaction.category_id !== filterCategory) {
      return false;
    }

    // Tag filter
    if (filterTag !== 'all') {
      if (!transaction.tag_ids || !transaction.tag_ids.includes(filterTag)) {
        return false;
      }
    }

    // Date range filter
    if (filterDateStart && transaction.transaction_date < filterDateStart) {
      return false;
    }
    if (filterDateEnd && transaction.transaction_date > filterDateEnd) {
      return false;
    }

    return true;
  });

  const resetFilters = () => {
    setSearchQuery("");
    setFilterType('all');
    setFilterCategory('all');
    setFilterTag('all');
    setFilterDateStart("");
    setFilterDateEnd("");
  };

  const hasActiveFilters = searchQuery || filterType !== 'all' || filterCategory !== 'all' || filterTag !== 'all' || filterDateStart || filterDateEnd;

  const commonEmojis = ["💼", "💰", "🏠", "🍽️", "🚗", "🎬", "🏥", "📚", "💡", "🛡️", "👕", "💳", "✈️", "🎮", "📱", "💻", "🎯", "🎨", "🏋️", "🛒"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-2xl font-bold">📝 Historique</h3>
          <p className="text-muted-foreground text-base">Toutes vos transactions</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="h-12">
                <Plus className="mr-2 h-5 w-5" />
                Ajouter
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nouvelle transaction</DialogTitle>
              <DialogDescription>Ajoutez un revenu ou une dépense</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Catégorie</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory} required>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {incomeCategories.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Revenus</div>
                        {incomeCategories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <span className="flex items-center gap-2">
                              <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />
                              {cat.name}
                            </span>
                          </SelectItem>
                        ))}
                      </>
                    )}
                    {expenseCategories.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Dépenses</div>
                        {expenseCategories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <span className="flex items-center gap-2">
                              <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />
                              {cat.name}
                            </span>
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Montant</Label>
                <CurrencyInput value={amount} onChange={setAmount} className="mt-1" required />
              </div>

              <div>
                <Label>Description (optionnel)</Label>
                <Textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Détails de la transaction..."
                  className="mt-1"
                  rows={2}
                />
              </div>

              <div>
                <Label>Date</Label>
                <Input 
                  type="date" 
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="recurring">Transaction récurrente</Label>
                <Switch 
                  id="recurring"
                  checked={isRecurring}
                  onCheckedChange={setIsRecurring}
                />
              </div>

              {isRecurring && (
                <div>
                  <Label>Fréquence</Label>
                  <Select value={recurringFrequency} onValueChange={setRecurringFrequency}>
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
              )}

              <Button type="submit" className="w-full" disabled={addTransaction.isPending}>
                {addTransaction.isPending ? "Ajout..." : "Ajouter"}
              </Button>
          </form>
        </DialogContent>
        </Dialog>

        {/* Edit transaction dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Modifier la transaction</DialogTitle>
              <DialogDescription>Modifiez les détails de votre transaction</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <Label>Catégorie</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory} required>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {incomeCategories.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Revenus</div>
                        {incomeCategories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <span className="flex items-center gap-2">
                              <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />
                              {cat.name}
                            </span>
                          </SelectItem>
                        ))}
                      </>
                    )}
                    {expenseCategories.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Dépenses</div>
                        {expenseCategories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <span className="flex items-center gap-2">
                              <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />
                              {cat.name}
                            </span>
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Montant</Label>
                <CurrencyInput value={amount} onChange={setAmount} className="mt-1" required />
              </div>

              <div>
                <Label>Description (optionnel)</Label>
                <Textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Détails de la transaction..."
                  className="mt-1"
                  rows={2}
                />
              </div>

              <div>
                <Label>Date</Label>
                <Input 
                  type="date" 
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="edit-recurring">Transaction récurrente</Label>
                <Switch 
                  id="edit-recurring"
                  checked={isRecurring}
                  onCheckedChange={setIsRecurring}
                />
              </div>

              {isRecurring && (
                <div>
                  <Label>Fréquence</Label>
                  <Select value={recurringFrequency} onValueChange={setRecurringFrequency}>
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
              )}

              <Button type="submit" className="w-full" disabled={updateTransaction.isPending}>
                {updateTransaction.isPending ? "Modification..." : "Modifier"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {viewMode === 'calendar' ? (
        <TransactionsCalendar 
          transactions={transactions as any} 
          categories={categories as any} 
        />
      ) : (
        <Card>
        <CardHeader>
          <CardTitle>Historique récent</CardTitle>
          <CardDescription>Vos 50 dernières transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Simple Search */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
            <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
              <SelectTrigger className="w-[140px] h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tout</SelectItem>
                <SelectItem value="income">Revenus</SelectItem>
                <SelectItem value="expense">Dépenses</SelectItem>
              </SelectContent>
            </Select>
            {tags.length > 0 && (
              <Select value={filterTag} onValueChange={setFilterTag}>
                <SelectTrigger className="w-[160px] h-11">
                  <SelectValue placeholder="Filtrer par tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <TagIcon className="h-4 w-4" />
                      Tous les tags
                    </div>
                  </SelectItem>
                  {tags.map(tag => (
                    <SelectItem key={tag.id} value={tag.id}>
                      {tag.icon} {tag.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          {filteredTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-12 text-base">
              Aucune transaction
            </p>
          ) : (
            <div className="divide-y">
              {filteredTransactions.map((transaction: any) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: transaction.category?.color + '20' }}
                    >
                      <CategoryIcon icon={transaction.category?.icon} color={transaction.category?.color} size="lg" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-base">{transaction.category?.name || 'Sans catégorie'}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {transaction.description || new Date(transaction.transaction_date).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })}
                      </p>
                      {transaction.tag_ids && transaction.tag_ids.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {transaction.tag_ids.map((tagId: string) => {
                            const tag = tags.find(t => t.id === tagId);
                            if (!tag) return null;
                            return (
                              <Badge 
                                key={tagId} 
                                variant="secondary" 
                                className="text-xs"
                                style={{ 
                                  backgroundColor: tag.color + '20',
                                  color: tag.color,
                                  borderColor: tag.color + '40'
                                }}
                              >
                                {tag.icon} {tag.name}
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className={`font-bold text-lg ${transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>
                      {transaction.type === 'income' ? '+' : ''}{formatPrice(transaction.amount)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(transaction)}
                      className="h-8 w-8"
                      title="Modifier"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTransaction.mutate(transaction.id)}
                      disabled={deleteTransaction.isPending}
                      className="h-8 w-8"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );
};
