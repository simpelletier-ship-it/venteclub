import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase, invokeWithTimeout } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Lock, MapPin, TrendingUp, Users, Calendar, Eye, Calculator } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ShareButton } from "@/components/ShareButton";
import { ChatBox } from "@/components/ChatBox";
import { SellerChatSection } from "@/components/SellerChatSection";
import { ReportBusinessDialog } from "@/components/ReportBusinessDialog";
import { SEO } from "@/components/SEO";
import { FinancialCalculator } from "@/components/FinancialCalculator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

const BusinessDetails = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
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
  const [isPremiumAccess, setIsPremiumAccess] = useState(false);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      await fetchBusiness();
      await fetchPhotos();

      if (session?.user) {
        console.log('[INIT] Checking Premium subscription first');
        await checkPremiumSubscription(session.user.id);
        
        console.log('[INIT] Then checking access for user');
        await checkAccess(session.user.id);
      } else {
        console.log('[INIT] No user session');
        setLoading(false);
      }
    };

    initialize();
  }, [slug]);

  // Subscribe to real-time updates for business data
  useEffect(() => {
    if (!businessId) return;

    const businessChannel = supabase
      .channel(`business_${businessId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'businesses',
          filter: `id=eq.${businessId}`
        },
        (payload) => {
          console.log('[REALTIME] Business update received:', payload);
          // Only refresh if it's not just pending_changes being updated
          // Check if has_pending_changes went from true to false (approval)
          const oldRecord = payload.old as any;
          const newRecord = payload.new as any;
          
          if (oldRecord?.has_pending_changes === true && newRecord?.has_pending_changes === false) {
            console.log('[REALTIME] Changes approved by admin, refreshing...');
            fetchBusiness();
          } else if (!newRecord?.has_pending_changes) {
            // Or if there are direct updates (no pending changes)
            console.log('[REALTIME] Direct update detected, refreshing...');
            fetchBusiness();
          }
        }
      )
      .subscribe();

    const photosChannel = supabase
      .channel(`business_photos_${businessId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'business_photos',
          filter: `business_id=eq.${businessId}`
        },
        () => {
          console.log('[REALTIME] Photos changed, refreshing...');
          fetchPhotos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(businessChannel);
      supabase.removeChannel(photosChannel);
    };
  }, [businessId]);

  // Re-check access when premium status changes
  useEffect(() => {
    if (user && hasPremium) {
      console.log('[PREMIUM] User is premium, re-checking access');
      checkAccess(user.id);
    }
  }, [hasPremium, user?.id]);

  const fetchPhotos = async () => {
    if (!businessId) return;
    
    const { data } = await supabase
      .from('business_photos')
      .select('*')
      .eq('business_id', businessId)
      .order('display_order');
    
    if (data) {
      setPhotos(data);
    }
  };

  const fetchBusiness = async () => {
    try {
      console.log('[BUSINESS DETAILS] Fetching business with slug:', slug);
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      console.log('[BUSINESS DETAILS] Fetch result:', { data, error });

      if (error) throw error;
      
      // Increment view count
      if (data) {
        setBusinessId(data.id);
        
        // Track view analytics - with error handling for rate limiting
        try {
          const session = await supabase.auth.getSession();
          await supabase
            .from('business_analytics')
            .insert({
              business_id: data.id,
              event_type: 'view',
              user_id: session.data.session?.user?.id,
            });
        } catch (analyticsError) {
          // Silently fail if rate limited or duplicate view
          console.log('Analytics tracking skipped:', analyticsError);
        }
        
        setBusiness(data);
        console.log('[BUSINESS DETAILS] Business set:', data.title);
        
        // Fetch seller profile to get name
        if (data.seller_id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, first_name, last_name, email')
            .eq('id', data.seller_id)
            .single();
          
          if (profile) {
            setSellerProfile(profile);
          }
        }
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
    if (!businessId) return;
    
    try {
      console.log('[ACCESS CHECK] Checking access for business:', businessId);
      
      // Use RPC to check access server-side
      const { data: accessGranted, error } = await supabase
        .rpc('check_business_access', { business_uuid: businessId });

      console.log('[ACCESS CHECK] RPC result:', { accessGranted, error });

      if (error) {
        console.error('[ACCESS CHECK] Error checking access:', error);
        setLoading(false);
        return;
      }

      setHasAccess(!!accessGranted);
      console.log('[ACCESS CHECK] Has access:', !!accessGranted);

      // If has access, fetch seller contact info
      if (accessGranted) {
        console.log('[ACCESS CHECK] User has access, fetching seller contact...');
        
        // Check if access is via premium (used_token = false)
        const { data: accessData } = await supabase
          .from('contact_access')
          .select('used_token')
          .eq('user_id', userId)
          .eq('business_id', businessId)
          .maybeSingle();
        
        if (accessData) {
          setIsPremiumAccess(!accessData.used_token);
          console.log('[ACCESS CHECK] Access via premium:', !accessData.used_token);
        }
        
        // First get the business to find seller_id
        const { data: businessData } = await supabase
          .from('businesses')
          .select('seller_id')
          .eq('id', businessId)
          .single();

        console.log('[ACCESS CHECK] Business seller_id:', businessData?.seller_id);

        if (businessData?.seller_id) {
          const { data: contact, error: contactError } = await supabase
            .from('seller_contacts')
            .select('email, phone')
            .eq('seller_id', businessData.seller_id)
            .maybeSingle();
          
          console.log('[ACCESS CHECK] Seller contact:', { contact, contactError });
          
          if (contact) {
            setSellerContact(contact);
            console.log('[ACCESS CHECK] Seller contact set successfully');
          } else {
            console.log('[ACCESS CHECK] No seller contact found');
          }
        }
      } else {
        console.log('[ACCESS CHECK] User does not have access');
      }
      
      setLoading(false);
    } catch (error: any) {
      console.error('[ACCESS CHECK] Unexpected error:', error);
      setLoading(false);
    }
  };

  const checkPremiumSubscription = async (userId: string) => {
    try {
      const { data, error } = await invokeWithTimeout('check-premium-subscription', { timeout: 8000 });
      
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
    if (!businessId || !user) return;
    
    setIsUnlocking(true);
    try {
      console.log('[UNLOCK] Starting checkout for one-time access');
      
      const { data, error } = await supabase.functions.invoke('create-contact-access-checkout', {
        body: {
          businessId: businessId,
          accessType: 'one_time'
        }
      });

      if (error) {
        console.error('[UNLOCK] Error creating checkout:', error);
        throw error;
      }

      if (data?.url) {
        // Open Stripe checkout in new tab
        window.open(data.url, '_blank');
        setShowUnlockDialog(false);
        
        toast({
          title: "Redirection vers le paiement",
          description: "Vous allez être redirigé vers la page de paiement sécurisée.",
        });
      }
    } catch (error: any) {
      console.error('[UNLOCK] Unexpected error:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de créer la session de paiement.",
      });
    } finally {
      setIsUnlocking(false);
    }
  };

  const handlePremiumCheckout = async () => {
    if (!businessId) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('create-contact-access-checkout', {
        body: {
          businessId: businessId,
          accessType: 'subscription'
        }
      });
      
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

  // Structured data for business listing - Enhanced for SEO
  const businessStructuredData = business ? {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": business.title,
    "description": business.description,
    "category": business.industry,
    "brand": {
      "@type": "Organization",
      "name": "Vente.club"
    },
    "offers": {
      "@type": "Offer",
      "price": business.asking_price > 0 ? business.asking_price : undefined,
      "priceCurrency": business.asking_price > 0 ? "CAD" : undefined,
      "availability": business.status === 'active' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Vente.club"
      },
      "itemCondition": "https://schema.org/UsedCondition",
      "url": `https://vente.club/entreprise/${business.slug}`
    },
    "location": {
      "@type": "Place",
      "name": business.city,
      "address": {
        "@type": "PostalAddress",
        "addressLocality": business.city,
        "addressRegion": business.province || "Québec",
        "addressCountry": "CA"
      }
    },
    "aggregateRating": business.views_count > 10 ? {
      "@type": "AggregateRating",
      "ratingValue": "4.5",
      "reviewCount": Math.floor(business.views_count / 10)
    } : undefined
  } : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/10">
      <SEO
        title={`${business.title} à Vendre ${business.asking_price > 0 ? `- ${business.asking_price.toLocaleString()} $` : '- Prix à discuter'} | ${business.city}, Québec`}
        description={`${business.is_franchise ? 'Franchise' : 'Entreprise'} ${business.industry} à vendre à ${business.city}. ${business.description.substring(0, 120)}... ${business.annual_revenue ? `Revenus annuels: ${business.annual_revenue.toLocaleString()} $` : ''} Contact direct avec le propriétaire.`}
        keywords={`entreprise à vendre ${business.city}, ${business.industry} à vendre québec, commerce à vendre ${business.city}, achat entreprise ${business.industry}, ${business.is_franchise ? 'franchise à vendre' : 'PME à vendre'}, affaires québec, vente commerce ${business.city}`}
        canonical={`/entreprise/${business.slug}`}
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
                      {businessId && (
                        <div className="flex items-center gap-2">
                          <FavoriteButton businessId={businessId} userId={user?.id} />
                          <span className="text-xs text-muted-foreground">
                            Activer les notifications
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2 items-center text-muted-foreground">
                      {business.property_type ? (
                        <>
                          <Badge variant="secondary" className="bg-secondary/10 text-secondary border-secondary/20">
                            🏢 Immobilier
                          </Badge>
                          <Badge variant="outline">
                            {business.property_type === 'bureau' && 'Bureau commercial'}
                            {business.property_type === 'commerce' && 'Espace commercial'}
                            {business.property_type === 'industriel' && 'Bâtiment industriel'}
                            {business.property_type === 'terrain' && 'Terrain commercial'}
                            {business.property_type === 'immeuble_logement' && 'Immeuble à logement'}
                            {business.property_type === 'mixte' && 'Propriété mixte'}
                            {!['bureau', 'commerce', 'industriel', 'terrain', 'immeuble_logement', 'mixte'].includes(business.property_type) && 'Propriété'}
                          </Badge>
                        </>
                      ) : business.is_franchise ? (
                        <Badge variant="secondary" className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20">
                          🎯 Franchise
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Entreprise</Badge>
                      )}
                      <span className="flex items-center gap-1 font-medium">
                        <MapPin className="w-4 h-4" />
                        {business.city || business.location}
                        {business.region && <span className="text-muted-foreground/70">, {business.region}</span>}
                        {!business.address && (
                          <span className="text-xs text-muted-foreground/60 italic ml-1">
                            (localisation approximative)
                          </span>
                        )}
                      </span>
                      {business.created_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Publié le {new Date(business.created_at).toLocaleDateString('fr-CA')}
                        </span>
                      )}
                    </div>
                      {!isSeller && businessId && (
                        <ReportBusinessDialog businessId={businessId} businessTitle={business.title} />
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-accent">
                      {business.asking_price === 0 ? 'À discuter' : `${business.asking_price.toLocaleString()} CAD`}
                    </div>
                    <div className="text-sm text-muted-foreground">Prix demandé</div>
                    {business.sale_type && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          {business.sale_type === 'assets' && '💼 Vente d\'actifs'}
                          {business.sale_type === 'shares' && '📊 Vente d\'actions'}
                          {business.sale_type === 'both' && '💼📊 Ouvert aux deux'}
                        </Badge>
                      </div>
                    )}
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
                  
                  {/* Notice Démo */}
                  {business.is_demo && (
                    <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-950/30 border-2 border-purple-200 dark:border-purple-800 rounded-lg">
                      <p className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                        📢 Annonce fictive à titre démonstratif
                      </p>
                      <p className="text-sm text-purple-800 dark:text-purple-200 mb-2">
                        Cette annonce est à titre démonstratif en attendant le lancement officiel de notre plateforme.
                      </p>
                      <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                        Il est déjà possible de soumettre votre annonce pour le grand lancement prévu le 1er décembre 2025!
                      </p>
                    </div>
                  )}
                </div>

                {/* Property Characteristics - For Real Estate Only */}
                {business.property_type && (
                  <div className="border border-border/50 rounded-xl p-6 bg-gradient-to-br from-secondary/5 to-secondary/10">
                    <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                      🏢 Caractéristiques de la propriété
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Type de propriété */}
                      <div className="bg-background/50 p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Type de propriété</div>
                        <div className="text-lg font-semibold text-foreground">
                          {business.property_type === 'bureau' && 'Bureau commercial'}
                          {business.property_type === 'commerce' && 'Espace commercial'}
                          {business.property_type === 'industriel' && 'Bâtiment industriel'}
                          {business.property_type === 'terrain' && 'Terrain commercial'}
                          {business.property_type === 'immeuble_logement' && 'Immeuble à logement'}
                          {business.property_type === 'mixte' && 'Propriété mixte'}
                          {!['bureau', 'commerce', 'industriel', 'terrain', 'immeuble_logement', 'mixte'].includes(business.property_type) && 'Propriété commerciale'}
                        </div>
                      </div>

                      {/* Date de création de l'annonce */}
                      {business.created_at && (
                        <div className="bg-background/50 p-4 rounded-lg">
                          <div className="text-sm text-muted-foreground mb-1">Date de publication</div>
                          <div className="text-lg font-semibold text-foreground">
                            {new Date(business.created_at).toLocaleDateString('fr-CA', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </div>
                        </div>
                      )}

                      {/* Superficie */}
                      {business.square_footage && (
                        <div className="bg-background/50 p-4 rounded-lg">
                          <div className="text-sm text-muted-foreground mb-1">Superficie</div>
                          <div className="text-lg font-semibold text-foreground">
                            {Number(business.square_footage).toLocaleString('fr-CA')} pi²
                          </div>
                        </div>
                      )}

                      {/* Année de construction */}
                      <div className="bg-background/50 p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Année de construction</div>
                        <div className="text-lg font-semibold text-foreground">
                          {business.year_built || 'Non spécifiée'}
                        </div>
                      </div>

                      {/* Type de propriété locative */}
                      {business.is_rental_property && (
                        <div className="bg-background/50 p-4 rounded-lg">
                          <div className="text-sm text-muted-foreground mb-1">Type</div>
                          <div className="text-lg font-semibold text-secondary">
                            🏠 Propriété locative
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Adresse complète */}
                    {business.address && (
                      <div className="mt-4 bg-background/50 p-4 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Adresse</div>
                        <div className="text-base font-medium text-foreground flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-secondary" />
                          {business.address}
                        </div>
                      </div>
                    )}

                    {/* Unités de location */}
                    {business.is_rental_property && business.rental_units && Array.isArray(business.rental_units) && business.rental_units.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border/30">
                        <h3 className="text-lg font-semibold text-foreground mb-3">📊 Unités de location</h3>
                        <div className="space-y-3">
                          {business.rental_units.map((unit: any, index: number) => (
                            <div key={index} className="bg-background/70 p-4 rounded-lg border border-secondary/20">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-semibold text-foreground text-base">
                                    {unit.count}x {unit.unit_type}
                                  </div>
                                  {unit.monthly_rent && (
                                    <div className="text-sm text-muted-foreground mt-1">
                                      Loyer mensuel
                                    </div>
                                  )}
                                </div>
                                {unit.monthly_rent && (
                                  <div className="text-right">
                                    <div className="text-xl font-bold text-secondary">
                                      {Number(unit.monthly_rent).toLocaleString('fr-CA')} $
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      par mois
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Location Information */}
                {!business.property_type && (business.city || business.region) && (
                  <div className="bg-gradient-to-r from-primary/5 to-accent/5 p-5 rounded-xl border border-border/50">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Localisation</h3>
                        <p className="text-sm text-muted-foreground">
                          {business.city && business.region 
                            ? `${business.city}, ${business.region}, ${business.province || 'Québec'}` 
                            : business.location}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Financial Information Grid - Only show for non-property businesses */}
                {!business.property_type && (
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
                )}

                {/* Portrait Financier - Only show for non-property businesses */}
                {!business.property_type && (business.annual_revenue || business.baiia || business.net_profit) && (
                  <div className="border border-border/50 rounded-xl p-8 bg-gradient-to-br from-background to-muted/20 shadow-sm">
                    <h2 className="text-2xl font-bold text-foreground mb-2">Portrait financier</h2>
                    <p className="text-sm text-muted-foreground mb-6">Aperçu des performances financières de l'entreprise</p>
                    
                    {/* Résultats */}
                    {(business.annual_revenue || business.baiia || business.net_profit) && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Résultats</h3>
                        
                        <div className="space-y-2">
                          {business.annual_revenue && (
                            <div className="flex justify-between items-center py-3 px-4 rounded-lg hover:bg-muted/30 transition-colors">
                              <span className="text-foreground font-medium">Revenu annuel</span>
                              <span className="font-bold text-lg text-primary">
                                {new Intl.NumberFormat('fr-CA', {
                                  style: 'currency',
                                  currency: business.currency || 'CAD',
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                }).format(business.annual_revenue)}
                              </span>
                            </div>
                          )}
                          
                          {business.baiia && (
                            <div className="flex justify-between items-center py-3 px-4 rounded-lg hover:bg-muted/30 transition-colors">
                              <span className="text-foreground font-medium">BAIIA</span>
                              <span className="font-bold text-lg text-primary">
                                {new Intl.NumberFormat('fr-CA', {
                                  style: 'currency',
                                  currency: business.currency || 'CAD',
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                }).format(business.baiia)}
                              </span>
                            </div>
                          )}
                          
                          {business.net_profit && (
                            <div className="flex justify-between items-center py-3 px-4 rounded-lg hover:bg-muted/30 transition-colors">
                              <span className="text-foreground font-medium">Bénéfice net</span>
                              <span className="font-bold text-lg text-primary">
                                {new Intl.NumberFormat('fr-CA', {
                                  style: 'currency',
                                  currency: business.currency || 'CAD',
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                }).format(business.net_profit)}
                              </span>
                            </div>
                          )}
                          
                          {business.net_profit_margin && (
                            <div className="flex justify-between items-center py-3 px-4 rounded-lg bg-muted/40">
                              <span className="text-foreground font-medium">Marge bénéficiaire nette</span>
                              <span className="font-bold text-lg text-accent">{business.net_profit_margin}%</span>
                            </div>
                          )}

                          {business.profit_margin && (
                            <div className="flex justify-between items-center py-3 px-4 rounded-lg bg-muted/40">
                              <span className="text-foreground font-medium">Marge de profit</span>
                              <span className="font-bold text-lg text-accent">{business.profit_margin}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

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
                        <span className="font-semibold">
                          {isPremiumAccess ? "✨ Accès débloqué grâce à votre abonnement Premium" : "Accès débloqué"}
                        </span>
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
                    <div className="bg-gradient-to-br from-primary/5 to-accent/5 p-6 rounded-lg">
                      {!user && (
                        <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-6 rounded-lg border-2 border-green-200 dark:border-green-800 text-center">
                          <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center justify-center gap-2">
                            💬 Discutez gratuitement avec le vendeur
                          </h3>
                          <p className="text-green-800 dark:text-green-200 mb-4">
                            Connectez-vous pour accéder au chat gratuit et illimité avec tous les vendeurs
                          </p>
                          <Button 
                            onClick={() => navigate("/auth")}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Se connecter maintenant
                          </Button>
                        </div>
                      )}
                      
                      <div className="text-center mb-6">
                        <Lock className="w-12 h-12 mx-auto mb-4 text-accent" />
                        <h3 className="text-lg font-semibold mb-2">
                          Coordonnées du vendeur verrouillées
                        </h3>
                        <p className="text-muted-foreground">
                          Choisissez votre option d'accès pour voir l'email et le téléphone du vendeur
                        </p>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-card border-2 border-border rounded-lg p-6 flex flex-col">
                          <div className="mb-4">
                            <h4 className="font-semibold text-lg mb-2">Accès unique</h4>
                            <div className="text-3xl font-bold text-primary mb-2">9,99$</div>
                            <p className="text-sm text-muted-foreground">Paiement unique</p>
                          </div>
                          <ul className="space-y-2 mb-6 flex-grow">
                            <li className="flex items-start gap-2 text-sm">
                              <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span>Coordonnées de ce vendeur uniquement</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm">
                              <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span>Accès permanent</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm">
                              <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span>Chat illimité avec ce vendeur</span>
                            </li>
                          </ul>
                          <Button 
                            size="lg" 
                            className="w-full"
                            onClick={handleUnlockRequest}
                          >
                            Déverrouiller
                          </Button>
                        </div>
                        
                        <div className="bg-gradient-to-br from-secondary/10 to-primary/10 border-2 border-secondary rounded-lg p-6 flex flex-col relative">
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                            RECOMMANDÉ
                          </div>
                          <div className="mb-4">
                            <h4 className="font-semibold text-lg mb-2">Premium</h4>
                            <div className="text-3xl font-bold text-secondary mb-2">19,99$</div>
                            <p className="text-sm text-muted-foreground">Par mois</p>
                          </div>
                          <ul className="space-y-2 mb-6 flex-grow">
                            <li className="flex items-start gap-2 text-sm">
                              <svg className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span className="font-semibold">Accès illimité à tous les vendeurs</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm">
                              <svg className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span>Aucune limite de contacts</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm">
                              <svg className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span>Chat illimité avec tous</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm">
                              <svg className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span>Annulez à tout moment</span>
                            </li>
                          </ul>
                          <Button 
                            size="lg" 
                            className="w-full"
                            variant="secondary"
                            onClick={handlePremiumCheckout}
                          >
                            S'abonner au Premium
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Calculateur de financement - Collapsible */}
                {business.asking_price > 0 && (
                  <div className="border-t pt-6 mt-6">
                    <Collapsible open={isCalculatorOpen} onOpenChange={setIsCalculatorOpen}>
                      <CollapsibleTrigger asChild>
                        <button className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-secondary/5 to-primary/5 hover:from-secondary/10 hover:to-primary/10 rounded-lg transition-colors group">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-secondary/10 rounded-lg group-hover:bg-secondary/20 transition-colors">
                              <Calculator className="w-5 h-5 text-secondary" />
                            </div>
                            <div className="text-left">
                              <h3 className="text-lg font-semibold text-foreground">
                                Calculateur de financement
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Estimez vos paiements mensuels
                              </p>
                            </div>
                          </div>
                          <ChevronDown 
                            className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
                              isCalculatorOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-4">
                        <FinancialCalculator askingPrice={business.asking_price} />
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                )}

                {/* Chat Section - Gratuit pour tous les utilisateurs authentifiés */}
                {user && business && (
                  <div className="border-t pt-6 mt-6">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                      💬 Messagerie avec le vendeur
                      <Badge variant="secondary" className="text-xs">Gratuit</Badge>
                    </h2>
                    
                    {!isSeller ? (
                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                          <p className="text-sm text-green-800 dark:text-green-200">
                            ✅ Le chat est gratuit et accessible à tous les utilisateurs connectés
                          </p>
                        </div>
                        <ChatBox
                          businessId={businessId}
                          currentUserId={user.id}
                          otherUserId={business.seller_id}
                          otherUserName={
                            sellerProfile?.full_name || 
                            (sellerProfile?.first_name && sellerProfile?.last_name 
                              ? `${sellerProfile.first_name} ${sellerProfile.last_name}` 
                              : sellerProfile?.email?.split('@')[0] || "Vendeur")
                          }
                          businessTitle={business.title}
                        />
                      </div>
                    ) : (
                      <SellerChatSection 
                        businessId={businessId}
                        sellerId={user.id}
                      />
                    )}
                  </div>
                )}

                {/* Share button at the end of the listing */}
                <div className="border-t pt-6 mt-6 flex justify-center">
                  {businessId && (
                    <ShareButton 
                      title={business.title} 
                      slug={business.slug} 
                      description={business.description}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Déverrouiller les coordonnées du vendeur</DialogTitle>
            <DialogDescription className="space-y-4 pt-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">9,99$</div>
                <p className="text-sm text-muted-foreground">Paiement unique</p>
              </div>
              
              <div className="bg-primary/5 rounded-lg p-4">
                <p className="font-semibold mb-2">Ce que vous obtenez :</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Email et téléphone du vendeur</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Accès permanent à ce vendeur</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Chat illimité avec ce vendeur</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm text-center text-muted-foreground">
                  💡 <strong>Astuce:</strong> Besoin de contacter plusieurs vendeurs ? L'abonnement Premium à 19,99$/mois vous donne accès illimité à tous les vendeurs.
                </p>
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
              {isUnlocking ? 'Traitement...' : 'Payer 9,99$'}
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
