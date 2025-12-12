import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/CurrencyInput";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet, CreditCard, Building, PiggyBank, Car, GraduationCap, RefreshCw, Calendar } from "lucide-react";
import { formatPrice } from "@/lib/priceFormat";
import confetti from "canvas-confetti";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface SimpleNetWorthTrackerProps {
  currentNetWorth: number;
  isAuthenticated: boolean;
}

const ACCOUNT_ICONS: Record<string, any> = {
  rrsp: PiggyBank,
  tfsa: PiggyBank,
  savings: Wallet,
  property: Building,
  investment: TrendingUp,
  emergency_fund: Wallet,
  other: Wallet,
  mortgage: Building,
  car_loan: Car,
  student_loan: GraduationCap,
  credit_card: CreditCard,
  personal_loan: CreditCard,
};

const ACCOUNT_LABELS: Record<string, string> = {
  rrsp: 'REER',
  tfsa: 'CELI',
  savings: 'Épargne',
  property: 'Propriété',
  investment: 'Placements',
  emergency_fund: 'Fonds urgence',
  other: 'Autre',
  mortgage: 'Hypothèque',
  car_loan: 'Prêt auto',
  student_loan: 'Prêt étudiant',
  credit_card: 'Carte crédit',
  personal_loan: 'Prêt perso',
};

