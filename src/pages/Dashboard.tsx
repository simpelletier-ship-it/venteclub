import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Star, XCircle, Edit, TrendingUp, Eye, Building, MessageSquare, Crown, FileText, CheckCircle, UserCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BusinessCard from "@/components/BusinessCard";
import { WithdrawBusinessDialog } from "@/components/WithdrawBusinessDialog";
import { PremiumSubscription } from "@/components/PremiumSubscription";
import { BusinessStatistics } from "@/components/BusinessStatistics";
import { ProfileForm } from "@/components/ProfileForm";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [businessToWithdraw, setBusinessToWithdraw] = useState<any>(null);
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

    // Souscrire aux changements en temps réel pour mettre à jour les stats automatiquement
    const businessesChannel = supabase
      .channel('businesses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'businesses'
        },
        () => {
          // Recharger les annonces quand il y a un changement
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
              fetchUserBusinesses(session.user.id);
            }
          });
        }
      )
      .subscribe();

    return () => {
      businessesChannel.unsubscribe();
    };
  }, [navigate, defaultTab]);

  useEffect(() => {
    // Check for payment verified
    if (searchParams.get('payment_verified') === 'true') {
      toast({
        title: "Accès débloqué!",
        description: "Vous pouvez maintenant contacter le vendeur.",
      });
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, toast]);

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
    navigate(`/featured-listing?businessId=${business.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      {/* Header moderne avec gradient */}
      <div className="bg-gradient-to-r from-primary/95 via-primary to-primary/95 backdrop-blur-xl border-b border-primary/20 shadow-xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                <Building className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">
                  Tableau de bord
                </h1>
                <p className="text-sm text-white/80">
                  Gérez vos {businesses.length} annonce{businesses.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/messages')} 
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Messagerie
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Stats Cards Modernes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-xl p-4 hover:shadow-lg transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-foreground">{stats.published}</span>
            </div>
            <p className="text-sm text-muted-foreground font-medium">Publiées</p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-xl p-4 hover:shadow-lg transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-foreground">{stats.draft}</span>
            </div>
            <p className="text-sm text-muted-foreground font-medium">Brouillons</p>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 hover:shadow-lg transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Eye className="h-5 w-5 text-yellow-600" />
              </div>
              <span className="text-2xl font-bold text-foreground">{stats.approved}</span>
            </div>
            <p className="text-sm text-muted-foreground font-medium">Approuvées</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-xl p-4 hover:shadow-lg transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-foreground">{stats.sold}</span>
            </div>
            <p className="text-sm text-muted-foreground font-medium">Vendues</p>
          </div>
        </div>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full max-w-3xl grid-cols-4 h-auto mb-8 gap-4 p-2">
            <TabsTrigger value="businesses" className="text-xs sm:text-sm py-3 sm:py-4 gap-2 px-4">
              <Building className="h-4 w-4" />
              <span>Mes annonces</span>
            </TabsTrigger>
            <TabsTrigger value="statistics" className="text-xs sm:text-sm py-3 sm:py-4 gap-2 px-4">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Statistiques avancées</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="text-xs sm:text-sm py-3 sm:py-4 gap-2 px-4">
              <UserCircle className="h-4 w-4" />
              <span>Mon profil</span>
            </TabsTrigger>
            <TabsTrigger value="premium" className="text-xs sm:text-sm py-3 sm:py-4 gap-2 px-4">
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
                        {business.status === 'active' && business.approval_status === 'approved' && (
                          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-lg p-3 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground">Annonce publiée</p>
                              <p className="text-xs text-muted-foreground">
                                Votre annonce est active et visible sur le site
                              </p>
                            </div>
                          </div>
                        )}
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
                          <>
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
                              className="flex-1"
                            >
                              <Edit className="mr-1 h-3 w-3" />
                              Modifier
                            </Button>
                          </>
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

          <TabsContent value="profile" className="space-y-6">
            <div className="max-w-4xl mx-auto">
              <ProfileForm />
            </div>
          </TabsContent>

          <TabsContent value="premium">
            <div className="max-w-4xl mx-auto">
              {user && <PremiumSubscription userId={user.id} />}
            </div>
          </TabsContent>
        </Tabs>
      </div>


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
