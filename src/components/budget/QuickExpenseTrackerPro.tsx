import { useState } from "react";
import { Check, Settings, Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export const QuickExpenseTracker = ({ isAuthenticated }: QuickExpenseTrackerProps) => {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  
  const queryClient = useQueryClient();
  const { addOfflineTransaction } = useOfflineSync(isAuthenticated);

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

  const filteredCategories = categories.filter(c => c.type === transactionType);

  const addMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('budget_transactions')
        .insert({
          amount: parseFloat(amount),
          category_id: selectedCategoryId,
          description: description || null,
          transaction_date: format(selectedDate, 'yyyy-MM-dd'),
          type: transactionType,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['budget-transactions-all'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-summary-transactions'] });
      
      toast.success(`✓ ${transactionType === 'expense' ? 'Dépense' : 'Revenu'} ajouté`, {
        description: `${amount} $ • ${filteredCategories.find(c => c.id === selectedCategoryId)?.name}`,
        duration: 2000,
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
        
        toast.success('📱 Transaction enregistrée hors ligne');
        setAmount("");
        setDescription("");
        setSelectedCategoryId("");
      } else {
        toast.error('❌ Erreur');
      }
    },
  });

  const handleSubmit = () => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      toast.error("Montant invalide");
      return;
    }
    if (!selectedCategoryId) {
      toast.error("Choisir une catégorie");
      return;
    }
    addMutation.mutate();
  };

  return (
    <Card className="border-0 shadow-lg bg-card overflow-hidden">
      <CardHeader className="pb-4 space-y-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">
            {transactionType === 'expense' ? '💸 Entrez vos dépenses' : '💰 Entrez vos revenus'}
          </CardTitle>
          <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
            <Button
              variant={transactionType === 'expense' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => { setTransactionType('expense'); setSelectedCategoryId(''); }}
              className="rounded-md transition-all text-sm h-8"
            >
              Dépense
            </Button>
            <Button
              variant={transactionType === 'income' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => { setTransactionType('income'); setSelectedCategoryId(''); }}
              className="rounded-md transition-all text-sm h-8"
            >
              Revenu
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">
              Montant
            </Label>
            <CurrencyInput
              id="amount"
              value={amount}
              onChange={setAmount}
              placeholder="0 $"
              className="text-2xl font-light h-12 rounded-lg"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left h-12 font-normal rounded-lg"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, "d MMM yyyy", { locale: fr })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} initialFocus className="pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Catégorie</Label>
            <Dialog open={showCategoryManager} onOpenChange={setShowCategoryManager}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-xs"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Gérer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Gérer les catégories</DialogTitle>
                  <DialogDescription>Organisez vos catégories</DialogDescription>
                </DialogHeader>
                <CategoryManager isAuthenticated={isAuthenticated} />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {filteredCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategoryId(category.id)}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                  selectedCategoryId === category.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-muted/30 hover:border-primary/50'
                }`}
              >
                <span className="text-2xl">{category.icon}</span>
                <span className="text-xs font-medium text-center line-clamp-1">{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium">
            Description <span className="text-xs text-muted-foreground">(optionnel)</span>
          </Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              const suggestedId = suggestCategory(e.target.value, filteredCategories);
              if (suggestedId && !selectedCategoryId) setSelectedCategoryId(suggestedId);
            }}
            placeholder="Ex: Épicerie, Restaurant, Essence..."
            className="h-10 rounded-lg"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={addMutation.isPending || !amount || amount === '0'}
          className="w-full h-11 text-base font-medium gap-2 rounded-lg"
        >
          {addMutation.isPending ? (
            <>
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Ajout...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Ajouter
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
