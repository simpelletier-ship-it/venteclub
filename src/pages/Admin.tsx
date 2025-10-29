import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Eye, ArrowLeft, Trash2, Star, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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
      <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold">
              Vente<span className="text-accent">.Club</span>
            </span>
          </Link>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={createSampleData}>
              Créer Données Factices
            </Button>
            <Button variant="ghost" onClick={() => navigate("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Tableau de bord Admin
          </h1>
          <p className="text-muted-foreground">
            Gérez les annonces d'entreprises
          </p>
        </div>

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
                      <span className="font-semibold">Revenus:</span> {business.annual_revenue?.toLocaleString()} $ CAD
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
    </div>
  );
};

export default Admin;
