import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

interface Alert {
  id: string;
  alert_type: string;
  category?: string;
  city?: string;
  email_enabled: boolean;
}

interface AlertsManagerProps {
  userId: string | undefined;
}

export const AlertsManager = ({ userId }: AlertsManagerProps) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [newAlertType, setNewAlertType] = useState<string>("all");
  const [newCategory, setNewCategory] = useState<string>("");
  const [newCity, setNewCity] = useState<string>("");
  const [emailEnabled, setEmailEnabled] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchAlerts();
    }
  }, [userId]);

  const fetchAlerts = async () => {
    const { data, error } = await supabase
      .from("user_alerts")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching alerts:", error);
    } else if (data) {
      setAlerts(data);
    }
  };

  const addAlert = async () => {
    if (!userId) return;

    const alertData: any = {
      user_id: userId,
      alert_type: newAlertType,
      email_enabled: emailEnabled,
    };

    if (newAlertType === "category" && newCategory) {
      alertData.category = newCategory;
    } else if (newAlertType === "city" && newCity) {
      alertData.city = newCity;
    } else if (newAlertType !== "all") {
      toast.error("Veuillez remplir tous les champs requis");
      return;
    }

    const { error } = await supabase.from("user_alerts").insert(alertData);

    if (error) {
      toast.error("Erreur lors de la création de l'alerte");
      console.error(error);
    } else {
      toast.success("Alerte créée avec succès");
      fetchAlerts();
      setNewAlertType("all");
      setNewCategory("");
      setNewCity("");
      setEmailEnabled(false);
    }
  };

  const deleteAlert = async (alertId: string) => {
    const { error } = await supabase
      .from("user_alerts")
      .delete()
      .eq("id", alertId);

    if (error) {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    } else {
      toast.success("Alerte supprimée");
      fetchAlerts();
    }
  };

  const getAlertDescription = (alert: Alert) => {
    switch (alert.alert_type) {
      case "all":
        return "Toutes les nouvelles annonces";
      case "category":
        return `Catégorie: ${alert.category}`;
      case "city":
        return `Ville: ${alert.city}`;
      default:
        return alert.alert_type;
    }
  };

  if (!userId) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Alertes personnalisées
        </CardTitle>
        <CardDescription>
          Recevez des notifications pour les nouvelles annonces qui vous intéressent
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Type d'alerte</Label>
            <Select value={newAlertType} onValueChange={setNewAlertType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les annonces</SelectItem>
                <SelectItem value="category">Par catégorie</SelectItem>
                <SelectItem value="city">Par ville</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {newAlertType === "category" && (
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activite_sport_loisir">Activité sport loisir</SelectItem>
                  <SelectItem value="art_spectacle_cinema">Art spectacle cinéma</SelectItem>
                  <SelectItem value="hebergement">Hébergement</SelectItem>
                  <SelectItem value="bar_bistro_discotheque">Bar bistro discothèque</SelectItem>
                  <SelectItem value="beaute_esthetique">Beauté esthétique</SelectItem>
                  <SelectItem value="boutique_commerce_detail">Boutique commerce détail</SelectItem>
                  <SelectItem value="cabinet_conseil_service">Cabinet conseil service</SelectItem>
                  <SelectItem value="commerce_ligne">Commerce en ligne</SelectItem>
                  <SelectItem value="communications_informatique">Communications informatique</SelectItem>
                  <SelectItem value="construction_renovation">Construction rénovation</SelectItem>
                  <SelectItem value="depanneur_epicerie">Dépanneur épicerie</SelectItem>
                  <SelectItem value="educatif_formation">Éducatif formation</SelectItem>
                  <SelectItem value="equipement_machinerie">Équipement machinerie</SelectItem>
                  <SelectItem value="finance_comptabilite">Finance comptabilité</SelectItem>
                  <SelectItem value="franchise">Franchise</SelectItem>
                  <SelectItem value="garage_mecanique_concessionnaire">Garage mécanique concessionnaire</SelectItem>
                  <SelectItem value="garderie">Garderie</SelectItem>
                  <SelectItem value="grossiste_distributeur">Grossiste distributeur</SelectItem>
                  <SelectItem value="immobilier">Immobilier</SelectItem>
                  <SelectItem value="import_export">Import export</SelectItem>
                  <SelectItem value="imprimerie_graphisme">Imprimerie graphisme</SelectItem>
                  <SelectItem value="pharmaceutique_medical">Pharmaceutique médical</SelectItem>
                  <SelectItem value="production_transformation">Production transformation</SelectItem>
                  <SelectItem value="residence_personnes_agees">Résidence personnes âgées</SelectItem>
                  <SelectItem value="sante_dentaire_veterinaire">Santé dentaire vétérinaire</SelectItem>
                  <SelectItem value="services_professionnels">Services professionnels</SelectItem>
                  <SelectItem value="tourisme_voyage">Tourisme voyage</SelectItem>
                  <SelectItem value="transport_logistique">Transport logistique</SelectItem>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {newAlertType === "city" && (
            <div className="space-y-2">
              <Label>Ville</Label>
              <Select value={newCity} onValueChange={setNewCity}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une ville" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Montréal">Montréal</SelectItem>
                  <SelectItem value="Québec">Québec</SelectItem>
                  <SelectItem value="Laval">Laval</SelectItem>
                  <SelectItem value="Gatineau">Gatineau</SelectItem>
                  <SelectItem value="Longueuil">Longueuil</SelectItem>
                  <SelectItem value="Sherbrooke">Sherbrooke</SelectItem>
                  <SelectItem value="Trois-Rivières">Trois-Rivières</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Switch
              id="email"
              checked={emailEnabled}
              onCheckedChange={setEmailEnabled}
            />
            <Label htmlFor="email">Recevoir aussi par email</Label>
          </div>

          <Button onClick={addAlert} className="w-full">
            Créer l'alerte
          </Button>
        </div>

        <div className="space-y-2">
          <h4 className="font-semibold">Mes alertes actives</h4>
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune alerte active</p>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{getAlertDescription(alert)}</p>
                    {alert.email_enabled && (
                      <p className="text-xs text-muted-foreground">
                        + Notifications email
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteAlert(alert.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};