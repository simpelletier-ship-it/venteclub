import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Plus, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface SimpleNetWorthTrackerProps {
  currentNetWorth: number;
  isAuthenticated: boolean;
}

export const SimpleNetWorthTracker = ({ currentNetWorth, isAuthenticated }: SimpleNetWorthTrackerProps) => {
  const queryClient = useQueryClient();
  const [totalAssets, setTotalAssets] = useState("");
  const [totalDebts, setTotalDebts] = useState("");
  const [snapshotDate, setSnapshotDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  // Record net worth snapshot
  const recordSnapshot = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const assets = parseFloat(totalAssets) || 0;
      const debts = parseFloat(totalDebts) || 0;
      const netWorth = assets - debts;
      const recordedAt = format(snapshotDate, 'yyyy-MM-dd');

      // Record in asset history (as a single "Total Assets" entry)
      const { error: assetError } = await supabase
        .from('asset_history')
        .insert({
          user_id: user.id,
          asset_id: '00000000-0000-0000-0000-000000000000', // Special ID for total
          value: assets,
          recorded_at: recordedAt,
          notes: notes || `Actifs totaux au ${format(snapshotDate, 'd MMMM yyyy', { locale: fr })}`,
        });

      if (assetError) throw assetError;

      // Record in debt history (as a single "Total Debts" entry)
      const { error: debtError } = await supabase
        .from('debt_history')
        .insert({
          user_id: user.id,
          debt_id: '00000000-0000-0000-0000-000000000000', // Special ID for total
          balance: debts,
          recorded_at: recordedAt,
          notes: notes || `Dettes totales au ${format(snapshotDate, 'd MMMM yyyy', { locale: fr })}`,
        });

      if (debtError) throw debtError;

      return { assets, debts, netWorth };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['net-worth-history'] });
      queryClient.invalidateQueries({ queryKey: ['user-assets'] });
      queryClient.invalidateQueries({ queryKey: ['user-debts'] });
      
      if (data.netWorth > currentNetWorth) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#22c55e', '#16a34a', '#15803d']
        });
      }
      
      toast.success("📊 Actif net enregistré avec succès!", { duration: 3000 });
      setIsExpanded(false);
      setTotalAssets("");
      setTotalDebts("");
      setNotes("");
      setSnapshotDate(new Date());
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de l'enregistrement");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const assets = parseFloat(totalAssets);
    const debts = parseFloat(totalDebts);

    if (isNaN(assets) || assets < 0) {
      toast.error("Le montant des actifs doit être un nombre positif");
      return;
    }

    if (isNaN(debts) || debts < 0) {
      toast.error("Le montant des dettes doit être un nombre positif");
      return;
    }

    recordSnapshot.mutate();
  };

  const calculatedNetWorth = (parseFloat(totalAssets) || 0) - (parseFloat(totalDebts) || 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ma valeur nette</CardTitle>
        <CardDescription>Suivez l'évolution de votre patrimoine dans le temps</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Enregistrez périodiquement vos actifs et dettes totaux pour suivre l'évolution de votre patrimoine.
        </p>

        {!isExpanded ? (
          <Button 
            onClick={() => setIsExpanded(true)} 
            variant="outline" 
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            Calculer ma valeur nette
          </Button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Date du bilan</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1",
                      !snapshotDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {snapshotDate ? format(snapshotDate, "d MMMM yyyy", { locale: fr }) : "Choisir la date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={snapshotDate}
                    onSelect={(date) => date && setSnapshotDate(date)}
                    initialFocus
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Total de mes actifs 💰</Label>
              <CurrencyInput
                value={totalAssets}
                onChange={setTotalAssets}
                placeholder="REER, CELI, maison, épargne..."
                className="mt-1"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Incluez REER, CELI, valeur de votre maison, épargne, placements, etc.
              </p>
            </div>

            <div>
              <Label>Total de mes passifs 💳</Label>
              <CurrencyInput
                value={totalDebts}
                onChange={setTotalDebts}
                placeholder="Hypothèque, prêts, cartes de crédit..."
                className="mt-1"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Incluez hypothèque, prêt auto, cartes de crédit, prêts étudiants, etc.
              </p>
            </div>

            {/* Live preview */}
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-sm text-muted-foreground mb-2">Aperçu de votre valeur nette</div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">Actifs</span>
                <span className="text-sm font-medium text-green-600">
                  {totalAssets ? `${parseFloat(totalAssets).toLocaleString('fr-CA')} $` : '0 $'}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Passifs</span>
                <span className="text-sm font-medium text-red-600">
                  {totalDebts ? `${parseFloat(totalDebts).toLocaleString('fr-CA')} $` : '0 $'}
                </span>
              </div>
              <div className="pt-2 border-t flex items-center justify-between">
                <span className="font-medium">Valeur nette</span>
                <div className="flex items-center gap-2">
                  {calculatedNetWorth >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className={`text-lg font-bold ${calculatedNetWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {calculatedNetWorth.toLocaleString('fr-CA')} $
                  </span>
                </div>
              </div>
            </div>

            <div>
              <Label>Notes (facultatif)</Label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Augmentation de salaire, vente de voiture..."
                className="w-full mt-1 px-3 py-2 rounded-md border border-input bg-background text-sm"
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsExpanded(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button type="submit" className="flex-1" disabled={recordSnapshot.isPending}>
                <Plus className="mr-2 h-4 w-4" />
                {recordSnapshot.isPending ? "Calcul..." : "Calculer"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
};
