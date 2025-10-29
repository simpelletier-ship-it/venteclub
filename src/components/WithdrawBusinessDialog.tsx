import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

interface WithdrawBusinessDialogProps {
  business: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const WithdrawBusinessDialog = ({ 
  business, 
  open, 
  onOpenChange, 
  onSuccess 
}: WithdrawBusinessDialogProps) => {
  const [action, setAction] = useState<"sold" | "delete">("sold");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (action === "sold") {
        // Marquer comme vendue
        const { error } = await supabase
          .from("businesses")
          .update({
            status: "sold",
            sold_at: new Date().toISOString(),
            withdrawal_reason: reason || "Entreprise vendue"
          })
          .eq("id", business.id);

        if (error) throw error;

        toast.success("Annonce marquée comme vendue! Elle restera visible 3 mois.");
      } else {
        // Supprimer définitivement
        if (!reason.trim()) {
          toast.error("Veuillez indiquer une raison pour la suppression");
          setLoading(false);
          return;
        }

        const { error } = await supabase
          .from("businesses")
          .update({
            status: "archived",
            withdrawal_reason: reason
          })
          .eq("id", business.id);

        if (error) throw error;

        toast.success("Annonce supprimée avec succès");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erreur: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Retirer l'annonce</DialogTitle>
          <DialogDescription>
            Choisissez l'action à effectuer pour cette annonce
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={action} onValueChange={(value: any) => setAction(value)}>
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/5">
              <RadioGroupItem value="sold" id="sold" />
              <Label htmlFor="sold" className="flex-1 cursor-pointer">
                <div className="font-medium">Marquer comme vendue</div>
                <div className="text-xs text-muted-foreground">
                  L'annonce affichera "Vendue" et restera visible 3 mois
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent/5">
              <RadioGroupItem value="delete" id="delete" />
              <Label htmlFor="delete" className="flex-1 cursor-pointer">
                <div className="font-medium">Supprimer l'annonce</div>
                <div className="text-xs text-muted-foreground">
                  L'annonce sera retirée immédiatement et définitivement
                </div>
              </Label>
            </div>
          </RadioGroup>

          <div className="space-y-2">
            <Label htmlFor="reason">
              Raison {action === "delete" && "(obligatoire)"}
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                action === "sold" 
                  ? "Optionnel: Ajoutez des détails sur la vente..." 
                  : "Expliquez pourquoi vous supprimez cette annonce..."
              }
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Traitement..." : "Confirmer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};