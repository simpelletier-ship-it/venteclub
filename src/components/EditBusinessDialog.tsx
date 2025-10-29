import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EditBusinessDialogProps {
  business: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditBusinessDialog = ({ business, open, onOpenChange, onSuccess }: EditBusinessDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: business.title || "",
    description: business.description || "",
    industry: business.industry || "",
    location: business.location || "",
    city: business.city || "",
    province: business.province || "Québec",
    asking_price: business.asking_price?.toString() || "",
    annual_revenue: business.annual_revenue?.toString() || "",
    profit_margin: business.profit_margin?.toString() || "",
    employees_count: business.employees_count?.toString() || "",
    year_established: business.year_established?.toString() || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Créer une proposition de modification
      const { error } = await supabase
        .from("business_edit_proposals")
        .insert({
          business_id: business.id,
          user_id: user.id,
          proposed_changes: {
            title: formData.title,
            description: formData.description,
            industry: formData.industry,
            location: formData.location,
            city: formData.city,
            province: formData.province,
            asking_price: formData.asking_price ? parseFloat(formData.asking_price) : null,
            annual_revenue: formData.annual_revenue ? parseFloat(formData.annual_revenue) : null,
            profit_margin: formData.profit_margin ? parseFloat(formData.profit_margin) : null,
            employees_count: formData.employees_count ? parseInt(formData.employees_count) : null,
            year_established: formData.year_established ? parseInt(formData.year_established) : null,
          },
        });

      if (error) throw error;

      toast({
        title: "Proposition envoyée",
        description: "Vos modifications ont été soumises et sont en attente d'approbation.",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier l'annonce</DialogTitle>
          <DialogDescription>
            Proposez des modifications. Elles seront examinées par un administrateur avant d'être appliquées.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="industry">Industrie *</Label>
              <Select
                value={formData.industry}
                onValueChange={(value) => setFormData({ ...formData, industry: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="bar_bistro_discotheque">Bar / Bistro / Discothèque</SelectItem>
                  <SelectItem value="boutique_commerce_detail">Commerce de détail</SelectItem>
                  <SelectItem value="epicerie_depanneur">Épicerie / Dépanneur</SelectItem>
                  <SelectItem value="entreprise_service">Services professionnels</SelectItem>
                  <SelectItem value="communications_informatique">Technologie / Informatique</SelectItem>
                  <SelectItem value="batiment_immeuble">Immobilier / Bâtiment</SelectItem>
                  <SelectItem value="construction_excavation_renovation">Construction / Rénovation</SelectItem>
                  <SelectItem value="residence_sante">Santé / Résidence</SelectItem>
                  <SelectItem value="education_garderie">Éducation / Garderie</SelectItem>
                  <SelectItem value="beaute_esthetique">Beauté / Esthétique</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location">Localisation *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="asking_price">Prix demandé (CAD) *</Label>
              <Input
                id="asking_price"
                type="number"
                value={formData.asking_price}
                onChange={(e) => setFormData({ ...formData, asking_price: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="annual_revenue">Chiffre d'affaires annuel</Label>
              <Input
                id="annual_revenue"
                type="number"
                value={formData.annual_revenue}
                onChange={(e) => setFormData({ ...formData, annual_revenue: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="profit_margin">Marge de profit (%)</Label>
              <Input
                id="profit_margin"
                type="number"
                step="0.01"
                value={formData.profit_margin}
                onChange={(e) => setFormData({ ...formData, profit_margin: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="employees_count">Nombre d'employés</Label>
              <Input
                id="employees_count"
                type="number"
                value={formData.employees_count}
                onChange={(e) => setFormData({ ...formData, employees_count: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="year_established">Année de fondation</Label>
              <Input
                id="year_established"
                type="number"
                value={formData.year_established}
                onChange={(e) => setFormData({ ...formData, year_established: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Envoi en cours..." : "Soumettre les modifications"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