export const SimpleNetWorthTracker = ({ currentNetWorth, isAuthenticated }: SimpleNetWorthTrackerProps) => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editDate, setEditDate] = useState<Date>(new Date());
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [newName, setNewName] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newType, setNewType] = useState("savings");
  const [newDate, setNewDate] = useState<Date>(new Date());

  // Fetch assets
  const { data: assets = [], refetch: refetchAssets } = useQuery({
    queryKey: ['user-assets'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_assets')
        .select('*')
        .order('type', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Fetch debts
  const { data: debts = [], refetch: refetchDebts } = useQuery({
    queryKey: ['user-debts'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_debts')
        .select('*')
        .order('type', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Quick update asset value with date selection
  const updateAsset = useMutation({
    mutationFn: async ({ id, value, date }: { id: string; value: number; date: Date }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const recordedAt = date.toISOString().split('T')[0];

      const { error } = await supabase
        .from('user_assets')
        .update({ value, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      // Record history with selected date
      await supabase.from('asset_history').insert({
        user_id: user.id,
        asset_id: id,
        value,
        recorded_at: recordedAt,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-assets'] });
      queryClient.invalidateQueries({ queryKey: ['net-worth-history'] });
      toast.success("Solde mis à jour");
      setEditingId(null);
      setEditValue("");
      setEditDate(new Date());
    },
  });

  // Quick update debt balance with date selection
  const updateDebt = useMutation({
    mutationFn: async ({ id, balance, date }: { id: string; balance: number; date: Date }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const recordedAt = date.toISOString().split('T')[0];

      const { error } = await supabase
        .from('user_debts')
        .update({ balance, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      // Record history with selected date
      await supabase.from('debt_history').insert({
        user_id: user.id,
        debt_id: id,
        balance,
        recorded_at: recordedAt,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-debts'] });
      queryClient.invalidateQueries({ queryKey: ['net-worth-history'] });
      toast.success("Solde mis à jour");
      setEditingId(null);
      setEditValue("");
      setEditDate(new Date());
    },
  });

  // Add new asset
  const addAsset = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await supabase.from('user_assets').insert({
        user_id: user.id,
        name: newName,
        type: newType,
        value: parseFloat(newValue) || 0,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-assets'] });
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
      toast.success("Compte ajouté");
      setShowAddAsset(false);
      setNewName("");
      setNewValue("");
    },
  });

  // Add new debt
  const addDebt = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { error } = await supabase.from('user_debts').insert({
        user_id: user.id,
        name: newName,
        type: newType,
        balance: parseFloat(newValue) || 0,
        interest_rate: 0,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-debts'] });
      toast.success("Dette ajoutée");
      setShowAddDebt(false);
      setNewName("");
      setNewValue("");
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
      toast.success("Supprimé");
    },
  });

  const deleteDebt = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('user_debts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-debts'] });
      toast.success("Supprimé");
    },
  });

  const totalAssets = assets.reduce((sum: number, a: any) => sum + Number(a.value), 0);
  const totalDebts = debts.reduce((sum: number, d: any) => sum + Number(d.balance), 0);
  const netWorth = totalAssets - totalDebts;

  const handleRefreshAll = () => {
    refetchAssets();
    refetchDebts();
    toast.success("Données actualisées");
  };

  return (
    <div className="space-y-4">
      {/* Net Worth Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-500/10 rounded-xl p-4 text-center">
          <TrendingUp className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
          <div className="text-xs text-muted-foreground">Actifs</div>
          <div className="text-lg font-bold text-emerald-600">{formatPrice(totalAssets)}</div>
        </div>
        <div className="bg-red-500/10 rounded-xl p-4 text-center">
          <TrendingDown className="w-5 h-5 text-red-600 mx-auto mb-1" />
          <div className="text-xs text-muted-foreground">Passifs</div>
          <div className="text-lg font-bold text-red-600">{formatPrice(totalDebts)}</div>
        </div>
        <div className={`rounded-xl p-4 text-center ${netWorth >= 0 ? 'bg-blue-500/10' : 'bg-orange-500/10'}`}>
          <Wallet className={`w-5 h-5 mx-auto mb-1 ${netWorth >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
          <div className="text-xs text-muted-foreground">Valeur nette</div>
          <div className={`text-lg font-bold ${netWorth >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            {formatPrice(netWorth)}
          </div>
        </div>
      </div>

      {/* Quick Update All Accounts */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">Mes comptes</CardTitle>
            <Button variant="ghost" size="sm" onClick={handleRefreshAll}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Assets List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-emerald-600">Actifs</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs"
                onClick={() => { setShowAddAsset(!showAddAsset); setNewType('savings'); }}
              >
                <Plus className="w-3 h-3 mr-1" />
                Ajouter
              </Button>
            </div>
            
            {showAddAsset && (
              <div className="flex gap-2 p-2 bg-muted/50 rounded-lg">
                <Input
                  placeholder="Nom du compte"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-8 text-sm flex-1"
                />
                <CurrencyInput
                  value={newValue}
                  onChange={setNewValue}
                  placeholder="Solde"
                  className="h-8 text-sm w-28"
                  allowDecimals
                />
                <Button size="sm" className="h-8" onClick={() => addAsset.mutate()} disabled={!newName}>
                  OK
                </Button>
              </div>
            )}

            {assets.map((asset: any) => {
              const Icon = ACCOUNT_ICONS[asset.type] || Wallet;
              const isEditing = editingId === `asset-${asset.id}`;
              
              return (
                <div key={asset.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 group">
                  <Icon className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-sm flex-1 truncate">{asset.name}</span>
                  
                  {isEditing ? (
                    <div className="flex items-center gap-1 flex-wrap">
                      <CurrencyInput
                        value={editValue}
                        onChange={setEditValue}
                        className="h-7 text-sm w-24"
                        allowDecimals
                        autoFocus
                      />
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                            <Calendar className="w-3 h-3 mr-1" />
                            {format(editDate, 'dd/MM', { locale: fr })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <CalendarComponent
                            mode="single"
                            selected={editDate}
                            onSelect={(date) => date && setEditDate(date)}
                            locale={fr}
                          />
                        </PopoverContent>
                      </Popover>
                      <Button 
                        size="sm" 
                        className="h-7 px-2"
                        onClick={() => updateAsset.mutate({ id: asset.id, value: parseFloat(editValue) || 0, date: editDate })}
                      >
                        ✓
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 px-2"
                        onClick={() => { setEditingId(null); setEditValue(""); setEditDate(new Date()); }}
                      >
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span 
                        className="text-sm font-medium text-emerald-600 cursor-pointer hover:underline"
                        onClick={() => { setEditingId(`asset-${asset.id}`); setEditValue(asset.value.toString()); }}
                      >
                        {formatPrice(asset.value)}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                        onClick={() => deleteAsset.mutate(asset.id)}
                      >
                        <Trash2 className="w-3 h-3 text-muted-foreground" />
                      </Button>
                    </>
                  )}
                </div>
              );
            })}
            
            {assets.length === 0 && !showAddAsset && (
              <p className="text-xs text-muted-foreground text-center py-2">Aucun actif</p>
            )}
          </div>

          <div className="border-t" />

          {/* Debts List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-red-600">Passifs</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs"
                onClick={() => { setShowAddDebt(!showAddDebt); setNewType('credit_card'); }}
              >
                <Plus className="w-3 h-3 mr-1" />
                Ajouter
              </Button>
            </div>
            
            {showAddDebt && (
              <div className="flex gap-2 p-2 bg-muted/50 rounded-lg">
                <Input
                  placeholder="Nom de la dette"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-8 text-sm flex-1"
                />
                <CurrencyInput
                  value={newValue}
                  onChange={setNewValue}
                  placeholder="Solde"
                  className="h-8 text-sm w-28"
                  allowDecimals
                />
                <Button size="sm" className="h-8" onClick={() => addDebt.mutate()} disabled={!newName}>
                  OK
                </Button>
              </div>
            )}

            {debts.map((debt: any) => {
              const Icon = ACCOUNT_ICONS[debt.type] || CreditCard;
              const isEditing = editingId === `debt-${debt.id}`;
              
              return (
                <div key={debt.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 group">
                  <Icon className="w-4 h-4 text-red-600 shrink-0" />
                  <span className="text-sm flex-1 truncate">{debt.name}</span>
                  
                  {isEditing ? (
                    <div className="flex items-center gap-1 flex-wrap">
                      <CurrencyInput
                        value={editValue}
                        onChange={setEditValue}
                        className="h-7 text-sm w-24"
                        allowDecimals
                        autoFocus
                      />
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                            <Calendar className="w-3 h-3 mr-1" />
                            {format(editDate, 'dd/MM', { locale: fr })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                          <CalendarComponent
                            mode="single"
                            selected={editDate}
                            onSelect={(date) => date && setEditDate(date)}
                            locale={fr}
                          />
                        </PopoverContent>
                      </Popover>
                      <Button 
                        size="sm" 
                        className="h-7 px-2"
                        onClick={() => updateDebt.mutate({ id: debt.id, balance: parseFloat(editValue) || 0, date: editDate })}
                      >
                        ✓
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 px-2"
                        onClick={() => { setEditingId(null); setEditValue(""); setEditDate(new Date()); }}
                      >
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span 
                        className="text-sm font-medium text-red-600 cursor-pointer hover:underline"
                        onClick={() => { setEditingId(`debt-${debt.id}`); setEditValue(debt.balance.toString()); }}
                      >
                        {formatPrice(debt.balance)}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                        onClick={() => deleteDebt.mutate(debt.id)}
                      >
                        <Trash2 className="w-3 h-3 text-muted-foreground" />
                      </Button>
                    </>
                  )}
                </div>
              );
            })}
            
            {debts.length === 0 && !showAddDebt && (
              <p className="text-xs text-muted-foreground text-center py-2">Aucune dette</p>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Cliquez sur un montant pour le modifier. L'historique est automatiquement enregistré.
      </p>
    </div>
  );
};
