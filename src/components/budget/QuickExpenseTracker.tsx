import { useState } from "react";
import { Plus, TrendingDown, Zap, Sparkles, Check, ChevronsUpDown, Settings, Pin, PinOff, GripVertical, Calendar as CalendarIcon, Pencil, Rocket, X, DollarSign, FolderOpen, Search, Wallet, Banknote } from "lucide-react";
import { CategoryIcon, ICON_MAP } from "./CategoryIcon";
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
import { formatPrice } from "@/lib/priceFormat";
import { useOfflineSync } from "@/hooks/useOfflineSync";
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

// Professional Lucide icon options for categories
const ICON_OPTIONS = [
  'utensils', 'car', 'home', 'lightbulb', 'gamepad-2', 'shirt', 'smartphone', 'pill',
  'graduation-cap', 'plane', 'film', 'coffee', 'shopping-cart', 'dumbbell', 'book',
  'heart-pulse', 'gift', 'paw-print', 'sparkles', 'box', 'briefcase', 'banknote',
  'trending-up', 'coins', 'building', 'wifi', 'tv', 'music', 'beer', 'baby'
];
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
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: category.color + '20' }}
        >
          <CategoryIcon icon={category.icon} color={category.color} size="lg" />
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
  const [newCategoryIcon, setNewCategoryIcon] = useState("utensils");
  const [newCategoryColor, setNewCategoryColor] = useState("#3b82f6");
  const [transactionDate, setTransactionDate] = useState<Date>(new Date());
  const [editCategoryOpen, setEditCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  // Offline sync hook
  const { isOnline, addOfflineTransaction } = useOfflineSync(isAuthenticated);

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
      const categoryToUse = selectedCategory || suggestedCategory;
      if (!categoryToUse) throw new Error("Veuillez sélectionner une catégorie");

      const amountValue = parseFloat(amount);
      if (isNaN(amountValue) || amountValue <= 0) {
        throw new Error("Veuillez saisir un montant supérieur à 0");
      }
      
      if (!transactionDate) {
        throw new Error("Veuillez sélectionner une date");
      }

      // If offline, save locally
      if (!isOnline) {
        await addOfflineTransaction({
          amount: amountValue,
          description: description || '',
          category_id: categoryToUse,
          type: transactionType,
          transaction_date: format(transactionDate, 'yyyy-MM-dd'),
        });
        return;
      }

      // If online, proceed with normal Supabase insert
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data: transaction, error } = await supabase
        .from('budget_transactions')
        .insert({
          user_id: user.id,
          category_id: categoryToUse,
          amount: amountValue,
          description: description || null,
          transaction_date: format(transactionDate, 'yyyy-MM-dd'),
          type: transactionType,
        })
        .select()
        .single();

      if (error) throw error;
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
      
      if (isOnline) {
        toast.success(transactionType === 'expense' ? "✅ Dépense ajoutée!" : "✅ Revenu ajouté!", { duration: 2000 });
      } else {
        toast.success(
          transactionType === 'expense' 
            ? "💾 Dépense enregistrée hors ligne - Sera synchronisée à la reconnexion" 
            : "💾 Revenu enregistré hors ligne - Sera synchronisé à la reconnexion", 
          { duration: 3000 }
        );
      }
      
      setAmount("");
      setDescription("");
      setSuggestedCategory(null);
      setSelectedCategory("");
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
      setNewCategoryIcon("utensils");
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
    // Validation détaillée avec messages spécifiques
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      toast.error("⚠️ Veuillez saisir un montant supérieur à 0$");
      return;
    }
    
    const categoryToUse = selectedCategory || suggestedCategory;
    if (!categoryToUse) {
      toast.error("⚠️ Veuillez sélectionner une catégorie");
      return;
    }
    
    if (!transactionDate) {
      toast.error("⚠️ Veuillez sélectionner une date");
      return;
    }
    
    quickAdd.mutate();
  };

  const applyTemplate = (template: any) => {
    setAmount(template.amount.toString());
    setDescription(template.description || "");
    setSelectedCategory(template.category_id);
    setTemplatesOpen(false);
    toast.success(`✨ Template "${template.name}" appliqué!`, { duration: 1500 });
  };

  // Get pinned categories (fallback to first 6 if none pinned)
  const pinnedCategories = categories.filter(c => c.is_pinned);
  const displayCategories = pinnedCategories.length > 0 ? pinnedCategories : categories.slice(0, 6);

  return (
    <Card className="shadow-lg" id="quick-expense-tracker">
       <CardHeader className="pb-2 pt-4">
        <div className="flex items-center justify-between" id="transaction-type">
          <CardTitle className="text-xl flex items-center gap-2">
            {transactionType === 'expense' ? (
              <><TrendingDown className="h-5 w-5 text-destructive" /> Nouvelle dépense</>
            ) : (
              <><Banknote className="h-5 w-5 text-success" /> Nouveau revenu</>
            )}
          </CardTitle>
          <div className="flex gap-1.5">
            <Button
              type="button"
              variant={transactionType === 'expense' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setTransactionType('expense');
                setSelectedCategory("");
                setSuggestedCategory(null);
              }}
              className="gap-1.5"
            >
              <TrendingDown className="h-4 w-4" />
              Dépense
            </Button>
            <Button
              type="button"
              variant={transactionType === 'income' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setTransactionType('income');
                setSelectedCategory("");
                setSuggestedCategory(null);
              }}
              className="gap-1.5"
            >
              <Banknote className="h-4 w-4" />
              Revenu
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="space-y-2.5">
          <div id="amount-input">
            <Label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Combien?
            </Label>
            <div className="relative">
              <CurrencyInput 
                value={amount} 
                onChange={setAmount}
                placeholder="Entrez le montant"
                className="text-xl h-11 font-bold pr-12"
              />
              {amount && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setAmount("")}
                  title="Effacer"
                >
                  ✕
                </Button>
              )}
            </div>
          </div>
          
          <div id="category-buttons">
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                Pour quoi?
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditPinnedOpen(true)}
                className="h-7 px-2 text-xs"
              >
                <Settings className="h-3 w-3 mr-1" />
                Organiser
              </Button>
            </div>
            
            {/* Pinned categories as large buttons */}
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              {displayCategories.map((cat: any) => (
                <Button
                  key={cat.id}
                  type="button"
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  className="h-14 flex flex-col gap-1 text-sm p-1"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <div className="w-6 h-6 flex items-center justify-center">
                    <CategoryIcon icon={cat.icon} color={selectedCategory === cat.id ? undefined : cat.color} size="lg" />
                  </div>
                  <span className="text-[10px] leading-tight">{cat.name}</span>
                </Button>
              ))}
            </div>

            {/* More categories dropdown */}
            <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full h-9 text-sm gap-1.5"
              >
                <Search className="h-4 w-4" />
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
                          <div className="mr-2 w-5 h-5 flex items-center justify-center">
                            <CategoryIcon icon={cat.icon} color={cat.color} size="md" />
                          </div>
                          <span className="font-medium">{cat.name}</span>
                          {suggestedCategory === cat.id && !selectedCategory && (
                            <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Sparkles className="h-3 w-3" /> Suggéré
                            </span>
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
            <Label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              Quand?
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-9 justify-start text-left font-normal text-sm",
                    !transactionDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
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
            <Label className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
              <Pencil className="h-4 w-4 text-muted-foreground" />
              Détails (facultatif)
            </Label>
            <div className="relative">
              <Input
                value={description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                onFocus={() => previousDescriptions.length > 0 && setDescriptionOpen(true)}
                placeholder={transactionType === 'expense' 
                  ? "Ex: Épicerie IGA, Café Starbucks..." 
                  : "Ex: Salaire, Bonus, Intérêts..."}
                className="text-sm h-9"
              />
              {previousDescriptions.length > 0 && (
                <Popover open={descriptionOpen} onOpenChange={setDescriptionOpen}>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandList>
                        <CommandEmpty>Aucune suggestion.</CommandEmpty>
                        <CommandGroup heading="Descriptions récentes">
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
              <div className="text-xs bg-primary/10 text-primary px-2 py-1.5 rounded-md mt-1.5 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                <span className="font-medium">
                  {categories.find(c => c.id === suggestedCategory)?.name}
                </span>
              </div>
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
                  <div className="grid grid-cols-6 gap-2">
                    {ICON_OPTIONS.map((iconKey) => (
                      <Button
                        key={iconKey}
                        type="button"
                        variant={newCategoryIcon === iconKey ? "default" : "outline"}
                        className="h-10 w-10 p-0 flex items-center justify-center"
                        onClick={() => setNewCategoryIcon(iconKey)}
                      >
                        <CategoryIcon icon={iconKey} size="md" />
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
                    <div className="grid grid-cols-6 gap-2">
                      {ICON_OPTIONS.map((iconKey) => (
                        <Button
                          key={iconKey}
                          type="button"
                          variant={editingCategory.icon === iconKey ? "default" : "outline"}
                          className="h-10 w-10 p-0 flex items-center justify-center"
                          onClick={() => setEditingCategory({ ...editingCategory, icon: iconKey })}
                        >
                          <CategoryIcon icon={iconKey} size="md" />
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
                  className="w-full h-8 text-xs"
                  type="button"
                >
                  <Rocket className="h-3.5 w-3.5 mr-1.5" />
                  Templates ({templates.length})
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
            className={cn(
              "w-full h-11 text-base font-bold mt-1",
              transactionType === 'income' 
                ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                : "bg-rose-500 hover:bg-rose-600 text-white"
            )}
            onClick={handleQuickAdd}
            disabled={quickAdd.isPending || !amount || parseFloat(amount) <= 0}
            size="default"
          >
            {quickAdd.isPending ? "⏳ Ajout..." : transactionType === 'income' ? "✅ Ajouter le revenu" : "✅ Ajouter la dépense"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
