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
import { CheckCircle, XCircle, Eye, ArrowLeft, Trash2, Star, Edit, Upload, UserX } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { z } from "zod";
import { QUEBEC_INDUSTRIES } from "@/lib/constants";
import { EditProposalsManager } from "@/components/EditProposalsManager";

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
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);

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

      // Then fetch seller contacts and featured status for each
      const businessesWithDetails = await Promise.all(
        (businessesData || []).map(async (business) => {
          // Get seller contact
          const { data: contactData } = await supabase
            .from('seller_contacts')
            .select('email')
            .eq('seller_id', business.seller_id)
            .single();

          // Get featured status
          const { data: isFeatured } = await supabase
            .rpc('is_business_featured', { business_uuid: business.id });

          return {
            ...business,
            seller_email: contactData?.email || null,
            is_featured: !!isFeatured
          };
        })
      );

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

      // Send email notification (commented out temporarily due to resend package issue)
      // if (business?.seller_email) {
      //   await supabase.functions.invoke('send-approval-email', {
      //     body: {
      //       email: business.seller_email,
      //       businessTitle: business.title,
      //       status: approvalStatus,
      //       rejectionReason: rejectionReason,
      //     }
      //   });
      // }

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

  const toggleFeatured = async (businessId: string, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        // Remove from featured (delete payment record)
        const { error } = await supabase
          .from('featured_payments')
          .delete()
          .eq('business_id', businessId);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "L'annonce n'est plus en vedette.",
        });
      } else {
        // Add to featured (create payment record)
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { error } = await supabase
          .from('featured_payments')
          .insert({
            user_id: session.user.id,
            business_id: businessId,
            amount: 20,
            featured_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            payment_status: 'completed'
          });

        if (error) throw error;

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

  const handleEditClick = (business: any) => {
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
    });
    setImageFile(null);
    setEditDialogOpen(true);
  };

  const editBusinessSchema = z.object({
    title: z.string().trim().min(5, "Le titre doit contenir au moins 5 caractères").max(200, "Le titre doit contenir maximum 200 caractères"),
    description: z.string().trim().min(20, "La description doit contenir au moins 20 caractères").max(5000, "La description doit contenir maximum 5000 caractères"),
    asking_price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Prix invalide"),
    annual_revenue: z.string().optional(),
    profit_margin: z.string().optional(),
    employees_count: z.string().optional(),
    year_established: z.string().optional(),
    location: z.string().trim().min(2, "Emplacement requis"),
    city: z.string().trim().min(2, "Ville requise"),
    province: z.string().trim().min(2, "Province requise"),
    industry: z.string().min(1, "Secteur requis"),
  });

  const handleImageUpload = async (businessId: string): Promise<string | null> => {
    if (!imageFile) return null;

    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${businessId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('business-photos')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('business-photos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleEditSave = async () => {
    try {
      setUploadingImage(true);
      
      // Validate form data
      const validated = editBusinessSchema.parse(editFormData);

      // Upload image if provided
      let photoUrl = null;
      if (imageFile) {
        photoUrl = await handleImageUpload(selectedBusiness?.id);
      }

      // Update business
      const updateData: any = {
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
        industry: validated.industry as any, // Cast to any to handle ENUM type
      };

      const { error } = await supabase
        .from('businesses')
        .update(updateData)
        .eq('id', selectedBusiness?.id);

      if (error) throw error;

      // Update or insert photo if uploaded
      if (photoUrl) {
        // Delete existing photos first
        await supabase
          .from('business_photos')
          .delete()
          .eq('business_id', selectedBusiness?.id);

        // Insert new photo
        await supabase
          .from('business_photos')
          .insert({
            business_id: selectedBusiness?.id,
            photo_url: photoUrl,
            display_order: 1
          });
      }

      toast({
        title: "Succès",
        description: "L'annonce a été mise à jour.",
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

      setUsers(usersData || []);
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
            .select('title, industry, location')
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

        <Tabs defaultValue="businesses" className="w-full">
          <TabsList className="grid w-full max-w-4xl grid-cols-5 mb-6">
            <TabsTrigger value="businesses">Annonces</TabsTrigger>
            <TabsTrigger value="proposals">Propositions</TabsTrigger>
            <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            <TabsTrigger value="reports">Signalements</TabsTrigger>
            <TabsTrigger value="subscriptions">Abonnements</TabsTrigger>
          </TabsList>

          <TabsContent value="businesses">
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
                    onClick={() => navigate(`/business/${business.id}`)}
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

          <TabsContent value="proposals">
            <EditProposalsManager />
          </TabsContent>

          <TabsContent value="users">
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
                          {report.business_id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/business/${report.business_id}`)}
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
                  <CardTitle>Abonnements Premium Actifs</CardTitle>
                  <CardDescription>
                    Gestion des abonnements Premium en cours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {subscriptions.filter(sub => sub.status === 'active' && new Date(sub.current_period_end) > new Date()).length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Aucun abonnement Premium actif
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
                                    <Badge className="bg-gradient-to-r from-primary to-accent text-white">
                                      PREMIUM
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
                                        if (!confirm(`Voulez-vous vraiment annuler l'abonnement de ${subscription.user_email} ?`)) {
                                          return;
                                        }
                                        
                                        try {
                                          const { error } = await supabase.functions.invoke('admin-cancel-subscription', {
                                            body: { subscriptionId: subscription.stripe_subscription_id }
                                          });

                                          if (error) throw error;

                                          toast({
                                            title: "Succès",
                                            description: "L'abonnement a été annulé avec succès.",
                                          });

                                          fetchSubscriptions();
                                        } catch (error: any) {
                                          toast({
                                            variant: "destructive",
                                            title: "Erreur",
                                            description: error.message || "Impossible d'annuler l'abonnement",
                                          });
                                        }
                                      }}
                                    >
                                      <XCircle className="mr-2 h-4 w-4" />
                                      Annuler l'abonnement
                                    </Button>
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
        </Tabs>
      </div>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter l'annonce</DialogTitle>
            <DialogDescription>
              Veuillez fournir une raison pour le refus de cette annonce. L'utilisateur recevra un email avec cette information.
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
                updateBusinessStatus(selectedBusiness?.id, 'rejected', rejectionReason);
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
            <div>
              <Label htmlFor="edit-image">Photo de l'entreprise</Label>
              <div className="mt-2">
                <Input
                  id="edit-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
                {imageFile && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    {imageFile.name}
                  </p>
                )}
              </div>
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
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                placeholder="Description détaillée de l'entreprise"
                rows={6}
                maxLength={5000}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {editFormData.description.length} / 5000 caractères
              </p>
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
