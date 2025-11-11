import { useState } from "react";
import { Plus, Trash2, Search } from "lucide-react";
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

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
}

export const BudgetTransactions = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState("monthly");
  const [searchQuery, setSearchQuery] = useState("");
  
  // States for adding custom categories
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("📝");
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
      
      // Create default categories if user has none
      if (!data || data.length === 0) {
        const defaultCategories = [
          // Revenus
          { name: "Salaire", icon: "💼", color: "#10b981", type: "income", user_id: user.id, is_custom: false },
          { name: "Freelance", icon: "💻", color: "#06b6d4", type: "income", user_id: user.id, is_custom: false },
          { name: "Investissements", icon: "📈", color: "#8b5cf6", type: "income", user_id: user.id, is_custom: false },
          { name: "Autre revenu", icon: "💰", color: "#14b8a6", type: "income", user_id: user.id, is_custom: false },
          
          // Dépenses
          { name: "Logement", icon: "🏠", color: "#ef4444", type: "expense", user_id: user.id, is_custom: false },
          { name: "Alimentation", icon: "🍽️", color: "#f59e0b", type: "expense", user_id: user.id, is_custom: false },
          { name: "Transport", icon: "🚗", color: "#3b82f6", type: "expense", user_id: user.id, is_custom: false },
          { name: "Divertissement", icon: "🎬", color: "#ec4899", type: "expense", user_id: user.id, is_custom: false },
          { name: "Santé", icon: "🏥", color: "#06b6d4", type: "expense", user_id: user.id, is_custom: false },
          { name: "Éducation", icon: "📚", color: "#8b5cf6", type: "expense", user_id: user.id, is_custom: false },
          { name: "Services publics", icon: "💡", color: "#f59e0b", type: "expense", user_id: user.id, is_custom: false },
          { name: "Assurances", icon: "🛡️", color: "#6366f1", type: "expense", user_id: user.id, is_custom: false },
          { name: "Vêtements", icon: "👕", color: "#ec4899", type: "expense", user_id: user.id, is_custom: false },
          { name: "Autre dépense", icon: "💳", color: "#64748b", type: "expense", user_id: user.id, is_custom: false },
        ];

        const { error: insertError } = await supabase
          .from('budget_categories')
          .insert(defaultCategories);

        if (insertError) {
          console.error("Error creating default categories:", insertError);
        } else {
          // Re-fetch categories after creating defaults
          const { data: newData } = await supabase
            .from('budget_categories')
            .select('*')
            .order('type', { ascending: true })
            .order('name', { ascending: true });
          
          return newData as Category[];
        }
      }
      
      return data as Category[];
    },
  });

  // Fetch transactions
  const { data: transactions = [] } = useQuery({
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
      return data;
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
      queryClient.invalidateQueries({ queryKey: ['budget-transactions'] });
      
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
      queryClient.invalidateQueries({ queryKey: ['budget-transactions'] });
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

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  // Filter transactions based on search query
  const filteredTransactions = transactions.filter(transaction => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const categoryName = transaction.category?.name?.toLowerCase() || '';
    const desc = transaction.description?.toLowerCase() || '';
    const amount = transaction.amount?.toString() || '';
    return categoryName.includes(query) || desc.includes(query) || amount.includes(query);
  });

  const commonEmojis = ["💼", "💰", "🏠", "🍽️", "🚗", "🎬", "🏥", "📚", "💡", "🛡️", "👕", "💳", "✈️", "🎮", "📱", "💻", "🎯", "🎨", "🏋️", "🛒"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-2xl font-bold">Transactions Réelles</h3>
          <p className="text-muted-foreground">Enregistrez vos revenus et dépenses réels</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle catégorie
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Ajouter une catégorie</DialogTitle>
                <DialogDescription>Créez une catégorie personnalisée</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <div>
                  <Label>Type</Label>
                  <Select value={newCategoryType} onValueChange={(v) => setNewCategoryType(v as 'income' | 'expense')}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">💰 Revenu</SelectItem>
                      <SelectItem value="expense">💳 Dépense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Nom de la catégorie</Label>
                  <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Ex: Café, Gym, etc."
                    className="mt-1"
                    required
                    maxLength={30}
                  />
                </div>

                <div>
                  <Label>Icône</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={newCategoryIcon}
                      onChange={(e) => setNewCategoryIcon(e.target.value)}
                      className="w-20"
                      maxLength={2}
                    />
                    <div className="flex flex-wrap gap-1 flex-1">
                      {commonEmojis.map(emoji => (
                        <Button
                          key={emoji}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-8 h-8 p-0"
                          onClick={() => setNewCategoryIcon(emoji)}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Couleur</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="color"
                      value={newCategoryColor}
                      onChange={(e) => setNewCategoryColor(e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      value={newCategoryColor}
                      onChange={(e) => setNewCategoryColor(e.target.value)}
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={addCategory.isPending}>
                  {addCategory.isPending ? "Ajout..." : "Créer la catégorie"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter une transaction
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
                            {cat.icon} {cat.name}
                          </SelectItem>
                        ))}
                      </>
                    )}
                    {expenseCategories.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Dépenses</div>
                        {expenseCategories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
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
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historique récent</CardTitle>
          <CardDescription>Vos 50 dernières transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher par catégorie, description ou montant..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            {filteredTransactions.length === 0 && searchQuery ? (
              <p className="text-center text-muted-foreground py-8">Aucune transaction trouvée pour "{searchQuery}"</p>
            ) : transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aucune transaction pour le moment</p>
            ) : (
              filteredTransactions.map((transaction: any) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{transaction.category?.icon}</div>
                    <div>
                      <div className="font-medium">{transaction.category?.name}</div>
                      {transaction.description && (
                        <div className="text-sm text-muted-foreground">{transaction.description}</div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {new Date(transaction.transaction_date).toLocaleDateString('fr-CA')}
                        {transaction.is_recurring && " • Récurrent"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatPrice(transaction.amount)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTransaction.mutate(transaction.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
