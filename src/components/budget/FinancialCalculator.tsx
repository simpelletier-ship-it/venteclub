import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Calculator, Plus, Calendar as CalendarIcon, TrendingUp, TrendingDown, Home, Car, Building2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/priceFormat";

interface FinancialCalculatorProps {
  isAuthenticated: boolean;
}

const ASSET_TYPES = [
  { value: 'property', label: '🏠 Maison/Propriété', icon: Home },
  { value: 'rrsp', label: '💰 REER', icon: TrendingUp },
  { value: 'tfsa', label: '💎 CELI', icon: TrendingUp },
  { value: 'investment', label: '📈 Placements', icon: TrendingUp },
  { value: 'savings', label: '🏦 Épargne', icon: TrendingUp },
  { value: 'vehicle', label: '🚗 Véhicule', icon: Car },
  { value: 'other', label: '📦 Autre actif', icon: Building2 },
];

const DEBT_TYPES = [
  { value: 'mortgage', label: '🏠 Hypothèque', color: '#ef4444' },
  { value: 'car_loan', label: '🚗 Prêt auto', color: '#f97316' },
  { value: 'student_loan', label: '🎓 Prêt étudiant', color: '#eab308' },
  { value: 'credit_card', label: '💳 Carte de crédit', color: '#dc2626' },
  { value: 'personal_loan', label: '👤 Prêt personnel', color: '#f59e0b' },
  { value: 'other', label: '📋 Autre dette', color: '#64748b' },
];

