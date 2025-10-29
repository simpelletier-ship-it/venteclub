import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, X } from "lucide-react";
import { businessSchema } from "@/lib/validations";

const ListBusiness = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    industry: "",
    location: "",
    annual_revenue: "",
    asking_price: "",
    profit_margin: "",
    employees_count: "",
    year_established: "",
    seller_email: "",
    seller_phone: "",
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });
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
    
    // Create preview URLs
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
    setLoading(true);

    try {
      // Validate with Zod
      const validatedData = businessSchema.parse({
        title: formData.title,
        description: formData.description,
        industry: formData.industry,
        location: formData.location,
        annual_revenue: formData.annual_revenue ? parseFloat(formData.annual_revenue) : null,
        asking_price: parseFloat(formData.asking_price),
        profit_margin: formData.profit_margin ? parseFloat(formData.profit_margin) : null,
        employees_count: formData.employees_count ? parseInt(formData.employees_count) : null,
        year_established: formData.year_established ? parseInt(formData.year_established) : null,
      });

      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .insert({
          seller_id: user.id,
          title: validatedData.title,
          description: validatedData.description,
          industry: validatedData.industry,
          location: validatedData.location,
          annual_revenue: validatedData.annual_revenue,
          asking_price: validatedData.asking_price,
          profit_margin: validatedData.profit_margin,
          employees_count: validatedData.employees_count,
          year_established: validatedData.year_established,
          status: "active",
        } as any)
        .select()
        .single();

      if (businessError) throw businessError;

      // Upload photos if any
      if (photos.length > 0 && businessData) {
        for (let i = 0; i < photos.length; i++) {
          const file = photos[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${businessData.id}/${Date.now()}-${i}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('business-photos')
            .upload(fileName, file);

          if (uploadError) {
            console.error('Photo upload error:', uploadError);
            continue;
          }

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

      // Create or update seller contact info
      if (formData.seller_email || formData.seller_phone) {
        const { error: contactError } = await supabase
          .from('seller_contacts')
          .upsert({
            seller_id: user.id,
            email: formData.seller_email,
            phone: formData.seller_phone,
          }, {
            onConflict: 'seller_id'
          });

        if (contactError) {
          console.error('Contact info error:', contactError);
        }
      }

      toast({
        title: "Succès !",
        description: "Votre entreprise a été listée avec succès.",
      });
      navigate("/dashboard");
    } catch (error: any) {
      if (error.errors) {
        // Zod validation errors
        error.errors.forEach((err: any) => {
          toast({
            variant: "destructive",
            title: "Erreur de validation",
            description: err.message,
          });
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: error.message,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10">
      <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center cursor-pointer" onClick={() => navigate("/")}>
            <span className="text-2xl font-bold">
              Vente<span className="text-accent">.Club</span>
            </span>
          </div>
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Listez votre entreprise
          </h1>
          <p className="text-muted-foreground mb-8">
            Remplissez les détails pour mettre votre entreprise en vente
          </p>

          <form onSubmit={handleSubmit} className="space-y-6 bg-card p-8 rounded-2xl shadow-elegant border border-border/50">
            <div>
              <Label htmlFor="title">Titre de l'annonce *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="Ex: Restaurant italien bien établi à Montréal"
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={6}
                placeholder="Décrivez votre entreprise en détail..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="industry">Industrie *</Label>
                <Select
                  value={formData.industry}
                  onValueChange={(value) => setFormData({ ...formData, industry: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restaurant">Restaurant</SelectItem>
                    <SelectItem value="boutique_commerce_detail">Commerce de détail</SelectItem>
                    <SelectItem value="entreprise_service">Services</SelectItem>
                    <SelectItem value="communications_informatique">Technologie</SelectItem>
                    <SelectItem value="batiment_immeuble">Immobilier</SelectItem>
                    <SelectItem value="residence_sante">Santé</SelectItem>
                    <SelectItem value="education_garderie">Éducation</SelectItem>
                    <SelectItem value="industrie_manufacturier_transformation">Manufacturing</SelectItem>
                    <SelectItem value="transport_entreposage">Transport</SelectItem>
                    <SelectItem value="bar_bistro_discotheque">Bar / Bistro</SelectItem>
                    <SelectItem value="beaute_esthetique">Beauté / Esthétique</SelectItem>
                    <SelectItem value="camping">Camping</SelectItem>
                    <SelectItem value="hebergement">Hébergement</SelectItem>
                    <SelectItem value="domaine_alimentaire">Domaine alimentaire</SelectItem>
                    <SelectItem value="epicerie_depanneur">Épicerie / Dépanneur</SelectItem>
                    <SelectItem value="franchise">Franchise</SelectItem>
                    <SelectItem value="garage_mecanique_concessionnaire">Garage / Mécanique</SelectItem>
                    <SelectItem value="activite_sport_loisir">Sport / Loisir</SelectItem>
                    <SelectItem value="art_spectacle_cinema">Art / Spectacle</SelectItem>
                    <SelectItem value="entreprise_saisonniere">Entreprise saisonnière</SelectItem>
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
                  placeholder="Ex: Montréal, QC"
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
                  placeholder="250000"
                />
              </div>

              <div>
                <Label htmlFor="annual_revenue">Revenu annuel (CAD)</Label>
                <Input
                  id="annual_revenue"
                  type="number"
                  value={formData.annual_revenue}
                  onChange={(e) => setFormData({ ...formData, annual_revenue: e.target.value })}
                  placeholder="500000"
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
                  placeholder="25"
                />
              </div>

              <div>
                <Label htmlFor="employees_count">Nombre d'employés</Label>
                <Input
                  id="employees_count"
                  type="number"
                  value={formData.employees_count}
                  onChange={(e) => setFormData({ ...formData, employees_count: e.target.value })}
                  placeholder="10"
                />
              </div>

              <div>
                <Label htmlFor="year_established">Année de fondation</Label>
                <Input
                  id="year_established"
                  type="number"
                  value={formData.year_established}
                  onChange={(e) => setFormData({ ...formData, year_established: e.target.value })}
                  placeholder="2010"
                />
              </div>
            </div>

            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">Vos coordonnées</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Ces informations seront visibles uniquement aux acheteurs qui paient pour y accéder (5$ CAD).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="seller_email">Votre email *</Label>
                  <Input
                    id="seller_email"
                    type="email"
                    value={formData.seller_email}
                    onChange={(e) => setFormData({ ...formData, seller_email: e.target.value })}
                    required
                    placeholder="votre@email.com"
                  />
                </div>

                <div>
                  <Label htmlFor="seller_phone">Votre téléphone</Label>
                  <Input
                    id="seller_phone"
                    type="tel"
                    value={formData.seller_phone}
                    onChange={(e) => setFormData({ ...formData, seller_phone: e.target.value })}
                    placeholder="+1 (514) 123-4567"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="photos">Photos (maximum 10)</Label>
              <div className="mt-2">
                <Input
                  id="photos"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <label
                  htmlFor="photos"
                  className="flex items-center justify-center gap-2 p-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors"
                >
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Cliquez pour ajouter des photos
                  </span>
                </label>
              </div>
              
              {photoPreviewUrls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {photoPreviewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Publication..." : "Publier l'annonce"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/")} disabled={loading}>
                Annuler
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ListBusiness;
