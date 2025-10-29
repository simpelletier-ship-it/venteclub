import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Lock, MapPin, TrendingUp, Users, Calendar, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ChatBox } from "@/components/ChatBox";

const BusinessDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [sellerContact, setSellerContact] = useState<any>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [photos, setPhotos] = useState<any[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      await fetchBusiness();
      await fetchPhotos();

      // Check for payment success/cancel
      const sessionId = searchParams.get('session_id');
      if (searchParams.get('payment_success') === 'true' && sessionId) {
        if (session?.user) {
          await verifyPayment(sessionId, session.user.id);
          // Clear URL params after verification to stay on the page
          setSearchParams({});
        }
        return;
      } else if (searchParams.get('payment_canceled') === 'true') {
        toast({
          variant: "destructive",
          title: "Paiement annulé",
          description: "Vous avez annulé le paiement.",
        });
        setSearchParams({});
      } else if (session?.user) {
        await checkAccess(session.user.id);
      } else {
        setLoading(false);
      }
    };

    initialize();
  }, [id]);

  const fetchPhotos = async () => {
    if (!id) return;
    
    const { data } = await supabase
      .from('business_photos')
      .select('*')
      .eq('business_id', id)
      .order('display_order');
    
    if (data) {
      setPhotos(data);
    }
  };

  const fetchBusiness = async () => {
    try {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      
      // Increment view count
      if (data) {
        await supabase
          .from("businesses")
          .update({ views_count: (data.views_count || 0) + 1 })
          .eq("id", id);
        
        setBusiness({ ...data, views_count: (data.views_count || 0) + 1 });
      } else {
        setBusiness(null);
      }
    } catch (error: any) {
      console.error("Fetch business error:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message,
      });
      setBusiness(null);
    }
  };

  const checkAccess = async (userId: string) => {
    if (!id) return;
    
    try {
      // Use RPC to check access server-side
      const { data: accessGranted, error } = await supabase
        .rpc('check_business_access', { business_uuid: id });

      if (error) {
        console.error('Error checking access:', error);
        setLoading(false);
        return;
      }

      setHasAccess(!!accessGranted);

      // If has access, fetch seller contact info
      if (accessGranted) {
        // First get the business to find seller_id
        const { data: businessData } = await supabase
          .from('businesses')
          .select('seller_id')
          .eq('id', id)
          .single();

        if (businessData?.seller_id) {
          const { data: contact } = await supabase
            .from('seller_contacts')
            .select('email, phone')
            .eq('seller_id', businessData.seller_id)
            .maybeSingle();
          
          setSellerContact(contact);
        }
      }
      
      setLoading(false);
    } catch (error: any) {
      console.error(error);
      setLoading(false);
    }
  };

  const verifyPayment = async (sessionId: string, userId: string) => {
    setIsVerifyingPayment(true);
    setLoading(true);
    try {
      console.log("Verifying payment with session:", sessionId);
      
      const { data, error } = await supabase.functions.invoke('verify-contact-payment', {
        body: { sessionId }
      });

      console.log("Verification response:", data);

      if (error) {
        console.error("Verification error:", error);
        throw error;
      }

      if (data?.error) {
        console.error("Data error:", data.error);
        toast({
          variant: "destructive",
          title: "Erreur de vérification",
          description: data.error,
        });
        setLoading(false);
        setIsVerifyingPayment(false);
        return;
      }

      // Payment successful - update state immediately
      setHasAccess(true);
      setSellerContact(data.sellerContact);

      toast({
        title: "🎉 Accès débloqué avec succès!",
        description: "Vous pouvez maintenant voir toutes les informations du vendeur et démarrer une conversation.",
      });
      
      // Scroll to seller contact section
      setTimeout(() => {
        document.getElementById('seller-contact')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
      
    } catch (error: any) {
      console.error('Payment verification error:', error);
      toast({
        variant: "destructive",
        title: "Erreur de vérification",
        description: error.message || "Impossible de vérifier le paiement. Veuillez rafraîchir la page.",
      });
    } finally {
      setIsVerifyingPayment(false);
      setLoading(false);
    }
  };

  const handleUnlockAccess = () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez vous connecter pour accéder aux coordonnées du vendeur.",
      });
      navigate("/auth");
      return;
    }
    setShowPaymentDialog(true);
  };

  const handlePayForAccess = async (isSubscription = false) => {
    if (!id) return;
    
    setIsPurchasing(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-contact-access-checkout', {
        body: { 
          businessId: id,
          accessType: isSubscription ? 'subscription' : 'one_time'
        }
      });

      if (error) throw error;

      if (data?.error) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: data.error,
        });
        return;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
        setShowPaymentDialog(false);
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Erreur lors de la création du paiement",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  const handlePurchasePlan = async (planId: string) => {
    if (!id) return;
    
    setIsPurchasing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Vous devez être connecté",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('purchase-access', {
        body: { businessId: id, planId },
      });

      if (error) throw error;

      if (data.error) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: data.error,
        });
        return;
      }

      toast({
        title: "Succès !",
        description: "Accès débloqué avec succès!",
      });
      setHasAccess(true);
      setSellerContact(data.sellerContact);
      setShowPaymentDialog(false);
      
      // Refresh access
      if (user) {
        checkAccess(user.id);
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Erreur lors de l'achat",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  if (loading || isVerifyingPayment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">
            {isVerifyingPayment ? "Vérification du paiement..." : "Chargement..."}
          </p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Entreprise non trouvée</p>
          <Button onClick={() => navigate("/")}>Retour à l'accueil</Button>
        </div>
      </div>
    );
  }

  const isSeller = user?.id === business.seller_id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10">
      <nav className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center cursor-pointer" onClick={() => navigate("/")}>
            <span className="text-2xl font-bold">
              Vente<span className="text-accent">.Club</span>
            </span>
          </div>
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-2xl shadow-elegant border border-border/50 overflow-hidden">
              <div className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold text-foreground">
                        {business.title}
                      </h1>
                      {id && (
                        <div className="flex items-center gap-2">
                          <FavoriteButton businessId={id} userId={user?.id} />
                          <span className="text-xs text-muted-foreground">
                            Activer les notifications
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 items-center text-muted-foreground">
                      <Badge variant="secondary">{business.industry}</Badge>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {business.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {business.views_count || 0} vues
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-accent">
                      {business.asking_price.toLocaleString()} CAD
                    </div>
                    <div className="text-sm text-muted-foreground">Prix demandé</div>
                  </div>
                </div>

                {/* Photo Gallery */}
                {photos.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-4">Galerie Photos</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {photos.map((photo, index) => (
                        <div 
                          key={photo.id} 
                          className="aspect-video rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity shadow-md hover:shadow-lg"
                          onClick={() => setSelectedPhotoIndex(index)}
                        >
                          <img
                            src={photo.photo_url}
                            alt={`Photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Photo Lightbox */}
                {selectedPhotoIndex !== null && (
                  <Dialog open={true} onOpenChange={() => setSelectedPhotoIndex(null)}>
                    <DialogContent className="max-w-4xl w-full p-0">
                      <div className="relative bg-black">
                        <img
                          src={photos[selectedPhotoIndex].photo_url}
                          alt={`Photo ${selectedPhotoIndex + 1}`}
                          className="w-full h-auto max-h-[80vh] object-contain"
                        />
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                          {selectedPhotoIndex > 0 && (
                            <Button
                              variant="secondary"
                              onClick={() => setSelectedPhotoIndex(selectedPhotoIndex - 1)}
                            >
                              Précédent
                            </Button>
                          )}
                          {selectedPhotoIndex < photos.length - 1 && (
                            <Button
                              variant="secondary"
                              onClick={() => setSelectedPhotoIndex(selectedPhotoIndex + 1)}
                            >
                              Suivant
                            </Button>
                          )}
                        </div>
                        <div className="absolute top-4 right-4 text-white bg-black/50 px-3 py-1 rounded-full">
                          {selectedPhotoIndex + 1} / {photos.length}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold mb-3">Description</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {business.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {business.annual_revenue && (
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm">Chiffre d'affaires annuel</span>
                      </div>
                      <div className="text-xl font-semibold">
                        {business.annual_revenue.toLocaleString()} CAD
                      </div>
                    </div>
                  )}
                  {business.profit_margin && (
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">
                        Marge de profit
                      </div>
                      <div className="text-xl font-semibold">
                        {business.profit_margin}%
                      </div>
                    </div>
                  )}
                  {business.employees_count && (
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">Employés</span>
                      </div>
                      <div className="text-xl font-semibold">
                        {business.employees_count}
                      </div>
                    </div>
                  )}
                  {business.year_established && (
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">Année</span>
                      </div>
                      <div className="text-xl font-semibold">
                        {business.year_established}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t pt-6" id="seller-contact">
                  <h2 className="text-xl font-semibold mb-4">
                    Informations du vendeur
                  </h2>
                  {isSeller || hasAccess ? (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-6 rounded-lg space-y-3 border-2 border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-semibold">Accès débloqué</span>
                      </div>
                      {sellerContact ? (
                        <>
                          {sellerContact.email && (
                            <p className="text-sm">
                              <span className="font-semibold">Email:</span>{' '}
                              <a href={`mailto:${sellerContact.email}`} className="text-primary hover:underline">
                                {sellerContact.email}
                              </a>
                            </p>
                          )}
                          {sellerContact.phone && (
                            <p className="text-sm">
                              <span className="font-semibold">Téléphone:</span>{' '}
                              <a href={`tel:${sellerContact.phone}`} className="text-primary hover:underline">
                                {sellerContact.phone}
                              </a>
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Le vendeur n'a pas encore ajouté ses coordonnées.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gradient-to-br from-primary/5 to-accent/5 p-6 rounded-lg text-center">
                      <Lock className="w-12 h-12 mx-auto mb-4 text-accent" />
                      <h3 className="text-lg font-semibold mb-2">
                        Coordonnées du vendeur verrouillées
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Payez 5$ CAD pour accéder aux informations de contact du vendeur (email et téléphone)
                      </p>
                      <Button size="lg" onClick={handleUnlockAccess}>
                        Débloquer pour 5$ CAD
                      </Button>
                    </div>
                  )}
                </div>

                {/* Chat Section - Only show if user has access */}
                {hasAccess && !isSeller && user && business && (
                  <div className="border-t pt-6 mt-6">
                    <h2 className="text-xl font-semibold mb-4">
                      Messagerie avec le vendeur
                    </h2>
                    <ChatBox
                      businessId={business.id}
                      currentUserId={user.id}
                      otherUserId={business.seller_id}
                      otherUserName="Vendeur"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Accéder aux coordonnées du vendeur</DialogTitle>
            <DialogDescription>
              Choisissez votre option de paiement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="bg-secondary/20 p-4 rounded-lg border border-border">
              <h3 className="font-semibold mb-2">{business?.title}</h3>
              <p className="text-sm text-muted-foreground">
                Accédez à l'email et au numéro de téléphone du vendeur pour le contacter directement.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Option 1: Paiement unique */}
              <div className="border-2 border-border rounded-lg p-6 hover:border-accent transition-colors">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold mb-2">Paiement unique</h3>
                  <div className="text-3xl font-bold text-primary mb-2">5 $</div>
                  <p className="text-sm text-muted-foreground">Accès à cette annonce seulement</p>
                </div>
                <div className="space-y-2 text-sm mb-6">
                  <p className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Email du vendeur
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Téléphone du vendeur
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Accès permanent
                  </p>
                </div>
                <Button 
                  onClick={() => handlePayForAccess(false)} 
                  disabled={isPurchasing}
                  className="w-full"
                  variant="outline"
                >
                  {isPurchasing ? "Traitement..." : "Payer 5 $"}
                </Button>
              </div>

              {/* Option 2: Abonnement */}
              <div className="border-2 border-accent rounded-lg p-6 bg-accent/5 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-accent text-accent-foreground">Meilleure valeur</Badge>
                </div>
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold mb-2">Abonnement mensuel</h3>
                  <div className="text-3xl font-bold text-accent mb-2">9,99 $ / mois</div>
                  <p className="text-sm text-muted-foreground">Accès illimité à toutes les annonces</p>
                </div>
                <div className="space-y-2 text-sm mb-6">
                  <p className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Toutes les coordonnées
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Accès illimité
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Annulation à tout moment
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-green-500">✓</span> Nouvelles annonces
                  </p>
                </div>
                <Button 
                  onClick={() => handlePayForAccess(true)} 
                  disabled={isPurchasing}
                  className="w-full bg-accent hover:bg-accent/90"
                >
                  {isPurchasing ? "Traitement..." : "S'abonner à 9,99 $"}
                </Button>
              </div>
            </div>

            <div className="text-center">
              <Button 
                variant="ghost" 
                onClick={() => setShowPaymentDialog(false)}
                disabled={isPurchasing}
              >
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BusinessDetails;
