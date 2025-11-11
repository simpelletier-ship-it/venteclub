import { useState } from "react";
import { Plus, TrendingDown, Zap, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/CurrencyInput";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const EMOJI_OPTIONS = ['🍔', '🚗', '🏠', '💡', '🎮', '👕', '📱', '💊', '🎓', '✈️', '🎬', '☕', '🛒', '🏋️', '📚'];
const COLOR_OPTIONS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'];

// AI-powered category suggestions based on description
const suggestCategory = (description: string, categories: any[]) => {
  const desc = description.toLowerCase();
  
  // Keywords mapping
  const keywords: Record<string, string[]> = {
    'Alimentation': ['épicerie', 'grocery', 'supermarché', 'iga', 'metro', 'costco', 'provigo', 'maxi'],
    'Transport': ['essence', 'gas', 'uber', 'taxi', 'bus', 'metro', 'stm', 'bixi', 'parking'],
    'Divertissement': ['cinéma', 'movie', 'concert', 'bar', 'club', 'spotify', 'netflix'],
    'Logement': ['loyer', 'rent', 'hypothèque', 'mortgage', 'hydro', 'électricité'],
    'Santé': ['pharmacie', 'pharmacy', 'médecin', 'doctor', 'dentiste', 'gym'],
  };

  for (const [categoryName, keywordList] of Object.entries(keywords)) {
    if (keywordList.some(keyword => desc.includes(keyword))) {
      return categories.find(c => c.name === categoryName)?.id;
    }
  }
  
  return null;
};

export const QuickExpenseTracker = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("🍔");
  const [newCategoryColor, setNewCategoryColor] = useState("#3b82f6");

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['budget-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_categories')
        .select('*')
        .eq('type', 'expense')
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthenticated,
    retry: 1,
  });

  // Quick add mutation
  const quickAdd = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const categoryToUse = selectedCategory || suggestedCategory;
      if (!categoryToUse) throw new Error("Veuillez sélectionner une catégorie");

      const { error } = await supabase
        .from('budget_transactions')
        .insert({
          user_id: user.id,
          category_id: categoryToUse,
          amount: parseFloat(amount),
          description: description || null,
          transaction_date: new Date().toISOString().split('T')[0],
          type: 'expense',
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['user-daily-streaks'] });
      toast.success("✅ Dépense ajoutée!", { duration: 2000 });
      setAmount("");
      setDescription("");
      setSuggestedCategory(null);
      setSelectedCategory("");
    },
  });

  // Create new category mutation
  const createCategory = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      if (!newCategoryName.trim()) throw new Error("Le nom est requis");

      const { data, error } = await supabase
        .from('budget_categories')
        .insert({
          user_id: user.id,
          name: newCategoryName.trim(),
          icon: newCategoryIcon,
          color: newCategoryColor,
          type: 'expense',
          is_custom: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (newCategory) => {
      queryClient.invalidateQueries({ queryKey: ['budget-categories'] });
      toast.success(`✨ Catégorie "${newCategory.name}" créée!`, { duration: 2000 });
      setSelectedCategory(newCategory.id);
      setNewCategoryOpen(false);
      setNewCategoryName("");
      setNewCategoryIcon("🍔");
      setNewCategoryColor("#3b82f6");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la création");
    },
  });

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    if (value.length >= 3) {
      const suggested = suggestCategory(value, categories);
      setSuggestedCategory(suggested);
    } else {
      setSuggestedCategory(null);
    }
  };

  const handleQuickAdd = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Entrez un montant valide");
      return;
    }
    quickAdd.mutate();
  };

  return (
    <Card className="border-2 border-primary/20 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-primary" />
          Ajout Rapide
        </CardTitle>
        <CardDescription>Enregistrez une dépense en quelques secondes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <CurrencyInput 
              value={amount} 
              onChange={setAmount}
              placeholder="Montant"
              className="text-lg h-12"
            />
          </div>
          
          <div>
            <Input
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Description (optionnel, ex: Café Starbucks)"
              className="h-11"
            />
            {suggestedCategory && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                💡 Suggestion: {categories.find(c => c.id === suggestedCategory)?.name}
              </p>
            )}
          </div>

          <Select 
            value={selectedCategory || suggestedCategory || ""} 
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder={suggestedCategory ? "✓ Catégorie suggérée" : "Catégorie"} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat: any) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </SelectItem>
              ))}
              <Dialog open={newCategoryOpen} onOpenChange={setNewCategoryOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start mt-2 border-t">
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle catégorie
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Créer une catégorie
                    </DialogTitle>
                    <DialogDescription>
                      Ajoutez une nouvelle catégorie personnalisée
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Nom de la catégorie</Label>
                      <Input
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Ex: Restaurant, Essence..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Icône</Label>
                      <div className="grid grid-cols-8 gap-2">
                        {EMOJI_OPTIONS.map((emoji) => (
                          <Button
                            key={emoji}
                            type="button"
                            variant={newCategoryIcon === emoji ? "default" : "outline"}
                            className="h-10 w-10 p-0 text-xl"
                            onClick={() => setNewCategoryIcon(emoji)}
                          >
                            {emoji}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Couleur</Label>
                      <div className="grid grid-cols-8 gap-2">
                        {COLOR_OPTIONS.map((color) => (
                          <Button
                            key={color}
                            type="button"
                            variant="outline"
                            className="h-10 w-10 p-0 relative"
                            onClick={() => setNewCategoryColor(color)}
                          >
                            <div 
                              className="absolute inset-1 rounded"
                              style={{ backgroundColor: color }}
                            />
                            {newCategoryColor === color && (
                              <span className="absolute inset-0 flex items-center justify-center text-white">✓</span>
                            )}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={() => createCategory.mutate()}
                    disabled={createCategory.isPending || !newCategoryName.trim()}
                    className="w-full"
                  >
                    {createCategory.isPending ? "Création..." : "Créer la catégorie"}
                  </Button>
                </DialogContent>
              </Dialog>
            </SelectContent>
          </Select>

          <Button 
            className="w-full h-12 text-base"
            onClick={handleQuickAdd}
            disabled={quickAdd.isPending}
          >
            <Plus className="mr-2 h-5 w-5" />
            {quickAdd.isPending ? "Ajout..." : "Ajouter"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
