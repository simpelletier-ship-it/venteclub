import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, ArrowLeft } from "lucide-react";
import { TermsDialog } from "@/components/TermsDialog";

const ListFranchise = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);

  const quebecCities = [
    "Montréal", "Québec", "Laval", "Gatineau", "Longueuil", "Sherbrooke", "Saguenay", "Lévis", "Trois-Rivières", "Terrebonne",
    "Saint-Jean-sur-Richelieu", "Repentigny", "Boucherville", "Drummondville", "Saint-Jérôme", "Granby", "Blainville", "Saint-Hyacinthe",
  ].sort();

  const quebecRegions = [
    "Bas-Saint-Laurent", "Saguenay–Lac-Saint-Jean", "Capitale-Nationale", "Mauricie", "Estrie", "Montréal",
    "Outaouais", "Abitibi-Témiscamingue", "Côte-Nord", "Nord-du-Québec", "Gaspésie–Îles-de-la-Madeleine",
    "Chaudière-Appalaches", "Laval", "Lanaudière", "Laurentides", "Montérégie", "Centre-du-Québec",
  ].sort();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    industry: "",
    location: "",
    city: "",
    region: "",
    province: "Québec",
    franchise_fee: "",
    royalty_percentage: "",
    marketing_fee: "",
    initial_investment_min: "",
    initial_investment_max: "",
    training_provided: false,
    franchise_term_years: "",
    territory_available: "",
    seller_email: "",
    seller_phone: "",
  });

  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    };
    checkSession();
  }, [navigate]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + photos.length > 10) {
      toast({
        variant: "destructive",
        title: "Limite dépassée",
        description: "Vous pouvez télécharger un maximum de 10 photos.",
      });
      return;
    }

    setPhotos([...photos, ...files]);
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setPhotoPreviewUrls([...photoPreviewUrls, ...newPreviewUrls]);
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviewUrls[index]);
    setPhotos(photos.filter((_, i) => i !== index));
    setPhotoPreviewUrls(photoPreviewUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!termsAccepted) {
      toast({
        variant: "destructive",
        title: "Conditions non acceptées",
        description: "Vous devez accepter les conditions d'utilisation.",
      });
      return;
    }

    if (!formData.title || !formData.description || !formData.industry || !formData.location || !formData.franchise_fee) {
      toast({
        variant: "destructive",
        title: "Champs requis manquants",
        description: "Veuillez remplir tous les champs obligatoires.",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .insert({
          seller_id: user.id,
          title: formData.title,
          description: formData.description,
          industry: formData.industry,
          location: formData.location,
          city: formData.city,
          region: formData.region,
          province: formData.province,
          asking_price: parseFloat(formData.franchise_fee),
          franchise_fee: parseFloat(formData.franchise_fee),
          royalty_percentage: formData.royalty_percentage ? parseFloat(formData.royalty_percentage) : null,
          marketing_fee: formData.marketing_fee ? parseFloat(formData.marketing_fee) : null,
          initial_investment_min: formData.initial_investment_min ? parseFloat(formData.initial_investment_min) : null,
          initial_investment_max: formData.initial_investment_max ? parseFloat(formData.initial_investment_max) : null,
          training_provided: formData.training_provided,
          franchise_term_years: formData.franchise_term_years ? parseInt(formData.franchise_term_years) : null,
          territory_available: formData.territory_available,
          is_franchise: true,
          status: "active",
          approval_status: "pending",
        } as any)
        .select()
        .single();

      if (businessError) throw businessError;

      // Upload photos
      if (photos.length > 0) {
        for (let i = 0; i < photos.length; i++) {
          const file = photos[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${businessData.id}/${Date.now()}-${i}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('business-photos')
            .upload(fileName, file);

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('business-photos')
              .getPublicUrl(fileName);

            await supabase.from('business_photos').insert({
              business_id: businessData.id,
              photo_url: publicUrl,
              display_order: i,
            });
          }
        }
      }

      // Save seller contact info
      if (formData.seller_email || formData.seller_phone) {
        await supabase.from('seller_contacts').upsert({
          seller_id: user.id,
          email: formData.seller_email || user.email,
          phone: formData.seller_phone || null,
        });
      }

      toast({
        title: "Franchise publiée !",
        description: "Votre franchise a été soumise et est en attente d'approbation.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error('Error:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/list-business")}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>

          <div className="bg-card rounded-2xl shadow-elegant border border-border/50 p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">🏢 Vendre une Franchise</h1>
              <p className="text-muted-foreground">
                Formulaire spécialisé pour les opportunités de franchises
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Informations de base */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold border-b pb-2">Informations de base</h2>
                
                <div>
                  <Label htmlFor="title">Nom de la franchise *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Franchise Restaurant Tim Hortons"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={6}
                    placeholder="Décrivez votre opportunité de franchise..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="industry">Secteur d'activité *</Label>
                    <Select value={formData.industry} onValueChange={(value) => setFormData({ ...formData, industry: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="restaurant">Restaurant</SelectItem>
                        <SelectItem value="beaute_esthetique">Beauté et Esthétique</SelectItem>
                        <SelectItem value="boutique_commerce_detail">Commerce de détail</SelectItem>
                        <SelectItem value="franchise">Franchise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="city">Ville *</Label>
                    <Select value={formData.city} onValueChange={(value) => setFormData({ ...formData, city: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {quebecCities.map((city) => (
                          <SelectItem key={city} value={city}>{city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Informations financières */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold border-b pb-2">Informations financières</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="franchise_fee">Droit d'entrée franchise ($) *</Label>
                    <Input
                      id="franchise_fee"
                      type="number"
                      value={formData.franchise_fee}
                      onChange={(e) => setFormData({ ...formData, franchise_fee: e.target.value })}
                      placeholder="Ex: 50000"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="royalty_percentage">Redevances (%)</Label>
                    <Input
                      id="royalty_percentage"
                      type="number"
                      step="0.1"
                      value={formData.royalty_percentage}
                      onChange={(e) => setFormData({ ...formData, royalty_percentage: e.target.value })}
                      placeholder="Ex: 5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="marketing_fee">Frais marketing (%)</Label>
                    <Input
                      id="marketing_fee"
                      type="number"
                      step="0.1"
                      value={formData.marketing_fee}
                      onChange={(e) => setFormData({ ...formData, marketing_fee: e.target.value })}
                      placeholder="Ex: 2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="franchise_term_years">Durée du contrat (années)</Label>
                    <Input
                      id="franchise_term_years"
                      type="number"
                      value={formData.franchise_term_years}
                      onChange={(e) => setFormData({ ...formData, franchise_term_years: e.target.value })}
                      placeholder="Ex: 10"
                    />
                  </div>

                  <div>
                    <Label htmlFor="initial_investment_min">Investissement minimum ($)</Label>
                    <Input
                      id="initial_investment_min"
                      type="number"
                      value={formData.initial_investment_min}
                      onChange={(e) => setFormData({ ...formData, initial_investment_min: e.target.value })}
                      placeholder="Ex: 200000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="initial_investment_max">Investissement maximum ($)</Label>
                    <Input
                      id="initial_investment_max"
                      type="number"
                      value={formData.initial_investment_max}
                      onChange={(e) => setFormData({ ...formData, initial_investment_max: e.target.value })}
                      placeholder="Ex: 500000"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="territory_available">Territoires disponibles</Label>
                  <Textarea
                    id="territory_available"
                    value={formData.territory_available}
                    onChange={(e) => setFormData({ ...formData, territory_available: e.target.value })}
                    rows={3}
                    placeholder="Ex: Montréal-Est, Laval, Rive-Sud..."
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="training_provided"
                    checked={formData.training_provided}
                    onCheckedChange={(checked) => setFormData({ ...formData, training_provided: checked as boolean })}
                  />
                  <Label htmlFor="training_provided" className="cursor-pointer">
                    Formation fournie
                  </Label>
                </div>
              </div>

              {/* Photos */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold border-b pb-2">Photos</h2>
                <div>
                  <Label htmlFor="photos">Ajouter des photos (maximum 10)</Label>
                  <Input
                    id="photos"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoChange}
                    className="cursor-pointer"
                  />
                </div>

                {photoPreviewUrls.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {photoPreviewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Contact */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold border-b pb-2">Coordonnées</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="seller_email">Email</Label>
                    <Input
                      id="seller_email"
                      type="email"
                      value={formData.seller_email}
                      onChange={(e) => setFormData({ ...formData, seller_email: e.target.value })}
                      placeholder="votre@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="seller_phone">Téléphone</Label>
                    <Input
                      id="seller_phone"
                      type="tel"
                      value={formData.seller_phone}
                      onChange={(e) => setFormData({ ...formData, seller_phone: e.target.value })}
                      placeholder="514-XXX-XXXX"
                    />
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                />
                <Label htmlFor="terms" className="cursor-pointer">
                  J'accepte les{" "}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setTermsDialogOpen(true);
                    }}
                    className="text-primary hover:underline"
                  >
                    conditions d'utilisation
                  </button>
                </Label>
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? "Publication..." : "Publier la franchise"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <TermsDialog open={termsDialogOpen} onOpenChange={setTermsDialogOpen} />
    </div>
  );
};

export default ListFranchise;
