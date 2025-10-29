import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Flag } from "lucide-react";

interface ReportBusinessDialogProps {
  businessId: string;
  businessTitle: string;
}

export const ReportBusinessDialog = ({ businessId, businessTitle }: ReportBusinessDialogProps) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!reason) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez sélectionner une raison",
      });
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Vous devez être connecté pour signaler une annonce",
      });
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("business_reports").insert({
      business_id: businessId,
      reporter_id: user.id,
      reason,
      details: details.trim() || null,
    });

    setLoading(false);

    if (error) {
      console.error("Error reporting business:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de soumettre le signalement",
      });
      return;
    }

    toast({
      title: "Signalement envoyé",
      description: "Merci pour votre signalement. Notre équipe va l'examiner.",
    });

    setOpen(false);
    setReason("");
    setDetails("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <Flag className="w-4 h-4 mr-2" />
          Signaler
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Signaler cette annonce</DialogTitle>
          <DialogDescription>
            Signalez "{businessTitle}" si vous pensez qu'elle enfreint nos conditions d'utilisation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="reason">Raison du signalement *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une raison" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fraud">Annonce frauduleuse ou arnaque</SelectItem>
                <SelectItem value="misleading">Informations trompeuses</SelectItem>
                <SelectItem value="duplicate">Annonce dupliquée</SelectItem>
                <SelectItem value="inappropriate">Contenu inapproprié</SelectItem>
                <SelectItem value="spam">Spam ou publicité non autorisée</SelectItem>
                <SelectItem value="sold">Entreprise déjà vendue (non marquée)</SelectItem>
                <SelectItem value="other">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="details">Détails (optionnel)</Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Fournissez plus de détails sur votre signalement..."
              rows={4}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Envoi..." : "Soumettre le signalement"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};