import { useState } from "react";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatPrice } from "@/lib/priceFormat";

interface QuickNetWorthUpdateProps {
  currentNetWorth: number;
  isAuthenticated: boolean;
}

export const QuickNetWorthUpdate = ({ currentNetWorth, isAuthenticated }: QuickNetWorthUpdateProps) => {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const queryClient = useQueryClient();

  // Fetch current assets and debts
  const { data: assets = [] } = useQuery({
    queryKey: ['user-assets'],
    enabled: isAuthenticated && open,
    retry: 1,
    queryFn: async () => {
      const { data, error } = await supabase.from('user_assets').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: debts = [] } = useQuery({
    queryKey: ['user-debts'],
    enabled: isAuthenticated && open,
    retry: 1,
    queryFn: async () => {
      const { data, error } = await supabase.from('user_debts').select('*');
      if (error) throw error;
      return data || [];
    },
  });

  // Record snapshot mutation
  const recordSnapshot = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Record asset history for all assets
      const assetInserts = assets.map(asset => ({
        user_id: user.id,
        asset_id: asset.id,
        value: asset.value,
        recorded_at: new Date(recordDate).toISOString(),
        notes: notes || null,
      }));

      // Record debt history for all debts
      const debtInserts = debts.map(debt => ({
        user_id: user.id,
        debt_id: debt.id,
        balance: debt.balance,
        recorded_at: new Date(recordDate).toISOString(),
        notes: notes || null,
      }));

      // Insert in parallel
      const promises = [];
      
      if (assetInserts.length > 0) {
        promises.push(
          supabase.from('asset_history').insert(assetInserts)
        );
      }
      
      if (debtInserts.length > 0) {
        promises.push(
          supabase.from('debt_history').insert(debtInserts)
        );
      }

      if (promises.length === 0) {
        throw new Error("Aucun actif ou dette à enregistrer. Ajoutez des actifs/dettes d'abord.");
      }

      const results = await Promise.all(promises);
      const error = results.find(r => r.error)?.error;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['net-worth-history'] });
      toast.success("📊 Snapshot enregistré avec succès!");
      setOpen(false);
      setNotes("");
      setRecordDate(new Date().toISOString().split('T')[0]);
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    recordSnapshot.mutate();
  };

  const totalAssets = assets.reduce((sum, a) => sum + Number(a.value), 0);
  const totalDebts = debts.reduce((sum, d) => sum + Number(d.balance), 0);
  const calculatedNetWorth = totalAssets - totalDebts;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="gap-2 hover:bg-primary hover:text-primary-foreground transition-all"
        >
          <Plus className="h-4 w-4" />
          Enregistrer l'évolution
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>📈 Enregistrer une mise à jour</DialogTitle>
          <DialogDescription>
            Créez un snapshot de votre situation financière actuelle
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current snapshot preview */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Actifs totaux</span>
              <span className="font-semibold text-green-600">{formatPrice(totalAssets)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Dettes totales</span>
              <span className="font-semibold text-red-600">{formatPrice(totalDebts)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm font-medium">Valeur nette</span>
              <div className="flex items-center gap-2">
                {calculatedNetWorth >= currentNetWorth ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className={`font-bold text-lg ${calculatedNetWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPrice(calculatedNetWorth)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <Label>Date de l'enregistrement</Label>
            <Input 
              type="date" 
              value={recordDate}
              onChange={(e) => setRecordDate(e.target.value)}
              className="mt-1"
              required
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <Label>Notes (optionnel)</Label>
            <Textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Reçu bonus de fin d'année, remboursé prêt auto..."
              className="mt-1"
              rows={3}
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 text-sm text-muted-foreground">
            <p>💡 Enregistrez régulièrement pour voir votre progression dans le graphique d'évolution.</p>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={recordSnapshot.isPending || assets.length === 0}
          >
            {recordSnapshot.isPending ? "Enregistrement..." : "Enregistrer le snapshot"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
