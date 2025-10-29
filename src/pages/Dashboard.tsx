import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, LogOut, Star, XCircle, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BusinessCard from "@/components/BusinessCard";
import { WithdrawBusinessDialog } from "@/components/WithdrawBusinessDialog";
import { EditBusinessDialog } from "@/components/EditBusinessDialog";
import { AlertsManager } from "@/components/AlertsManager";
import { PremiumSubscription } from "@/components/PremiumSubscription";
import { MessagesList } from "@/components/MessagesList";

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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [businessToEdit, setBusinessToEdit] = useState<any>(null);
  const [selectedDuration, setSelectedDuration] = useState<7 | 14 | 30>(7);
  const defaultTab = searchParams.get('tab') || 'businesses';

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
  }, [navigate]);

  useEffect(() => {
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
        description: "Vous pouvez maintenant contacter le vendeur.",
      });
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, toast]);

  const fetchUserBusinesses = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("seller_id", userId)
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

  const handleEditClick = (business: any) => {
    setBusinessToEdit(business);
    setEditDialogOpen(true);
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
        body: { 
          businessId: selectedBusiness.id,
          duration: selectedDuration
        }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        setFeaturedDialogOpen(false);
        toast({
          title: "Redirection vers le paiement",
          description: "Une nouvelle fenêtre s'est ouverte pour finaliser votre paiement.",
        });
      }
    } catch (error: any) {
      console.error('Erreur lors de la création de la session de paiement featured:', error);
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
        <Tabs defaultValue={defaultTab} className="w-full">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Tableau de bord
            </h1>
            <p className="text-muted-foreground mb-6">
              Gérez vos annonces et vos conversations
            </p>
            <TabsList className="grid w-full max-w-3xl grid-cols-4">
              <TabsTrigger value="businesses">Mes annonces</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="alerts">Alertes</TabsTrigger>
              <TabsTrigger value="subscription">Abonnement</TabsTrigger>
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
              <>
                <div className="flex justify-end mb-4">
                  <Button onClick={() => navigate("/list-business")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Créer une nouvelle annonce
                  </Button>
                </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {businesses.map((business) => (
                  <div key={business.id} className="space-y-2">
                    <div 
                      onClick={() => {
                        if (business.status === 'archived') {
                          navigate(`/list-business?edit=${business.id}`);
                        } else {
                          navigate(`/business/${business.id}`);
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <BusinessCard 
                        {...business}
                        showActions={business.status !== 'archived'}
                        onWithdraw={() => handleWithdrawClick(business)}
                        onFeature={() => handleFeatureClick(business)}
                      />
                    </div>
                    <div className="flex gap-2">
                      {business.status === 'archived' && (
                        <Button
                          onClick={async () => {
                            try {
                              await supabase
                                .from('businesses')
                                .update({ 
                                  status: 'active',
                                  approval_status: 'pending'
                                })
                                .eq('id', business.id);
                              
                              toast({
                                title: "Annonce publiée!",
                                description: "Votre annonce a été soumise pour approbation.",
                              });
                              fetchUserBusinesses(user.id);
                            } catch (error: any) {
                              toast({
                                variant: "destructive",
                                title: "Erreur",
                                description: error.message,
                              });
                            }
                          }}
                          size="sm"
                          className="flex-1"
                        >
                          Publier l'annonce
                        </Button>
                      )}
                      {business.approval_status === 'approved' && business.status !== 'sold' && business.status !== 'archived' && (
                        <Button
                          onClick={() => handleEditClick(business)}
                          size="sm"
                          variant="outline"
                          className="flex-1"
                        >
                          <Edit className="mr-1 h-3 w-3" />
                          Modifier
                        </Button>
                      )}
                    </div>
                    {business.rejection_reason && business.approval_status === 'rejected' && (
                      <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <p className="text-sm font-semibold mb-1">Raison du refus:</p>
                        <p className="text-sm text-muted-foreground">{business.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="messages">
            {user && <MessagesList userId={user.id} />}
          </TabsContent>

          <TabsContent value="alerts">
            {user && <AlertsManager userId={user.id} />}
          </TabsContent>

          <TabsContent value="subscription">
            {user && <PremiumSubscription userId={user.id} />}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={featuredDialogOpen} onOpenChange={setFeaturedDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader className="space-y-3 pb-4 border-b">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Star className="h-6 w-6 fill-primary text-primary" />
              Mettre votre annonce en avant
            </DialogTitle>
            <DialogDescription className="text-base">
              Augmentez votre visibilité et attirez plus d'acheteurs potentiels
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-6">
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-6 rounded-xl border border-primary/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">{selectedBusiness?.title}</h3>
                  <p className="text-sm text-muted-foreground">Cette annonce sera mise en avant</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Bronze Package */}
              <Card 
                className={`cursor-pointer transition-all hover:shadow-lg relative overflow-hidden ${
                  selectedDuration === 7 ? 'ring-2 ring-amber-600 shadow-lg scale-105' : 'hover:scale-102'
                }`}
                onClick={() => setSelectedDuration(7)}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-600/20 to-transparent rounded-bl-full" />
                <CardContent className="p-6 relative">
                  <Badge className="mb-4 bg-amber-600/20 text-amber-700 border-amber-600/30 font-semibold">
                    BRONZE
                  </Badge>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <Star className="h-12 w-12 fill-amber-600 text-amber-600" />
                    </div>
                    <div className="text-center space-y-1">
                      <h4 className="font-bold text-3xl text-foreground">75$</h4>
                      <p className="text-sm font-medium text-muted-foreground">7 jours de mise en avant</p>
                      <p className="text-xs text-muted-foreground">10,71$ / jour</p>
                    </div>
                    <div className="pt-4 border-t space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span>Visibilité prioritaire</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span>Badge étoile dorée</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Platinum Package */}
              <Card 
                className={`cursor-pointer transition-all hover:shadow-xl relative overflow-hidden ${
                  selectedDuration === 14 ? 'ring-2 ring-slate-500 shadow-xl scale-105' : 'hover:scale-102'
                }`}
                onClick={() => setSelectedDuration(14)}
              >
                <div className="absolute top-0 left-0 right-0">
                  <Badge className="w-full rounded-t-lg rounded-b-none bg-slate-500/90 text-white border-0 py-1">
                    ⭐ POPULAIRE
                  </Badge>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-400/20 to-transparent rounded-bl-full" />
                <CardContent className="p-6 pt-10 relative">
                  <Badge className="mb-4 bg-slate-400/20 text-slate-700 border-slate-400/30 font-semibold">
                    PLATINE
                  </Badge>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <Star className="h-12 w-12 fill-slate-400 text-slate-400" />
                    </div>
                    <div className="text-center space-y-1">
                      <h4 className="font-bold text-3xl text-foreground">100$</h4>
                      <p className="text-sm font-medium text-muted-foreground">14 jours de mise en avant</p>
                      <p className="text-xs text-muted-foreground">7,14$ / jour</p>
                    </div>
                    <div className="pt-4 border-t space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span>Visibilité prioritaire</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span>Badge étoile argentée</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span>Économie de 33%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gold Package */}
              <Card 
                className={`cursor-pointer transition-all hover:shadow-xl relative overflow-hidden ${
                  selectedDuration === 30 ? 'ring-2 ring-yellow-500 shadow-xl scale-105' : 'hover:scale-102'
                }`}
                onClick={() => setSelectedDuration(30)}
              >
                <div className="absolute top-0 left-0 right-0">
                  <Badge className="w-full rounded-t-lg rounded-b-none bg-green-600/90 text-white border-0 py-1">
                    💎 MEILLEURE VALEUR
                  </Badge>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-500/20 to-transparent rounded-bl-full" />
                <CardContent className="p-6 pt-10 relative">
                  <Badge className="mb-4 bg-yellow-500/20 text-yellow-700 border-yellow-500/30 font-semibold">
                    OR
                  </Badge>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <Star className="h-12 w-12 fill-yellow-500 text-yellow-500" />
                    </div>
                    <div className="text-center space-y-1">
                      <h4 className="font-bold text-3xl text-foreground">110$</h4>
                      <p className="text-sm font-medium text-muted-foreground">30 jours de mise en avant</p>
                      <p className="text-xs text-muted-foreground">3,67$ / jour</p>
                    </div>
                    <div className="pt-4 border-t space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span>Visibilité prioritaire</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span>Badge étoile dorée</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span>Économie de 66%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="bg-gradient-to-r from-muted/50 to-muted/30 p-6 rounded-xl border">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <span className="text-lg">✨</span>
                Ce qui est inclus dans tous les forfaits
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span className="text-sm">Position en tête de liste sur la page principale</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span className="text-sm">Badge étoile visible sur votre annonce</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span className="text-sm">Durée garantie selon votre forfait</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span className="text-sm">Augmentation moyenne de +300% de visibilité</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              onClick={handleFeaturePayment} 
              disabled={processingPayment}
              className="flex-1 h-12 text-base font-semibold"
              size="lg"
            >
              {processingPayment ? "Traitement en cours..." : `Confirmer le paiement de ${selectedDuration === 7 ? '75' : selectedDuration === 14 ? '100' : '110'}$ CAD`}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setFeaturedDialogOpen(false)}
              disabled={processingPayment}
              className="h-12"
              size="lg"
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

      {businessToEdit && (
        <EditBusinessDialog
          business={businessToEdit}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSuccess={() => {
            fetchUserBusinesses(user.id);
            setBusinessToEdit(null);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
