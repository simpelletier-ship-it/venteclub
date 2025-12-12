import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PiggyBank, Plus, TrendingUp, TrendingDown, Wallet, Building2, Car, Briefcase, Coins, Edit2, Trash2, DollarSign, CircleDollarSign } from "lucide-react";
import { formatPrice } from "@/lib/priceFormat";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const ASSET_TYPES = [
  { value: "savings", label: "Compte épargne", icon: PiggyBank, color: "#10b981" },
  { value: "reer", label: "REER", icon: Briefcase, color: "#3b82f6" },
  { value: "celi", label: "CELI", icon: Coins, color: "#8b5cf6" },
  { value: "reee", label: "REEE", icon: CircleDollarSign, color: "#f59e0b" },
  { value: "property", label: "Propriété", icon: Building2, color: "#ef4444" },
  { value: "vehicle", label: "Véhicule", icon: Car, color: "#6366f1" },
  { value: "investment", label: "Placement", icon: TrendingUp, color: "#14b8a6" },
  { value: "other", label: "Autre", icon: Wallet, color: "#64748b" },
];

const getAssetConfig = (type: string) => {
  return ASSET_TYPES.find(t => t.value === type) || ASSET_TYPES[ASSET_TYPES.length - 1];
};

export const SavingsTracker = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "savings",
    value: "",
    notes: "",
  });

  // Fetch user assets
  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['user-assets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_assets')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Fetch user debts for net worth calculation
  const { data: debts = [] } = useQuery({
    queryKey: ['user-debts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_debts').select('*');
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Add asset mutation
  const addAsset = useMutation({
    mutationFn: async (asset: typeof formData) => {
      const { error } = await supabase.from('user_assets').insert({
        user_id: user?.id,
        name: asset.name,
        type: asset.type,
        value: parseFloat(asset.value) || 0,
        notes: asset.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-assets'] });
      toast.success("Épargne ajoutée");
      resetForm();
    },
    onError: () => {
      toast.error("Erreur lors de l'ajout");
    },
  });

  // Update asset mutation
  const updateAsset = useMutation({
    mutationFn: async ({ id, ...asset }: any) => {
      const { error } = await supabase
        .from('user_assets')
        .update({
          name: asset.name,
          type: asset.type,
          value: parseFloat(asset.value) || 0,
          notes: asset.notes || null,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-assets'] });
      toast.success("Épargne mise à jour");
      resetForm();
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });

  // Delete asset mutation
  const deleteAsset = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('user_assets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-assets'] });
      toast.success("Épargne supprimée");
    },
  });

  const resetForm = () => {
    setFormData({ name: "", type: "savings", value: "", notes: "" });
    setEditingAsset(null);
    setDialogOpen(false);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.value) {
      toast.error("Veuillez remplir tous les champs requis");
      return;
    }

    if (editingAsset) {
      updateAsset.mutate({ id: editingAsset.id, ...formData });
    } else {
      addAsset.mutate(formData);
    }
  };

  const handleEdit = (asset: any) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      type: asset.type,
      value: asset.value.toString(),
      notes: asset.notes || "",
    });
    setDialogOpen(true);
  };

  // Calculate totals
  const totalAssets = assets.reduce((sum, a) => sum + Number(a.value), 0);
  const totalDebts = debts.reduce((sum, d) => sum + Number(d.balance), 0);
  const netWorth = totalAssets - totalDebts;

  // Group assets by type for chart
  const assetsByType = ASSET_TYPES.map(type => ({
    name: type.label,
    value: assets
      .filter(a => a.type === type.value)
      .reduce((sum, a) => sum + Number(a.value), 0),
    color: type.color,
  })).filter(item => item.value > 0);

  // Savings types only (exclude property, vehicle)
  const savingsAssets = assets.filter(a => 
    ['savings', 'reer', 'celi', 'reee', 'investment'].includes(a.type)
  );
  const totalSavings = savingsAssets.reduce((sum, a) => sum + Number(a.value), 0);

  return (
    <div className="space-y-6">
      {/* Net Worth Summary */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl bg-background/50">
              <div className="flex items-center justify-center gap-2 text-emerald-600 mb-2">
                <TrendingUp className="h-5 w-5" />
                <span className="text-sm font-medium">Total actifs</span>
              </div>
              <p className="text-2xl font-bold">{formatPrice(totalAssets)}</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-background/50">
              <div className="flex items-center justify-center gap-2 text-red-500 mb-2">
                <TrendingDown className="h-5 w-5" />
                <span className="text-sm font-medium">Total dettes</span>
              </div>
              <p className="text-2xl font-bold">{formatPrice(totalDebts)}</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-background/50">
              <div className="flex items-center justify-center gap-2 text-primary mb-2">
                <Wallet className="h-5 w-5" />
                <span className="text-sm font-medium">Valeur nette</span>
              </div>
              <p className={`text-2xl font-bold ${netWorth >= 0 ? 'text-primary' : 'text-red-500'}`}>
                {netWorth >= 0 ? '' : '-'}{formatPrice(Math.abs(netWorth))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Savings Breakdown */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-emerald-500" />
              Mes épargnes & actifs
            </CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1" onClick={() => { setEditingAsset(null); setFormData({ name: "", type: "savings", value: "", notes: "" }); }}>
                  <Plus className="h-4 w-4" />
                  Ajouter
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingAsset ? "Modifier l'épargne" : "Ajouter une épargne"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Type d'actif</Label>
                    <Select value={formData.type} onValueChange={(v) => setFormData(prev => ({ ...prev, type: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSET_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-4 w-4" style={{ color: type.color }} />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Nom</Label>
                    <Input
                      placeholder="Ex: CELI Wealthsimple"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valeur actuelle ($)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.value}
                      onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes (optionnel)</Label>
                    <Input
                      placeholder="Informations supplémentaires"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={resetForm}>Annuler</Button>
                  <Button onClick={handleSubmit} disabled={addAsset.isPending || updateAsset.isPending}>
                    {editingAsset ? "Mettre à jour" : "Ajouter"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Chart and Summary */}
          {assets.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={assetsByType}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {assetsByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [formatPrice(value), ""]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col justify-center space-y-2">
                {assetsByType.map((type, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                      <span>{type.name}</span>
                    </div>
                    <span className="font-medium">{formatPrice(type.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assets List */}
          {assets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <PiggyBank className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Aucune épargne enregistrée</p>
              <p className="text-xs mt-1">Ajoutez vos comptes d'épargne, REER, CELI, etc.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {assets.map((asset) => {
                const config = getAssetConfig(asset.type);
                const Icon = config.icon;
                const percentage = totalAssets > 0 ? (Number(asset.value) / totalAssets) * 100 : 0;
                
                return (
                  <div
                    key={asset.id}
                    className="p-3 rounded-xl border bg-card hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: `${config.color}20` }}>
                          <Icon className="h-4 w-4" style={{ color: config.color }} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{asset.name}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {config.label}
                            </Badge>
                            {asset.notes && (
                              <span className="text-xs text-muted-foreground">{asset.notes}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="font-bold">{formatPrice(asset.value)}</p>
                          <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(asset)}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => deleteAsset.mutate(asset.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-1 mt-2" />
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Stats */}
          {savingsAssets.length > 0 && (
            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-emerald-500/10">
                  <p className="text-xs text-muted-foreground">Total épargnes liquides</p>
                  <p className="text-lg font-bold text-emerald-600">{formatPrice(totalSavings)}</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <p className="text-xs text-muted-foreground">% de la valeur nette</p>
                  <p className="text-lg font-bold text-primary">
                    {netWorth > 0 ? ((totalSavings / netWorth) * 100).toFixed(0) : 0}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
