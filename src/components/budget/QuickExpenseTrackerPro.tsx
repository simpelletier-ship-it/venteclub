import { useState } from "react";
import { Check, Settings, Calendar as CalendarIcon, Plus, Minus, X, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { CategoryManager } from "./CategoryManager";
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
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface QuickExpenseTrackerProps {
  isAuthenticated: boolean;
}

const suggestCategory = (description: string, categories: any[]) => {
  const desc = description.toLowerCase();
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

// Sortable Category Item Component
const SortableCategoryItem = ({ 
  category, 
  isSelected, 
  onSelect, 
  onHide,
  isEditMode 
}: { 
  category: any; 
  isSelected: boolean; 
  onSelect: () => void;
  onHide: () => void;
  isEditMode: boolean;
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
      className="relative"
    >
      {isEditMode && (
        <>
          <button
            onClick={onHide}
            className="absolute -top-1 -right-1 z-10 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-sm hover:bg-red-600 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
          <div
            {...attributes}
            {...listeners}
            className="absolute -top-1 -left-1 z-10 w-5 h-5 rounded-full bg-muted text-muted-foreground flex items-center justify-center cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-3 w-3" />
          </div>
        </>
      )}
      <button
        type="button"
        onClick={onSelect}
        disabled={isEditMode}
        className={cn(
          "w-full flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all",
          isSelected
            ? "bg-primary/10 ring-2 ring-primary"
            : "bg-muted/30 hover:bg-muted/50",
          isEditMode && "pointer-events-none"
        )}
      >
        <span className="text-2xl">{category.icon}</span>
        <span className="text-[10px] font-medium text-center line-clamp-1 text-muted-foreground">
          {category.name}
        </span>
      </button>
    </div>
  );
};

export const QuickExpenseTracker = ({ isAuthenticated }: QuickExpenseTrackerProps) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const queryClient = useQueryClient();
  const { addOfflineTransaction } = useOfflineSync(isAuthenticated);

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
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthenticated,
  });

  const filteredCategories = categories.filter(c => c.type === transactionType && !c.is_hidden);

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const { error } = await supabase
        .from('budget_categories')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-categories'] });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = filteredCategories.findIndex(c => c.id === active.id);
      const newIndex = filteredCategories.findIndex(c => c.id === over.id);
      
      const newOrder = arrayMove(filteredCategories, oldIndex, newIndex);
      
      // Update display_order for all reordered categories
      newOrder.forEach((cat, index) => {
        updateCategoryMutation.mutate({
          id: cat.id,
          updates: { display_order: index }
        });
      });
    }
  };

  const handleHideCategory = (categoryId: string) => {
    updateCategoryMutation.mutate({
      id: categoryId,
      updates: { is_hidden: true }
    });
    toast.success("Catégorie masquée", {
      description: "Réactivez-la dans les paramètres"
    });
  };

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('budget_transactions')
        .insert({
          amount: parseFloat(amount),
          category_id: selectedCategoryId,
          description: description || null,
          transaction_date: format(selectedDate, 'yyyy-MM-dd'),
          type: transactionType,
          user_id: user?.id,
        } as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['budget-transactions-all'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-summary-transactions'] });
      
      const categoryName = filteredCategories.find(c => c.id === selectedCategoryId)?.name;
      toast.success(transactionType === 'expense' ? 'Dépense ajoutée' : 'Revenu ajouté', {
        description: `${amount} $ • ${categoryName}`,
      });
      
      setAmount("");
      setDescription("");
      setSelectedCategoryId("");
    },
    onError: (error) => {
      if (navigator.onLine === false) {
        addOfflineTransaction({
          amount: parseFloat(amount),
          category_id: selectedCategoryId,
          description: description || null,
          transaction_date: format(selectedDate, 'yyyy-MM-dd'),
          type: transactionType,
        });
        
        toast.success('Enregistré hors ligne');
        setAmount("");
        setDescription("");
        setSelectedCategoryId("");
      } else {
        console.error('Erreur ajout transaction', error);
        toast.error("Erreur lors de l'enregistrement");
      }
    },
  });

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      toast.error("Entrez un montant valide");
      return;
    }
    if (!selectedCategoryId) {
      toast.error("Sélectionnez une catégorie");
      return;
    }
    if (!user?.id) {
      toast.error("Connectez-vous");
      return;
    }
    addMutation.mutate();
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      {/* Type Toggle */}
      <div className="flex items-center justify-center gap-1 p-1 bg-muted/50 rounded-xl mb-6 max-w-xs mx-auto">
        <button
          onClick={() => { setTransactionType('expense'); setSelectedCategoryId(''); }}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all",
            transactionType === 'expense' 
              ? "bg-red-500 text-white shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Minus className="h-4 w-4" />
          Dépense
        </button>
        <button
          onClick={() => { setTransactionType('income'); setSelectedCategoryId(''); }}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all",
            transactionType === 'income' 
              ? "bg-emerald-500 text-white shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Plus className="h-4 w-4" />
          Revenu
        </button>
      </div>

      {/* Amount Input - Prominent with decimals support */}
      <div className="text-center mb-6">
        <CurrencyInput
          value={amount}
          onChange={setAmount}
          allowDecimals={true}
          placeholder="0,00"
          className="text-4xl lg:text-5xl font-light h-16 text-center border-0 bg-transparent focus:ring-0 focus-visible:ring-0 placeholder:text-muted-foreground/30"
        />
      </div>

      {/* Date Selector */}
      <div className="flex justify-center mb-6">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full px-4 h-9 text-sm font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {format(selectedDate, "d MMMM", { locale: fr })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar 
              mode="single" 
              selected={selectedDate} 
              onSelect={(date) => date && setSelectedDate(date)} 
              initialFocus 
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Categories Grid with Drag & Drop */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <Label className="text-sm font-medium text-muted-foreground">Catégorie</Label>
          <div className="flex gap-2">
            <Button
              variant={isEditMode ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setIsEditMode(!isEditMode)}
            >
              {isEditMode ? "Terminé" : "Réorganiser"}
            </Button>
            <Dialog open={showCategoryManager} onOpenChange={setShowCategoryManager}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">
                  <Settings className="h-3 w-3 mr-1" />
                  Gérer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Gérer les catégories</DialogTitle>
                  <DialogDescription>Organisez vos catégories de transactions</DialogDescription>
                </DialogHeader>
                <CategoryManager isAuthenticated={isAuthenticated} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredCategories.map(c => c.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-2">
              {filteredCategories.slice(0, 12).map((category) => (
                <SortableCategoryItem
                  key={category.id}
                  category={category}
                  isSelected={selectedCategoryId === category.id}
                  onSelect={() => setSelectedCategoryId(category.id)}
                  onHide={() => handleHideCategory(category.id)}
                  isEditMode={isEditMode}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        
        {isEditMode && (
          <p className="text-xs text-muted-foreground text-center mt-3">
            Glissez pour réorganiser • Cliquez sur X pour masquer
          </p>
        )}
      </div>

      {/* Description Input */}
      <div className="mb-6">
        <Input
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            const suggestedId = suggestCategory(e.target.value, filteredCategories);
            if (suggestedId && !selectedCategoryId) setSelectedCategoryId(suggestedId);
          }}
          placeholder="Description (optionnel)"
          className="h-11 rounded-xl bg-muted/30 border-0 focus-visible:ring-1"
        />
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={addMutation.isPending || !amount || amount === '0' || !selectedCategoryId}
        className={cn(
          "w-full h-12 text-base font-medium rounded-xl transition-all",
          transactionType === 'expense' 
            ? "bg-red-500 hover:bg-red-600" 
            : "bg-emerald-500 hover:bg-emerald-600"
        )}
      >
        {addMutation.isPending ? (
          <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <Check className="h-5 w-5 mr-2" />
            {transactionType === 'expense' ? 'Ajouter la dépense' : 'Ajouter le revenu'}
          </>
        )}
      </Button>
    </div>
  );
};
