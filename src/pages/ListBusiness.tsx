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
import { ArrowLeft, Upload, X } from "lucide-react";
import { businessSchema } from "@/lib/validations";
import { TermsDialog } from "@/components/TermsDialog";

const ListBusiness = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  
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
  const [generatingImage, setGeneratingImage] = useState(false);

  useEffect(() => {
    // Check initial session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    };

    checkSession();

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
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

  const handleGenerateImage = async () => {
    // Vérifier que le titre et la description sont remplis
    if (!formData.title || !formData.description) {
      toast({
        variant: "destructive",
        title: "Informations manquantes",
        description: "Veuillez remplir le titre et la description avant de générer une image.",
      });
      return;
    }

    if (photos.length >= 10) {
      toast({
        variant: "destructive",
        title: "Limite atteinte",
        description: "Vous avez déjà atteint la limite de 10 photos.",
      });
      return;
    }

    setGeneratingImage(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-business-image', {
        body: {
          title: formData.title,
          description: formData.description,
          industry: formData.industry,
        }
      });

      if (error) throw error;

      if (!data?.imageUrl) {
        throw new Error("Aucune image générée");
      }

      // Convertir le base64 en fichier
      const response = await fetch(data.imageUrl);
      const blob = await response.blob();
      const file = new File([blob], `ai-generated-${Date.now()}.png`, { type: 'image/png' });

      setPhotos([...photos, file]);
      setPhotoPreviewUrls([...photoPreviewUrls, data.imageUrl]);

      toast({
        title: "Image générée !",
        description: "L'image a été générée avec succès par l'IA.",
      });
    } catch (error: any) {
      console.error("Erreur génération image:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de générer l'image. Veuillez réessayer.",
      });
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Vérifier l'acceptation des conditions
    if (!termsAccepted) {
      toast({
        variant: "destructive",
        title: "Conditions non acceptées",
        description: "Vous devez accepter les conditions d'utilisation pour publier une annonce.",
      });
      return;
    }

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

      // Send email notification (commented out temporarily due to resend package issue)
      // await supabase.functions.invoke('send-approval-email', {
      //   body: {
      //     email: formData.seller_email,
      //     businessTitle: validatedData.title,
      //     status: 'pending',
      //   }
      // });

      toast({
        title: "Succès !",
        description: "Votre annonce a été soumise et est en attente d'approbation. Vous recevrez un email de confirmation.",
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
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une industrie" />
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
                    <SelectItem value="industrie_manufacturier_transformation">Manufacturing / Transformation</SelectItem>
                    <SelectItem value="transport_entreposage">Transport / Entreposage</SelectItem>
                    <SelectItem value="camping">Camping</SelectItem>
                    <SelectItem value="hebergement">Hébergement</SelectItem>
                    <SelectItem value="domaine_alimentaire">Domaine alimentaire</SelectItem>
                    <SelectItem value="franchise">Franchise</SelectItem>
                    <SelectItem value="garage_mecanique_concessionnaire">Garage / Mécanique</SelectItem>
                    <SelectItem value="activite_sport_loisir">Activités sportives / Loisirs</SelectItem>
                    <SelectItem value="art_spectacle_cinema">Arts / Spectacles / Cinéma</SelectItem>
                    <SelectItem value="centre_equestre_erabliere">Centre équestre / Érablière</SelectItem>
                    <SelectItem value="developpement_domaine">Développement de domaine</SelectItem>
                    <SelectItem value="distribution_commerce_gros">Distribution / Commerce de gros</SelectItem>
                    <SelectItem value="entreprise_saisonniere">Entreprise saisonnière</SelectItem>
                    <SelectItem value="immeuble_revenus">Immeuble à revenus</SelectItem>
                    <SelectItem value="jardin_pepiniere_verger_vignoble">Jardin / Pépinière / Verger</SelectItem>
                    <SelectItem value="pourvoirie_centre_plein_air">Pourvoirie / Plein air</SelectItem>
                    <SelectItem value="residentiel">Résidentiel</SelectItem>
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
                <Label htmlFor="annual_revenue">Chiffre d'affaires annuel (CAD)</Label>
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
              <div className="mt-2 space-y-3">
                <label
                  htmlFor="photos"
                  className="flex items-center justify-center gap-2 p-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors"
                >
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Cliquez pour ajouter des photos
                  </span>
                </label>
                <Input
                  id="photos"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      ou
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGenerateImage}
                  disabled={generatingImage || !formData.title || !formData.description}
                >
                  {generatingImage ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <svg
                        className="mr-2 h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                      Générer une image par IA
                    </>
                  )}
                </Button>
                {(!formData.title || !formData.description) && (
                  <p className="text-xs text-muted-foreground text-center">
                    Remplissez le titre et la description pour générer une image
                  </p>
                )}
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

            {/* Acceptation des conditions */}
            <div className="flex items-start space-x-3 p-4 bg-accent/10 rounded-lg border border-accent/20">
              <Checkbox 
                id="terms" 
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  J&apos;accepte les conditions d&apos;utilisation *
                </label>
                <p className="text-sm text-muted-foreground">
                  En publiant mon annonce, je confirme avoir lu et accepté le{" "}
                  <button
                    type="button"
                    onClick={() => setTermsDialogOpen(true)}
                    className="text-accent hover:underline font-medium"
                  >
                    Contrat d&apos;utilisation
                  </button>
                  , incluant le partage de mes coordonnées et la décharge de responsabilité.
                </p>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading || !termsAccepted} className="flex-1">
                {loading ? "Publication..." : "Publier l'annonce"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/")} disabled={loading}>
                Annuler
              </Button>
            </div>
          </form>
        </div>
      </div>
      
      <TermsDialog open={termsDialogOpen} onOpenChange={setTermsDialogOpen} />
    </div>
  );
};

export default ListBusiness;