export const FinancialCalculator = ({ isAuthenticated }: FinancialCalculatorProps) => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [calculationDate, setCalculationDate] = useState<Date>(new Date());

  // Assets state
  const [assets, setAssets] = useState<Array<{
    type: string;
    name: string;
    value: string;
  }>>([]);

  // Debts state  
  const [debts, setDebts] = useState<Array<{
    type: string;
    name: string;
    balance: string;
  }>>([]);

  const addAssetField = () => {
    setAssets([...assets, { type: '', name: '', value: '' }]);
  };

  const removeAssetField = (index: number) => {
    setAssets(assets.filter((_, i) => i !== index));
  };

  const updateAsset = (index: number, field: string, value: string) => {
    const updated = [...assets];
    updated[index] = { ...updated[index], [field]: value };
    setAssets(updated);
  };

  const addDebtField = () => {
    setDebts([...debts, { type: '', name: '', balance: '' }]);
  };

  const removeDebtField = (index: number) => {
    setDebts(debts.filter((_, i) => i !== index));
  };

  const updateDebt = (index: number, field: string, value: string) => {
    const updated = [...debts];
    updated[index] = { ...updated[index], [field]: value };
    setDebts(updated);
  };

  // Calculate totals
  const totalAssets = assets.reduce((sum, asset) => sum + (parseFloat(asset.value) || 0), 0);
  const totalDebts = debts.reduce((sum, debt) => sum + (parseFloat(debt.balance) || 0), 0);
  const netWorth = totalAssets - totalDebts;

  // Save snapshot mutation
  const saveSnapshot = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const recordedAt = format(calculationDate, 'yyyy-MM-dd');

      // Save each asset individually
      for (const asset of assets) {
        if (asset.type && asset.value) {
          const { data: assetData, error: assetInsertError } = await supabase
            .from('user_assets')
            .upsert({
              user_id: user.id,
              name: asset.name || ASSET_TYPES.find(t => t.value === asset.type)?.label || 'Actif',
              type: asset.type,
              value: parseFloat(asset.value),
            }, { onConflict: 'user_id,name' })
            .select()
            .single();

          if (assetInsertError) throw assetInsertError;

          // Record in history
          const { error: historyError } = await supabase
            .from('asset_history')
            .insert({
              user_id: user.id,
              asset_id: assetData.id,
              value: parseFloat(asset.value),
              recorded_at: recordedAt,
              notes: `Valeur calculée le ${format(calculationDate, 'd MMMM yyyy', { locale: fr })}`,
            });

          if (historyError) throw historyError;
        }
      }

      // Save each debt individually
      for (const debt of debts) {
        if (debt.type && debt.balance) {
          const { data: debtData, error: debtInsertError } = await supabase
            .from('user_debts')
            .upsert({
              user_id: user.id,
              name: debt.name || DEBT_TYPES.find(t => t.value === debt.type)?.label || 'Dette',
              type: debt.type,
              balance: parseFloat(debt.balance),
              interest_rate: 0,
            }, { onConflict: 'user_id,name' })
            .select()
            .single();

          if (debtInsertError) throw debtInsertError;

          // Record in history
          const { error: historyError } = await supabase
            .from('debt_history')
            .insert({
              user_id: user.id,
              debt_id: debtData.id,
              balance: parseFloat(debt.balance),
              recorded_at: recordedAt,
              notes: `Solde calculé le ${format(calculationDate, 'd MMMM yyyy', { locale: fr })}`,
            });

          if (historyError) throw historyError;
        }
      }

      return { totalAssets, totalDebts, netWorth };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-assets'] });
      queryClient.invalidateQueries({ queryKey: ['user-debts'] });
      queryClient.invalidateQueries({ queryKey: ['asset-history'] });
      queryClient.invalidateQueries({ queryKey: ['debt-history'] });
      
      toast.success(`✅ Valeur nette calculée: ${formatPrice(data.netWorth)}`, { duration: 3000 });
      setDialogOpen(false);
      // Reset form
      setAssets([]);
      setDebts([]);
      setCalculationDate(new Date());
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de l'enregistrement");
    },
  });

  const handleCalculate = () => {
    if (assets.length === 0 && debts.length === 0) {
      toast.error("Ajoutez au moins un actif ou une dette");
      return;
    }

    const validAssets = assets.filter(a => a.type && a.value);
    const validDebts = debts.filter(d => d.type && d.balance);

    if (validAssets.length === 0 && validDebts.length === 0) {
      toast.error("Veuillez remplir au moins un actif ou une dette valide");
      return;
    }

    saveSnapshot.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Calculateur de valeur nette
            </CardTitle>
            <CardDescription>
              Enregistrez vos actifs et dettes pour calculer votre valeur nette
            </CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Calculer
          </Button>
        </div>
      </CardHeader>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Calculer ma valeur nette</DialogTitle>
            <DialogDescription>
              Ajoutez tous vos actifs et dettes pour obtenir votre valeur nette
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Date Selection */}
            <div>
              <Label>Date du calcul</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1",
                      !calculationDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {calculationDate ? format(calculationDate, "d MMMM yyyy", { locale: fr }) : "Choisir la date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={calculationDate}
                    onSelect={(date) => date && setCalculationDate(date)}
                    initialFocus
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Assets Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">💰 Mes actifs</Label>
                <Button type="button" variant="outline" size="sm" onClick={addAssetField}>
                  <Plus className="h-3 w-3 mr-1" />
                  Ajouter
                </Button>
              </div>

              {assets.map((asset, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 p-3 bg-muted/30 rounded-lg">
                  <div className="col-span-4">
                    <Select value={asset.type} onValueChange={(value) => updateAsset(index, 'type', value)}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSET_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-4">
                    <Input
                      value={asset.name}
                      onChange={(e) => updateAsset(index, 'name', e.target.value)}
                      placeholder="Nom (optionnel)"
                      className="h-9"
                    />
                  </div>
                  <div className="col-span-3">
                    <CurrencyInput
                      value={asset.value}
                      onChange={(value) => updateAsset(index, 'value', value)}
                      placeholder="Valeur"
                      className="h-9"
                    />
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => removeAssetField(index)}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              ))}

              {assets.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Aucun actif ajouté
                </p>
              )}
            </div>

            {/* Debts Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">💳 Mes dettes</Label>
                <Button type="button" variant="outline" size="sm" onClick={addDebtField}>
                  <Plus className="h-3 w-3 mr-1" />
                  Ajouter
                </Button>
              </div>

              {debts.map((debt, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 p-3 bg-muted/30 rounded-lg">
                  <div className="col-span-4">
                    <Select value={debt.type} onValueChange={(value) => updateDebt(index, 'type', value)}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEBT_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-4">
                    <Input
                      value={debt.name}
                      onChange={(e) => updateDebt(index, 'name', e.target.value)}
                      placeholder="Nom (optionnel)"
                      className="h-9"
                    />
                  </div>
                  <div className="col-span-3">
                    <CurrencyInput
                      value={debt.balance}
                      onChange={(value) => updateDebt(index, 'balance', value)}
                      placeholder="Solde"
                      className="h-9"
                    />
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => removeDebtField(index)}
                    >
                      ✕
                    </Button>
                  </div>
                </div>
              ))}

              {debts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Aucune dette ajoutée
                </p>
              )}
            </div>

            {/* Summary Preview */}
            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Total actifs
                </span>
                <span className="font-semibold text-green-600">{formatPrice(totalAssets)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  Total dettes
                </span>
                <span className="font-semibold text-red-600">{formatPrice(totalDebts)}</span>
              </div>
              <div className="pt-2 border-t flex items-center justify-between">
                <span className="font-semibold">Valeur nette</span>
                <span className={`text-lg font-bold ${netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPrice(netWorth)}
                </span>
              </div>
            </div>

            <Button 
              onClick={handleCalculate} 
              className="w-full" 
              disabled={saveSnapshot.isPending}
              size="lg"
            >
              {saveSnapshot.isPending ? "Enregistrement..." : `Calculer ma valeur nette en date du ${format(calculationDate, 'd MMMM yyyy', { locale: fr })}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};