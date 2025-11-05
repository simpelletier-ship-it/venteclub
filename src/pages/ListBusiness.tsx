import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, FileText, TrendingUp, DollarSign, Info, Sparkles, Check, ChevronsUpDown } from "lucide-react";
import { businessSchema } from "@/lib/validations";
import { TermsDialog } from "@/components/TermsDialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAutosaveDraft } from "@/hooks/useAutosaveDraft";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { quebecCities } from "@/lib/quebecCities";

const ListBusiness = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  const [editingBusinessId, setEditingBusinessId] = useState<string | null>(null);

  // Récupérer l'ID de l'annonce à éditer depuis l'URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get('edit');
    if (editId) {
      setEditingBusinessId(editId);
    }
  }, []);

  // Régions administratives du Québec - la liste des villes est maintenant importée

  // Régions administratives du Québec
  const quebecRegions = [
    "Bas-Saint-Laurent",
    "Saguenay–Lac-Saint-Jean",
    "Capitale-Nationale",
    "Mauricie",
    "Estrie",
    "Montréal",
    "Outaouais",
    "Abitibi-Témiscamingue",
    "Côte-Nord",
    "Nord-du-Québec",
    "Gaspésie–Îles-de-la-Madeleine",
    "Chaudière-Appalaches",
    "Laval",
    "Lanaudière",
    "Laurentides",
    "Montérégie",
    "Centre-du-Québec",
  ].sort();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    industry: "",
    location: "",
    city: "",
    region: "",
    province: "Québec",
    street_number: "",
    street_name: "",
    postal_code: "",
    annual_revenue: "",
    asking_price: "",
    profit_margin: "",
    baiia: "",
    net_profit: "",
    net_profit_margin: "",
    baiia_margin: "",
    employees_count: "",
    year_established: "",
    seller_email: "",
    seller_phone: "",
    latitude: null as number | null,
    longitude: null as number | null,
    competitive_advantages: "",
    target_clientele: "",
    sale_reason: "",
    financing_options: "",
    support_offered: "",
    sale_type: "" as "assets" | "shares" | "both" | "",
    website: "",
    facebook: "",
    instagram: "",
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [citySearchOpen, setCitySearchOpen] = useState(false);
  const [citySearchValue, setCitySearchValue] = useState("");
  const [priceNegotiable, setPriceNegotiable] = useState(false);

  // Autosave draft hook
  const { loadDraft, deleteDraft } = useAutosaveDraft({
    formData,
    userId: user?.id,
    draftType: 'business',
    editingBusinessId,
    minFieldsFilled: 2,
  });

  // Géocoder l'adresse complète quand les champs sont remplis
  useEffect(() => {
    const geocodeAddress = async () => {
      // Construire l'adresse complète
      const addressParts = [
        formData.street_number,
        formData.street_name,
        formData.city,
        formData.province,
        formData.postal_code
      ].filter(part => part && part.trim() !== "");

      if (addressParts.length < 3) return; // Au minimum rue + ville + province

      const fullAddress = addressParts.join(", ");
      
      // Mettre à jour location
      setFormData(prev => ({ ...prev, location: fullAddress }));

      try {
        const { data, error } = await supabase.functions.invoke('geocode-address', {
          body: { query: fullAddress }
        });

        if (error) {
          console.error('[GEOCODE] Error:', error);
          return;
        }

        if (data?.success && data.latitude && data.longitude) {
          console.log('[GEOCODE] Coordinates obtained:', data);
          setFormData(prev => ({
            ...prev,
            latitude: data.latitude,
            longitude: data.longitude
          }));
        }
      } catch (err) {
        console.error('[GEOCODE] Failed to geocode address:', err);
      }
    };

    // Debounce le géocodage
    const timer = setTimeout(() => {
      geocodeAddress();
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData.street_number, formData.street_name, formData.city, formData.postal_code]);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        
        // Charger l'annonce existante si on est en mode édition
        if (editingBusinessId) {
          await loadBusinessForEdit(editingBusinessId, session.user.id);
        } else {
          // Charger le brouillon s'il existe
          const draftData = await loadDraft();
          if (draftData) {
            setFormData(prev => ({ ...prev, ...draftData }));
            toast({
              title: "Brouillon restauré",
              description: "Votre brouillon a été chargé. Vous pouvez continuer où vous vous étiez arrêté.",
              duration: 5000,
            });
          }
        }
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
  }, [navigate, editingBusinessId]);

  const loadBusinessForEdit = async (businessId: string, userId: string) => {
    try {
      const { data: business, error } = await supabase
        .from('businesses')
        .select('*, business_photos(*)')
        .eq('id', businessId)
        .eq('seller_id', userId)
        .single();

      if (error) throw error;

      if (!business) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Annonce introuvable",
        });
        navigate('/dashboard');
        return;
      }

      // Vérifier si l'annonce a des modifications en attente
      if (business.has_pending_changes) {
        toast({
          variant: "destructive",
          title: "Modification impossible",
          description: "Cette annonce a déjà des modifications en attente d'approbation. Vous devez attendre que l'administrateur approuve ou rejette vos modifications avant d'en soumettre de nouvelles.",
          duration: 6000,
        });
        navigate('/dashboard');
        return;
      }

      // Remplir le formulaire avec les données existantes
      setFormData({
        title: business.title || "",
        description: business.description || "",
        industry: business.industry || "",
        location: business.location || "",
        city: business.city || "",
        region: business.region || "",
        province: business.province || "Québec",
        street_number: "",
        street_name: "",
        postal_code: "",
        annual_revenue: business.annual_revenue?.toString() || "",
        asking_price: business.asking_price?.toString() || "",
        profit_margin: business.profit_margin?.toString() || "",
        baiia: business.baiia?.toString() || "",
        net_profit: business.net_profit?.toString() || "",
        net_profit_margin: business.net_profit_margin?.toString() || "",
        baiia_margin: business.baiia_margin?.toString() || "",
        employees_count: business.employees_count?.toString() || "",
        year_established: business.year_established?.toString() || "",
        seller_email: "",
        seller_phone: "",
        latitude: business.latitude || null,
        longitude: business.longitude || null,
        competitive_advantages: "",
        target_clientele: "",
        sale_reason: "",
        financing_options: "",
        support_offered: "",
        sale_type: business.sale_type || "",
        website: "",
        facebook: "",
        instagram: "",
      });

      // Vérifier si le prix est "à discuter"
      if (business.asking_price === 0 || business.asking_price === null) {
        setPriceNegotiable(true);
      }

      // Charger les photos existantes
      if (business.business_photos && business.business_photos.length > 0) {
        const urls = business.business_photos
          .sort((a: any, b: any) => a.display_order - b.display_order)
          .map((photo: any) => photo.photo_url);
        setPhotoPreviewUrls(urls);
      }

      // Charger les informations de contact
      const { data: contact } = await supabase
        .from('seller_contacts')
        .select('*')
        .eq('seller_id', userId)
        .single();

      if (contact) {
        setFormData(prev => ({
          ...prev,
          seller_email: contact.email || "",
          seller_phone: contact.phone || "",
        }));
      }

      toast({
        title: "Annonce chargée",
        description: "Vous pouvez maintenant modifier votre annonce",
      });
    } catch (error: any) {
      console.error('Error loading business:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
      navigate('/dashboard');
    }
  };

  // Calculate visibility score
  const visibilityScore = useMemo(() => {
    const fields = [
      formData.title,
      formData.description,
      formData.industry,
      formData.location,
      formData.city,
      formData.asking_price,
      formData.year_established,
      formData.competitive_advantages,
      formData.target_clientele,
      formData.website,
    ];
    
    // Count filled fields (excluding empty strings)
    const filledFields = fields.filter(field => field && String(field).trim() !== "").length;
    // Add photos count (1 if at least one photo)
    const totalFilledFields = filledFields + (photos.length > 0 ? 1 : 0);
    const totalFields = fields.length + 1; // +1 for photos
    
    // Return 0 if nothing is filled
    if (totalFilledFields === 0) return 0;
    
    return Math.round((totalFilledFields / totalFields) * 100);
  }, [formData, photos]);

  // Next steps suggestions
  const nextSteps = useMemo(() => {
    const steps = [];
    if (!formData.title || formData.title.trim() === "") {
      steps.push({ icon: FileText, text: "Ajouter un titre percutant", action: "title" });
    }
    if (!formData.description || formData.description.trim() === "" || formData.description.length < 100) {
      steps.push({ icon: FileText, text: "Rédiger une description détaillée", action: "description" });
    }
    if (!priceNegotiable && (!formData.asking_price || formData.asking_price.trim() === "")) {
      steps.push({ icon: DollarSign, text: "Indiquer le prix de vente", action: "asking_price" });
    }
    if (!formData.industry || formData.industry.trim() === "") {
      steps.push({ icon: TrendingUp, text: "Sélectionner une catégorie", action: "industry" });
    }
    if (photos.length === 0) {
      steps.push({ icon: Upload, text: "Ajouter au moins une photo", action: "main-photo" });
    }
    return steps;
  }, [formData, photos]);

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

  const handleGenerateImage = async () => {
    if (photos.length >= 10) {
      toast({
        variant: "destructive",
        title: "Limite atteinte",
        description: "Vous avez déjà atteint la limite de 10 photos.",
      });
      return;
    }

    if (!imagePrompt && (!formData.title || !formData.description)) {
      toast({
        variant: "destructive",
        title: "Informations manquantes",
        description: "Veuillez remplir le prompt personnalisé ou le titre et la description.",
      });
      return;
    }

    setGeneratingImage(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-business-image', {
        body: {
          title: imagePrompt || formData.title,
          description: imagePrompt || formData.description,
          industry: formData.industry,
        }
      });

      if (error) throw error;

      if (!data?.imageUrl) {
        throw new Error("Aucune image générée");
      }

      const response = await fetch(data.imageUrl);
      const blob = await response.blob();
      const file = new File([blob], `ai-generated-${Date.now()}.png`, { type: 'image/png' });

      setPhotos([...photos, file]);
      setPhotoPreviewUrls([...photoPreviewUrls, data.imageUrl]);

      toast({
        title: "Image générée !",
        description: "L'image a été générée avec succès par l'IA.",
      });
      
      setImagePrompt("");
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

  const handleSubmit = async (e: React.FormEvent, isDraft: boolean = false) => {
    e.preventDefault();

    if (!isDraft && !termsAccepted) {
      toast({
        variant: "destructive",
        title: "Conditions non acceptées",
        description: "Vous devez accepter les conditions d'utilisation pour publier une annonce.",
      });
      return;
    }

    setLoading(true);

    try {
      const validatedData = businessSchema.parse({
        title: formData.title,
        description: formData.description,
        industry: formData.industry,
        location: formData.location,
        annual_revenue: formData.annual_revenue && formData.annual_revenue.trim() !== "" ? parseFloat(formData.annual_revenue) : null,
        asking_price: priceNegotiable ? 0 : (formData.asking_price && formData.asking_price.trim() !== "" ? parseFloat(formData.asking_price) : 0),
        profit_margin: formData.profit_margin && formData.profit_margin.trim() !== "" && !isNaN(parseFloat(formData.profit_margin)) ? parseFloat(formData.profit_margin) : null,
        baiia: formData.baiia && formData.baiia.trim() !== "" && !isNaN(parseFloat(formData.baiia)) ? parseFloat(formData.baiia) : null,
        employees_count: formData.employees_count && formData.employees_count.trim() !== "" ? parseInt(formData.employees_count) : null,
        year_established: formData.year_established && formData.year_established.trim() !== "" ? parseInt(formData.year_established) : null,
      });

      // Si on édite une annonce existante
      if (editingBusinessId) {
        // Vérifier si l'annonce est déjà approuvée
        const { data: existingBusiness } = await supabase
          .from("businesses")
          .select("approval_status")
          .eq('id', editingBusinessId)
          .single();

        const isAlreadyApproved = existingBusiness?.approval_status === 'approved';

        if (isAlreadyApproved && !isDraft) {
          // Upload new photos and get their URLs for pending_changes
          const newPhotoUrls: Array<{photo_url: string, display_order: number}> = [];
          
          if (photos.length > 0) {
            for (let i = 0; i < photos.length; i++) {
              const file = photos[i];
              const fileExt = file.name.split('.').pop();
              const fileName = `${editingBusinessId}/${Date.now()}-${i}.${fileExt}`;

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

              newPhotoUrls.push({
                photo_url: publicUrl,
                display_order: photoPreviewUrls.length + i
              });
            }
          }

          // Combine existing photos (photoPreviewUrls) with new photos
          const allPhotos = [
            ...photoPreviewUrls.map((url, index) => ({
              photo_url: url,
              display_order: index
            })),
            ...newPhotoUrls
          ];

          // Si l'annonce est déjà approuvée, stocker les modifications en attente
          const pendingChanges = {
            title: validatedData.title,
            description: validatedData.description,
            industry: validatedData.industry,
            location: validatedData.location,
            city: formData.city,
            region: formData.region,
            province: formData.province,
            annual_revenue: validatedData.annual_revenue,
            asking_price: validatedData.asking_price,
            profit_margin: validatedData.profit_margin,
            baiia: validatedData.baiia,
            net_profit: formData.net_profit && !isNaN(parseFloat(formData.net_profit)) ? parseFloat(formData.net_profit) : null,
            net_profit_margin: formData.net_profit_margin && !isNaN(parseFloat(formData.net_profit_margin)) ? parseFloat(formData.net_profit_margin) : null,
            employees_count: validatedData.employees_count,
            year_established: validatedData.year_established,
            seller_phone: formData.seller_phone,
            photos: allPhotos,
          };

          const { error: updateError } = await supabase
            .from("businesses")
            .update({
              has_pending_changes: true,
              pending_changes: pendingChanges,
              pending_changes_submitted_at: new Date().toISOString(),
            } as any)
            .eq('id', editingBusinessId);

          if (updateError) throw updateError;

          toast({
            title: "Modifications soumises !",
            description: "Vos modifications sont en attente d'approbation par un administrateur. Votre annonce reste active avec son contenu actuel.",
          });
          
          navigate("/dashboard");
          return;
        }
        
        // Sinon, appliquer les modifications normalement
        const { error: updateError } = await supabase
            .from("businesses")
            .update({
              title: validatedData.title,
              description: validatedData.description,
              industry: validatedData.industry,
              location: validatedData.location,
              city: formData.city,
              region: formData.region,
              province: formData.province,
              annual_revenue: validatedData.annual_revenue,
              asking_price: validatedData.asking_price,
              profit_margin: validatedData.profit_margin,
              baiia: validatedData.baiia,
              net_profit: formData.net_profit && !isNaN(parseFloat(formData.net_profit)) ? parseFloat(formData.net_profit) : null,
              net_profit_margin: formData.net_profit_margin && !isNaN(parseFloat(formData.net_profit_margin)) ? parseFloat(formData.net_profit_margin) : null,
              employees_count: validatedData.employees_count,
              year_established: validatedData.year_established,
              latitude: formData.latitude,
              longitude: formData.longitude,
              sale_type: formData.sale_type || null,
              status: isDraft ? "archived" : "active",
              approval_status: isDraft ? "pending" : "pending",
            } as any)
            .eq('id', editingBusinessId);

          if (updateError) throw updateError;

          toast({
            title: isDraft ? "Modifié !" : "Publié !",
            description: isDraft 
              ? "Votre annonce a été modifiée et reste en brouillon." 
              : "Votre annonce a été publiée et est en attente d'approbation.",
          });
        

        // Upload new photos if any (for non-approved or draft edits)
        if (photos.length > 0) {
          for (let i = 0; i < photos.length; i++) {
            const file = photos[i];
            const fileExt = file.name.split('.').pop();
            const fileName = `${editingBusinessId}/${Date.now()}-${i}.${fileExt}`;

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
              business_id: editingBusinessId,
              photo_url: publicUrl,
              display_order: photoPreviewUrls.length + i,
            });
          }
        }

        navigate("/dashboard");
        return;
      }
      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .insert({
          seller_id: user.id,
          title: validatedData.title,
          description: validatedData.description,
          industry: validatedData.industry,
          location: validatedData.location,
          city: formData.city,
          region: formData.region,
          province: formData.province,
          annual_revenue: validatedData.annual_revenue,
          asking_price: validatedData.asking_price,
          profit_margin: validatedData.profit_margin,
          baiia: validatedData.baiia,
          net_profit: formData.net_profit && !isNaN(parseFloat(formData.net_profit)) ? parseFloat(formData.net_profit) : null,
          net_profit_margin: formData.net_profit_margin && !isNaN(parseFloat(formData.net_profit_margin)) ? parseFloat(formData.net_profit_margin) : null,
          baiia_margin: formData.baiia_margin && !isNaN(parseFloat(formData.baiia_margin)) ? parseFloat(formData.baiia_margin) : null,
          employees_count: validatedData.employees_count,
          year_established: validatedData.year_established,
          latitude: formData.latitude,
          longitude: formData.longitude,
          sale_type: formData.sale_type || null,
          status: isDraft ? "archived" : "active",
        } as any)
        .select()
        .single();

      console.log("[CREATE BUSINESS] Insert result:", { businessData, businessError });

      if (businessError) {
        console.error("[CREATE BUSINESS] Insert error:", businessError);
        throw businessError;
      }
      
      if (!businessData) {
        console.error("[CREATE BUSINESS] No data returned from insert");
        throw new Error("L'annonce n'a pas pu être créée. Veuillez réessayer.");
      }

      console.log("[CREATE BUSINESS] Business created successfully:", businessData.id);

      // Upload photos
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
        title: isDraft ? "Enregistré !" : "Succès !",
        description: isDraft 
          ? "Votre annonce a été enregistrée mais n'est pas encore publiée. Elle est visible uniquement dans votre tableau de bord." 
          : "Votre annonce a été soumise et est en attente d'approbation. Vous recevrez un email de confirmation.",
      });
      
      // Supprimer le brouillon si l'annonce est publiée avec succès
      if (!isDraft) {
        await deleteDraft();
      }
      
      navigate("/dashboard");
    } catch (error: any) {
      console.error("[CREATE BUSINESS] Error:", error);
      
      if (error.errors) {
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
          description: error.message || "Une erreur est survenue lors de la création de l'annonce.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              {editingBusinessId ? "Modifier l'annonce" : "Nouvelle Fiche Entreprise"}
            </h1>
            <p className="text-muted-foreground">
              {editingBusinessId 
                ? "Modifiez les informations de votre annonce et publiez-la." 
                : "Remplissez les informations pour créer une nouvelle annonce."}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form - 2/3 width */}
            <div className="lg:col-span-2">
              <form className="space-y-6">
                {/* Informations générales */}
                <div className="bg-card p-6 rounded-2xl shadow-elegant border border-border/50">
                  <h2 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    Informations générales
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">
                        Titre de l'annonce <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        required
                        placeholder="Ex: Restaurant italien bien établi à Montréal"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">
                        Description <span className="text-destructive">*</span>
                      </Label>
                      <div className="space-y-2">
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          required
                          rows={6}
                          placeholder="Décrivez votre entreprise en détail..."
                        />
                        {formData.description && formData.industry && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              setLoading(true);
                              try {
                                const { data, error } = await supabase.functions.invoke('improve-description', {
                                  body: {
                                    description: formData.description,
                                    title: formData.title,
                                    industry: formData.industry
                                  }
                                });

                                if (error) throw error;

                                if (data?.improvedDescription) {
                                  setFormData({ ...formData, description: data.improvedDescription });
                                  toast({
                                    title: "Description améliorée !",
                                    description: "Votre description a été reformulée avec succès.",
                                  });
                                }
                              } catch (error: any) {
                                toast({
                                  variant: "destructive",
                                  title: "Erreur",
                                  description: error.message || "Impossible d'améliorer la description",
                                });
                              } finally {
                                setLoading(false);
                              }
                            }}
                            disabled={loading}
                          >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Améliorer avec l'IA
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="year_established">
                          Année de fondation
                        </Label>
                        <Input
                          id="year_established"
                          type="number"
                          value={formData.year_established}
                          onChange={(e) => setFormData({ ...formData, year_established: e.target.value })}
                          placeholder="2010"
                        />
                      </div>

                      <div>
                        <Label htmlFor="industry">
                          Catégories
                        </Label>
                        <Select
                          value={formData.industry}
                          onValueChange={(value) => setFormData({ ...formData, industry: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner des catégories" />
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
                    </div>

                    <div>
                      <Label htmlFor="competitive_advantages">
                        Avantages compétitifs
                      </Label>
                      <Textarea
                        id="competitive_advantages"
                        value={formData.competitive_advantages}
                        onChange={(e) => setFormData({ ...formData, competitive_advantages: e.target.value })}
                        rows={4}
                        placeholder="Décrivez les avantages uniques de votre entreprise..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="target_clientele">
                        Clientèle
                      </Label>
                      <Textarea
                        id="target_clientele"
                        value={formData.target_clientele}
                        onChange={(e) => setFormData({ ...formData, target_clientele: e.target.value })}
                        rows={4}
                        placeholder="Décrivez votre clientèle cible..."
                      />
                    </div>

                    {/* Image principale */}
                    <div>
                      <Label>Image principale</Label>
                      <div className="mt-2 space-y-3">
                        <label
                          htmlFor="main-photo"
                          className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-primary/30 rounded-lg cursor-pointer hover:border-primary transition-colors bg-primary/5"
                        >
                          {photoPreviewUrls.length > 0 ? (
                            <img
                              src={photoPreviewUrls[0]}
                              alt="Aperçu principal"
                              className="max-h-48 rounded-lg"
                            />
                          ) : (
                            <>
                              <div className="text-muted-foreground text-center">
                                <div className="text-4xl mb-2">📷</div>
                                <p className="font-medium">Aucune image</p>
                                <p className="text-sm mt-1">Choisir un fichier</p>
                              </div>
                            </>
                          )}
                        </label>
                        <Input
                          id="main-photo"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                        <p className="text-xs text-muted-foreground">
                          Formats acceptés : JPEG, PNG, WEBP, GIF. Max 16 Mo.
                        </p>
                      </div>
                    </div>

                    {/* Images supplémentaires */}
                    <div>
                      <Label htmlFor="photos">Images supplémentaires</Label>
                      <div className="mt-2 space-y-3">
                        <label
                          htmlFor="photos"
                          className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-primary/30 rounded-lg cursor-pointer hover:border-primary transition-colors bg-primary/5"
                        >
                          {photoPreviewUrls.length > 1 ? (
                            <p className="text-muted-foreground text-center">
                              {photoPreviewUrls.length - 1} image(s) supplémentaire(s).
                            </p>
                          ) : (
                            <p className="text-muted-foreground text-center">Aucune image supplémentaire.</p>
                          )}
                          <Button type="button" variant="ghost" size="sm" className="mt-2">
                            Sélect. fichiers
                          </Button>
                        </label>
                        <Input
                          id="photos"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                        <p className="text-xs text-muted-foreground">
                          Sélectionnez jusqu'à 6 fichiers (JPEG, PNG, WEBP, GIF). Max 5Mo par fichier.
                        </p>

                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">ou</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="imagePrompt">Prompt personnalisé pour l'IA (optionnel)</Label>
                            <Textarea
                              id="imagePrompt"
                              value={imagePrompt}
                              onChange={(e) => setImagePrompt(e.target.value)}
                              placeholder="Ex: Une photo professionnelle d'un restaurant italien moderne avec terrasse..."
                              rows={3}
                              className="mt-1"
                            />
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={handleGenerateImage}
                            disabled={generatingImage || (!imagePrompt && (!formData.title || !formData.description))}
                          >
                            {generatingImage ? (
                              <>
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                Génération en cours...
                              </>
                            ) : (
                              <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Générer une image par IA
                              </>
                            )}
                          </Button>
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
                    </div>
                  </div>
                </div>

                {/* Emplacement */}
                <div className="bg-card p-6 rounded-2xl shadow-elegant border border-border/50">
                  <h2 className="text-xl font-semibold text-primary mb-4">Emplacement (optionnel)</h2>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="city">Ville</Label>
                        <Popover open={citySearchOpen} onOpenChange={setCitySearchOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={citySearchOpen}
                              className="w-full justify-between"
                            >
                              {formData.city || "Sélectionner une ville..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <Command>
                              <CommandInput 
                                placeholder="Rechercher une ville..." 
                                value={citySearchValue}
                                onValueChange={setCitySearchValue}
                              />
                              <CommandList>
                                {citySearchValue && !quebecCities.some(city => city.toLowerCase() === citySearchValue.toLowerCase()) && (
                                  <CommandGroup>
                                    <CommandItem
                                      value={citySearchValue}
                                      onSelect={(currentValue) => {
                                        setFormData({ ...formData, city: currentValue });
                                        setCitySearchOpen(false);
                                        setCitySearchValue("");
                                      }}
                                      className="cursor-pointer bg-accent/10"
                                    >
                                      <Check className="mr-2 h-4 w-4 opacity-0" />
                                      Utiliser "{citySearchValue}"
                                    </CommandItem>
                                  </CommandGroup>
                                )}
                                {quebecCities.filter(city => 
                                  city.toLowerCase().includes(citySearchValue.toLowerCase())
                                ).length === 0 && citySearchValue && quebecCities.some(city => city.toLowerCase() === citySearchValue.toLowerCase()) ? (
                                  <CommandEmpty>Aucune ville trouvée.</CommandEmpty>
                                ) : (
                                  <CommandGroup>
                                    {quebecCities
                                      .filter(city => 
                                        city.toLowerCase().includes(citySearchValue.toLowerCase())
                                      )
                                      .slice(0, 50)
                                      .map((city) => (
                                        <CommandItem
                                          key={city}
                                          value={city}
                                          onSelect={(currentValue) => {
                                            setFormData({ ...formData, city: currentValue });
                                            setCitySearchOpen(false);
                                            setCitySearchValue("");
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              formData.city === city ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                          {city}
                                        </CommandItem>
                                      ))}
                                  </CommandGroup>
                                )}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div>
                        <Label htmlFor="province">Province</Label>
                        <Input
                          id="province"
                          value={formData.province}
                          disabled
                          className="bg-muted"
                        />
                      </div>

                      <div>
                        <Label htmlFor="postal_code">Code postal</Label>
                        <Input
                          id="postal_code"
                          value={formData.postal_code}
                          onChange={(e) => {
                            const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                            setFormData({ ...formData, postal_code: value });
                          }}
                          placeholder="H1A 1A1"
                          maxLength={7}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-1">
                        <Label htmlFor="street_number">Numéro civique</Label>
                        <Input
                          id="street_number"
                          value={formData.street_number}
                          onChange={(e) => setFormData({ ...formData, street_number: e.target.value })}
                          placeholder="123"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Label htmlFor="street_name">Nom de la rue</Label>
                        <AddressAutocomplete
                          value={formData.street_name}
                          onChange={(street) => setFormData({ ...formData, street_name: street })}
                          city={formData.city}
                          placeholder="Ex: Rue Principale"
                        />
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      L'adresse exacte sera visible uniquement pour les acheteurs qualifiés.
                    </p>
                  </div>
                </div>

                {/* Volet financier */}
                <div className="bg-card p-6 rounded-2xl shadow-elegant border border-border/50">
                  <h2 className="text-xl font-semibold text-primary mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Volet financier
                  </h2>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div>
                        <Label htmlFor="asking_price">
                          Prix de vente {!priceNegotiable && <span className="text-destructive">*</span>}
                        </Label>
                        <Input
                          id="asking_price"
                          type="number"
                          value={formData.asking_price}
                          onChange={(e) => setFormData({ ...formData, asking_price: e.target.value })}
                          required={!priceNegotiable}
                          disabled={priceNegotiable}
                          placeholder={priceNegotiable ? "À discuter" : "Ex: 100 000"}
                          min="0"
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

                      <div>
                        <Label htmlFor="sale_type">Type de vente</Label>
                        <Select
                          value={formData.sale_type}
                          onValueChange={(value) => setFormData({ ...formData, sale_type: value as "assets" | "shares" | "both" })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner le type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="assets">Vente d'actifs</SelectItem>
                            <SelectItem value="shares">Vente d'actions</SelectItem>
                            <SelectItem value="both">Ouvert aux deux</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          Précisez si vous vendez les actifs, les actions ou les deux
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="annual_revenue">Revenus annuels</Label>
                        <Input
                          id="annual_revenue"
                          type="number"
                          value={formData.annual_revenue}
                          onChange={(e) => setFormData({ ...formData, annual_revenue: e.target.value })}
                          placeholder="Ex: 250 000"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="baiia">BAIIA</Label>
                        <Input
                          id="baiia"
                          type="number"
                          value={formData.baiia}
                          onChange={(e) => setFormData({ ...formData, baiia: e.target.value })}
                          placeholder="Ex: 50 000"
                        />
                      </div>

                      <div>
                        <Label htmlFor="net_profit">Bénéfice net</Label>
                        <Input
                          id="net_profit"
                          type="number"
                          value={formData.net_profit}
                          onChange={(e) => setFormData({ ...formData, net_profit: e.target.value })}
                          placeholder="Ex: 40 000"
                        />
                      </div>

                      <div>
                        <Label htmlFor="net_profit_margin">Marge bénéficiaire nette (%)</Label>
                        <Input
                          id="net_profit_margin"
                          type="number"
                          step="0.1"
                          value={formData.net_profit_margin}
                          onChange={(e) => setFormData({ ...formData, net_profit_margin: e.target.value })}
                          placeholder="Ex: 28"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="sale_reason">Raison de vente</Label>
                      <Textarea
                        id="sale_reason"
                        value={formData.sale_reason}
                        onChange={(e) => setFormData({ ...formData, sale_reason: e.target.value })}
                        rows={3}
                        placeholder="Ex: Départ à la retraite, nouveau projet, déménagement..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      <div>
                        <Label htmlFor="financing_options">Options financement</Label>
                        <Input
                          id="financing_options"
                          value={formData.financing_options}
                          onChange={(e) => setFormData({ ...formData, financing_options: e.target.value })}
                          placeholder="Ex: Financement disponible"
                        />
                      </div>

                      <div>
                        <Label htmlFor="support_offered">Accompagnement</Label>
                        <Select
                          value={formData.support_offered}
                          onValueChange={(value) => setFormData({ ...formData, support_offered: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Aucun</SelectItem>
                            <SelectItem value="training">Formation incluse</SelectItem>
                            <SelectItem value="transition">Transition assistée</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
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
                  </div>
                </div>

                {/* Présence web */}
                <div className="bg-card p-6 rounded-2xl shadow-elegant border border-border/50">
                  <h2 className="text-xl font-semibold text-primary mb-4">Présence web</h2>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="website">Site web 🌐</Label>
                      <Input
                        id="website"
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="facebook">Facebook</Label>
                      <Input
                        id="facebook"
                        type="url"
                        value={formData.facebook}
                        onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                        placeholder="https://facebook.com/..."
                      />
                    </div>

                    <div>
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input
                        id="instagram"
                        type="url"
                        value={formData.instagram}
                        onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                        placeholder="https://instagram.com/..."
                      />
                    </div>
                  </div>
                </div>

                {/* Vos coordonnées */}
                <div className="bg-card p-6 rounded-2xl shadow-elegant border border-border/50">
                  <h3 className="text-lg font-semibold mb-4">Vos coordonnées</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="seller_email">
                        Votre email <span className="text-destructive">*</span>
                      </Label>
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
                      J&apos;accepte les conditions d&apos;utilisation <span className="text-destructive">*</span>
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

                <div className="flex flex-col gap-4 pt-4">
                  <div className="flex gap-4">
                    <Button 
                      type="button" 
                      onClick={(e) => handleSubmit(e, false)} 
                      disabled={loading || !termsAccepted} 
                      className="flex-1"
                    >
                      {loading ? "Publication..." : "Publier l'annonce"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="secondary"
                      onClick={(e) => handleSubmit(e, true)} 
                      disabled={loading} 
                      className="flex-1"
                    >
                      {loading ? "Enregistrement..." : "Enregistrer (brouillon)"}
                    </Button>
                  </div>
                  <Button type="button" variant="outline" onClick={() => navigate("/")} disabled={loading} className="w-full">
                    Annuler
                  </Button>
                </div>
              </form>
            </div>

            {/* Sidebar - 1/3 width */}
            <div className="space-y-6">
              {/* Score de visibilité */}
              <div className="bg-card p-6 rounded-lg shadow-sm border border-border sticky top-24">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold text-foreground">Score de visibilité</h3>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        visibilityScore === 0 ? "bg-gray-400" :
                        visibilityScore < 30 ? "bg-red-500" :
                        visibilityScore < 60 ? "bg-orange-500" :
                        visibilityScore < 80 ? "bg-yellow-500" :
                        "bg-green-500"
                      }`} />
                      <span className="text-2xl font-bold text-foreground">{visibilityScore}%</span>
                    </div>
                  </div>
                  <Progress 
                    value={visibilityScore} 
                    className={`h-2 ${
                      visibilityScore === 0 ? "[&>div]:bg-slate-400" :
                      visibilityScore < 30 ? "[&>div]:bg-red-500" :
                      visibilityScore < 60 ? "[&>div]:bg-amber-500" :
                      visibilityScore < 80 ? "[&>div]:bg-blue-500" :
                      "[&>div]:bg-primary"
                    }`}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    {visibilityScore === 0 ? "Aucune donnée" :
                     visibilityScore < 30 ? "Visibilité faible" :
                     visibilityScore < 60 ? "Visibilité moyenne" :
                     visibilityScore < 80 ? "Bonne visibilité" :
                     "Excellente visibilité"}
                  </p>
                </div>

                {/* Prochaines étapes */}
                {nextSteps.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <h4 className="font-semibold text-sm mb-2 text-foreground">Prochaines étapes</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      {nextSteps.length} étape(s) restante(s)
                    </p>
                    <div className="space-y-2">
                      {nextSteps.map((step, index) => (
                        <Button
                          key={index}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-left h-auto py-2.5 hover:bg-muted"
                          onClick={() => {
                            const element = document.getElementById(step.action);
                            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            element?.focus();
                          }}
                        >
                          <step.icon className="w-4 h-4 mr-2 flex-shrink-0 text-muted-foreground" />
                          <span className="text-xs flex-1">{step.text}</span>
                          <span className="ml-2 text-muted-foreground">→</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <TermsDialog open={termsDialogOpen} onOpenChange={setTermsDialogOpen} />
    </div>
  );
};

export default ListBusiness;
