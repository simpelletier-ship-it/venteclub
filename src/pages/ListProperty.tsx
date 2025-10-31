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
import { Upload, X, Home, Sparkles } from "lucide-react";
import { TermsDialog } from "@/components/TermsDialog";
import { CityCombobox } from "@/components/CityCombobox";

const ListProperty = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);

  const [improvingDescription, setImprovingDescription] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    property_type: "",
    location: "",
    city: "",
    province: "Québec",
    asking_price: "",
    square_footage: "",
    year_built: "",
    seller_email: "",
    seller_phone: "",
    is_rental_property: false,
  });
  const [rentalUnits, setRentalUnits] = useState<Array<{unit_type: string, monthly_rent: string, count: string}>>([
    { unit_type: "", monthly_rent: "", count: "" }
  ]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [priceNegotiable, setPriceNegotiable] = useState(false);

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
    const newPreviewUrls = files.map(file => URL.createObjectURL(file));
    setPhotoPreviewUrls([...photoPreviewUrls, ...newPreviewUrls]);
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviewUrls[index]);
    setPhotos(photos.filter((_, i) => i !== index));
    setPhotoPreviewUrls(photoPreviewUrls.filter((_, i) => i !== index));
  };

  const handleImproveDescription = async () => {
    if (!formData.description || !formData.title) {
      toast({
        variant: "destructive",
        title: "Informations manquantes",
        description: "Veuillez d'abord remplir le titre et la description.",
      });
      return;
    }

    setImprovingDescription(true);

    try {
      const { data, error } = await supabase.functions.invoke('improve-description', {
        body: {
          description: formData.description,
          title: formData.title,
          industry: formData.property_type || 'immobilier',
          type: 'property'
        }
      });

      if (error) throw error;

      if (data?.improvedDescription) {
        setFormData({ ...formData, description: data.improvedDescription });
        toast({
          title: "Description améliorée !",
          description: "L'IA a amélioré votre description.",
        });
      }
    } catch (error: any) {
      console.error('Error improving description:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible d'améliorer la description.",
      });
    } finally {
      setImprovingDescription(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!termsAccepted) {
      toast({
        variant: "destructive",
        title: "Conditions non acceptées",
        description: "Vous devez accepter les conditions d'utilisation pour publier une annonce.",
      });
      return;
    }

    if (!user) {
      toast({
        variant: "destructive",
        title: "Non connecté",
        description: "Vous devez être connecté pour publier une annonce.",
      });
      return;
    }

    // Validation de la longueur de la description
    if (formData.description.length < 50) {
      toast({
        variant: "destructive",
        title: "Description trop courte",
        description: "La description doit contenir au moins 50 caractères.",
      });
      return;
    }

    if (formData.description.length > 5000) {
      toast({
        variant: "destructive",
        title: "Description trop longue",
        description: "La description ne peut pas dépasser 5000 caractères.",
      });
      return;
    }

    setLoading(true);

    try {
      // Créer ou mettre à jour le contact vendeur
      const { error: contactError } = await supabase
        .from('seller_contacts')
        .upsert(
          {
            seller_id: user.id,
            email: formData.seller_email,
            phone: formData.seller_phone,
          },
          {
            onConflict: 'seller_id'
          }
        );

      if (contactError) throw contactError;

      // Créer l'annonce immobilière
      const rentalUnitsData = formData.is_rental_property && rentalUnits.filter(u => u.unit_type && u.count).length > 0 
        ? rentalUnits
            .filter(u => u.unit_type && u.count)
            .map(u => ({
              unit_type: u.unit_type,
              monthly_rent: u.monthly_rent ? parseFloat(u.monthly_rent) : null,
              count: parseInt(u.count)
            }))
        : null;

      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .insert([{
          seller_id: user.id,
          title: formData.title,
          description: formData.description,
          industry: 'boutique_commerce_detail' as any,
          location: `${formData.city}, ${formData.province}`,
          city: formData.city,
          province: formData.province,
          asking_price: priceNegotiable ? 0 : parseFloat(formData.asking_price),
          year_established: formData.year_built ? parseInt(formData.year_built) : null,
          year_built: formData.year_built ? parseInt(formData.year_built) : null,
          square_footage: formData.square_footage ? parseFloat(formData.square_footage) : null,
          property_type: formData.property_type,
          is_rental_property: formData.is_rental_property,
          rental_units: rentalUnitsData,
          status: 'active',
          approval_status: 'pending',
          seller_phone: formData.seller_phone,
          slug: '',
        }])
        .select()
        .maybeSingle();

      if (businessError) throw businessError;

      // Uploader les photos si présentes
      if (photos.length > 0 && business) {
        const photoUploadPromises = photos.map(async (photo, index) => {
          const fileExt = photo.name.split('.').pop();
          const fileName = `${business.id}/${Date.now()}-${index}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('business-photos')
            .upload(fileName, photo);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('business-photos')
            .getPublicUrl(fileName);

          return supabase
            .from('business_photos')
            .insert({
              business_id: business.id,
              photo_url: publicUrl,
              display_order: index,
            });
        });

        await Promise.all(photoUploadPromises);
      }

      toast({
        title: "Annonce publiée avec succès !",
        description: "Votre annonce immobilière est en cours de vérification. Vous serez notifié une fois approuvée.",
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error creating property listing:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la publication de l'annonce.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-secondary/10 border border-secondary/20 mb-4">
            <Home className="w-5 h-5 text-secondary" />
            <span className="text-sm font-semibold">Immobilier</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Vendez votre <span className="text-secondary">immobilier</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Listez votre propriété commerciale ou industrielle sur notre plateforme
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 bg-card rounded-2xl shadow-elegant p-8 border border-border">
          {/* Informations de base */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Home className="w-6 h-6 text-secondary" />
              Informations de base
            </h2>

            <div className="space-y-2">
              <Label htmlFor="title">Titre de l'annonce *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Bureau commercial au centre-ville"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Décrivez votre propriété en détail..."
                rows={6}
                required
                minLength={50}
                maxLength={5000}
              />
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/5000 caractères (minimum 50)
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleImproveDescription}
                disabled={improvingDescription}
                className="w-full sm:w-auto"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {improvingDescription ? "Amélioration en cours..." : "Améliorer avec l'IA"}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="property_type">Type de propriété *</Label>
                <Select
                  value={formData.property_type}
                  onValueChange={(value) => setFormData({ ...formData, property_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bureau">Bureau commercial</SelectItem>
                    <SelectItem value="commerce">Espace commercial</SelectItem>
                    <SelectItem value="industriel">Bâtiment industriel</SelectItem>
                    <SelectItem value="terrain">Terrain commercial</SelectItem>
                    <SelectItem value="immeuble_logement">Immeuble à logement</SelectItem>
                    <SelectItem value="mixte">Propriété mixte</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Ville *</Label>
                <CityCombobox 
                  value={formData.city} 
                  onChange={(value) => setFormData({ ...formData, city: value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="asking_price">
                  Prix demandé ($) {!priceNegotiable && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="asking_price"
                  type="number"
                  value={formData.asking_price}
                  onChange={(e) => setFormData({ ...formData, asking_price: e.target.value })}
                  placeholder={priceNegotiable ? "À discuter" : "500000"}
                  required={!priceNegotiable}
                  disabled={priceNegotiable}
                />
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox
                    id="price_negotiable"
                    checked={priceNegotiable}
                    onCheckedChange={(checked) => {
                      setPriceNegotiable(checked as boolean);
                      if (checked) {
                        setFormData({ ...formData, asking_price: "" });
                      }
                    }}
                  />
                  <Label htmlFor="price_negotiable" className="text-sm font-normal cursor-pointer">
                    Prix à discuter
                  </Label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="square_footage">Superficie (pi²)</Label>
                <Input
                  id="square_footage"
                  type="number"
                  value={formData.square_footage}
                  onChange={(e) => setFormData({ ...formData, square_footage: e.target.value })}
                  placeholder="5000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="year_built">Année de construction</Label>
                <Input
                  id="year_built"
                  type="number"
                  value={formData.year_built}
                  onChange={(e) => setFormData({ ...formData, year_built: e.target.value })}
                  placeholder="2000"
                  min="1800"
                  max={new Date().getFullYear()}
                />
              </div>
            </div>

            {/* Immeuble à logement */}
            {formData.property_type === 'immeuble_logement' && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_rental"
                    checked={formData.is_rental_property}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_rental_property: checked as boolean })}
                  />
                  <Label htmlFor="is_rental" className="cursor-pointer">
                    Afficher les informations sur les loyers
                  </Label>
                </div>

                {formData.is_rental_property && (
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Unités de location</Label>
                    {rentalUnits.map((unit, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-background rounded-lg border border-border">
                        <div className="space-y-2">
                          <Label>Type d'unité</Label>
                          <Input
                            placeholder="Ex: 4-1/2, 5-1/2"
                            value={unit.unit_type}
                            onChange={(e) => {
                              const newUnits = [...rentalUnits];
                              newUnits[index].unit_type = e.target.value;
                              setRentalUnits(newUnits);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Loyer mensuel ($)</Label>
                          <Input
                            type="number"
                            placeholder="1200"
                            value={unit.monthly_rent}
                            onChange={(e) => {
                              const newUnits = [...rentalUnits];
                              newUnits[index].monthly_rent = e.target.value;
                              setRentalUnits(newUnits);
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Nombre d'unités</Label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="3"
                              value={unit.count}
                              onChange={(e) => {
                                const newUnits = [...rentalUnits];
                                newUnits[index].count = e.target.value;
                                setRentalUnits(newUnits);
                              }}
                            />
                            {rentalUnits.length > 1 && (
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={() => setRentalUnits(rentalUnits.filter((_, i) => i !== index))}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setRentalUnits([...rentalUnits, { unit_type: "", monthly_rent: "", count: "" }])}
                      className="w-full"
                    >
                      + Ajouter une unité
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Photos */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Upload className="w-6 h-6 text-secondary" />
              Photos de la propriété
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {photoPreviewUrls.map((url, index) => (
                <div key={index} className="relative group aspect-square">
                  <img
                    src={url}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg border-2 border-border"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                className="cursor-pointer"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Maximum 10 photos. Formats acceptés: JPG, PNG
              </p>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Vos coordonnées</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seller_email">Email *</Label>
                <Input
                  id="seller_email"
                  type="email"
                  value={formData.seller_email}
                  onChange={(e) => setFormData({ ...formData, seller_email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seller_phone">Téléphone *</Label>
                <Input
                  id="seller_phone"
                  type="tel"
                  value={formData.seller_phone}
                  onChange={(e) => setFormData({ ...formData, seller_phone: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>

          {/* Conditions */}
          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
            />
            <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
              J'accepte les{" "}
              <button
                type="button"
                onClick={() => setTermsDialogOpen(true)}
                className="text-primary hover:underline font-semibold"
              >
                conditions d'utilisation
              </button>
            </label>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            disabled={loading}
          >
            {loading ? "Publication en cours..." : "Publier l'annonce"}
          </Button>
        </form>

        <TermsDialog open={termsDialogOpen} onOpenChange={setTermsDialogOpen} />
      </div>
    </div>
  );
};

export default ListProperty;
