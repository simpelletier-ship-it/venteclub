import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";
import { Loader2, Plus, TrendingUp, TrendingDown, Wallet, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SimpleNetWorthTracker } from "@/components/budget/SimpleNetWorthTracker";
import { NetWorthGamification } from "@/components/budget/NetWorthGamification";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPrice } from "@/lib/priceFormat";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ASSET_TYPES = [
  { value: 'checking', label: 'Compte chèques' },
  { value: 'savings', label: 'Compte épargne' },
  { value: 'reer', label: 'REER' },
  { value: 'celi', label: 'CELI' },
  { value: 'property', label: 'Propriété' },
  { value: 'investment', label: 'Placements' },
  { value: 'vehicle', label: 'Véhicule' },
  { value: 'other', label: 'Autre' },
];

const DEBT_TYPES = [
  { value: 'mortgage', label: 'Hypothèque' },
  { value: 'car_loan', label: 'Prêt auto' },
  { value: 'credit_card', label: 'Carte de crédit' },
  { value: 'student_loan', label: 'Prêt étudiant' },
  { value: 'personal_loan', label: 'Prêt personnel' },
  { value: 'line_of_credit', label: 'Marge de crédit' },
  { value: 'other', label: 'Autre' },
];

const BudgetNetWorth = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading } = useAuth();
  const isAuthenticated = !!user;

  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [assetForm, setAssetForm] = useState({ name: '', type: 'savings', value: '', date: new Date().toISOString().split('T')[0] });
  const [debtForm, setDebtForm] = useState({ name: '', type: 'credit_card', balance: '', date: new Date().toISOString().split('T')[0] });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/auth?redirect=/budget/valeur-nette');
    }
  }, [loading, isAuthenticated, navigate]);

  const { data: assets = [] } = useQuery({
    queryKey: ['user-assets'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_assets').select('*');
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthenticated,
    retry: 1,
  });

  const { data: debts = [] } = useQuery({
    queryKey: ['user-debts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_debts').select('*');
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthenticated,
    retry: 1,
  });

  const addAssetMutation = useMutation({
    mutationFn: async (data: { name: string; type: string; value: number; date: string }) => {
      const { data: newAsset, error } = await supabase
        .from('user_assets')
        .insert({ name: data.name, type: data.type, value: data.value, user_id: user?.id })
        .select()
        .single();
      if (error) throw error;
      
      // Add history entry
      await supabase.from('asset_history').insert({
        asset_id: newAsset.id,
        user_id: user?.id,
        value: data.value,
        recorded_at: data.date,
      });
      
      return newAsset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-assets'] });
      queryClient.invalidateQueries({ queryKey: ['asset-history'] });
      toast.success('Actif ajouté');
      setAssetForm({ name: '', type: 'savings', value: '', date: new Date().toISOString().split('T')[0] });
      setShowAddAsset(false);
    },
    onError: () => toast.error('Erreur lors de l\'ajout'),
  });

  const addDebtMutation = useMutation({
    mutationFn: async (data: { name: string; type: string; balance: number; date: string }) => {
      const { data: newDebt, error } = await supabase
        .from('user_debts')
        .insert({ 
          name: data.name, 
          type: data.type, 
          balance: data.balance, 
          interest_rate: 0,
          user_id: user?.id 
        })
        .select()
        .single();
      if (error) throw error;
      
      // Add history entry
      await supabase.from('debt_history').insert({
        debt_id: newDebt.id,
        user_id: user?.id,
        balance: data.balance,
        recorded_at: data.date,
      });
      
      return newDebt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-debts'] });
      queryClient.invalidateQueries({ queryKey: ['debt-history'] });
      toast.success('Passif ajouté');
      setDebtForm({ name: '', type: 'credit_card', balance: '', date: new Date().toISOString().split('T')[0] });
      setShowAddDebt(false);
    },
    onError: () => toast.error('Erreur lors de l\'ajout'),
  });

  const handleAddAsset = () => {
    const value = parseFloat(assetForm.value.replace(/[^\d.-]/g, ''));
    if (!assetForm.name || isNaN(value) || value <= 0) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    addAssetMutation.mutate({ ...assetForm, value });
  };

  const handleAddDebt = () => {
    const balance = parseFloat(debtForm.balance.replace(/[^\d.-]/g, ''));
    if (!debtForm.name || isNaN(balance) || balance <= 0) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    addDebtMutation.mutate({ ...debtForm, balance });
  };

  const totalAssets = assets.reduce((sum, asset) => sum + Number(asset.value), 0);
  const totalDebts = debts.reduce((sum, debt) => sum + Number(debt.balance), 0);
  const netWorth = totalAssets - totalDebts;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <ErrorBoundary>
      <SEO
        title="Valeur nette | Budget.club"
        description="Suivez l'évolution de votre valeur nette et patrimoine."
        canonical="/budget/valeur-nette"
      />
      <BreadcrumbSchema
        items={[
          { name: "Budget", url: "/budget" },
          { name: "Valeur nette", url: "/budget/valeur-nette" }
        ]}
      />

      <div className="min-h-screen bg-background pb-8">
        <div className="container mx-auto px-6 py-6">
          <h1 className="text-xl font-semibold text-foreground mb-6">Mon patrimoine</h1>
          
          {/* Résumé KPI */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Actifs</span>
                  <TrendingUp className="h-4 w-4 text-success" />
                </div>
                <p className="text-xl font-semibold text-success">{formatPrice(totalAssets)}</p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Passifs</span>
                  <TrendingDown className="h-4 w-4 text-destructive" />
                </div>
                <p className="text-xl font-semibold text-destructive">{formatPrice(totalDebts)}</p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Valeur nette</span>
                  <Wallet className="h-4 w-4 text-primary" />
                </div>
                <p className={cn("text-xl font-semibold", netWorth >= 0 ? "text-foreground" : "text-destructive")}>
                  {formatPrice(netWorth)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Formulaires d'ajout rapide */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <Card className="border-border">
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Ajouter un actif</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowAddAsset(!showAddAsset)}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              {showAddAsset && (
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Nom</Label>
                      <Input 
                        placeholder="Ex: Compte épargne BMO"
                        value={assetForm.name}
                        onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Type</Label>
                      <Select value={assetForm.type} onValueChange={(v) => setAssetForm({ ...assetForm, type: v })}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ASSET_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Valeur</Label>
                      <Input 
                        placeholder="0 $"
                        value={assetForm.value}
                        onChange={(e) => setAssetForm({ ...assetForm, value: e.target.value })}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Date
                      </Label>
                      <Input 
                        type="date"
                        value={assetForm.date}
                        onChange={(e) => setAssetForm({ ...assetForm, date: e.target.value })}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleAddAsset} 
                    className="w-full h-9"
                    disabled={addAssetMutation.isPending}
                  >
                    {addAssetMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ajouter l\'actif'}
                  </Button>
                </CardContent>
              )}
            </Card>

            <Card className="border-border">
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Ajouter un passif</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowAddDebt(!showAddDebt)}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              {showAddDebt && (
                <CardContent className="pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Nom</Label>
                      <Input 
                        placeholder="Ex: Carte Visa"
                        value={debtForm.name}
                        onChange={(e) => setDebtForm({ ...debtForm, name: e.target.value })}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Type</Label>
                      <Select value={debtForm.type} onValueChange={(v) => setDebtForm({ ...debtForm, type: v })}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DEBT_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Solde</Label>
                      <Input 
                        placeholder="0 $"
                        value={debtForm.balance}
                        onChange={(e) => setDebtForm({ ...debtForm, balance: e.target.value })}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Date
                      </Label>
                      <Input 
                        type="date"
                        value={debtForm.date}
                        onChange={(e) => setDebtForm({ ...debtForm, date: e.target.value })}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                  <Button 
                    onClick={handleAddDebt} 
                    className="w-full h-9"
                    disabled={addDebtMutation.isPending}
                  >
                    {addDebtMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ajouter le passif'}
                  </Button>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Graphique d'évolution de la valeur nette */}
          <div className="mb-6">
            <NetWorthGamification netWorth={netWorth} isAuthenticated={isAuthenticated} />
          </div>

          {/* Gestion des actifs et passifs */}
          <SimpleNetWorthTracker currentNetWorth={netWorth} isAuthenticated={isAuthenticated} />
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default BudgetNetWorth;