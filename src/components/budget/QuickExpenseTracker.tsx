import { useState } from "react";
import { Plus, TrendingDown, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencyInput } from "@/components/CurrencyInput";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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

export const QuickExpenseTracker = () => {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("");

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
      return data;
    },
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
