import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { supabase, invokeWithTimeout } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Lock, MapPin, TrendingUp, Users, Calendar, Eye, Calculator, Phone, Mail, UserCircle, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X, ChevronDown, MessageSquare, Share2 } from "lucide-react";
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
import { PriceHistory } from "@/components/PriceHistory";
import { MakeOfferDialog } from "@/components/MakeOfferDialog";
import { ConversationLimitAlert } from "@/components/ConversationLimitAlert";
import { PremiumUpgradeModal } from "@/components/PremiumUpgradeModal";

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
  const [conversationsRemaining, setConversationsRemaining] = useState<number>(1);
  const [hoursUntilReset, setHoursUntilReset] = useState<number>(0);
  const [minutesUntilReset, setMinutesUntilReset] = useState<number>(0);
  const [isSeller, setIsSeller] = useState(false);
  const [hasUnlockedChat, setHasUnlockedChat] = useState(false);
  const [isUnlockingChat, setIsUnlockingChat] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      const businessData = await fetchBusiness();
      
      // CRITIQUE: Attendre que businessData soit disponible avant de charger les photos
      if (businessData?.id) {
        console.log('[INIT] Business loaded, now fetching photos for:', businessData.id);
        await fetchPhotos(businessData.id);
      }

      // Track view analytics ONCE at initialization only
      if (businessData?.id) {
        try {
          await supabase
            .from('business_analytics')
            .insert({
              business_id: businessData.id,
              event_type: 'view',
              user_id: session?.user?.id,
            });
        } catch (analyticsError) {
          console.log('Analytics tracking skipped:', analyticsError);
        }
      }

      if (session?.user && businessData?.id) {
        console.log('[INIT] Checking Premium subscription first');
        await checkPremiumSubscription(session.user.id);
        
        console.log('[INIT] Checking conversation limits');
        await checkConversationLimits(session.user.id);
        
        console.log('[INIT] Checking if user is seller');
        setIsSeller(session.user.id === businessData.seller_id);
        
        console.log('[INIT] Checking if chat is unlocked');
        await checkChatUnlocked(session.user.id, businessData.id);
        
        console.log('[INIT] Then checking access for user');
        await checkAccess(session.user.id, businessData.id);
      } else {
        console.log('[INIT] No user session or no business data');
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
          const oldRecord = payload.old as any;
          const newRecord = payload.new as any;
          
          // Ignore updates that are only view count changes
          const onlyViewsChanged = oldRecord && newRecord && 
            oldRecord.views_count !== newRecord.views_count &&
            Object.keys(newRecord).every(key => 
              key === 'views_count' || 
              key === 'updated_at' || 
              key === 'id' ||
              oldRecord[key] === newRecord[key]
            );
          
          if (onlyViewsChanged) {
            console.log('[REALTIME] Only views count changed, skipping refresh');
            return;
          }
          
          // Check if has_pending_changes went from true to false (approval)
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
          fetchPhotos(businessId);
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

  // Charger les coordonnées du vendeur UNIQUEMENT si premium
  useEffect(() => {
    if (user && business && hasPremium && !sellerContact) {
      console.log('[SELLER CONTACT] Loading seller contact info for premium user...');
      supabase
        .from('seller_contacts')
        .select('email, phone')
        .eq('seller_id', business.seller_id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setSellerContact(data);
            console.log('[SELLER CONTACT] Contact loaded successfully');
          }
        });
    }
  }, [hasPremium, business, user]);

  // Navigation clavier pour la galerie
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedPhotoIndex === null) return;

      if (e.key === 'ArrowLeft' && selectedPhotoIndex > 0) {
        setSelectedPhotoIndex(selectedPhotoIndex - 1);
        setImageZoom(1);
      } else if (e.key === 'ArrowRight' && selectedPhotoIndex < photos.length - 1) {
        setSelectedPhotoIndex(selectedPhotoIndex + 1);
        setImageZoom(1);
      } else if (e.key === 'Escape') {
        setSelectedPhotoIndex(null);
        setImageZoom(1);
      } else if (e.key === '+' || e.key === '=') {
        setImageZoom(Math.min(3, imageZoom + 0.25));
      } else if (e.key === '-') {
        setImageZoom(Math.max(1, imageZoom - 0.25));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhotoIndex, photos.length, imageZoom]);

  const fetchPhotos = async (businessId?: string) => {
    const idToUse = businessId || businessId;
    if (!idToUse) {
      console.log('[PHOTOS] No business ID available yet');
      return;
    }
    
    console.log('[PHOTOS] Fetching photos for business:', idToUse);
    const { data, error } = await supabase
      .from('business_photos')
      .select('*')
      .eq('business_id', idToUse)
      .order('display_order');
    
    if (error) {
      console.error('[PHOTOS] Error fetching photos:', error);
      return;
    }
    
    if (data) {
      console.log('[PHOTOS] Found', data.length, 'photos');
      setPhotos(data);
    } else {
      console.log('[PHOTOS] No photos found');
      setPhotos([]);
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
      
      if (data) {
        setBusinessId(data.id);
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
        
        return data;
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

  const checkAccess = async (userId: string, checkBusinessId?: string) => {
    const idToCheck = checkBusinessId || businessId;
    if (!idToCheck) {
      console.log('[ACCESS CHECK] No business ID available');
      setLoading(false);
      return;
    }
    
    try {
      console.log('[ACCESS CHECK] Checking access for business:', idToCheck);
      
      // Use RPC to check access server-side
      const { data: accessGranted, error } = await supabase
        .rpc('check_business_access', { business_uuid: idToCheck });

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
          .eq('business_id', idToCheck)
          .maybeSingle();
        
        if (accessData) {
          setIsPremiumAccess(!accessData.used_token);
          console.log('[ACCESS CHECK] Access via premium:', !accessData.used_token);
        }
        
        // First get the business to find seller_id
        const { data: businessData } = await supabase
          .from('businesses')
          .select('seller_id')
          .eq('id', idToCheck)
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

  const checkConversationLimits = async (userId: string) => {
    if (!businessId) return;
    
    try {
      const { data, error } = await supabase.rpc('can_start_conversation', {
        p_user_id: userId,
        p_business_id: businessId
      });
      
      if (error) {
        console.error('Error checking conversation limits:', error);
        return;
      }
      
      if (data && typeof data === 'object') {
        const conversationData = data as { 
          can_start?: boolean;
          conversations_remaining?: number;
          hours_until_reset?: number;
          minutes_until_reset?: number;
          message?: string;
        };
        setConversationsRemaining(conversationData.conversations_remaining || 0);
        setHoursUntilReset(conversationData.hours_until_reset || 0);
        setMinutesUntilReset(conversationData.minutes_until_reset || 0);
      }
    } catch (error) {
      console.error('Error in checkConversationLimits:', error);
    }
  };

  const checkChatUnlocked = async (userId: string, checkBusinessId: string) => {
    try {
      // Vérifier si l'utilisateur a déverrouillé le chat pour cette annonce spécifique
      // Soit via contact_access, soit via des messages existants
      const { data: accessData, error: accessError } = await supabase
        .from('contact_access')
        .select('id')
        .eq('user_id', userId)
        .eq('business_id', checkBusinessId)
        .limit(1);
      
      if (accessError) {
        console.error('Error checking contact access:', accessError);
      }
      
      // Vérifier s'il existe déjà des messages pour cette conversation
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('id')
        .eq('business_id', checkBusinessId)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .limit(1);
      
      if (messagesError) {
        console.error('Error checking messages:', messagesError);
      }
      
      // Le chat est déverrouillé si l'utilisateur a un access OU des messages existants
      const isUnlocked = (accessData && accessData.length > 0) || (messagesData && messagesData.length > 0);
      setHasUnlockedChat(isUnlocked);
      
      console.log('[CHAT UNLOCK CHECK] Business:', checkBusinessId, 'Unlocked:', isUnlocked);
    } catch (error) {
      console.error('Error in checkChatUnlocked:', error);
    }
  };

  const handleUnlockChat = async () => {
    if (!user || !businessId || !business) return;
    
    setIsUnlockingChat(true);
    
    try {
      // VÉRIFICATION CRITIQUE #1 : Recharger les infos utilisateur pour avoir email_confirmed_at à jour
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
        toast({
          variant: "destructive",
          title: "Erreur d'authentification",
          description: "Impossible de vérifier votre compte. Veuillez vous reconnecter.",
        });
        setIsUnlockingChat(false);
        return;
      }
      
      // VÉRIFICATION CRITIQUE #2 : L'email doit être confirmé
      if (!currentUser.email_confirmed_at) {
        toast({
          variant: "destructive",
          title: "Email non confirmé",
          description: "Vous devez confirmer votre email avant de pouvoir déverrouiller un chat. Vérifiez votre boîte de réception.",
        });
        setIsUnlockingChat(false);
        return;
      }
      
      // Vérifier si l'utilisateur a déjà déverrouillé cette annonce spécifique
      const { data: existingAccess } = await supabase
        .from('contact_access')
        .select('id')
        .eq('user_id', user.id)
        .eq('business_id', businessId)
        .limit(1);
      
      if (existingAccess && existingAccess.length > 0) {
        toast({
          title: "Déjà déverrouillé",
          description: "Vous avez déjà accès au chat pour cette annonce.",
        });
        setHasUnlockedChat(true);
        setIsUnlockingChat(false);
        return;
      }
      
      // Vérifier les limites avec la nouvelle fonction
      const { data: limitCheck, error: limitError } = await supabase.rpc('can_start_conversation', {
        p_user_id: user.id,
        p_business_id: businessId
      });
      
      if (limitError) {
        console.error('Error checking limits:', limitError);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de vérifier vos limites.",
        });
        setIsUnlockingChat(false);
        return;
      }
      
      const limitData = limitCheck as any;
      if (limitData && !limitData.can_start) {
        // Afficher le modal premium au lieu d'un simple toast
        setHoursUntilReset(limitData.hours_until_reset || 0);
        setMinutesUntilReset(limitData.minutes_until_reset || 0);
        setShowPremiumDialog(true);
        setIsUnlockingChat(false);
        return;
      }
      
      // 1. Créer une entrée dans contact_access pour cette annonce spécifique
      const { error: accessError } = await supabase
        .from('contact_access')
        .insert({
          user_id: user.id,
          business_id: businessId,
          used_token: true
        });
      
      if (accessError) {
        console.error('Error creating contact access:', accessError);
        throw accessError;
      }
      
      // 2. Marquer comme déverrouillé localement (PAS de message automatique !)
      setHasUnlockedChat(true);
      
      // 3. Charger les coordonnées du vendeur
      const { data: contact } = await supabase
        .from('seller_contacts')
        .select('email, phone')
        .eq('seller_id', business.seller_id)
        .maybeSingle();
      
      if (contact) {
        setSellerContact(contact);
      }
      
      // 4. Recharger les limites de conversation
      await checkConversationLimits(user.id);
      
      // 5. Ouvrir le chat dans la page au lieu de rediriger
      setIsChatOpen(true);
      
      // 6. Attendre un peu puis scroller vers le chat avec une animation
      setTimeout(() => {
        const chatElement = document.querySelector('[data-chat-section]');
        if (chatElement) {
          chatElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 100);
      
      toast({
        title: "Chat déverrouillé avec succès",
        description: "Vous pouvez maintenant discuter avec le vendeur. Envoyez votre premier message!",
      });
    } catch (error: any) {
      console.error('Error unlocking chat:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: error.message || "Impossible de déverrouiller le chat.",
      });
      
      // Recharger l'état du chat en cas d'erreur
      if (businessId) {
        await checkChatUnlocked(user.id, businessId);
      }
    } finally {
      setIsUnlockingChat(false);
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

  // isSeller est maintenant géré par le state

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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <SEO
        title={`${business.title} à Vendre ${business.asking_price > 0 ? `- ${business.asking_price.toLocaleString()} $` : '- Prix à discuter'} | ${business.city}, Québec`}
        description={`${business.is_franchise ? 'Franchise' : 'Entreprise'} ${business.industry} à vendre à ${business.city}. ${business.description.substring(0, 120)}... ${business.annual_revenue ? `Revenus annuels: ${business.annual_revenue.toLocaleString()} $` : ''} Contact direct avec le propriétaire.`}
        keywords={`entreprise à vendre ${business.city}, ${business.industry} à vendre québec, commerce à vendre ${business.city}, achat entreprise ${business.industry}, ${business.is_franchise ? 'franchise à vendre' : 'PME à vendre'}, affaires québec, vente commerce ${business.city}`}
        canonical={`/entreprise/${business.slug}`}
        type="product"
        structuredData={businessStructuredData}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section - Header Premium avec outils */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-white rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden mb-8">
            {/* Barre d'outils supérieure */}
            <div className="bg-slate-950/50 border-b border-slate-700/50 px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {business.created_at && (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Calendar className="w-4 h-4" />
                      <span>Publié le {new Date(business.created_at).toLocaleDateString('fr-CA')}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {businessId && (
                    <>
                      <FavoriteButton businessId={businessId} userId={user?.id} />
                      <ShareButton 
                        title={business.title} 
                        slug={business.slug} 
                        description={business.description}
                        variant="outline"
                        size="default"
                        className="bg-slate-800/50 hover:bg-slate-700 border-slate-600 text-slate-200"
                      />
                    </>
                  )}
                  {!isSeller && businessId && (
                    <ReportBusinessDialog businessId={businessId} businessTitle={business.title} />
                  )}
                </div>
              </div>
            </div>

            {/* Contenu principal du header */}
            <div className="p-8 md:p-10">
              <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                <div className="flex-1">
                  <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                    {business.title}
                  </h1>
                  <div className="flex flex-wrap gap-3 items-center">
                    {business.property_type ? (
                      <>
                        <Badge className="bg-blue-500/30 text-blue-100 border-blue-400/50 hover:bg-blue-500/40 px-4 py-1.5 text-sm font-semibold">
                          Immobilier
                        </Badge>
                        <Badge variant="outline" className="border-slate-500 text-slate-100 hover:bg-slate-800 px-4 py-1.5 text-sm">
                          {business.property_type === 'bureau' && 'Bureau commercial'}
                          {business.property_type === 'commerce' && 'Espace commercial'}
                          {business.property_type === 'industriel' && 'Bâtiment industriel'}
                          {business.property_type === 'terrain' && 'Terrain commercial'}
                          {business.property_type === 'immeuble_logement' && 'Immeuble à logement'}
                          {business.property_type === 'mixte' && 'Propriété mixte'}
                        </Badge>
                      </>
                    ) : business.is_franchise ? (
                      <Badge className="bg-purple-500/30 text-purple-100 border-purple-400/50 px-4 py-1.5 text-sm font-semibold">
                        Franchise
                      </Badge>
                    ) : (
                      <Badge className="bg-primary/30 text-primary-foreground border-primary/50 px-4 py-1.5 text-sm font-semibold">
                        Entreprise
                      </Badge>
                    )}
                    <span className="flex items-center gap-2 text-slate-100 px-3 py-1.5 bg-slate-800/50 rounded-full text-sm">
                      <MapPin className="w-4 h-4" />
                      {business.city || business.location}
                      {business.region && <span className="text-slate-300">, {business.region}</span>}
                    </span>
                  </div>
                </div>
                <div className="text-right bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 backdrop-blur-sm border border-emerald-400/20 rounded-xl p-6 min-w-[280px]">
                  <div className="text-sm text-slate-400 font-medium uppercase tracking-wider mb-2">Prix demandé</div>
                  <div className="text-4xl md:text-5xl font-bold text-white mb-3">
                    {business.asking_price === 0 ? 'À discuter' : `${business.asking_price.toLocaleString()} $`}
                  </div>
                  {business.sale_type && (
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-200 bg-emerald-950/20 text-xs">
                      {business.sale_type === 'assets' && 'Vente d\'actifs'}
                      {business.sale_type === 'shares' && 'Vente d\'actions'}
                      {business.sale_type === 'both' && 'Flexible'}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-8">

                {/* Photo Lightbox avec Zoom et Navigation */}
                {selectedPhotoIndex !== null && (
                  <Dialog open={true} onOpenChange={() => {
                    setSelectedPhotoIndex(null);
                    setImageZoom(1);
                  }}>
                    <DialogContent className="max-w-7xl w-full h-[90vh] p-0 bg-black/95">
                      <div className="relative w-full h-full flex flex-col">
                        {/* Barre d'outils supérieure */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-black/70 backdrop-blur-sm rounded-full px-6 py-3">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20"
                            onClick={() => setImageZoom(Math.max(1, imageZoom - 0.25))}
                            disabled={imageZoom <= 1}
                          >
                            <ZoomOut className="w-5 h-5" />
                          </Button>
                          <span className="text-white font-medium min-w-[60px] text-center">
                            {Math.round(imageZoom * 100)}%
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-white hover:bg-white/20"
                            onClick={() => setImageZoom(Math.min(3, imageZoom + 0.25))}
                            disabled={imageZoom >= 3}
                          >
                            <ZoomIn className="w-5 h-5" />
                          </Button>
                          <div className="w-px h-6 bg-white/30 mx-2" />
                          <span className="text-white font-medium">
                            {selectedPhotoIndex + 1} / {photos.length}
                          </span>
                        </div>

                        {/* Bouton fermer */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 rounded-full"
                          onClick={() => {
                            setSelectedPhotoIndex(null);
                            setImageZoom(1);
                          }}
                        >
                          <X className="w-6 h-6" />
                        </Button>

                        {/* Image principale avec zoom */}
                        <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
                          <img
                            src={photos[selectedPhotoIndex].photo_url}
                            alt={`Photo ${selectedPhotoIndex + 1}`}
                            className="max-w-full max-h-full object-contain transition-transform duration-200"
                            style={{ transform: `scale(${imageZoom})` }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop';
                            }}
                          />
                        </div>

                        {/* Boutons de navigation gauche/droite */}
                        {selectedPhotoIndex > 0 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-4 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full bg-black/70 backdrop-blur-sm text-white hover:bg-white/20 hover:scale-110 transition-all"
                            onClick={() => {
                              setSelectedPhotoIndex(selectedPhotoIndex - 1);
                              setImageZoom(1);
                            }}
                          >
                            <ChevronLeft className="w-8 h-8" />
                          </Button>
                        )}
                        {selectedPhotoIndex < photos.length - 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-4 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full bg-black/70 backdrop-blur-sm text-white hover:bg-white/20 hover:scale-110 transition-all"
                            onClick={() => {
                              setSelectedPhotoIndex(selectedPhotoIndex + 1);
                              setImageZoom(1);
                            }}
                          >
                            <ChevronRight className="w-8 h-8" />
                          </Button>
                        )}

                        {/* Barre de miniatures en bas */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                          <div className="flex gap-2 overflow-x-auto pb-2 justify-center">
                            {photos.map((photo, index) => (
                              <button
                                key={photo.id}
                                onClick={() => {
                                  setSelectedPhotoIndex(index);
                                  setImageZoom(1);
                                }}
                                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                                  index === selectedPhotoIndex
                                    ? 'border-primary scale-110 shadow-lg shadow-primary/50'
                                    : 'border-white/30 opacity-60 hover:opacity-100 hover:border-white/60'
                                }`}
                              >
                                <img
                                  src={photo.photo_url}
                                  alt={`Miniature ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null;
                                    target.src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&auto=format&fit=crop';
                                  }}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

              <div className="space-y-6">
                {/* Photo Gallery - Affichée en premier */}
                {photos.length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Photos de l'annonce</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                       {photos.map((photo, index) => (
                        <div 
                          key={photo.id} 
                          className="aspect-video rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity shadow-md hover:shadow-lg border-2 border-primary/20"
                          onClick={() => setSelectedPhotoIndex(index)}
                        >
                           <img
                            src={photo.photo_url}
                            alt={`Photo ${index + 1} de ${business.title} - ${business.industry} à ${business.city}`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null; // Éviter la boucle infinie
                              target.src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop';
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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



                {/* Bouton faire une offre - Membres Club Select seulement */}
                {!isSeller && user && businessId && hasPremium && (
                  <div className="border-t pt-6 mt-6">
                    <MakeOfferDialog
                      businessId={businessId}
                      businessTitle={business.title}
                      askingPrice={business.asking_price}
                    />
                  </div>
                )}

                {/* Historique des prix */}
                {businessId && (
                  <div className="border-t pt-6 mt-6">
                    <PriceHistory
                      businessId={businessId}
                      currentPrice={business.asking_price}
                      currency={business.currency}
                    />
                  </div>
                )}

                {/* Section Déverrouillage du Chat - Affichée AVANT le chat si pas encore déverrouillé */}
                {user && business && !isSeller && !hasPremium && !hasUnlockedChat && (
                  <div className="border-t pt-6 mt-6">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-2 border-green-200 dark:border-green-800 rounded-xl p-6 text-center max-w-md mx-auto">
                      <div className="mb-4">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 mb-3">
                          <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <h3 className="text-xl font-bold text-green-900 dark:text-green-100 mb-2">
                          Accès Gratuit Limité
                        </h3>
                        <p className="text-green-700 dark:text-green-300 text-sm mb-4">
                          Déverrouillez le chat avec ce vendeur gratuitement
                        </p>
                      </div>
                      <ul className="space-y-3 mb-6 text-left">
                        <li className="flex items-start gap-2 text-sm text-green-800 dark:text-green-200">
                          <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span><strong>Messages illimités</strong> avec ce vendeur une fois déverrouillé</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-green-800 dark:text-green-200">
                          <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span><strong>Déverrouillé à vie</strong> pour cette annonce</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-green-800 dark:text-green-200">
                          <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span><strong>1 vendeur par jour</strong> ({conversationsRemaining} restant)</span>
                        </li>
                      </ul>
                      <Button 
                        onClick={handleUnlockChat}
                        disabled={isUnlockingChat || conversationsRemaining <= 0}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        size="lg"
                      >
                        {isUnlockingChat ? "Déverrouillage..." : conversationsRemaining <= 0 ? "Limite atteinte - Voir le Club Select" : "Déverrouiller le chat gratuitement"}
                      </Button>
                      {conversationsRemaining <= 0 && (
                        <div className="mt-4 space-y-3">
                          <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
                            <p className="text-sm text-red-800 dark:text-red-200 text-center">
                              <strong>⏰ Limite gratuite atteinte</strong><br/>
                              1 chat par jour · Prochaine disponibilité dans {hoursUntilReset}h{minutesUntilReset}min
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/30 border-2 border-yellow-500/30 rounded-xl p-4">
                            <h4 className="font-bold text-center mb-2 text-yellow-900 dark:text-yellow-100">
                              ⭐ Rejoignez le Club Select
                            </h4>
                            <p className="text-sm text-center text-yellow-800 dark:text-yellow-200 mb-3">
                              19,99$/mois · Conversations illimitées
                            </p>
                            <Button
                              onClick={() => navigate('/dashboard?tab=premium')}
                              className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-bold"
                            >
                              Voir les avantages du Club Select
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Messagerie - Chat intégré */}
                {user && business && (isSeller || hasPremium || hasUnlockedChat) && (
                  <div className="border-t pt-6 mt-6" data-chat-section>
                    <Collapsible open={isChatOpen} onOpenChange={setIsChatOpen}>
                      <CollapsibleTrigger asChild>
                        <button className="w-full bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 rounded-xl p-6 hover:border-primary/50 transition-all duration-200 group">
                          <div className="flex items-center gap-4 mb-4">
                            <div className={`p-3 bg-primary/20 rounded-full transition-all duration-300 ${
                              isChatOpen ? 'scale-110 bg-primary/30' : 'group-hover:scale-110'
                            }`}>
                              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                            </div>
                            <div className="flex-1 text-left">
                              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                {isSeller ? "Vos conversations" : "Contacter le vendeur"}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {isSeller 
                                  ? "Gérez vos conversations avec les acheteurs intéressés" 
                                  : isChatOpen ? "Cliquez pour fermer le chat" : "Cliquez pour ouvrir le chat"}
                              </p>
                            </div>
                            <ChevronDown 
                              className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
                                isChatOpen ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-4 animate-fade-in">
                        {business && user && (
                          <div className="bg-card border-2 border-primary/20 rounded-xl overflow-hidden animate-scale-in shadow-lg">
                            <ChatBox
                              businessId={business.id}
                              currentUserId={user.id}
                              otherUserId={isSeller ? '' : business.seller_id}
                              otherUserName={isSeller ? 'Acheteur' : sellerProfile?.full_name || 'Vendeur'}
                              businessTitle={business.title}
                            />
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                )}

                {/* Informations du vendeur - Affichées UNIQUEMENT pour les membres Club Select */}
                {!isSeller && user && hasPremium && sellerContact && (
                  <div className="border-t pt-6 mt-6">
                    <div className="bg-gradient-to-br from-primary/5 to-secondary/5 border-2 border-primary/20 rounded-xl p-6 max-w-md mx-auto">
                      <div className="text-center mb-4">
                        <h3 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2 justify-center">
                          <UserCircle className="w-5 h-5" /> Coordonnées du vendeur
                        </h3>
                      </div>
                      
                      <div className="space-y-3">
                        {sellerContact.email && (
                          <div className="flex items-start gap-3">
                            <Mail className="w-5 h-5 text-primary mt-1" />
                            <div className="flex-1">
                              <div className="text-sm text-muted-foreground mb-1">Email</div>
                              <a 
                                href={`mailto:${sellerContact.email}`}
                                className="text-base font-semibold text-primary hover:underline break-all"
                              >
                                {sellerContact.email}
                              </a>
                            </div>
                          </div>
                        )}
                        
                        {sellerContact.phone && (
                          <div className="flex items-start gap-3">
                            <Phone className="w-5 h-5 text-primary mt-1" />
                            <div className="flex-1">
                              <div className="text-sm text-muted-foreground mb-1">Téléphone</div>
                              <a 
                                href={`tel:${sellerContact.phone}`}
                                className="text-base font-semibold text-primary hover:underline"
                              >
                                {sellerContact.phone}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}



                {/* Calculateur de financement */}
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

              </div>
            </div>

            {/* Right Sidebar - Chat Section qui suit le scroll */}
            <div className="lg:col-span-1">
              {/* Chat Section Sticky */}
              {!isSeller && businessId && user && (
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 shadow-lg sticky top-24">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-primary" />
                      Contacter le vendeur
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {hasUnlockedChat || isSeller || hasPremium ? (
                      <ChatBox
                        businessId={businessId}
                        currentUserId={user.id}
                        otherUserId={business.seller_id}
                        otherUserName={sellerProfile?.full_name}
                        businessTitle={business.title}
                      />
                    ) : (
                      <div className="bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-xl p-6 text-center">
                        <h3 className="font-bold text-xl mb-3 text-foreground">Accès Gratuit</h3>
                        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                          Débloquez gratuitement le chat avec ce vendeur pour 24h
                        </p>
                        <Button 
                          onClick={handleUnlockChat} 
                          disabled={isUnlockingChat}
                          size="lg"
                          className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          {isUnlockingChat ? 'Déverrouillage...' : 'Débloquer maintenant'}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-4 font-medium">
                          1 accès gratuit disponible par jour
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {!user && businessId && (
                <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-accent/10 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-primary" />
                      Contactez le vendeur
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Connectez-vous pour accéder gratuitement au chat avec ce vendeur
                    </p>
                    <Button 
                      onClick={() => navigate('/auth')}
                      className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    >
                      Se connecter
                    </Button>
                  </CardContent>
                </Card>
              )}
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
              
              <div className="bg-yellow-50/50 dark:bg-yellow-950/20 rounded-lg p-3 border border-yellow-500/20">
                <p className="text-sm text-center text-muted-foreground">
                  💡 <strong>Astuce:</strong> Besoin de contacter plusieurs vendeurs ? Le Club Select à 19,99$/mois vous donne accès illimité à tous les vendeurs.
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

      {/* Premium Upgrade Modal */}
      <PremiumUpgradeModal
        open={showPremiumDialog}
        onOpenChange={setShowPremiumDialog}
        hoursRemaining={hoursUntilReset}
        minutesRemaining={minutesUntilReset}
      />
    </div>
  );
};

export default BusinessDetails;
