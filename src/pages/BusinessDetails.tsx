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
import { SellerChatSection } from "@/components/SellerChatSection";
import { ReportBusinessDialog } from "@/components/ReportBusinessDialog";
import { SEO } from "@/components/SEO";

const BusinessDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showUnlockDialog, setShowUnlockDialog] = useState(false);
  const [sellerContact, setSellerContact] = useState<any>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [photos, setPhotos] = useState<any[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [hasPremium, setHasPremium] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      await fetchBusiness();
      await fetchPhotos();

      if (session?.user) {
        console.log('[INIT] Checking access for user');
        await checkAccess(session.user.id);
        await checkPremiumSubscription(session.user.id);
      } else {
        console.log('[INIT] No user session');
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
      console.log('[BUSINESS DETAILS] Fetching business with id:', id);
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      console.log('[BUSINESS DETAILS] Fetch result:', { data, error });

      if (error) throw error;
      
      // Increment view count
      if (data) {
        await supabase
          .from("businesses")
          .update({ views_count: (data.views_count || 0) + 1 })
          .eq("id", id);
        
        setBusiness({ ...data, views_count: (data.views_count || 0) + 1 });
        console.log('[BUSINESS DETAILS] Business set:', data.title);
      } else {
        console.log('[BUSINESS DETAILS] No business found');
        setBusiness(null);
      }
    } catch (error: any) {
      console.error("[BUSINESS DETAILS] Fetch business error:", error);
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

  const checkPremiumSubscription = async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('check-premium-subscription');
      
      if (error) {
        console.error('Error checking premium:', error);
        return;
      }
      
      setHasPremium(data?.subscribed || false);
    } catch (error) {
      console.error('Error in checkPremiumSubscription:', error);
    }
  };

  const getNextAccessTime = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.rpc('get_next_access_time', {
        user_uuid: user.id
      });
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error getting next access time:', error);
      return null;
    }
  };


  const handleUnlockRequest = () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez vous connecter pour voir les coordonnées du vendeur.",
      });
      navigate("/auth");
      return;
    }
    setShowUnlockDialog(true);
  };

  const handleConfirmUnlock = async () => {
    if (!id || !user) return;
    
    setIsUnlocking(true);
    try {
      const { data, error } = await supabase.rpc('use_token_for_access', {
        business_uuid: id,
        has_premium: hasPremium
      });

      if (error) {
        // Extraire le nombre de secondes de l'erreur
        const match = error.message.match(/attendre (\d+) secondes/);
        if (match) {
          const seconds = parseInt(match[1]);
          setSecondsRemaining(seconds);
          setShowUnlockDialog(false);
          setShowPremiumDialog(true);
        } else {
          throw error;
        }
        return;
      }

      const result = data as any;
      
      if (result?.success) {
        setHasAccess(true);
        setSellerContact(result.seller_contact);
        setShowUnlockDialog(false);
        
        toast({
          title: "Accès déverrouillé !",
          description: "Vous pouvez maintenant voir les coordonnées du vendeur et lui envoyer des messages.",
        });
        
        setTimeout(() => {
          const element = document.getElementById('seller-contact');
          element?.scrollIntoView({ behavior: 'smooth' });
        }, 500);
      }
    } catch (error: any) {
      console.error('Unlock error:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de déverrouiller l'accès.",
      });
    } finally {
      setIsUnlocking(false);
    }
  };

  const handlePremiumCheckout = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-premium-checkout');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
        setShowPremiumDialog(false);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de créer la session de paiement",
      });
    }
  };

  const formatTimeRemaining = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (days > 0) {
      return `${days} jour${days > 1 ? 's' : ''}, ${hours}h ${minutes}min`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}min ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}min ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold mb-2">
            Chargement de l'annonce...
          </h2>
          <p className="text-muted-foreground">
            Veuillez patienter pendant que nous chargeons les détails de l'annonce.
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

  // Structured data for business listing
  const businessStructuredData = business ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": business.title,
    "description": business.description,
    "category": business.industry,
    "offers": {
      "@type": "Offer",
      "price": business.asking_price,
      "priceCurrency": "CAD",
      "availability": business.status === 'active' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    },
    "location": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": business.city,
        "addressRegion": business.province,
        "addressCountry": "CA"
      }
    }
  } : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10">
      <SEO
        title={`${business.title} - ${business.asking_price.toLocaleString()} CAD | Vente.club`}
        description={`${business.description.substring(0, 155)}... Entreprise ${business.industry} à ${business.city}. ${business.annual_revenue ? `Revenus: ${business.annual_revenue.toLocaleString()} CAD` : ''}`}
        keywords={`vente ${business.industry} ${business.city}, acheter entreprise ${business.city}, ${business.title}, opportunité affaires Québec`}
        canonical={`/business/${id}`}
        type="product"
        structuredData={businessStructuredData}
      />
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
                    <div className="flex items-center justify-between">
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
                      {!isSeller && id && (
                        <ReportBusinessDialog businessId={id} businessTitle={business.title} />
                      )}
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
                            alt={`Photo ${index + 1} de ${business.title} - ${business.industry} à ${business.city}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
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

                {business.is_franchise && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-800 flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-blue-900 dark:text-blue-100">
                        Cette entreprise est une franchise
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Fait partie d'un réseau établi avec support et reconnaissance de marque
                      </p>
                    </div>
                  </div>
                )}

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
                        Déverrouillez gratuitement les informations de contact du vendeur (email et téléphone)
                      </p>
                      <Button size="lg" onClick={handleUnlockRequest}>
                        Déverrouiller les informations gratuitement
                      </Button>
                    </div>
                  )}
                </div>

                {/* Chat Section - Show if buyer has access OR if seller and someone bought access */}
                {user && business && (
                  <>
                    {/* Buyer view - chat with seller */}
                    {hasAccess && !isSeller && (
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
                    
                    {/* Seller view - show all buyers who have access */}
                    {isSeller && (
                      <SellerChatSection 
                        businessId={business.id}
                        sellerId={user.id}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Déverrouiller les informations du vendeur</DialogTitle>
            <DialogDescription className="space-y-3 pt-4">
              <div className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <p className="font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                  <span className="text-2xl">⚠️</span>
                  Attention : Limite de 1 vendeur par semaine
                </p>
                <p className="text-sm text-amber-800 dark:text-amber-200 mt-2">
                  Vous avez droit aux informations de <strong>1 vendeur par période de 7 jours</strong>.
                </p>
              </div>
              
              <div className="space-y-2 text-sm text-foreground">
                <p>
                  Si vous déverrouillez cet accès maintenant, <strong>vous ne pourrez pas accéder aux informations d'autres vendeurs pendant une semaine</strong>.
                </p>
                <p>
                  Une fois déverrouillé, vous pourrez :
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Voir les coordonnées complètes du vendeur</li>
                  <li>Communiquer avec lui par messagerie intégrée</li>
                  <li>Garder cet accès de façon permanente</li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowUnlockDialog(false)}
              disabled={isUnlocking}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleConfirmUnlock}
              disabled={isUnlocking}
            >
              {isUnlocking ? 'Déverrouillage...' : 'Confirmer et déverrouiller'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Premium pour temps d'attente */}
      <Dialog open={showPremiumDialog} onOpenChange={setShowPremiumDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Accès limité atteint</DialogTitle>
            <DialogDescription className="space-y-4 pt-4">
              <div className="bg-red-50 dark:bg-red-950/30 border-2 border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="font-semibold text-red-900 dark:text-red-100 flex items-center gap-2 mb-2">
                  <span className="text-2xl">⏱️</span>
                  Temps d'attente requis
                </p>
                {secondsRemaining && (
                  <p className="text-sm text-red-800 dark:text-red-200">
                    Vous devez attendre <strong>{formatTimeRemaining(secondsRemaining)}</strong> avant de pouvoir déverrouiller un autre vendeur gratuitement.
                  </p>
                )}
              </div>

              <div className="bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-lg">Abonnement Premium</h3>
                  <Badge className="bg-gradient-to-r from-primary to-accent text-white font-bold">
                    4,99$ CAD/mois
                  </Badge>
                </div>
                <p className="text-sm mb-3">
                  Obtenez un accès illimité aux coordonnées de tous les vendeurs sans aucune restriction !
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    Accès illimité à tous les vendeurs
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    Aucune limite de temps
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    Annulation facile à tout moment
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500 font-bold">✓</span>
                    Messagerie illimitée
                  </li>
                </ul>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowPremiumDialog(false)}
              className="flex-1"
            >
              Attendre
            </Button>
            <Button 
              onClick={handlePremiumCheckout}
              className="flex-1 bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              S'abonner à Premium
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BusinessDetails;
