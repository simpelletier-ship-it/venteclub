import { useState } from "react";
import { Calendar, Save, History, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencyInput } from "@/components/CurrencyInput";
import { formatPrice } from "@/lib/priceFormat";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import confetti from "canvas-confetti";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const ASSET_TYPES = [
  { value: 'rrsp', label: 'REER' },
  { value: 'tfsa', label: 'CELI' },
  { value: 'property', label: 'Propriété/Maison' },
  { value: 'investment', label: 'Placements' },
  { value: 'savings', label: 'Épargne' },
  { value: 'emergency_fund', label: 'Fonds d\'urgence' },
  { value: 'other', label: 'Autre' },
];

interface BalanceSheetManagerProps {
  isAuthenticated: boolean;
}

interface AssetEntry {
  id?: string;
  name: string;
  type: string;
  value: string;
  isNew?: boolean;
}

export const BalanceSheetManager = ({ isAuthenticated }: BalanceSheetManagerProps) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [balanceDate, setBalanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [assetEntries, setAssetEntries] = useState<AssetEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Fetch existing assets
  const { data: existingAssets = [] } = useQuery({
    queryKey: ['user-assets'],
    enabled: isAuthenticated && open,
    retry: 1,
    queryFn: async () => {
      const { data, error } = await supabase.from('user_assets').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch balance sheet history (grouped by date)
  const { data: balanceHistory = [] } = useQuery({
    queryKey: ['balance-sheet-history'],
    enabled: isAuthenticated && showHistory,
    retry: 1,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asset_history')
        .select(`
          *,
          user_assets(name, type)
        `)
        .order('recorded_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      
      // Group by date
      const grouped: Record<string, any[]> = {};
      (data || []).forEach((entry: any) => {
        const dateKey = entry.recorded_at.split('T')[0];
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(entry);
      });
      
      return Object.entries(grouped).map(([date, entries]) => ({
        date,
        entries,
        totalValue: entries.reduce((sum, e) => sum + Number(e.value), 0),
      }));
    },
  });

  // Initialize entries when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && existingAssets.length > 0) {
      setAssetEntries(
        existingAssets.map(asset => ({
          id: asset.id,
          name: asset.name,
          type: asset.type,
          value: asset.value.toString(),
          isNew: false,
        }))
      );
    }
  };

  // Add new asset entry
  const addNewEntry = () => {
    setAssetEntries([
      ...assetEntries,
      { name: "", type: "", value: "", isNew: true },
    ]);
  };

  // Remove entry
  const removeEntry = (index: number) => {
    setAssetEntries(assetEntries.filter((_, i) => i !== index));
  };

  // Update entry
  const updateEntry = (index: number, field: keyof AssetEntry, value: string) => {
    const updated = [...assetEntries];
    updated[index] = { ...updated[index], [field]: value };
    setAssetEntries(updated);
  };

  // Submit balance sheet
  const submitBalanceSheet = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const recordedAt = new Date(balanceDate).toISOString();
      const allOperations = [];

      for (const entry of assetEntries) {
        if (!entry.name || !entry.type || !entry.value) continue;

        const numericValue = parseFloat(entry.value);
        if (isNaN(numericValue)) continue;

        // Create or update asset
        let assetId = entry.id;
        
        if (entry.isNew || !assetId) {
          // Check if asset with same name exists
          const existingAsset = existingAssets.find(a => a.name === entry.name);
          
          if (existingAsset) {
            assetId = existingAsset.id;
            // Update existing asset value
            allOperations.push(
              supabase
                .from('user_assets')
                .update({ value: numericValue })
                .eq('id', assetId)
            );
          } else {
            // Create new asset
            const { data: newAsset, error: createError } = await supabase
              .from('user_assets')
              .insert({
                user_id: user.id,
                name: entry.name,
                type: entry.type,
                value: numericValue,
              })
              .select()
              .single();

            if (createError) throw createError;
            assetId = newAsset.id;
          }
        } else {
          // Update existing asset value
          allOperations.push(
            supabase
              .from('user_assets')
              .update({ value: numericValue })
              .eq('id', assetId)
          );
        }

        // Create history entry
        allOperations.push(
          supabase.from('asset_history').insert({
            user_id: user.id,
            asset_id: assetId,
            value: numericValue,
            recorded_at: recordedAt,
            notes: notes || null,
          })
        );
      }

      // Execute all operations
      const results = await Promise.all(allOperations);
      const error = results.find(r => r.error)?.error;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-assets'] });
      queryClient.invalidateQueries({ queryKey: ['net-worth-history'] });
      queryClient.invalidateQueries({ queryKey: ['balance-sheet-history'] });
      
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#8b5cf6']
      });
      
      toast.success("📊 Bilan enregistré avec succès!", {
        description: `Date: ${format(new Date(balanceDate), 'dd MMMM yyyy', { locale: fr })}`,
        duration: 4000,
      });
      
      setOpen(false);
      setAssetEntries([]);
      setNotes("");
      setBalanceDate(new Date().toISOString().split('T')[0]);
    },
    onError: (error) => {
      toast.error("Erreur lors de l'enregistrement: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (assetEntries.length === 0) {
      toast.error("Ajoutez au moins un actif");
      return;
    }

    const validEntries = assetEntries.filter(e => e.name && e.type && e.value);
    if (validEntries.length === 0) {
      toast.error("Complétez au moins un actif avec toutes les informations");
      return;
    }

    submitBalanceSheet.mutate();
  };

  const totalValue = assetEntries.reduce((sum, entry) => {
    const val = parseFloat(entry.value);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Bilan des actifs
        </CardTitle>
        <CardDescription>
          Enregistrez un bilan complet de vos actifs à une date spécifique
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button className="flex-1">
                <Save className="mr-2 h-4 w-4" />
                Nouveau bilan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>📋 Créer un bilan des actifs</DialogTitle>
                <DialogDescription>
                  Entrez la valeur de tous vos actifs pour une date spécifique
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Date selection */}
                <div className="bg-primary/5 rounded-lg p-4">
                  <Label>Date du bilan</Label>
                  <Input 
                    type="date" 
                    value={balanceDate}
                    onChange={(e) => setBalanceDate(e.target.value)}
                    className="mt-2"
                    required
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {/* Assets entries */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base">Actifs</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addNewEntry}>
                      <Plus className="mr-1 h-3 w-3" />
                      Ajouter un actif
                    </Button>
                  </div>

                  {assetEntries.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                      <p>Aucun actif. Cliquez sur "Ajouter un actif" pour commencer.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {assetEntries.map((entry, index) => (
                        <Card key={index} className="relative">
                          <CardContent className="pt-6">
                            <div className="absolute top-2 right-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeEntry(index)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <Label className="text-xs">Nom</Label>
                                <Input
                                  value={entry.name}
                                  onChange={(e) => updateEntry(index, 'name', e.target.value)}
                                  placeholder="Ex: REER TD"
                                  className="mt-1"
                                  disabled={!entry.isNew && !!entry.id}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Type</Label>
                                <Select 
                                  value={entry.type} 
                                  onValueChange={(value) => updateEntry(index, 'type', value)}
                                  disabled={!entry.isNew && !!entry.id}
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue placeholder="Sélectionner" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {ASSET_TYPES.map(type => (
                                      <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs">Valeur à cette date</Label>
                                <CurrencyInput
                                  value={entry.value}
                                  onChange={(value) => updateEntry(index, 'value', value)}
                                  className="mt-1"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Total preview */}
                  {assetEntries.length > 0 && (
                    <div className="bg-muted/50 rounded-lg p-4 flex items-center justify-between">
                      <span className="font-semibold">Total des actifs</span>
                      <span className="text-xl font-bold text-green-600">{formatPrice(totalValue)}</span>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <Label>Notes (optionnel)</Label>
                  <Textarea 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Bilan de fin d'année, bonus reçu, héritage..."
                    className="mt-2"
                    rows={2}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={submitBalanceSheet.isPending || assetEntries.length === 0}
                >
                  {submitBalanceSheet.isPending ? "Enregistrement..." : "Enregistrer le bilan"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={() => setShowHistory(!showHistory)}>
            <History className="mr-2 h-4 w-4" />
            Historique
          </Button>
        </div>

        {/* History display */}
        {showHistory && (
          <div className="space-y-3 mt-4">
            <h3 className="font-semibold text-sm">Bilans précédents</h3>
            {balanceHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Aucun bilan enregistré</p>
            ) : (
              <div className="space-y-2">
                {balanceHistory.map((balance: any) => (
                  <Card key={balance.date}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">
                          {format(new Date(balance.date), 'dd MMMM yyyy', { locale: fr })}
                        </span>
                        <span className="text-lg font-bold text-green-600">
                          {formatPrice(balance.totalValue)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {balance.entries.length} actif(s) enregistré(s)
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
