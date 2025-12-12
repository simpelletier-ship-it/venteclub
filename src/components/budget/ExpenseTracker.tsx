import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, ReceiptText, TrendingUp, TrendingDown, Calendar, HelpCircle, Lightbulb, ChevronRight, Trash2, Pencil } from "lucide-react";
import { formatPrice } from "@/lib/priceFormat";
import { CategoryIcon } from "./CategoryIcon";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export const ExpenseTracker = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isRecurring, setIsRecurring] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ['budget-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('budget_categories').select('*');
      if (error) throw error;
      return data;
    },
    enabled: isAuthenticated,
  });

  const { data: recentTransactions = [] } = useQuery({
    queryKey: ['budget-transactions-recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_transactions')
        .select('*')
        .order('transaction_date', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: isAuthenticated,
  });

  const addTransaction = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await supabase.from('budget_transactions').insert({
        user_id: user.id,
        amount: parseFloat(amount),
        type: transactionType,
        category_id: categoryId || null,
        description: description || null,
        transaction_date: format(selectedDate, 'yyyy-MM-dd'),
        is_recurring: isRecurring,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['budget-transactions-all'] });
      queryClient.invalidateQueries({ queryKey: ['budget-transactions-recent'] });
      queryClient.invalidateQueries({ queryKey: ['budget-transactions-current-month'] });
      toast.success(transactionType === 'expense' ? "Dépense ajoutée" : "Revenu ajouté");
      setAmount('');
      setDescription('');
      setCategoryId('');
    },
    onError: () => {
      toast.error("Erreur lors de l'ajout");
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('budget_transactions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['budget-transactions-all'] });
      queryClient.invalidateQueries({ queryKey: ['budget-transactions-recent'] });
      queryClient.invalidateQueries({ queryKey: ['budget-transactions-current-month'] });
      toast.success("Supprimé");
    },
  });

  const filteredCategories = categories.filter(c => c.type === transactionType);

  const isValid = parseFloat(amount) > 0 && categoryId;

  return (
    <div className="space-y-6">
      {/* Contextual Help */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
        <Lightbulb className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-foreground">Comment ça marche?</p>
          <p className="text-sm text-muted-foreground">
            Entre tes dépenses et revenus au fur et à mesure. 
            Plus tu es précis, mieux tu pourras voir si tu respectes ton budget!
          </p>
        </div>
      </div>

      {/* Quick Add Form */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Ajouter une transaction
          </CardTitle>
          <CardDescription>
            {transactionType === 'expense' ? 'Enregistre une dépense' : 'Enregistre un revenu'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Type Toggle */}
          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <Button
              type="button"
              variant={transactionType === 'expense' ? 'default' : 'ghost'}
              className={cn(
                "flex-1 gap-2",
                transactionType === 'expense' && "bg-red-500 hover:bg-red-600"
              )}
              onClick={() => setTransactionType('expense')}
            >
              <TrendingDown className="w-4 h-4" />
              Dépense
            </Button>
            <Button
              type="button"
              variant={transactionType === 'income' ? 'default' : 'ghost'}
              className={cn(
                "flex-1 gap-2",
                transactionType === 'income' && "bg-emerald-500 hover:bg-emerald-600"
              )}
              onClick={() => setTransactionType('income')}
            >
              <TrendingUp className="w-4 h-4" />
              Revenu
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-1">
                Montant
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger><HelpCircle className="w-3 h-3 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent>Le montant de la transaction</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <CurrencyInput
                value={amount}
                onChange={setAmount}
                placeholder="0 $"
                className="h-12 text-lg"
              />
            </div>

            <div>
              <Label>Catégorie</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Choisir une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <CategoryIcon icon={cat.icon} size="sm" />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Description (optionnel)</Label>
              <Input
                placeholder={transactionType === 'expense' ? "Ex: Épicerie IGA" : "Ex: Paie du 15"}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="h-12"
              />
            </div>

            <div>
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full h-12 justify-start">
                    <Calendar className="w-4 h-4 mr-2" />
                    {format(selectedDate, 'dd MMMM yyyy', { locale: fr })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Switch
                id="recurring"
                checked={isRecurring}
                onCheckedChange={setIsRecurring}
              />
              <Label htmlFor="recurring" className="cursor-pointer text-sm flex items-center gap-1">
                Transaction récurrente
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger><HelpCircle className="w-3 h-3 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent>Marque cette transaction comme récurrente (loyer, abonnements...)</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
            </div>

            <Button 
              onClick={() => addTransaction.mutate()}
              disabled={!isValid || addTransaction.isPending}
              className={cn(
                "gap-2",
                transactionType === 'expense' ? "bg-red-500 hover:bg-red-600" : "bg-emerald-500 hover:bg-emerald-600"
              )}
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ReceiptText className="w-4 h-4" />
            Transactions récentes
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/budget/historique')}
          >
            Voir tout <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ReceiptText className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>Aucune transaction encore</p>
              <p className="text-sm">Ajoute ta première transaction ci-dessus!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map((t) => {
                const category = categories.find(c => c.id === t.category_id);
                return (
                  <div 
                    key={t.id} 
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <CategoryIcon icon={category?.icon} size="md" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {t.description || category?.name || 'Transaction'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(t.transaction_date), 'dd MMM yyyy', { locale: fr })}
                      </p>
                    </div>
                    <span className={cn(
                      "font-semibold",
                      t.type === 'income' ? "text-emerald-600" : "text-foreground"
                    )}>
                      {t.type === 'income' ? '+' : '-'}{formatPrice(Number(t.amount))}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                      onClick={() => deleteTransaction.mutate(t.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
