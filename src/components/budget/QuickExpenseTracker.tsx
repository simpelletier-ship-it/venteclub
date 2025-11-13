import { useState } from "react";
import { Plus, TrendingDown, Zap, Sparkles, Check, ChevronsUpDown, Settings, Pin, PinOff, GripVertical, Calendar as CalendarIcon, Pencil, Rocket } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TransactionTagManager } from "./TransactionTagManager";
import { formatPrice } from "@/lib/priceFormat";
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

const SortableCategoryItem = ({ 
  category, 
  onTogglePin,
  onEdit,
  isPending 
}: { 
  category: any, 
  onTogglePin: (params: { categoryId: string, isPinned: boolean }) => void,
  onEdit: (category: any) => void,
  isPending: boolean 
}) => {
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
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 rounded-lg border bg-card transition-colors"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      
      <div className="flex items-center gap-3 flex-1">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
          style={{ backgroundColor: category.color + '20' }}
        >
          {category.icon}
        </div>
        <div>
          <div className="font-medium">{category.name}</div>
          <div className="text-xs text-muted-foreground">
            {category.is_custom ? 'Personnalisée' : 'Par défaut'}
          </div>
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(category)}
        >
          <Pencil className="h-4 w-4 mr-1" />
          Modifier
        </Button>
        <Button
          variant={category.is_pinned ? "default" : "outline"}
          size="sm"
          onClick={() => onTogglePin({ categoryId: category.id, isPinned: category.is_pinned })}
          disabled={isPending}
        >
          {category.is_pinned ? (
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
    </div>
  );
};

