import { useState } from "react";
import { Plus, TrendingDown, Zap, Sparkles, Check, ChevronsUpDown, Settings, Pin, PinOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
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
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  const [editPinnedOpen, setEditPinnedOpen] = useState(false);
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
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthenticated,
    retry: 1,
  });

  // Toggle pin mutation
  const togglePin = useMutation({
    mutationFn: async ({ categoryId, isPinned }: { categoryId: string, isPinned: boolean }) => {
      const { error } = await supabase
        .from('budget_categories')
        .update({ is_pinned: !isPinned })
        .eq('id', categoryId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-categories'] });
      toast.success("✅ Catégories mises à jour!", { duration: 1500 });
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

  // Get pinned categories (fallback to first 6 if none pinned)
  const pinnedCategories = categories.filter(c => c.is_pinned);
  const displayCategories = pinnedCategories.length > 0 ? pinnedCategories : categories.slice(0, 6);

  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">💸 Ajouter une dépense</CardTitle>
        <CardDescription className="text-base">Simple et rapide</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium mb-2 block">Montant</Label>
            <CurrencyInput 
              value={amount} 
              onChange={setAmount}
              placeholder="0 $"
              className="text-2xl h-14 font-bold"
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-base font-medium">Catégorie</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditPinnedOpen(true)}
                className="h-8 px-2 text-xs"
              >
                <Settings className="h-3.5 w-3.5 mr-1" />
                Modifier
              </Button>
            </div>
            
            {/* Pinned categories as large buttons */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {displayCategories.map((cat: any) => (
                <Button
                  key={cat.id}
                  type="button"
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  className="h-16 flex flex-col gap-1 text-sm"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-xs">{cat.name}</span>
                </Button>
              ))}
            </div>

            {/* More categories dropdown */}
            <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full h-11"
              >
                Autre catégorie...
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Rechercher une catégorie..." />
                <CommandList>
                  <CommandEmpty>Aucune catégorie trouvée.</CommandEmpty>
                  <CommandGroup>
                    {categories.map((cat: any) => (
                      <CommandItem
                        key={cat.id}
                        value={cat.name}
                        onSelect={() => {
                          setSelectedCategory(cat.id);
                          setCategoryOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            (selectedCategory || suggestedCategory) === cat.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <span className="mr-2">{cat.icon}</span>
                        {cat.name}
                        {suggestedCategory === cat.id && !selectedCategory && (
                          <span className="ml-auto text-xs text-muted-foreground">Suggérée</span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setCategoryOpen(false);
                        setNewCategoryOpen(true);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Créer une nouvelle catégorie
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          </div>
          
          <div>
            <Label className="text-base font-medium mb-2 block">Description (optionnel)</Label>
            <Input
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Ex: Épicerie, Café..."
              className="h-11"
            />
            {suggestedCategory && (
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                💡 {categories.find(c => c.id === suggestedCategory)?.name}
              </p>
            )}
          </div>

          {/* Dialog for creating new category */}
          <Dialog open={newCategoryOpen} onOpenChange={setNewCategoryOpen}>
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

          {/* Dialog for editing pinned categories */}
          <Dialog open={editPinnedOpen} onOpenChange={setEditPinnedOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Pin className="h-5 w-5 text-primary" />
                  Personnaliser les catégories rapides
                </DialogTitle>
                <DialogDescription>
                  Épinglez vos catégories favorites pour y accéder rapidement
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-2 py-4">
                {categories.map((cat: any) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                        style={{ backgroundColor: cat.color + '20' }}
                      >
                        {cat.icon}
                      </div>
                      <div>
                        <div className="font-medium">{cat.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {cat.is_custom ? 'Personnalisée' : 'Par défaut'}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant={cat.is_pinned ? "default" : "outline"}
                      size="sm"
                      onClick={() => togglePin.mutate({ categoryId: cat.id, isPinned: cat.is_pinned })}
                      disabled={togglePin.isPending}
                    >
                      {cat.is_pinned ? (
                        <>
                          <Pin className="h-4 w-4 mr-1" />
                          Épinglée
                        </>
                      ) : (
                        <>
                          <PinOff className="h-4 w-4 mr-1" />
                          Épingler
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>

              <Button 
                onClick={() => setEditPinnedOpen(false)}
                className="w-full"
              >
                Terminé
              </Button>
            </DialogContent>
          </Dialog>

          <Button 
            className="w-full h-14 text-lg font-semibold"
            onClick={handleQuickAdd}
            disabled={quickAdd.isPending}
            size="lg"
          >
            {quickAdd.isPending ? "⏳ Ajout en cours..." : "✅ Ajouter la dépense"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
