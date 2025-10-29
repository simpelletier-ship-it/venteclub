import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Lock, MapPin, TrendingUp, Users, Calendar, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import venteLogo from "@/assets/vente-logo.png";

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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkAccess(session.user.id);
      } else {
        setLoading(false);
      }
    });
    fetchBusiness();
    fetchPhotos();

    // Check for payment success/cancel
    const sessionId = searchParams.get('session_id');
    if (searchParams.get('payment_success') === 'true' && sessionId) {
      verifyPayment(sessionId);
      setSearchParams({});
    } else if (searchParams.get('payment_canceled') === 'true') {
      toast({
        variant: "destructive",
        title: "Paiement annulé",
        description: "Vous avez annulé le paiement.",
      });
      setSearchParams({});
    }
  }, [id, searchParams, setSearchParams]);

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
        .single();

      if (error) throw error;
      
      // Increment view count
      if (data) {
        await supabase
          .from("businesses")
          .update({ views_count: (data.views_count || 0) + 1 })
          .eq("id", id);
        
        setBusiness({ ...data, views_count: (data.views_count || 0) + 1 });
      }
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

  const checkAccess = async (userId: string) => {
    if (!id) return;
    
    try {
      // Use RPC to check access server-side
      const { data: accessGranted, error } = await supabase
        .rpc('check_business_access', { business_uuid: id });

      if (error) {
        console.error('Error checking access:', error);
        return;
      }

      setHasAccess(!!accessGranted);

      // If has access, fetch seller contact info
      if (accessGranted && business) {
        const { data: contact } = await supabase
          .from('seller_contacts')
          .select('email, phone')
          .eq('seller_id', business.seller_id)
          .maybeSingle();
        
        setSellerContact(contact);
      }
    } catch (error: any) {
      console.error(error);
    }
  };

  const verifyPayment = async (sessionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-contact-payment', {
        body: { sessionId }
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
        title: "Paiement réussi!",
        description: "Vous avez maintenant accès aux coordonnées du vendeur.",
      });
      
      setHasAccess(true);
      setSellerContact(data.sellerContact);

      // Refresh the page to update access
      if (user) {
        checkAccess(user.id);
      }
    } catch (error: any) {
      console.error('Payment verification error:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Erreur lors de la vérification du paiement",
      });
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

  const handlePayForAccess = async () => {
    if (!id) return;
    
    setIsPurchasing(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-contact-checkout', {
        body: { businessId: id }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
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
          <img
            src={venteLogo}
            alt="Vente.club"
            className="h-10 cursor-pointer"
            onClick={() => navigate("/")}
          />
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
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                      {business.title}
                    </h1>
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
                    <h2 className="text-xl font-semibold mb-3">Galerie Photos</h2>
                    <Carousel className="w-full">
                      <CarouselContent>
                        {photos.map((photo) => (
                          <CarouselItem key={photo.id} className="md:basis-1/2 lg:basis-1/3">
                            <div className="aspect-video rounded-lg overflow-hidden">
                              <img
                                src={photo.photo_url}
                                alt="Business photo"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious />
                      <CarouselNext />
                    </Carousel>
                  </div>
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
                        <span className="text-sm">Revenu annuel</span>
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

                <div className="border-t pt-6">
                  <h2 className="text-xl font-semibold mb-4">
                    Informations du vendeur
                  </h2>
                  {isSeller || hasAccess ? (
                    <div className="bg-muted/30 p-6 rounded-lg space-y-2">
                      {sellerContact ? (
                        <>
                          {sellerContact.email && (
                            <p className="text-sm">
                              <span className="font-semibold">Email:</span> {sellerContact.email}
                            </p>
                          )}
                          {sellerContact.phone && (
                            <p className="text-sm">
                              <span className="font-semibold">Téléphone:</span> {sellerContact.phone}
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
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accéder aux coordonnées du vendeur</DialogTitle>
            <DialogDescription>
              Payez 5$ CAD pour débloquer les coordonnées complètes du vendeur
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-secondary/20 p-4 rounded-lg border border-border">
              <h3 className="font-semibold mb-2">{business?.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Accédez à l'email et au numéro de téléphone du vendeur pour le contacter directement.
              </p>
              <div className="flex items-center gap-2 text-primary">
                <Lock className="h-5 w-5" />
                <span className="font-bold">5$ CAD - Paiement unique</span>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">✅ Email du vendeur</p>
              <p className="mb-2">✅ Téléphone du vendeur</p>
              <p>✅ Accès permanent à ces coordonnées</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handlePayForAccess} 
              disabled={isPurchasing}
              className="flex-1"
            >
              {isPurchasing ? "Traitement..." : "Payer 5$ CAD"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowPaymentDialog(false)}
              disabled={isPurchasing}
            >
              Annuler
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BusinessDetails;
