import { useState } from "react";
import { Check, ChevronsUpDown, Settings, Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
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
  const [openCategory, setOpenCategory] = useState(false);
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  
  const queryClient = useQueryClient();
  const { addOfflineTransaction } = useOfflineSync(
    queryClient,
    () => queryClient.invalidateQueries({ queryKey: ['budget-transactions'] })
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
        })
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
    <Card className="border-0 shadow-2xl bg-gradient-to-br from-card via-card/95 to-primary/5 overflow-hidden backdrop-blur-sm">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary))_0%,transparent_50%)] opacity-5" />
      
      <CardHeader className="pb-6 relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            {transactionType === 'expense' ? '💸 Nouvelle dépense' : '💰 Nouveau revenu'}
          </CardTitle>
          <div className="flex gap-1 p-1 bg-muted/40 rounded-xl backdrop-blur-sm border border-border/40">
            <Button
              variant={transactionType === 'expense' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => { setTransactionType('expense'); setSelectedCategoryId(''); }}
              className="rounded-lg transition-all font-medium"
            >
              Dépense
            </Button>
            <Button
              variant={transactionType === 'income' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => { setTransactionType('income'); setSelectedCategoryId(''); }}
              className="rounded-lg transition-all font-medium"
            >
              Revenu
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 relative z-10 pb-8">
        <div className="space-y-3">
          <Label htmlFor="amount" className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Montant
          </Label>
          <CurrencyInput
            id="amount"
            value={amount}
            onChange={setAmount}
            placeholder="0 $"
            className="text-4xl font-light h-16 border-0 bg-muted/30 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all rounded-xl"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Catégorie
            </Label>
            <Dialog open={showCategoryManager} onOpenChange={setShowCategoryManager}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Settings className="h-3.5 w-3.5 mr-1.5" />
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

          <Popover open={openCategory} onOpenChange={setOpenCategory}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={openCategory}
                className="w-full justify-between h-14 border-border/50 bg-muted/30 hover:bg-muted/50 transition-all rounded-xl"
              >
                {selectedCategoryId ? (
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{filteredCategories.find(c => c.id === selectedCategoryId)?.icon}</span>
                    <span className="font-medium">{filteredCategories.find(c => c.id === selectedCategoryId)?.name}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Choisir une catégorie</span>
                )}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-30" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Rechercher..." />
                <CommandEmpty>Aucune catégorie trouvée.</CommandEmpty>
                <CommandList>
                  <CommandGroup>
                    {filteredCategories.map((category) => (
                      <CommandItem
                        key={category.id}
                        value={category.name}
                        onSelect={() => { setSelectedCategoryId(category.id); setOpenCategory(false); }}
                        className="flex items-center gap-3 py-3"
                      >
                        <span className="text-2xl">{category.icon}</span>
                        <span className="flex-1 font-medium">{category.name}</span>
                        {selectedCategoryId === category.id && <Check className="h-4 w-4 text-primary" />}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-3">
          <Label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left h-14 font-normal border-border/50 bg-muted/30 hover:bg-muted/50 transition-all rounded-xl"
              >
                <CalendarIcon className="mr-3 h-4 w-4 opacity-50" />
                {format(selectedDate, "d MMMM yyyy", { locale: fr })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} initialFocus className="pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-3">
          <Label htmlFor="description" className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Description <span className="text-xs lowercase normal-case">(optionnel)</span>
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
            className="h-14 border-border/50 bg-muted/30 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all rounded-xl"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={addMutation.isPending || !amount || amount === '0'}
          className="w-full h-14 text-base font-medium gap-2 bg-primary hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 rounded-xl"
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
