import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, LogOut, Star, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BusinessCard from "@/components/BusinessCard";
import { MessagesList } from "@/components/MessagesList";
import { PurchasedBusinesses } from "@/components/PurchasedBusinesses";
import { WithdrawBusinessDialog } from "@/components/WithdrawBusinessDialog";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredDialogOpen, setFeaturedDialogOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [businessToWithdraw, setBusinessToWithdraw] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        fetchUserBusinesses(session.user.id);
        
        // Check if user is admin
        const { data: hasAdminRole } = await supabase
          .rpc('has_role', { 
            _user_id: session.user.id, 
            _role: 'admin' 
          });
        setIsAdmin(!!hasAdminRole);
      }
    });

    // Check for payment success/cancel
    if (searchParams.get('featured_success') === 'true') {
      toast({
        title: "Paiement réussi!",
        description: "Votre annonce est maintenant en vedette pour 7 jours.",
      });
      setSearchParams({});
    } else if (searchParams.get('featured_cancel') === 'true') {
      toast({
        variant: "destructive",
        title: "Paiement annulé",
        description: "Le paiement a été annulé.",
      });
      setSearchParams({});
    } else if (searchParams.get('payment_verified') === 'true') {
      toast({
        title: "Accès débloqué!",
        description: "Vous pouvez maintenant voir vos achats dans l'onglet 'Mes Achats'.",
      });
      setSearchParams({});
    }
  }, [navigate, searchParams, setSearchParams, toast]);

  const fetchUserBusinesses = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("seller_id", userId)
        .neq("status", "archived")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBusinesses(data || []);
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

  const handleWithdrawClick = (business: any) => {
    setBusinessToWithdraw(business);
    setWithdrawDialogOpen(true);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleFeatureClick = (business: any) => {
    setSelectedBusiness(business);
    setFeaturedDialogOpen(true);
  };

  const handleFeaturePayment = async () => {
    if (!selectedBusiness) return;

    setProcessingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-featured-checkout', {
        body: { businessId: selectedBusiness.id }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        setFeaturedDialogOpen(false);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de créer la session de paiement",
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10">
      <div className="container mx-auto px-4 py-12">
        <Tabs defaultValue="businesses" className="w-full">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Tableau de bord
            </h1>
            <p className="text-muted-foreground mb-6">
              Gérez vos annonces et vos conversations
            </p>
            <TabsList className="grid w-full max-w-3xl grid-cols-3">
              <TabsTrigger value="businesses">Mes annonces</TabsTrigger>
              <TabsTrigger value="purchases">Mes achats</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="businesses" className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Chargement...</p>
              </div>
            ) : businesses.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-2xl border border-border/50">
                <p className="text-muted-foreground mb-4">
                  Vous n'avez pas encore d'annonces
                </p>
                <Button onClick={() => navigate("/list-business")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer ma première annonce
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {businesses.map((business) => (
                  <div key={business.id} className="space-y-2">
                    <BusinessCard 
                      {...business}
                      showActions={true}
                      onWithdraw={() => handleWithdrawClick(business)}
                      onFeature={() => handleFeatureClick(business)}
                    />
                    {business.rejection_reason && business.approval_status === 'rejected' && (
                      <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-sm font-semibold mb-1">Raison du refus:</p>
                        <p className="text-sm text-muted-foreground">{business.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="purchases">
            {user && <PurchasedBusinesses userId={user.id} />}
          </TabsContent>

          <TabsContent value="messages">
            {user && <MessagesList userId={user.id} />}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={featuredDialogOpen} onOpenChange={setFeaturedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mettre votre annonce en avant</DialogTitle>
            <DialogDescription>
              Mettez votre annonce en vedette avec une étoile dorée pour 20$ CAD.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-secondary/20 p-4 rounded-lg border border-border">
              <h3 className="font-semibold mb-2">{selectedBusiness?.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Votre annonce sera mise en avant pendant 30 jours ou jusqu'à ce que 3 nouvelles annonces soient promues après la vôtre.
              </p>
              <div className="flex items-center gap-2 text-primary">
                <Star className="h-5 w-5 fill-current" />
                <span className="font-bold">20$ CAD</span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">✨ Votre annonce apparaîtra en haut avec une étoile dorée</p>
              <p className="mb-2">🎯 Maximum 3 annonces en avant en même temps</p>
              <p>⏱️ Valide 30 jours ou jusqu'à être déplacée par de nouvelles annonces</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleFeaturePayment} 
              disabled={processingPayment}
              className="flex-1"
            >
              {processingPayment ? "Traitement..." : "Payer 20$ CAD"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setFeaturedDialogOpen(false)}
              disabled={processingPayment}
            >
              Annuler
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {businessToWithdraw && (
        <WithdrawBusinessDialog
          business={businessToWithdraw}
          open={withdrawDialogOpen}
          onOpenChange={setWithdrawDialogOpen}
          onSuccess={() => {
            fetchUserBusinesses(user.id);
            setBusinessToWithdraw(null);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
