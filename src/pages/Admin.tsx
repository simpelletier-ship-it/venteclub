import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Eye, ArrowLeft, Trash2, Star, Edit, Upload, UserX, Shield, X, ChevronUp, ChevronDown, ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { RichTextEditor } from "@/components/RichTextEditor";
import { z } from "zod";
import { QUEBEC_INDUSTRIES } from "@/lib/constants";
import { BlogManager } from "@/components/BlogManager";
import { EmailTemplateManager } from "@/components/EmailTemplateManager";

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [businessToDelete, setBusinessToDelete] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    asking_price: "",
    annual_revenue: "",
    profit_margin: "",
    employees_count: "",
    year_established: "",
    location: "",
    city: "",
    province: "",
    industry: "",
    seller_name: "",
    seller_phone: "",
    seller_email: "",
    chat_disabled: false,
    source_url: "",
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingPhotos, setExistingPhotos] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [importUrl, setImportUrl] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importedData, setImportedData] = useState<any>(null);
  const [generatingDemoImages, setGeneratingDemoImages] = useState(false);
  const [forceDeleteEmail, setForceDeleteEmail] = useState("");

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Check if user has admin role
      const { data: hasAdminRole } = await supabase
        .rpc('has_role', { 
          _user_id: session.user.id, 
          _role: 'admin' 
        });

      if (!hasAdminRole) {
        toast({
          variant: "destructive",
          title: "Accès refusé",
          description: "Vous n'avez pas les permissions d'administrateur.",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
      fetchBusinesses();
      fetchUsers();
      fetchReports();
      fetchSubscriptions();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
      navigate("/");
    }
  };

  const fetchBusinesses = async () => {
    try {
      // Fetch businesses first
      const { data: businessesData, error } = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get all unique seller IDs
      const sellerIds = [...new Set(businessesData?.map(b => b.seller_id) || [])];
      
      // Fetch all seller contacts in one query
      const { data: contactsData } = await supabase
        .from('seller_contacts')
        .select('seller_id, email')
        .in('seller_id', sellerIds);

      // Create a map of seller_id -> email
      const contactsMap = new Map(
        contactsData?.map(c => [c.seller_id, c.email]) || []
      );

      // Map businesses with their details (no need for is_business_featured, use featured column)
      const businessesWithDetails = (businessesData || []).map(business => ({
        ...business,
        seller_email: contactsMap.get(business.seller_id) || null,
        is_featured: business.featured
      }));

      setBusinesses(businessesWithDetails);
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

  const updateBusinessStatus = async (businessId: string, approvalStatus: string, rejectionReason?: string) => {
    try {
      const business = businesses.find(b => b.id === businessId);
      
      const { error } = await supabase
        .from('businesses')
        .update({ 
          approval_status: approvalStatus,
          rejection_reason: rejectionReason || null
        })
        .eq('id', businessId);

      if (error) throw error;

      // Send approval email when business is approved
      if (approvalStatus === 'approved') {
        try {
          await supabase.functions.invoke('send-approval-email', {
            body: {
              businessId: businessId
            }
          });
          console.log('Approval email sent successfully');
        } catch (emailError) {
          console.error('Error sending approval email:', emailError);
          // Don't fail the approval if email fails
        }

        // Envoyer les emails d'alerte aux utilisateurs avec email_enabled = true
        if (business) {
          try {
            // Récupérer les alertes avec email activé qui correspondent à cette annonce
            const { data: emailAlerts } = await supabase
              .from('user_alerts')
              .select('*')
              .eq('email_enabled', true)
              .or(`alert_type.eq.all,and(alert_type.eq.category,category.eq.${business.industry}),and(alert_type.eq.city,city.eq.${business.city})`);

            // Envoyer un email pour chaque alerte
            if (emailAlerts && emailAlerts.length > 0) {
              console.log(`Sending ${emailAlerts.length} alert emails for business ${businessId}`);
              
              for (const alert of emailAlerts) {
                if (alert.user_id !== business.seller_id) {
                  // Récupérer l'email de l'utilisateur
                  const { data: profile } = await supabase
                    .from('profiles')
                    .select('email')
                    .eq('id', alert.user_id)
                    .single();

                  if (profile?.email) {
                    try {
                      await supabase.functions.invoke('send-alert-email', {
                        body: {
                          userEmail: profile.email,
                          businessTitle: business.title,
                          businessId: business.id,
                          businessCity: business.city || '',
                          businessIndustry: business.industry,
                          businessPrice: business.asking_price,
                          alertType: alert.alert_type,
                        }
                      });
                      console.log(`Alert email sent to ${profile.email}`);
                    } catch (alertEmailError) {
                      console.error('Error sending alert email:', alertEmailError);
                      // Continue avec les autres emails même si un échoue
                    }
                  }
                }
              }
            }
          } catch (alertError) {
            console.error('Error processing alerts:', alertError);
            // Don't fail the approval if alerts fail
          }
        }
      }

      toast({
        title: "Succès",
        description: `L'annonce a été ${approvalStatus === 'approved' ? 'approuvée' : 'rejetée'}.`,
      });

      fetchBusinesses();
      setRejectDialogOpen(false);
      setRejectionReason("");
      setSelectedBusiness(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const handleReject = (business: any) => {
    setSelectedBusiness(business);
    setRejectDialogOpen(true);
  };

  const handleDeleteClick = (business: any) => {
    setBusinessToDelete(business);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!businessToDelete) return;

    try {
      const { error } = await supabase
        .from('businesses')
        .delete()
        .eq('id', businessToDelete.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "L'annonce a été supprimée.",
      });

      fetchBusinesses();
      setDeleteDialogOpen(false);
      setBusinessToDelete(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const approvePendingChanges = async (businessId: string) => {
    try {
      const { error } = await supabase.rpc('apply_pending_changes', {
        business_uuid: businessId
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Les modifications ont été approuvées et appliquées.",
      });

      fetchBusinesses();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const rejectPendingChanges = async (businessId: string, reason: string) => {
    try {
      const { error } = await supabase.rpc('reject_pending_changes', {
        business_uuid: businessId,
        rejection_reason: reason
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Les modifications ont été rejetées.",
      });

      fetchBusinesses();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const toggleFeatured = async (businessId: string, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        // Remove from featured (delete payment record and update business)
        const { error: deleteError } = await supabase
          .from('featured_payments')
          .delete()
          .eq('business_id', businessId);

        if (deleteError) throw deleteError;

        const { error: updateError } = await supabase
          .from('businesses')
          .update({ featured: false })
          .eq('id', businessId);

        if (updateError) throw updateError;

        toast({
          title: "Succès",
          description: "L'annonce n'est plus en vedette.",
        });
      } else {
        // Get business seller_id
        const { data: business, error: fetchError } = await supabase
          .from('businesses')
          .select('seller_id')
          .eq('id', businessId)
          .single();

        if (fetchError) throw fetchError;
        if (!business) throw new Error("Entreprise introuvable");

        // Add to featured (create payment record)
        const { error: insertError } = await supabase
          .from('featured_payments')
          .insert({
            user_id: business.seller_id,
            business_id: businessId,
            amount: 0, // Admin feature = free
            currency: 'CAD',
            featured_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            payment_status: 'completed'
          });

        if (insertError) throw insertError;

        // Update business featured status
        const { error: updateError } = await supabase
          .from('businesses')
          .update({ featured: true })
          .eq('id', businessId);

        if (updateError) throw updateError;

        toast({
          title: "Succès",
          description: "L'annonce est maintenant en vedette pour 30 jours.",
        });
      }

      fetchBusinesses();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const handleEditClick = async (business: any) => {
    setSelectedBusiness(business);
    setEditFormData({
      title: business.title,
      description: business.description,
      asking_price: business.asking_price?.toString() || "",
      annual_revenue: business.annual_revenue?.toString() || "",
      profit_margin: business.profit_margin?.toString() || "",
      employees_count: business.employees_count?.toString() || "",
      year_established: business.year_established?.toString() || "",
      location: business.location || "",
      city: business.city || "",
      province: business.province || "Québec",
      industry: business.industry || "",
      seller_name: business.seller_name || "",
      seller_phone: business.seller_phone || "",
      seller_email: business.seller_email || "",
      chat_disabled: business.chat_disabled || false,
      source_url: business.source_url || "",
    });
    setImageFile(null);
    
    // Fetch existing photos
    const { data: photos } = await supabase
      .from('business_photos')
      .select('*')
      .eq('business_id', business.id)
      .order('display_order', { ascending: true });
    
    setExistingPhotos(photos || []);
    setEditDialogOpen(true);
  };

  const editBusinessSchema = z.object({
    title: z.string().trim().min(5, "Le titre doit contenir au moins 5 caractères").max(200, "Le titre doit contenir maximum 200 caractères"),
    description: z.string().trim().min(20, "La description doit contenir au moins 20 caractères"),
    asking_price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Prix invalide"),
    annual_revenue: z.string().optional(),
    profit_margin: z.string().optional(),
    employees_count: z.string().optional(),
    year_established: z.string().optional(),
    location: z.string().trim().max(100, "L'emplacement ne peut pas dépasser 100 caractères").optional().or(z.literal('')),
    city: z.string().trim().min(2, "Ville requise"),
    province: z.string().trim().min(2, "Province requise"),
    industry: z.string().min(1, "Secteur requis"),
    seller_name: z.string().trim().max(200).optional(),
    seller_phone: z.string().trim().max(20).optional(),
    seller_email: z.string().email("Email invalide").optional().or(z.literal('')),
    chat_disabled: z.boolean(),
    source_url: z.string().url("URL invalide").optional().or(z.literal('')),
  });


  const handleEditSave = async () => {
    try {
      setUploadingImage(true);
      
      // Validate form data client-side first for immediate feedback
      const validated = editBusinessSchema.parse(editFormData);

      // Update directement avec RLS admin - simple et efficace !
      const updateData = {
        title: validated.title,
        description: validated.description,
        asking_price: parseFloat(validated.asking_price),
        annual_revenue: validated.annual_revenue ? parseFloat(validated.annual_revenue) : null,
        profit_margin: validated.profit_margin ? parseFloat(validated.profit_margin) : null,
        employees_count: validated.employees_count ? parseInt(validated.employees_count) : null,
        year_established: validated.year_established ? parseInt(validated.year_established) : null,
        location: validated.location,
        city: validated.city,
        province: validated.province,
        industry: validated.industry as any,
        seller_name: validated.seller_name || null,
        seller_phone: validated.seller_phone || null,
        seller_email: validated.seller_email || null,
        chat_disabled: validated.chat_disabled,
        source_url: validated.source_url || null,
        updated_by_admin: true,
        admin_updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('businesses')
        .update(updateData)
        .eq('id', selectedBusiness?.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "L'annonce a été mise à jour. Utilisez le gestionnaire de photos pour gérer les images.",
      });

      fetchBusinesses();
      setEditDialogOpen(false);
      setSelectedBusiness(null);
      setImageFile(null);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Erreur de validation",
          description: error.errors[0].message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: error.message,
        });
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data: usersData, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Récupérer les informations de vérification d'email depuis auth.users
      const usersWithVerification = await Promise.all(
        (usersData || []).map(async (user) => {
          const { data: authUser } = await supabase.auth.admin.getUserById(user.id);
          return {
            ...user,
            email_confirmed_at: authUser?.user?.email_confirmed_at || null
          };
        })
      );

      setUsers(usersWithVerification);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const fetchReports = async () => {
    try {
      // Fetch reports first
      const { data: reportsData, error } = await supabase
        .from('business_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Then fetch related data for each report
      const reportsWithDetails = await Promise.all(
        (reportsData || []).map(async (report) => {
          // Get business details
          const { data: businessData } = await supabase
            .from('businesses')
            .select('title, industry, location, slug')
            .eq('id', report.business_id)
            .maybeSingle();

          // Get reporter email
          const { data: profileData } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', report.reporter_id)
            .maybeSingle();

          return {
            ...report,
            businesses: businessData,
            profiles: profileData
          };
        })
      );

      setReports(reportsWithDetails);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const { data: subscriptionsData, error } = await supabase
        .from('premium_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user email for each subscription
      const subscriptionsWithDetails = await Promise.all(
        (subscriptionsData || []).map(async (sub) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', sub.user_id)
            .maybeSingle();

          return {
            ...sub,
            user_email: profileData?.email,
            user_name: profileData?.full_name
          };
        })
      );

      setSubscriptions(subscriptionsWithDetails);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const handleReportStatusUpdate = async (reportId: string, status: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { error } = await supabase
        .from('business_reports')
        .update({ 
          status,
          reviewed_by: session?.user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: `Signalement marqué comme ${status === 'resolved' ? 'résolu' : 'rejeté'}.`,
      });

      fetchReports();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const getReportStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      resolved: "default",
      rejected: "destructive",
    };
    
    const labels: Record<string, string> = {
      pending: "En attente",
      resolved: "Résolu",
      rejected: "Rejeté",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const getReportReasonLabel = (reason: string) => {
    const reasons: Record<string, string> = {
      fraud: "Fraude / Arnaque",
      misleading: "Informations trompeuses",
      spam: "Spam / Contenu indésirable",
      inappropriate: "Contenu inapproprié",
      duplicate: "Doublon",
      other: "Autre"
    };
    return reasons[reason] || reason;
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const { error } = await supabase.functions.invoke('delete-user', {
        body: { userId: userToDelete.id }
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "L'utilisateur a été supprimé.",
      });

      fetchUsers();
      setDeleteUserDialogOpen(false);
      setUserToDelete(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const createSampleData = async () => {
    try {
      const { error } = await supabase.rpc('create_sample_businesses');
      if (error) throw error;
      toast({
        title: "Succès",
        description: "Les données factices ont été créées avec succès!",
      });
      fetchBusinesses();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleImportListing = async () => {
    if (!importUrl.trim()) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez entrer une URL valide",
      });
      return;
    }

    setImportLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('import-business-listing', {
        body: { url: importUrl }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Import failed');
      }

      setImportedData(data.data);
      toast({
        title: "Succès",
        description: "Les données ont été extraites avec succès. Vérifiez et ajustez avant de publier.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible d'importer l'annonce",
      });
    } finally {
      setImportLoading(false);
    }
  };

  const handlePublishImportedListing = async () => {
    if (!importedData) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { error } = await supabase.from('businesses').insert({
        ...importedData,
        seller_id: session.user.id,
        status: 'active',
        approval_status: 'approved',
        created_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: "Succès",
        description: "L'annonce a été publiée avec succès!",
      });

      setImportedData(null);
      setImportUrl("");
      fetchBusinesses();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
    }
  };

  const handleGenerateDemoImages = async () => {
    setGeneratingDemoImages(true);
    try {
      // Étape 1: Uploader les images réalistes dans le storage
      toast({
        title: "Upload en cours",
        description: "Upload des images professionnelles...",
      });
      
      const { data: uploadData, error: uploadError } = await supabase.functions.invoke('upload-demo-images', {
        body: {},
      });

      if (uploadError) throw uploadError;

      toast({
        title: "Upload réussi",
        description: `${uploadData.successful}/${uploadData.total} images uploadées`,
      });

      // Étape 2: Assigner les images aux annonces démo
      toast({
        title: "Attribution en cours",
        description: "Attribution des images aux annonces démo...",
      });

      const { data: assignData, error: assignError } = await supabase.functions.invoke('generate-demo-business-photos', {
        body: {},
      });

      if (assignError) throw assignError;

      toast({
        title: "Succès",
        description: `${assignData.successful}/${assignData.processed} photos assignées aux annonces démo`,
      });

      // Rafraîchir les annonces pour voir les nouvelles images
      fetchBusinesses();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de générer les images",
      });
    } finally {
      setGeneratingDemoImages(false);
    }
  };

  const handleCleanupDuplicatePhotos = async () => {
    if (!confirm('⚠️ Cette action va supprimer TOUTES les photos dupliquées de chaque annonce, en gardant seulement la première photo (display_order = 0). Êtes-vous sûr de vouloir continuer?')) {
      return;
    }

    try {
      setLoading(true);
      toast({
        title: "Nettoyage en cours",
        description: "Suppression des photos dupliquées...",
      });

      // Récupérer toutes les photos groupées par business_id
      const { data: allPhotos, error: fetchError } = await supabase
        .from('business_photos')
        .select('*')
        .order('business_id')
        .order('display_order');

      if (fetchError) throw fetchError;

      // Grouper les photos par business_id
      const photosByBusiness = (allPhotos || []).reduce((acc, photo) => {
        if (!acc[photo.business_id]) {
          acc[photo.business_id] = [];
        }
        acc[photo.business_id].push(photo);
        return acc;
      }, {} as Record<string, any[]>);

      let totalDeleted = 0;

      // Pour chaque business, garder seulement la première photo
      for (const [businessId, photos] of Object.entries(photosByBusiness)) {
        if (photos.length > 1) {
          // Trier par display_order pour s'assurer qu'on garde la première
          photos.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
          
          // Supprimer toutes les photos sauf la première
          const photosToDelete = photos.slice(1).map(p => p.id);
          
          const { error: deleteError } = await supabase
            .from('business_photos')
            .delete()
            .in('id', photosToDelete);

          if (deleteError) {
            console.error(`Erreur lors de la suppression des photos pour ${businessId}:`, deleteError);
          } else {
            totalDeleted += photosToDelete.length;
          }

          // Réinitialiser le display_order de la photo restante à 0
          await supabase
            .from('business_photos')
            .update({ display_order: 0 })
            .eq('id', photos[0].id);
        }
      }

      toast({
        title: "Nettoyage terminé",
        description: `${totalDeleted} photo(s) dupliquée(s) supprimée(s)`,
      });

      fetchBusinesses();
    } catch (error: any) {
      console.error('Error cleaning duplicate photos:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de nettoyer les photos",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
    };
    
    const labels: Record<string, string> = {
      pending: "En attente",
      approved: "Approuvée",
      rejected: "Rejetée",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Tableau de bord Admin
          </h1>
          <p className="text-muted-foreground">
            Gérez les annonces et les propositions de modification
          </p>
        </div>

        {/* Security Monitoring Card */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="border-orange-500/50 bg-gradient-to-r from-orange-500/10 to-red-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-orange-500/20">
                    <Shield className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Surveillance de sécurité</h3>
                    <p className="text-sm text-muted-foreground">
                      Moniteur en temps réel des tentatives de connexion
                    </p>
                  </div>
                </div>
                <Link to="/admin/security">
                  <Button size="lg" variant="outline" className="border-orange-500 hover:bg-orange-500/10">
                    <Shield className="h-4 w-4 mr-2" />
                    Accéder
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-500/50 bg-gradient-to-r from-green-500/10 to-emerald-500/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-green-500/20">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Conformité PCI DSS</h3>
                    <p className="text-sm text-muted-foreground">
                      Rapport de sécurité et certifications Level 1
                    </p>
                  </div>
                </div>
                <Link to="/admin/compliance">
                  <Button size="lg" variant="outline" className="border-green-500 hover:bg-green-500/10">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Voir rapport
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="businesses" className="w-full">
          <TabsList className="grid w-full max-w-6xl grid-cols-8 mb-6">
            <TabsTrigger value="businesses">Annonces</TabsTrigger>
            <TabsTrigger value="import">Importer</TabsTrigger>
            <TabsTrigger value="pending-changes">Modifications</TabsTrigger>
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="reports">Signalements</TabsTrigger>
            <TabsTrigger value="subscriptions">Abonnements</TabsTrigger>
            <TabsTrigger value="blog">Articles</TabsTrigger>
            <TabsTrigger value="emails">Emails</TabsTrigger>
          </TabsList>

          <TabsContent value="businesses">
            {/* Outil de nettoyage des photos */}
            <Card className="mb-6 border-blue-500/50 bg-gradient-to-r from-blue-500/5 to-cyan-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-blue-500" />
                  Nettoyage des photos dupliquées
                </CardTitle>
                <CardDescription>
                  Supprimez toutes les photos dupliquées de chaque annonce. Seule la première photo de chaque annonce sera conservée.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  onClick={handleCleanupDuplicatePhotos}
                  disabled={loading}
                  className="border-blue-500 hover:bg-blue-500/10"
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Nettoyer les photos dupliquées
                </Button>
              </CardContent>
            </Card>

            <div className="grid gap-6">
          {businesses.map((business) => (
            <Card key={business.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{business.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {business.location} • {business.industry}
                    </CardDescription>
                  </div>
                  {getStatusBadge(business.approval_status)}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4 line-clamp-2">
                  {business.description}
                </p>
                <div className="flex flex-wrap gap-4 mb-4 text-sm">
                  <div>
                    <span className="font-semibold">Prix demandé:</span> {business.asking_price?.toLocaleString()} $ CAD
                  </div>
                  {business.annual_revenue && (
                    <div>
                      <span className="font-semibold">Chiffre d'affaires:</span> {business.annual_revenue?.toLocaleString()} $ CAD
                    </div>
                  )}
                </div>
                {business.rejection_reason && business.approval_status === 'rejected' && (
                  <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm">
                      <span className="font-semibold">Raison du refus:</span> {business.rejection_reason}
                    </p>
                  </div>
                )}
                 <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/entreprise/${business.slug}`)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Voir
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(business)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Éditer
                  </Button>
                  <Button
                    variant={business.is_featured ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => toggleFeatured(business.id, business.is_featured)}
                  >
                    <Star className={`mr-2 h-4 w-4 ${business.is_featured ? 'fill-current' : ''}`} />
                    {business.is_featured ? 'Retirer vedette' : 'Mettre en vedette'}
                  </Button>
                  {business.approval_status !== 'approved' && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => updateBusinessStatus(business.id, 'approved')}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approuver
                    </Button>
                  )}
                  {business.approval_status !== 'rejected' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleReject(business)}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Rejeter
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(business)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
            </div>
          </TabsContent>

          <TabsContent value="import">
            <Card>
              <CardHeader>
                <CardTitle>Importer une annonce</CardTitle>
                <CardDescription>
                  Copiez l'URL d'une annonce d'un autre site pour l'importer automatiquement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="import-url">URL de l'annonce</Label>
                    <Input
                      id="import-url"
                      type="url"
                      placeholder="https://exemple.com/annonce/123"
                      value={importUrl}
                      onChange={(e) => setImportUrl(e.target.value)}
                      disabled={importLoading}
                    />
                  </div>
                  <Button
                    onClick={handleImportListing}
                    disabled={importLoading || !importUrl.trim()}
                    className="w-full sm:w-auto"
                  >
                    {importLoading ? "Extraction en cours..." : "Extraire les données"}
                  </Button>
                </div>

                {importedData && (
                  <div className="mt-8 space-y-6 p-6 bg-muted/30 rounded-lg border border-border">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Données extraites</h3>
                      <Badge variant="secondary">Vérifiez avant de publier</Badge>
                    </div>

                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label>Titre</Label>
                        <Input
                          value={importedData.title || ''}
                          onChange={(e) => setImportedData({ ...importedData, title: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={importedData.description || ''}
                          onChange={(e) => setImportedData({ ...importedData, description: e.target.value })}
                          rows={6}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Prix demandé ($)</Label>
                          <Input
                            type="number"
                            value={importedData.asking_price || ''}
                            onChange={(e) => setImportedData({ ...importedData, asking_price: parseFloat(e.target.value) })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Revenus annuels ($)</Label>
                          <Input
                            type="number"
                            value={importedData.annual_revenue || ''}
                            onChange={(e) => setImportedData({ ...importedData, annual_revenue: parseFloat(e.target.value) || null })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Ville</Label>
                          <Input
                            value={importedData.city || ''}
                            onChange={(e) => setImportedData({ ...importedData, city: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Province</Label>
                          <Input
                            value={importedData.province || ''}
                            onChange={(e) => setImportedData({ ...importedData, province: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Industrie</Label>
                          <Select
                            value={importedData.industry}
                            onValueChange={(value) => setImportedData({ ...importedData, industry: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {QUEBEC_INDUSTRIES.map((industry) => (
                                <SelectItem key={industry.value} value={industry.value}>
                                  {industry.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Employés</Label>
                          <Input
                            type="number"
                            value={importedData.employees_count || ''}
                            onChange={(e) => setImportedData({ ...importedData, employees_count: parseInt(e.target.value) || null })}
                          />
                        </div>
                      </div>

                      {importedData.source_url && (
                        <div className="p-3 bg-muted rounded-lg text-sm">
                          <span className="font-semibold">Source:</span>{' '}
                          <a href={importedData.source_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {importedData.source_url}
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                      <Button onClick={handlePublishImportedListing} variant="publish" className="flex-1">
                        Publier l'annonce
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setImportedData(null);
                          setImportUrl("");
                        }}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Outils de démonstration</CardTitle>
                <CardDescription>
                  Régénération des images réalistes pour les annonces démo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Cliquez sur ce bouton pour assigner des images professionnelles réalistes (depuis Unsplash) 
                  à toutes les annonces marquées comme "démo". Les images générées par IA seront remplacées 
                  par des photos authentiques de commerces. Ce processus peut prendre quelques minutes.
                </p>
                <Button
                  onClick={handleGenerateDemoImages}
                  disabled={generatingDemoImages}
                  className="w-full sm:w-auto"
                >
                  {generatingDemoImages ? "Attribution en cours..." : "Régénérer avec images réalistes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending-changes">
            <div className="grid gap-6">
              {businesses.filter(b => b.has_pending_changes).length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">Aucune modification en attente.</p>
                  </CardContent>
                </Card>
              ) : (
                businesses.filter(b => b.has_pending_changes).map((business) => (
                  <Card key={business.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{business.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {business.seller_email || "Email non disponible"}
                          </CardDescription>
                        </div>
                        <Badge variant="default" className="bg-orange-500">
                          Modifications en attente
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <p className="text-sm font-semibold mb-3">Modifications proposées :</p>
                          <div className="space-y-2 text-sm">
                            {business.pending_changes?.title && (
                              <div>
                                <span className="font-semibold">Nouveau titre :</span>
                                <p className="text-muted-foreground">{business.pending_changes.title}</p>
                              </div>
                            )}
                            {business.pending_changes?.description && (
                              <div>
                                <span className="font-semibold">Nouvelle description :</span>
                                <p className="text-muted-foreground line-clamp-3">{business.pending_changes.description}</p>
                              </div>
                            )}
                            {business.pending_changes?.asking_price && (
                              <div>
                                <span className="font-semibold">Nouveau prix :</span>
                                <p className="text-muted-foreground">
                                  {new Intl.NumberFormat('fr-CA', {
                                    style: 'currency',
                                    currency: business.currency || 'CAD',
                                  }).format(business.pending_changes.asking_price)}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Soumis le: {new Date(business.pending_changes_submitted_at).toLocaleDateString('fr-CA', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/entreprise/${business.slug}`)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Voir l'annonce actuelle
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => approvePendingChanges(business.id)}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approuver les modifications
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedBusiness(business);
                              setRejectDialogOpen(true);
                            }}
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Rejeter
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="users">
            {/* Force Delete Email Tool */}
            <Card className="mb-6 border-orange-500/50 bg-gradient-to-r from-orange-500/5 to-red-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-orange-500" />
                  Nettoyage forcé d'email
                </CardTitle>
                <CardDescription>
                  Utilisez cet outil pour supprimer complètement toutes les traces d'un email spécifique. 
                  <span className="font-semibold text-orange-600"> Note: En raison des limitations de Supabase Auth, il peut y avoir un délai de 24-48h avant que l'email soit complètement disponible.</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="force-delete-email">Email à nettoyer</Label>
                    <Input 
                      id="force-delete-email"
                      type="email"
                      placeholder="email@example.com"
                      value={forceDeleteEmail}
                      onChange={(e) => setForceDeleteEmail(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="destructive"
                      onClick={async () => {
                        if (!forceDeleteEmail) {
                          toast({
                            variant: "destructive",
                            title: "Erreur",
                            description: "Veuillez entrer un email",
                          });
                          return;
                        }

                        if (!confirm(`⚠️ ATTENTION: Vous êtes sur le point de forcer la suppression complète de toutes les données pour ${forceDeleteEmail}.\n\nCela supprimera:\n- L'utilisateur de auth.users\n- Toutes les données de profil\n- Tous les codes de vérification\n- Toutes les tentatives de connexion\n- Tous les fingerprints\n\nNote: Il peut y avoir un délai de 24-48h avant que l'email soit complètement disponible dans Supabase Auth.\n\nÊtes-vous sûr de vouloir continuer?`)) {
                          return;
                        }

                        setLoading(true);
                        try {
                          const { data, error } = await supabase.functions.invoke('force-delete-user-email', {
                            body: { email: forceDeleteEmail }
                          });

                          if (error) throw error;

                          toast({
                            title: "Nettoyage effectué",
                            description: data?.message || `${data?.usersDeleted || 0} utilisateur(s) supprimé(s). Les tables ont été nettoyées.`,
                            duration: 10000,
                          });

                          setForceDeleteEmail("");
                          fetchUsers();
                        } catch (error: any) {
                          console.error('Error force deleting email:', error);
                          toast({
                            variant: "destructive",
                            title: "Erreur",
                            description: error.message || "Impossible de nettoyer l'email",
                          });
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading || !forceDeleteEmail}
                    >
                      <UserX className="mr-2 h-4 w-4" />
                      Forcer le nettoyage
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {users.map((user) => (
                <Card key={user.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{user.email}</CardTitle>
                        {user.full_name && (
                          <CardDescription className="mt-1">
                            {user.full_name}
                          </CardDescription>
                        )}
                      </div>
                      <Badge variant={user.email_confirmed_at ? "default" : "secondary"}>
                        {user.email_confirmed_at ? (
                          <>
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Compte vérifié
                          </>
                        ) : (
                          <>
                            <XCircle className="mr-1 h-3 w-3" />
                            Non vérifié
                          </>
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4 mb-4 text-sm">
                      {user.phone && (
                        <div>
                          <span className="font-semibold">Téléphone:</span> {user.phone}
                        </div>
                      )}
                      <div>
                        <span className="font-semibold">Inscrit le:</span>{" "}
                        {new Date(user.created_at).toLocaleDateString('fr-CA')}
                      </div>
                      {user.email_confirmed_at && (
                        <div>
                          <span className="font-semibold">Email confirmé le:</span>{" "}
                          {new Date(user.email_confirmed_at).toLocaleDateString('fr-CA')}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setUserToDelete(user);
                        setDeleteUserDialogOpen(true);
                      }}
                    >
                      <UserX className="mr-2 h-4 w-4" />
                      Supprimer le compte
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reports">
            <div className="grid gap-4">
              {reports.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">Aucun signalement pour le moment.</p>
                  </CardContent>
                </Card>
              ) : (
                reports.map((report) => (
                  <Card key={report.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">
                            {report.businesses?.title || "Annonce supprimée"}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            Signalé par: {report.profiles?.email || "Utilisateur inconnu"}
                          </CardDescription>
                        </div>
                        {getReportStatusBadge(report.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="bg-muted/30 p-4 rounded-lg">
                          <p className="text-sm font-semibold mb-2">Raison du signalement:</p>
                          <Badge variant="outline" className="mb-2">
                            {getReportReasonLabel(report.reason)}
                          </Badge>
                          {report.details && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {report.details}
                            </p>
                          )}
                        </div>

                        {report.businesses && (
                          <div className="text-sm">
                            <p><span className="font-semibold">Secteur:</span> {report.businesses.industry}</p>
                            <p><span className="font-semibold">Localisation:</span> {report.businesses.location}</p>
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground">
                          Signalé le: {new Date(report.created_at).toLocaleDateString('fr-CA', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>

                        {report.reviewed_at && (
                          <div className="text-xs text-muted-foreground">
                            Traité le: {new Date(report.reviewed_at).toLocaleDateString('fr-CA', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        )}

                        <div className="flex gap-2 flex-wrap">
                          {report.business_id && report.businesses?.slug && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/entreprise/${report.businesses.slug}`)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Voir l'annonce
                            </Button>
                          )}
                          
                          {report.status === 'pending' && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleReportStatusUpdate(report.id, 'resolved')}
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Marquer résolu
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleReportStatusUpdate(report.id, 'rejected')}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Rejeter
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="subscriptions">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Abonnements Club Select Actifs</CardTitle>
                  <CardDescription>
                    Gestion des abonnements Club Select en cours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {subscriptions.filter(sub => sub.status === 'active' && new Date(sub.current_period_end) > new Date()).length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Aucun abonnement Club Select actif
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {subscriptions
                        .filter(sub => sub.status === 'active' && new Date(sub.current_period_end) > new Date())
                        .map((subscription) => {
                          const now = new Date();
                          const end = new Date(subscription.current_period_end);
                          const diffMs = end.getTime() - now.getTime();
                          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                          const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                          return (
                            <Card key={subscription.id} className="border-2 border-primary/20">
                              <CardContent className="pt-6">
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-semibold text-lg">
                                        {subscription.user_name || subscription.user_email}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {subscription.user_email}
                                      </p>
                                    </div>
                                    <Badge className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black font-bold border-0">
                                      ⭐ CLUB SELECT
                                    </Badge>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <p className="text-muted-foreground">Date de souscription</p>
                                      <p className="font-semibold">
                                        {new Date(subscription.created_at).toLocaleDateString('fr-CA', {
                                          day: 'numeric',
                                          month: 'long',
                                          year: 'numeric'
                                        })}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-muted-foreground">Fin de la période</p>
                                      <p className="font-semibold">
                                        {end.toLocaleDateString('fr-CA', {
                                          day: 'numeric',
                                          month: 'long',
                                          year: 'numeric'
                                        })}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="bg-accent/10 p-3 rounded-lg">
                                    <p className="text-sm font-semibold text-primary">
                                      ⏱️ Temps restant: {diffDays > 0 
                                        ? `${diffDays} jour${diffDays > 1 ? 's' : ''} et ${diffHours} heure${diffHours > 1 ? 's' : ''}`
                                        : diffHours > 0 
                                        ? `${diffHours} heure${diffHours > 1 ? 's' : ''}`
                                        : 'Expire bientôt'
                                      }
                                    </p>
                                  </div>

                                   <div className="flex gap-2 pt-2 text-xs text-muted-foreground">
                                    <div>
                                      <span className="font-semibold">ID Stripe:</span> {subscription.stripe_subscription_id}
                                    </div>
                                  </div>

                                  <div className="pt-4 border-t mt-4">
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={async () => {
                                        if (!confirm(`Voulez-vous vraiment annuler l'abonnement de ${subscription.user_email} ?\n\nL'abonnement restera actif jusqu'à la fin de la période payée, puis ne sera pas renouvelé.`)) {
                                          return;
                                        }
                                        
                                        try {
                                          const { data, error } = await supabase.functions.invoke('admin-cancel-subscription', {
                                            body: { subscriptionId: subscription.stripe_subscription_id }
                                          });

                                          if (error) throw error;

                                          toast({
                                            title: "Abonnement annulé",
                                            description: data?.message || "L'abonnement restera actif jusqu'à la fin de la période payée.",
                                          });

                                          fetchSubscriptions();
                                        } catch (error: any) {
                                          console.error('Error cancelling subscription:', error);
                                          toast({
                                            variant: "destructive",
                                            title: "Erreur",
                                            description: error.message || "Impossible d'annuler l'abonnement",
                                          });
                                        }
                                      }}
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Annuler le renouvellement
                                    </Button>
                                    <p className="text-xs text-muted-foreground mt-2">
                                      L&apos;abonnement restera actif jusqu&apos;à la fin de la période payée
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Historique des Abonnements</CardTitle>
                  <CardDescription>
                    Tous les abonnements (actifs, expirés et annulés)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {subscriptions.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Aucun abonnement enregistré
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {subscriptions.map((subscription) => {
                        const isActive = subscription.status === 'active' && new Date(subscription.current_period_end) > new Date();
                        
                        return (
                          <div key={subscription.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex-1">
                              <p className="font-semibold">{subscription.user_email}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(subscription.created_at).toLocaleDateString('fr-CA')} → {new Date(subscription.current_period_end).toLocaleDateString('fr-CA')}
                              </p>
                            </div>
                            <Badge variant={isActive ? "default" : "secondary"}>
                              {isActive ? 'Actif' : subscription.status === 'canceled' ? 'Annulé' : 'Expiré'}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="blog">
            <BlogManager />
          </TabsContent>

          <TabsContent value="emails">
            <EmailTemplateManager />
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedBusiness?.has_pending_changes 
                ? "Rejeter les modifications" 
                : "Rejeter l'annonce"}
            </DialogTitle>
            <DialogDescription>
              {selectedBusiness?.has_pending_changes
                ? "Veuillez fournir une raison pour le refus de ces modifications. L'utilisateur recevra une notification avec cette information."
                : "Veuillez fournir une raison pour le refus de cette annonce. L'utilisateur recevra un email avec cette information."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="rejection-reason">Raison du refus *</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: L'annonce ne respecte pas nos conditions d'utilisation car..."
                rows={4}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!rejectionReason.trim()) {
                  toast({
                    variant: "destructive",
                    title: "Erreur",
                    description: "Veuillez fournir une raison pour le refus.",
                  });
                  return;
                }
                
                if (selectedBusiness?.has_pending_changes) {
                  rejectPendingChanges(selectedBusiness.id, rejectionReason);
                  setRejectDialogOpen(false);
                  setRejectionReason("");
                  setSelectedBusiness(null);
                } else {
                  updateBusinessStatus(selectedBusiness?.id, 'rejected', rejectionReason);
                }
              }}
              disabled={!rejectionReason.trim()}
            >
              Confirmer le refus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Éditer l'annonce</DialogTitle>
            <DialogDescription>
              Modifiez les détails de l'annonce ci-dessous.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Gestion des images existantes */}
            {existingPhotos.length > 0 && (
              <div>
                <Label>Images actuelles ({existingPhotos.length})</Label>
                <div className="mt-2 space-y-2">
                  {existingPhotos.map((photo, index) => (
                    <div key={photo.id} className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30">
                      <img 
                        src={photo.photo_url} 
                        alt={`Photo ${index + 1}`}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <span className="text-sm flex-1 truncate">{photo.photo_url}</span>
                      <div className="flex gap-1">
                        {index > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              const newPhotos = [...existingPhotos];
                              const temp = newPhotos[index];
                              newPhotos[index] = newPhotos[index - 1];
                              newPhotos[index - 1] = temp;
                              
                              // Update display orders
                              await Promise.all(newPhotos.map((p, idx) => 
                                supabase
                                  .from('business_photos')
                                  .update({ display_order: idx })
                                  .eq('id', p.id)
                              ));
                              
                              setExistingPhotos(newPhotos);
                              toast({ title: "Ordre modifié" });
                            }}
                          >
                            <ChevronUp className="w-4 h-4" />
                          </Button>
                        )}
                        {index < existingPhotos.length - 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              const newPhotos = [...existingPhotos];
                              const temp = newPhotos[index];
                              newPhotos[index] = newPhotos[index + 1];
                              newPhotos[index + 1] = temp;
                              
                              await Promise.all(newPhotos.map((p, idx) => 
                                supabase
                                  .from('business_photos')
                                  .update({ display_order: idx })
                                  .eq('id', p.id)
                              ));
                              
                              setExistingPhotos(newPhotos);
                              toast({ title: "Ordre modifié" });
                            }}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () => {
                            if (!confirm('Supprimer cette image ?')) return;
                            
                            await supabase
                              .from('business_photos')
                              .delete()
                              .eq('id', photo.id);
                            
                            setExistingPhotos(existingPhotos.filter(p => p.id !== photo.id));
                            toast({ title: "Image supprimée" });
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ajouter une nouvelle photo via PhotoManager */}
            <div>
              <Label>Gestion des photos</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Utilisez le gestionnaire de photos ci-dessus pour ajouter, réorganiser ou supprimer des images.
              </p>
            </div>

            <div>
              <Label htmlFor="edit-title">Titre *</Label>
              <Input
                id="edit-title"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                placeholder="Nom de l'entreprise"
                maxLength={200}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="edit-industry">Secteur d'activité *</Label>
              <Select 
                value={editFormData.industry} 
                onValueChange={(value) => setEditFormData({ ...editFormData, industry: value })}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Sélectionnez un secteur" />
                </SelectTrigger>
                <SelectContent>
                  {QUEBEC_INDUSTRIES.map((industry) => (
                    <SelectItem key={industry.value} value={industry.value}>
                      {industry.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-description">Description *</Label>
              <RichTextEditor
                content={editFormData.description}
                onChange={(content) => setEditFormData({ ...editFormData, description: content })}
                placeholder="Description détaillée de l'entreprise"
              />
              <div className="flex items-center justify-between mt-1">
                <p className={`text-xs ${editFormData.description.length > 20000 ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
                  {editFormData.description.length.toLocaleString()}/20 000 caractères
                </p>
                {editFormData.description.length > 20000 && (
                  <p className="text-xs text-destructive">
                    ⚠️ La description est très longue
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-price">Prix demandé (CAD) *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={editFormData.asking_price}
                  onChange={(e) => setEditFormData({ ...editFormData, asking_price: e.target.value })}
                  placeholder="450000"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="edit-revenue">Chiffre d'affaires annuel (CAD)</Label>
                <Input
                  id="edit-revenue"
                  type="number"
                  value={editFormData.annual_revenue}
                  onChange={(e) => setEditFormData({ ...editFormData, annual_revenue: e.target.value })}
                  placeholder="650000"
                  className="mt-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-profit">Marge bénéficiaire (%)</Label>
                <Input
                  id="edit-profit"
                  type="number"
                  step="0.1"
                  value={editFormData.profit_margin}
                  onChange={(e) => setEditFormData({ ...editFormData, profit_margin: e.target.value })}
                  placeholder="22.5"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="edit-employees">Employés</Label>
                <Input
                  id="edit-employees"
                  type="number"
                  value={editFormData.employees_count}
                  onChange={(e) => setEditFormData({ ...editFormData, employees_count: e.target.value })}
                  placeholder="8"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="edit-year">Année de création</Label>
                <Input
                  id="edit-year"
                  type="number"
                  value={editFormData.year_established}
                  onChange={(e) => setEditFormData({ ...editFormData, year_established: e.target.value })}
                  placeholder="2009"
                  className="mt-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="edit-city">Ville *</Label>
                <Input
                  id="edit-city"
                  value={editFormData.city}
                  onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                  placeholder="Montréal"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="edit-province">Province *</Label>
                <Input
                  id="edit-province"
                  value={editFormData.province}
                  onChange={(e) => setEditFormData({ ...editFormData, province: e.target.value })}
                  placeholder="Québec"
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="edit-location">Emplacement complet *</Label>
                <Input
                  id="edit-location"
                  value={editFormData.location}
                  onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                  placeholder="Montréal, QC"
                  className="mt-2"
                />
              </div>
            </div>

            {/* Champs admin uniquement */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="secondary">Admin uniquement</Badge>
                <p className="text-xs text-muted-foreground">
                  Ces informations ne seront visibles que par les administrateurs
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-seller-name">Nom du contact</Label>
                    <Input
                      id="edit-seller-name"
                      value={editFormData.seller_name}
                      onChange={(e) => setEditFormData({ ...editFormData, seller_name: e.target.value })}
                      placeholder="Jean Dupont"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-seller-phone">Téléphone du contact</Label>
                    <Input
                      id="edit-seller-phone"
                      value={editFormData.seller_phone}
                      onChange={(e) => setEditFormData({ ...editFormData, seller_phone: e.target.value })}
                      placeholder="514-555-1234"
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="edit-seller-email">Email du contact</Label>
                  <Input
                    id="edit-seller-email"
                    type="email"
                    value={editFormData.seller_email}
                    onChange={(e) => setEditFormData({ ...editFormData, seller_email: e.target.value })}
                    placeholder="contact@entreprise.com"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-source-url">Lien source de l&apos;annonce</Label>
                  <Input
                    id="edit-source-url"
                    type="url"
                    value={editFormData.source_url}
                    onChange={(e) => setEditFormData({ ...editFormData, source_url: e.target.value })}
                    placeholder="https://exemple.com/annonce"
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Ce lien ne sera visible que dans l&apos;interface admin
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-chat-disabled"
                    checked={editFormData.chat_disabled}
                    onChange={(e) => setEditFormData({ ...editFormData, chat_disabled: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="edit-chat-disabled" className="font-normal cursor-pointer">
                    Désactiver le chat pour cette annonce
                  </Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={uploadingImage}>
              Annuler
            </Button>
            <Button onClick={handleEditSave} disabled={uploadingImage}>
              {uploadingImage ? "Enregistrement..." : "Sauvegarder"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'annonce "{businessToDelete?.title}" ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteUserDialogOpen} onOpenChange={setDeleteUserDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le compte de "{userToDelete?.email}" ? Cette action supprimera toutes les données associées (annonces, favoris, messages, etc.) et est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90">
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;
