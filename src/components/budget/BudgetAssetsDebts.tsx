import { useState } from "react";
import { Plus, TrendingUp, TrendingDown, Trash2, Edit } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CurrencyInput } from "@/components/CurrencyInput";
import { formatPrice } from "@/lib/priceFormat";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import confetti from "canvas-confetti";

const ASSET_TYPES = [
  { value: 'rrsp', label: 'REER' },
  { value: 'tfsa', label: 'CELI' },
  { value: 'property', label: 'Propriété/Maison' },
  { value: 'investment', label: 'Placements' },
  { value: 'savings', label: 'Épargne' },
  { value: 'other', label: 'Autre' },
];

const DEBT_TYPES = [
  { value: 'mortgage', label: 'Hypothèque' },
  { value: 'car_loan', label: 'Prêt auto' },
  { value: 'student_loan', label: 'Prêt étudiant' },
  { value: 'credit_card', label: 'Carte de crédit' },
  { value: 'personal_loan', label: 'Prêt personnel' },
  { value: 'other', label: 'Autre' },
];

export const BudgetAssetsDebts = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const queryClient = useQueryClient();
  
  // Assets state
  const [assetDialog, setAssetDialog] = useState(false);
  const [updateAssetDialog, setUpdateAssetDialog] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [assetName, setAssetName] = useState("");
  const [assetType, setAssetType] = useState("");
  const [assetValue, setAssetValue] = useState("");
  const [assetNotes, setAssetNotes] = useState("");
  const [assetRecordedAt, setAssetRecordedAt] = useState("");

  // Debts state
  const [debtDialog, setDebtDialog] = useState(false);
  const [updateDebtDialog, setUpdateDebtDialog] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<any>(null);
  const [debtName, setDebtName] = useState("");
  const [debtType, setDebtType] = useState("");
  const [debtBalance, setDebtBalance] = useState("");
  const [debtInterestRate, setDebtInterestRate] = useState("");
  const [debtMinPayment, setDebtMinPayment] = useState("");
  const [debtFrequency, setDebtFrequency] = useState("monthly");
  const [debtDueDate, setDebtDueDate] = useState("");
  const [debtNotes, setDebtNotes] = useState("");
  const [debtRecordedAt, setDebtRecordedAt] = useState("");

  // Fetch assets
  const { data: assets = [] } = useQuery({
    queryKey: ['user-assets'],
    enabled: isAuthenticated,
    retry: 1,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_assets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch debts
  const { data: debts = [] } = useQuery({
    queryKey: ['user-debts'],
    enabled: isAuthenticated,
    retry: 1,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_debts')
        .select('*')
        .order('created_at', { ascending: false});
      
      if (error) throw error;
      return data;
    },
  });

  // Add asset mutation
  const addAsset = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await supabase
        .from('user_assets')
        .insert({
          user_id: user.id,
          name: assetName,
          type: assetType,
          value: parseFloat(assetValue),
          notes: assetNotes || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-assets'] });
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#3b82f6', '#2563eb', '#1d4ed8']
      });
      toast.success("Actif ajouté avec succès 💎", {
        duration: 3000,
        className: "animate-scale-in",
      });
      setAssetDialog(false);
      resetAssetForm();
    },
  });

  // Add debt mutation
  const addDebt = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await supabase
        .from('user_debts')
        .insert({
          user_id: user.id,
          name: debtName,
          type: debtType,
          balance: parseFloat(debtBalance),
          interest_rate: parseFloat(debtInterestRate),
          minimum_payment: debtMinPayment ? parseFloat(debtMinPayment) : null,
          payment_frequency: debtFrequency,
          due_date: debtDueDate || null,
          notes: debtNotes || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-debts'] });
      toast.success("Dette ajoutée avec succès");
      setDebtDialog(false);
      resetDebtForm();
    },
  });

  // Delete mutations
  const deleteAsset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('user_assets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-assets'] });
      toast.success("Actif supprimé");
    },
  });

  const deleteDebt = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('user_debts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-debts'] });
      toast.success("Dette supprimée");
    },
  });

  // Update asset mutation with history
  const updateAssetValue = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !selectedAsset) throw new Error("Non authentifié");

      const newValue = parseFloat(assetValue);
      
      // Update asset value
      const { error: updateError } = await supabase
        .from('user_assets')
        .update({ value: newValue })
        .eq('id', selectedAsset.id);

      if (updateError) throw updateError;

      // Create history entry
      const { error: historyError } = await supabase
        .from('asset_history')
        .insert({
          user_id: user.id,
          asset_id: selectedAsset.id,
          value: newValue,
          recorded_at: assetRecordedAt || new Date().toISOString(),
          notes: assetNotes || null,
        });

      if (historyError) throw historyError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-assets'] });
      queryClient.invalidateQueries({ queryKey: ['net-worth-history'] });
      toast.success("Actif mis à jour avec succès");
      setUpdateAssetDialog(false);
      setSelectedAsset(null);
      resetAssetForm();
    },
  });

  // Update debt mutation with history
  const updateDebtBalance = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !selectedDebt) throw new Error("Non authentifié");

      const newBalance = parseFloat(debtBalance);
      
      // Update debt balance
      const { error: updateError } = await supabase
        .from('user_debts')
        .update({ balance: newBalance })
        .eq('id', selectedDebt.id);

      if (updateError) throw updateError;

      // Create history entry
      const { error: historyError } = await supabase
        .from('debt_history')
        .insert({
          user_id: user.id,
          debt_id: selectedDebt.id,
          balance: newBalance,
          recorded_at: debtRecordedAt || new Date().toISOString(),
          notes: debtNotes || null,
        });

      if (historyError) throw historyError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-debts'] });
      queryClient.invalidateQueries({ queryKey: ['net-worth-history'] });
      toast.success("Dette mise à jour avec succès");
      setUpdateDebtDialog(false);
      setSelectedDebt(null);
      resetDebtForm();
    },
  });

  const resetAssetForm = () => {
    setAssetName("");
    setAssetType("");
    setAssetValue("");
    setAssetNotes("");
    setAssetRecordedAt("");
  };

  const resetDebtForm = () => {
    setDebtName("");
    setDebtType("");
    setDebtBalance("");
    setDebtInterestRate("");
    setDebtMinPayment("");
    setDebtFrequency("monthly");
    setDebtDueDate("");
    setDebtNotes("");
    setDebtRecordedAt("");
  };

  const totalAssets = assets.reduce((sum, asset) => sum + Number(asset.value), 0);
  const totalDebts = debts.reduce((sum, debt) => sum + Number(debt.balance), 0);
  const netWorth = totalAssets - totalDebts;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Actifs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
              <span className="text-2xl font-bold text-green-600">{formatPrice(totalAssets)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Dettes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingDown className="h-4 w-4 text-red-600 mr-2" />
              <span className="text-2xl font-bold text-red-600">{formatPrice(totalDebts)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Valeur nette</CardDescription>
          </CardHeader>
          <CardContent>
            <span className={`text-2xl font-bold ${netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPrice(netWorth)}
            </span>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="assets">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assets">Actifs</TabsTrigger>
          <TabsTrigger value="debts">Dettes</TabsTrigger>
        </TabsList>

        {/* Assets Tab */}
        <TabsContent value="assets" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={assetDialog} onOpenChange={setAssetDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un actif
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nouvel actif</DialogTitle>
                  <DialogDescription>Ajoutez un actif à votre portfolio</DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); addAsset.mutate(); }} className="space-y-4">
                  <div>
                    <Label>Nom</Label>
                    <Input value={assetName} onChange={(e) => setAssetName(e.target.value)} placeholder="Ex: REER Banque XYZ" className="mt-1" required />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select value={assetType} onValueChange={setAssetType} required>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSET_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Valeur</Label>
                    <CurrencyInput value={assetValue} onChange={setAssetValue} className="mt-1" required />
                  </div>
                  <div>
                    <Label>Notes (optionnel)</Label>
                    <Textarea value={assetNotes} onChange={(e) => setAssetNotes(e.target.value)} className="mt-1" rows={2} />
                  </div>
                  <Button type="submit" className="w-full" disabled={addAsset.isPending}>
                    {addAsset.isPending ? "Ajout..." : "Ajouter"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assets.length === 0 ? (
              <Card className="col-span-2">
                <CardContent className="py-8 text-center text-muted-foreground">
                  Aucun actif enregistré
                </CardContent>
              </Card>
            ) : (
              assets.map((asset: any) => (
                <Card key={asset.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{asset.name}</CardTitle>
                        <CardDescription>
                          {ASSET_TYPES.find(t => t.value === asset.type)?.label}
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setSelectedAsset(asset);
                            setAssetValue(asset.value.toString());
                            setAssetRecordedAt(new Date().toISOString().split('T')[0]);
                            setUpdateAssetDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteAsset.mutate(asset.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{formatPrice(asset.value)}</div>
                    {asset.notes && <p className="text-sm text-muted-foreground mt-2">{asset.notes}</p>}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Debts Tab */}
        <TabsContent value="debts" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={debtDialog} onOpenChange={setDebtDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter une dette
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nouvelle dette</DialogTitle>
                  <DialogDescription>Ajoutez une dette à suivre</DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); addDebt.mutate(); }} className="space-y-4">
                  <div>
                    <Label>Nom</Label>
                    <Input value={debtName} onChange={(e) => setDebtName(e.target.value)} placeholder="Ex: Hypothèque maison" className="mt-1" required />
                  </div>
                  <div>
                    <Label>Type</Label>
                    <Select value={debtType} onValueChange={setDebtType} required>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEBT_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Solde</Label>
                    <CurrencyInput value={debtBalance} onChange={setDebtBalance} className="mt-1" required />
                  </div>
                  <div>
                    <Label>Taux d'intérêt (%)</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={debtInterestRate} 
                      onChange={(e) => setDebtInterestRate(e.target.value)} 
                      placeholder="Ex: 5.25"
                      className="mt-1"
                      required 
                    />
                  </div>
                  <div>
                    <Label>Paiement minimum (optionnel)</Label>
                    <CurrencyInput value={debtMinPayment} onChange={setDebtMinPayment} className="mt-1" />
                  </div>
                  <div>
                    <Label>Fréquence de paiement</Label>
                    <Select value={debtFrequency} onValueChange={setDebtFrequency}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Hebdomadaire</SelectItem>
                        <SelectItem value="biweekly">Aux 2 semaines</SelectItem>
                        <SelectItem value="monthly">Mensuel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Date d'échéance (optionnel)</Label>
                    <Input 
                      type="date" 
                      value={debtDueDate} 
                      onChange={(e) => setDebtDueDate(e.target.value)} 
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Notes (optionnel)</Label>
                    <Textarea value={debtNotes} onChange={(e) => setDebtNotes(e.target.value)} className="mt-1" rows={2} />
                  </div>
                  <Button type="submit" className="w-full" disabled={addDebt.isPending}>
                    {addDebt.isPending ? "Ajout..." : "Ajouter"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {debts.length === 0 ? (
              <Card className="col-span-2">
                <CardContent className="py-8 text-center text-muted-foreground">
                  Aucune dette enregistrée
                </CardContent>
              </Card>
            ) : (
              debts.map((debt: any) => (
                <Card key={debt.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{debt.name}</CardTitle>
                        <CardDescription>
                          {DEBT_TYPES.find(t => t.value === debt.type)?.label}
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setSelectedDebt(debt);
                            setDebtBalance(debt.balance.toString());
                            setDebtRecordedAt(new Date().toISOString().split('T')[0]);
                            setUpdateDebtDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteDebt.mutate(debt.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">{formatPrice(debt.balance)}</div>
                    <div className="text-sm text-muted-foreground mt-1">Taux: {debt.interest_rate}%</div>
                    {debt.minimum_payment && (
                      <div className="text-sm text-muted-foreground">Paiement min: {formatPrice(debt.minimum_payment)}</div>
                    )}
                    {debt.due_date && (
                      <div className="text-sm text-muted-foreground">Échéance: {new Date(debt.due_date).toLocaleDateString('fr-CA')}</div>
                    )}
                    {debt.notes && <p className="text-sm text-muted-foreground mt-2">{debt.notes}</p>}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Update Asset Dialog */}
      <Dialog open={updateAssetDialog} onOpenChange={setUpdateAssetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mettre à jour {selectedAsset?.name}</DialogTitle>
            <DialogDescription>Enregistrer une nouvelle valeur avec historique</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); updateAssetValue.mutate(); }} className="space-y-4">
            <div>
              <Label>Nouvelle valeur</Label>
              <CurrencyInput value={assetValue} onChange={setAssetValue} className="mt-1" required />
            </div>
            <div>
              <Label>Date d'enregistrement</Label>
              <Input 
                type="date" 
                value={assetRecordedAt} 
                onChange={(e) => setAssetRecordedAt(e.target.value)} 
                className="mt-1"
                required 
              />
            </div>
            <div>
              <Label>Notes (optionnel)</Label>
              <Textarea value={assetNotes} onChange={(e) => setAssetNotes(e.target.value)} className="mt-1" rows={2} placeholder="Ex: Contribution annuelle" />
            </div>
            <Button type="submit" className="w-full" disabled={updateAssetValue.isPending}>
              {updateAssetValue.isPending ? "Mise à jour..." : "Enregistrer"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Update Debt Dialog */}
      <Dialog open={updateDebtDialog} onOpenChange={setUpdateDebtDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mettre à jour {selectedDebt?.name}</DialogTitle>
            <DialogDescription>Enregistrer un nouveau solde avec historique</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); updateDebtBalance.mutate(); }} className="space-y-4">
            <div>
              <Label>Nouveau solde</Label>
              <CurrencyInput value={debtBalance} onChange={setDebtBalance} className="mt-1" required />
            </div>
            <div>
              <Label>Date d'enregistrement</Label>
              <Input 
                type="date" 
                value={debtRecordedAt} 
                onChange={(e) => setDebtRecordedAt(e.target.value)} 
                className="mt-1"
                required 
              />
            </div>
            <div>
              <Label>Notes (optionnel)</Label>
              <Textarea value={debtNotes} onChange={(e) => setDebtNotes(e.target.value)} className="mt-1" rows={2} placeholder="Ex: Paiement régulier" />
            </div>
            <Button type="submit" className="w-full" disabled={updateDebtBalance.isPending}>
              {updateDebtBalance.isPending ? "Mise à jour..." : "Enregistrer"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