export const QuickExpenseTracker = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const queryClient = useQueryClient();
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  const [editPinnedOpen, setEditPinnedOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("🍔");
  const [newCategoryColor, setNewCategoryColor] = useState("#3b82f6");
  const [transactionDate, setTransactionDate] = useState<Date>(new Date());
  const [editCategoryOpen, setEditCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['budget-categories', transactionType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_categories')
        .select('*')
        .eq('type', transactionType)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthenticated,
    retry: 1,
  });

  // Fetch unique descriptions for autocomplete
  const { data: previousDescriptions = [] } = useQuery({
    queryKey: ['transaction-descriptions', transactionType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_transactions')
        .select('description')
        .eq('type', transactionType)
        .not('description', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      // Get unique descriptions
      const unique = [...new Set(data.map(t => t.description))];
      return unique;
    },
    enabled: isAuthenticated,
    retry: 1,
  });

  // Fetch templates
  const { data: templates = [] } = useQuery({
    queryKey: ['transaction-templates', transactionType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transaction_templates')
        .select('*, category:budget_categories(*)')
        .eq('type', transactionType)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthenticated,
    retry: 1,
  });

  // Fetch tags for templates
  const { data: allTags = [] } = useQuery({
    queryKey: ['transaction-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transaction_tags')
        .select('*')
        .order('name');
      
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

  // Reorder pinned categories
  const reorderPinned = useMutation({
    mutationFn: async (updates: { id: string, display_order: number }[]) => {
      const promises = updates.map(({ id, display_order }) =>
        supabase
          .from('budget_categories')
          .update({ display_order })
          .eq('id', id)
      );
      
      const results = await Promise.all(promises);
      const error = results.find(r => r.error)?.error;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-categories'] });
    },
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex(c => c.id === active.id);
    const newIndex = categories.findIndex(c => c.id === over.id);

    const reordered = arrayMove(categories, oldIndex, newIndex);
    
    const updates = reordered.map((cat, index) => ({
      id: cat.id,
      display_order: index,
    }));

    reorderPinned.mutate(updates);
  };

  // Quick add mutation
  const quickAdd = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const categoryToUse = selectedCategory || suggestedCategory;
      if (!categoryToUse) throw new Error("Veuillez sélectionner une catégorie");

      const { data: transaction, error } = await supabase
        .from('budget_transactions')
        .insert({
          user_id: user.id,
          category_id: categoryToUse,
          amount: parseFloat(amount),
          description: description || null,
          transaction_date: format(transactionDate, 'yyyy-MM-dd'),
          type: transactionType,
        })
        .select()
        .single();

      if (error) throw error;

      // Add tag links if tags were selected
      if (selectedTags.length > 0 && transaction) {
        const tagLinks = selectedTags.map(tagId => ({
          transaction_id: transaction.id,
          tag_id: tagId,
        }));

        const { error: tagError } = await supabase
          .from('transaction_tag_links')
          .insert(tagLinks);

        if (tagError) {
          console.error("Error adding tags:", tagError);
          // Don't throw, transaction was successful
        }
      }
    },
    onSuccess: () => {
      // Invalider TOUTES les queries liées au budget pour synchronisation complète
      queryClient.invalidateQueries({ queryKey: ['budget-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['budget-transactions-all'] });
      queryClient.invalidateQueries({ queryKey: ['user-daily-streaks'] });
      queryClient.invalidateQueries({ queryKey: ['user-assets'] });
      queryClient.invalidateQueries({ queryKey: ['user-debts'] });
      queryClient.invalidateQueries({ queryKey: ['financial-goals'] });
      queryClient.invalidateQueries({ queryKey: ['asset-history'] });
      queryClient.invalidateQueries({ queryKey: ['debt-history'] });
      toast.success(transactionType === 'expense' ? "✅ Dépense ajoutée!" : "✅ Revenu ajouté!", { duration: 2000 });
      setAmount("");
      setDescription("");
      setSuggestedCategory(null);
      setSelectedCategory("");
      setSelectedTags([]);
      // Keep transactionDate for next transaction
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
          type: transactionType,
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

  // Update category mutation
  const updateCategory = useMutation({
    mutationFn: async (updates: { id: string, name: string, icon: string, color: string }) => {
      const { error } = await supabase
        .from('budget_categories')
        .update({
          name: updates.name.trim(),
          icon: updates.icon,
          color: updates.color,
        })
        .eq('id', updates.id);

      if (error) throw error;
      return updates;
    },
    onSuccess: (updates) => {
      queryClient.invalidateQueries({ queryKey: ['budget-categories'] });
      toast.success(`✅ Catégorie "${updates.name}" modifiée!`, { duration: 2000 });
      setEditCategoryOpen(false);
      setEditingCategory(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la modification");
    },
  });

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setEditCategoryOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingCategory) {
      updateCategory.mutate({
        id: editingCategory.id,
        name: editingCategory.name,
        icon: editingCategory.icon,
        color: editingCategory.color,
      });
    }
  };

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
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      toast.error("Le montant doit être supérieur à 0$");
      return;
    }
    quickAdd.mutate();
  };

  const applyTemplate = (template: any) => {
    setAmount(template.amount.toString());
    setDescription(template.description || "");
    setSelectedCategory(template.category_id);
    setSelectedTags(template.tag_ids || []);
    setTemplatesOpen(false);
    toast.success(`✨ Template "${template.name}" appliqué!`, { duration: 1500 });
  };

  // Get pinned categories (fallback to first 6 if none pinned)
  const pinnedCategories = categories.filter(c => c.is_pinned);
  const displayCategories = pinnedCategories.length > 0 ? pinnedCategories : categories.slice(0, 6);

  return (
    <Card className="shadow-lg" id="quick-expense-tracker">
       <CardHeader className="pb-4">
        <div className="flex items-center justify-between" id="transaction-type">
          <div>
            <CardTitle className="text-2xl">
              {transactionType === 'expense' ? '💸 Nouvelle dépense' : '💰 Nouveau revenu'}
            </CardTitle>
            <CardDescription className="text-base">
              {transactionType === 'expense' 
                ? 'Enregistrez rapidement votre achat' 
                : 'Enregistrez vos gains'}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={transactionType === 'expense' ? 'default' : 'outline'}
              size="lg"
              onClick={() => {
                setTransactionType('expense');
                setSelectedCategory("");
                setSuggestedCategory(null);
              }}
            >
              💸 Dépense
            </Button>
            <Button
              type="button"
              variant={transactionType === 'income' ? 'default' : 'outline'}
              size="lg"
              onClick={() => {
                setTransactionType('income');
                setSelectedCategory("");
                setSuggestedCategory(null);
              }}
            >
              💰 Revenu
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div id="amount-input">
            <Label className="text-base font-medium mb-2 block">
              💰 Combien?
            </Label>
            <div className="relative">
              <CurrencyInput 
                value={amount} 
                onChange={setAmount}
                placeholder="Entrez le montant"
                className="text-2xl h-14 font-bold pr-12"
              />
              {amount && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                  onClick={() => setAmount("")}
                  title="Effacer"
                >
                  ✕
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Le montant doit être supérieur à 0$</p>
          </div>
          
          <div id="category-buttons">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-base font-medium">
                📂 Pour quoi?
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditPinnedOpen(true)}
                className="h-8 px-2 text-xs"
              >
                <Settings className="h-3.5 w-3.5 mr-1" />
                Organiser
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Choisissez dans quelle catégorie classer cette dépense
            </p>
            
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
                <span className="text-lg mr-2">🔍</span>
                Autre catégorie...
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="Rechercher..." className="text-base" />
                <CommandList>
                  <CommandEmpty>Aucune catégorie trouvée.</CommandEmpty>
                  <CommandGroup>
                    {categories.map((cat: any) => (
                      <CommandItem
                        key={cat.id}
                        value={cat.name}
                        className="flex items-center justify-between cursor-pointer group"
                        onSelect={() => {
                          setSelectedCategory(cat.id);
                          setCategoryOpen(false);
                        }}
                      >
                        <div className="flex items-center flex-1">
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              (selectedCategory || suggestedCategory) === cat.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span className="mr-2 text-lg">{cat.icon}</span>
                          <span className="font-medium">{cat.name}</span>
                          {suggestedCategory === cat.id && !selectedCategory && (
                            <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Suggéré ✨</span>
                          )}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditCategory(cat);
                              setCategoryOpen(false);
                            }}
                            title="Modifier"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePin.mutate({ categoryId: cat.id, isPinned: cat.is_pinned });
                            }}
                            title={cat.is_pinned ? "Désépingler" : "Épingler"}
                          >
                            {cat.is_pinned ? (
                              <Pin className="h-3.5 w-3.5 fill-primary text-primary" />
                            ) : (
                              <PinOff className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
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
                      className="text-primary font-medium"
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

          <div id="date-picker">
            <Label className="text-base font-medium mb-2 block">
              📅 Quand?
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-11 justify-start text-left font-normal text-base",
                    !transactionDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  {transactionDate ? format(transactionDate, "d MMMM yyyy", { locale: fr }) : "Choisir la date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={transactionDate}
                  onSelect={(date) => date && setTransactionDate(date)}
                  initialFocus
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div id="description-input">
            <Label className="text-base font-medium mb-2 block">
              📝 Détails (facultatif)
            </Label>
            <div className="relative">
              <Input
                value={description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                onFocus={() => previousDescriptions.length > 0 && setDescriptionOpen(true)}
                placeholder="Ex: Épicerie IGA, Café Starbucks..."
                className="text-base h-11"
              />
              {previousDescriptions.length > 0 && (
                <Popover open={descriptionOpen} onOpenChange={setDescriptionOpen}>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandList>
                        <CommandEmpty>Aucune suggestion.</CommandEmpty>
                        <CommandGroup heading="💡 Descriptions récentes">
                          {previousDescriptions
                            .filter(desc => desc.toLowerCase().includes(description.toLowerCase()))
                            .slice(0, 10)
                            .map((desc) => (
                              <CommandItem
                                key={desc}
                                value={desc}
                                onSelect={(value) => {
                                  setDescription(value);
                                  handleDescriptionChange(value);
                                  setDescriptionOpen(false);
                                }}
                                className="text-base cursor-pointer"
                              >
                                {desc}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </div>
            {suggestedCategory && (
              <div className="text-sm bg-primary/10 text-primary px-3 py-2 rounded-lg mt-2 flex items-center gap-2">
                <span className="text-lg">✨</span>
                <span className="font-medium">
                  Suggestion: {categories.find(c => c.id === suggestedCategory)?.name}
                </span>
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              Ajoutez plus de détails pour mieux suivre vos dépenses
            </p>
          </div>

          {/* Transaction Tags */}
          <TransactionTagManager 
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
          />

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
                  Glissez pour réorganiser • Cliquez pour épingler/désépingler
                </DialogDescription>
              </DialogHeader>
              
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={categories.map(c => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 py-4">
                     {categories.map((cat: any) => (
                      <SortableCategoryItem 
                        key={cat.id} 
                        category={cat} 
                        onTogglePin={togglePin.mutate}
                        onEdit={handleEditCategory}
                        isPending={togglePin.isPending}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <Button 
                onClick={() => setEditPinnedOpen(false)}
                className="w-full"
              >
                Terminé
              </Button>
            </DialogContent>
          </Dialog>

          {/* Dialog for editing a category */}
          <Dialog open={editCategoryOpen} onOpenChange={setEditCategoryOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Pencil className="h-5 w-5 text-primary" />
                  Modifier la catégorie
                </DialogTitle>
                <DialogDescription>
                  Personnalisez le nom, l'icône et la couleur
                </DialogDescription>
              </DialogHeader>
              
              {editingCategory && (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nom de la catégorie</Label>
                    <Input
                      value={editingCategory.name}
                      onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
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
                          variant={editingCategory.icon === emoji ? "default" : "outline"}
                          className="h-10 w-10 p-0 text-xl"
                          onClick={() => setEditingCategory({ ...editingCategory, icon: emoji })}
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
                          onClick={() => setEditingCategory({ ...editingCategory, color })}
                        >
                          <div 
                            className="absolute inset-1 rounded"
                            style={{ backgroundColor: color }}
                          />
                          {editingCategory.color === color && (
                            <span className="absolute inset-0 flex items-center justify-center text-white">✓</span>
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <Button 
                onClick={handleSaveEdit}
                disabled={updateCategory.isPending || !editingCategory?.name?.trim()}
                className="w-full"
              >
                {updateCategory.isPending ? "Enregistrement..." : "Enregistrer les modifications"}
              </Button>
            </DialogContent>
          </Dialog>

          {/* Templates Dropdown */}
          {templates.length > 0 && (
            <Popover open={templatesOpen} onOpenChange={setTemplatesOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-12 mb-2"
                  type="button"
                >
                  <Rocket className="h-4 w-4 mr-2" />
                  Utiliser un template ({templates.length})
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="center">
                <Command>
                  <CommandInput placeholder="Rechercher un template..." />
                  <CommandList>
                    <CommandEmpty>Aucun template trouvé.</CommandEmpty>
                    <CommandGroup heading="Templates disponibles">
                      {templates.map((template: any) => (
                        <CommandItem
                          key={template.id}
                          value={template.name}
                          onSelect={() => applyTemplate(template)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0"
                              style={{ backgroundColor: template.category?.color + '20' }}
                            >
                              {template.category?.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{template.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {template.category?.name} • {formatPrice(template.amount)}
                              </div>
                              {template.tag_ids && template.tag_ids.length > 0 && (
                                <div className="flex gap-1 mt-1 flex-wrap">
                                  {template.tag_ids.slice(0, 3).map((tagId: string) => {
                                    const tag = allTags.find(t => t.id === tagId);
                                    if (!tag) return null;
                                    return (
                                      <span key={tagId} className="text-xs">
                                        {tag.icon}
                                      </span>
                                    );
                                  })}
                                  {template.tag_ids.length > 3 && (
                                    <span className="text-xs text-muted-foreground">+{template.tag_ids.length - 3}</span>
                                  )}
                                </div>
                              )}
                            </div>
                            <Zap className="h-4 w-4 text-primary shrink-0" />
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}

          <Button 
            id="add-button"
            className="w-full h-14 text-lg font-semibold"
            onClick={handleQuickAdd}
            disabled={quickAdd.isPending || !amount || parseFloat(amount) <= 0}
            size="lg"
          >
            {quickAdd.isPending ? "⏳ Ajout en cours..." : transactionType === 'income' ? "✅ Ajouter le revenu" : "✅ Ajouter la dépense"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
