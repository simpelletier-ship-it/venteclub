import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Star, XCircle, Edit, TrendingUp, Eye, Building, MessageSquare, Crown, FileText, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BusinessCard from "@/components/BusinessCard";
import { WithdrawBusinessDialog } from "@/components/WithdrawBusinessDialog";
import { PremiumSubscription } from "@/components/PremiumSubscription";
import { BusinessStatistics } from "@/components/BusinessStatistics";

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
  const [selectedDuration, setSelectedDuration] = useState<7 | 14 | 30>(7);
  const [stats, setStats] = useState({
    published: 0,
    draft: 0,
    approved: 0,
    sold: 0
  });
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
  }, [navigate, defaultTab]);

  useEffect(() => {
    const verifyFeaturedPayment = async (sessionId: string) => {
      try {
        console.log('[DASHBOARD] Verifying featured payment with session:', sessionId);
        const { error } = await supabase.functions.invoke('verify-featured-payment', {
          body: { sessionId }
        });
        
        if (error) throw error;
        
        toast({
          title: "Paiement réussi!",
          description: "Votre annonce est maintenant mise en avant.",
        });
        
        // Recharger les businesses
        if (user?.id) {
          fetchUserBusinesses(user.id);
        }
      } catch (error: any) {
        console.error('[DASHBOARD] Error verifying payment:', error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Le paiement a réussi mais la mise en avant a échoué. Contactez le support.",
        });
      } finally {
        setSearchParams({});
      }
    };

    // Check for payment success/cancel
    const sessionId = searchParams.get('session_id');
    if (searchParams.get('featured_success') === 'true' && sessionId) {
      verifyFeaturedPayment(sessionId);
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
  }, [searchParams, setSearchParams, toast, user]);

  const fetchUserBusinesses = async (userId: string) => {
    console.log('[DASHBOARD] Fetching businesses for user:', userId);
    try {
      // Fetch businesses with featured payment info
      const { data: businessData, error: businessError } = await supabase
        .from("businesses")
        .select("*")
        .eq("seller_id", userId)
        .order("created_at", { ascending: false });

      if (businessError) throw businessError;

      // For each business, get the latest featured payment
      const businessesWithFeatured = await Promise.all(
        (businessData || []).map(async (business) => {
          const { data: featuredPayment } = await supabase
            .from("featured_payments")
            .select("featured_until")
            .eq("business_id", business.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...business,
            featured_until: featuredPayment?.featured_until
          };
        })
      );

      console.log('[DASHBOARD] Businesses loaded:', businessesWithFeatured.length);
      setBusinesses(businessesWithFeatured);
      
      // Calculate stats
      const published = businessesWithFeatured.filter(b => b.status === 'active' && b.approval_status === 'approved').length;
      const draft = businessesWithFeatured.filter(b => b.status === 'inactive').length;
      const approved = businessesWithFeatured.filter(b => b.approval_status === 'approved').length;
      const sold = businessesWithFeatured.filter(b => b.status === 'sold').length;
      
      setStats({
        published,
        draft,
        approved,
        sold
      });
    } catch (error: any) {
      console.error('[DASHBOARD] Error fetching businesses:', error);
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
    console.log('[FEATURED] Starting payment for business:', selectedBusiness.id, 'duration:', selectedDuration);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-featured-checkout', {
        body: { 
          businessId: selectedBusiness.id,
          duration: selectedDuration
        }
      });

      console.log('[FEATURED] Checkout response:', { data, error });

      if (error) throw error;

      if (data?.url) {
        console.log('[FEATURED] Opening Stripe checkout in new tab');
        window.open(data.url, '_blank');
        setFeaturedDialogOpen(false);
        setSelectedBusiness(null);
        toast({
          title: "Redirection vers le paiement",
          description: "Une nouvelle fenêtre s'est ouverte pour finaliser votre paiement.",
        });
      }
    } catch (error: any) {
      console.error('[FEATURED] Error creating checkout session:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de créer la session de paiement",
      });
    } finally {
      console.log('[FEATURED] Payment flow completed, resetting state');
      setProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
                Tableau de bord
              </h1>
              <p className="text-muted-foreground">
                Gérez et suivez vos annonces
              </p>
            </div>
            <Button 
              onClick={() => navigate('/messages')} 
              variant="outline"
              className="gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Messagerie</span>
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="border-2 border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20 hover:shadow-lg transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Publiées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-700 dark:text-green-400">{stats.published}</div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Brouillon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.draft}</div>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 hover:shadow-lg transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400 flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Approuvées
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-700 dark:text-blue-400">{stats.approved}</div>
              </CardContent>
            </Card>

            <Card className="border-2 border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20 hover:shadow-lg transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-400 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Vendues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-700 dark:text-orange-400">{stats.sold}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 h-auto mb-8">
            <TabsTrigger value="businesses" className="text-xs sm:text-sm py-2 sm:py-3 gap-2">
              <Building className="h-4 w-4" />
              <span>Annonces</span>
            </TabsTrigger>
            <TabsTrigger value="statistics" className="text-xs sm:text-sm py-2 sm:py-3 gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>Stats</span>
            </TabsTrigger>
            <TabsTrigger value="premium" className="text-xs sm:text-sm py-2 sm:py-3 gap-2">
              <Crown className="h-4 w-4" />
              <span>Club Select</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="businesses" className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Chargement...</p>
              </div>
            ) : businesses.length === 0 ? (
              <div className="max-w-4xl mx-auto space-y-8">
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/50 mb-4">
                    <Plus className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Aucune annonce ajoutée</h2>
                  <p className="text-muted-foreground">
                    Commencez par ajouter votre première annonce
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card 
                    className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary/50 h-full"
                    onClick={() => navigate("/list-business")}
                  >
                    <CardContent className="p-6 h-full flex flex-col">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto">
                        <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div className="flex flex-col items-center flex-grow mt-4">
                        <h3 className="font-bold text-lg mb-2">Entreprise</h3>
                        <p className="text-sm text-muted-foreground mb-4 text-center flex-grow">
                          Commerce, restaurant, service, etc.
                        </p>
                        <Button className="w-full mt-auto">
                          <Plus className="mr-2 h-4 w-4" />
                          Ajouter
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card 
                    className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-[#FF6B00]/50 h-full"
                    onClick={() => navigate("/list-franchise")}
                  >
                    <CardContent className="p-6 h-full flex flex-col">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FF6B00]/10 mx-auto">
                        <svg className="w-8 h-8 text-[#FF6B00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="flex flex-col items-center flex-grow mt-4">
                        <h3 className="font-bold text-lg mb-2">Franchise</h3>
                        <p className="text-sm text-muted-foreground mb-4 text-center flex-grow">
                          Réseau de franchises établi
                        </p>
                        <Button className="w-full bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white mt-auto">
                          <Plus className="mr-2 h-4 w-4" />
                          Ajouter
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card 
                    className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-green-600/50 h-full"
                    onClick={() => navigate("/list-property")}
                  >
                    <CardContent className="p-6 h-full flex flex-col">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-600/10 mx-auto">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                      <div className="flex flex-col items-center flex-grow mt-4">
                        <h3 className="font-bold text-lg mb-2">Immeuble</h3>
                        <p className="text-sm text-muted-foreground mb-4 text-center flex-grow">
                          Immeuble à revenus, commercial
                        </p>
                        <Button className="w-full bg-green-600 hover:bg-green-600/90 text-white mt-auto">
                          <Plus className="mr-2 h-4 w-4" />
                          Ajouter
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-end mb-4">
                  <Button onClick={() => navigate("/sell")} variant="secondary">
                    <Plus className="mr-2 h-4 w-4" />
                    Créer une nouvelle annonce
                  </Button>
                </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch">
                {businesses.map((business) => {
                  const featuredUntil = business.featured_until ? new Date(business.featured_until) : null;
                  const now = new Date();
                  const isActiveFeatured = featuredUntil && featuredUntil > now;
                  const daysRemaining = isActiveFeatured 
                    ? Math.ceil((featuredUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                    : 0;

                  return (
                    <div key={business.id} className="flex flex-col space-y-2">
                      <div className="space-y-2">
                        {isActiveFeatured && (
                          <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-lg p-3 flex items-center gap-2">
                            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground">Mise en avant active</p>
                              <p className="text-xs text-muted-foreground">
                                {daysRemaining} jour{daysRemaining > 1 ? 's' : ''} restant{daysRemaining > 1 ? 's' : ''} · Expire le {featuredUntil.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div
                          onClick={() => {
                            if (business.status === 'archived') {
                              // Rediriger vers la bonne page selon le type
                              if (business.sale_type === 'property') {
                                navigate(`/list-property?edit=${business.id}`);
                              } else if (business.is_franchise) {
                                navigate(`/list-franchise?edit=${business.id}`);
                              } else {
                                navigate(`/list-business?edit=${business.id}`);
                              }
                            } else {
                              navigate(`/entreprise/${business.slug}`);
                            }
                          }}
                          className="cursor-pointer h-full"
                        >
                          <BusinessCard
                          {...business}
                          showActions={business.status !== 'archived'}
                          showPendingBadge={true}
                          onWithdraw={() => handleWithdrawClick(business)}
                          onFeature={() => handleFeatureClick(business)}
                        />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-center">
                        {business.approval_status === 'approved' && business.status !== 'sold' && business.status !== 'archived' && !business.has_pending_changes && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Rediriger vers la bonne page selon le type
                              if (business.sale_type === 'property') {
                                navigate(`/list-property?edit=${business.id}`);
                              } else if (business.is_franchise) {
                                navigate(`/list-franchise?edit=${business.id}`);
                              } else {
                                navigate(`/list-business?edit=${business.id}`);
                              }
                            }}
                            size="sm"
                            variant="outline"
                            className="w-full"
                          >
                            <Edit className="mr-1 h-3 w-3" />
                            Modifier l'annonce
                          </Button>
                        )}
                        {business.status === 'archived' && (
                          <>
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
                              className="w-full"
                            >
                              Publier l'annonce
                            </Button>
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Rediriger vers la bonne page selon le type
                                if (business.sale_type === 'property') {
                                  navigate(`/list-property?edit=${business.id}`);
                                } else if (business.is_franchise) {
                                  navigate(`/list-franchise?edit=${business.id}`);
                                } else {
                                  navigate(`/list-business?edit=${business.id}`);
                                }
                              }}
                              size="sm"
                              variant="outline"
                              className="w-full"
                            >
                              <Edit className="mr-1 h-3 w-3" />
                              Modifier l'annonce
                            </Button>
                          </>
                        )}
                        {business.has_pending_changes && (
                          <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                            <p className="text-sm text-orange-700 dark:text-orange-300">
                              ⏳ Vos modifications sont en attente d'approbation. Vous pourrez modifier l'annonce une fois qu'elles auront été approuvées ou rejetées.
                            </p>
                          </div>
                        )}
                      </div>
                      {business.rejection_reason && business.approval_status === 'rejected' && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                          <p className="text-sm font-semibold mb-1">Raison du refus:</p>
                          <p className="text-sm text-muted-foreground">{business.rejection_reason}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="statistics">
            {user && <BusinessStatistics userId={user.id} />}
          </TabsContent>

          <TabsContent value="premium">
            <div className="max-w-4xl mx-auto">
              {user && <PremiumSubscription userId={user.id} />}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={featuredDialogOpen} onOpenChange={setFeaturedDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-2 pb-3 border-b">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Star className="h-6 w-6 fill-primary text-primary" />
              Mettre votre annonce en avant
            </DialogTitle>
            <DialogDescription className="text-base">
              Augmentez votre visibilité et attirez plus d'acheteurs potentiels
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-4 rounded-xl border border-primary/20">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Star className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-base mb-1">{selectedBusiness?.title}</h3>
                  <p className="text-sm text-muted-foreground">Cette annonce sera mise en avant</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Bronze Package */}
              <Card 
                className={`cursor-pointer transition-all hover:shadow-lg relative overflow-hidden ${
                  selectedDuration === 7 ? 'ring-2 ring-amber-600 shadow-lg scale-105' : 'hover:scale-102'
                }`}
                onClick={() => setSelectedDuration(7)}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-600/20 to-transparent rounded-bl-full" />
                <CardContent className="p-5 relative">
                  <Badge className="mb-3 bg-amber-600/20 text-amber-700 border-amber-600/30 font-semibold text-xs">
                    BRONZE
                  </Badge>
                  <div className="space-y-3">
                    <div className="flex items-center justify-center">
                      <Star className="h-10 w-10 fill-amber-600 text-amber-600" />
                    </div>
                    <div className="text-center space-y-1">
                      <h4 className="font-bold text-2xl text-foreground">7,5 $</h4>
                      <p className="text-sm font-medium text-muted-foreground"><span className="font-bold">7 jours</span> de mise en avant</p>
                    </div>
                    <div className="pt-3 border-t space-y-1.5">
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span>Visibilité prioritaire</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
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
                <CardContent className="p-5 pt-10 relative">
                  <Badge className="mb-3 bg-slate-400/20 text-slate-700 border-slate-400/30 font-semibold text-xs">
                    PLATINE
                  </Badge>
                  <div className="space-y-3">
                    <div className="flex items-center justify-center">
                      <Star className="h-10 w-10 fill-slate-400 text-slate-400" />
                    </div>
                    <div className="text-center space-y-1">
                      <h4 className="font-bold text-2xl text-foreground">10 $</h4>
                      <p className="text-sm font-medium text-muted-foreground"><span className="font-bold">14 jours</span> de mise en avant</p>
                    </div>
                    <div className="pt-3 border-t space-y-1.5">
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span>Visibilité prioritaire</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span>Badge étoile argentée</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
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
                <CardContent className="p-5 pt-10 relative">
                  <Badge className="mb-3 bg-yellow-500/20 text-yellow-700 border-yellow-500/30 font-semibold text-xs">
                    OR
                  </Badge>
                  <div className="space-y-3">
                    <div className="flex items-center justify-center">
                      <Star className="h-10 w-10 fill-yellow-500 text-yellow-500" />
                    </div>
                    <div className="text-center space-y-1">
                      <h4 className="font-bold text-2xl text-foreground">11,50 $</h4>
                      <p className="text-sm font-medium text-muted-foreground"><span className="font-bold">30 jours</span> de mise en avant</p>
                    </div>
                    <div className="pt-3 border-t space-y-1.5">
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span>Visibilité prioritaire</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span>Badge étoile dorée</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span>Économie de 66%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="bg-gradient-to-r from-muted/50 to-muted/30 p-4 rounded-xl border">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                <span>✨</span>
                Ce qui est inclus dans tous les forfaits
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-start gap-2">
                  <span className="text-primary mt-0.5 text-xs">✓</span>
                  <span className="text-xs">Position en tête de liste sur la page principale</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary mt-0.5 text-xs">✓</span>
                  <span className="text-xs">Badge étoile visible sur votre annonce</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary mt-0.5 text-xs">✓</span>
                  <span className="text-xs">Durée garantie selon votre forfait</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary mt-0.5 text-xs">✓</span>
                  <span className="text-xs">Augmentation moyenne de visibilité</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 pt-3 border-t">
            <Button 
              onClick={handleFeaturePayment} 
              disabled={processingPayment}
              className="flex-1 h-11 text-sm font-semibold"
              size="lg"
            >
              {processingPayment ? "Traitement en cours..." : `Confirmer le paiement de ${selectedDuration === 7 ? '7,50' : selectedDuration === 14 ? '10' : '11,50'} $ CAD`}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setFeaturedDialogOpen(false)}
              disabled={processingPayment}
              className="h-11"
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
    </div>
  );
};

export default Dashboard;
