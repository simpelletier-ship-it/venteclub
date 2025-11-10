import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, MapPin, Star, Home, Store, HelpCircle, Image as ImageIcon } from "lucide-react";
import { OptimizedImage } from "./OptimizedImage";
import { useNavigate } from "react-router-dom";
import { FavoriteButton } from "./FavoriteButton";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePreloadBusinessImages } from "@/hooks/useVisibleBusinesses";

import { formatPrice } from "@/lib/priceFormatter";
import { stripHtml } from "@/lib/htmlUtils";

interface BusinessListItemProps {
  id?: string;
  slug?: string;
  title: string;
  industry: string;
  location: string;
  city?: string;
  region?: string;
  revenue?: string;
  annual_revenue?: number;
  price?: string;
  asking_price?: number;
  asking_price_max?: number;
  profit?: string;
  profit_margin?: number;
  baiia?: number;
  description: string;
  featured?: boolean;
  status?: string;
  is_franchise?: boolean;
  sale_type?: 'assets' | 'shares' | 'both' | 'property';
  property_type?: string;
  is_demo?: boolean;
}

const BusinessListItem = ({
  id,
  slug,
  title,
  industry,
  location,
  city,
  region,
  revenue,
  annual_revenue,
  price,
  asking_price,
  asking_price_max,
  profit,
  profit_margin,
  baiia,
  description,
  featured = false,
  status,
  is_franchise = false,
  sale_type,
  property_type,
  is_demo = false,
}: BusinessListItemProps) => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const [mainImageUrl, setMainImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  
  // Précharger l'image quand l'item devient visible
  const isPreloaded = usePreloadBusinessImages(id || '', mainImageUrl, isVisible);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id);
    });
  }, []);

  // Intersection Observer pour détecter la visibilité
  useEffect(() => {
    if (!itemRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      {
        rootMargin: '200px', // Commencer à précharger 200px avant
        threshold: 0.01,
      }
    );

    observer.observe(itemRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!id) {
      setImageLoading(false);
      return;
    }
    
    const fetchMainImage = async () => {
      try {
        // @ts-ignore - Supabase types can be too complex
        const { data } = await supabase
          .from('business_photos')
          .select('photo_url')
          .eq('business_id', id)
          .order('display_order', { ascending: true })
          .limit(1);
        
        if (data && data[0]?.photo_url) {
          setMainImageUrl(data[0].photo_url as string);
        }
      } catch (error) {
        console.error('Error fetching image:', error);
      } finally {
        setImageLoading(false);
      }
    };
    
    fetchMainImage();
  }, [id]);
  
  const displayRevenue = revenue || (annual_revenue ? `${annual_revenue.toLocaleString('fr-CA', { useGrouping: true }).replace(/\$/g, '')} $` : 'N/A');
  const displayPrice = price || formatPrice(asking_price, asking_price_max);
  const displayProfit = profit || (profit_margin ? `${profit_margin} %` : 'N/A');
  const displayBaiia = baiia ? `${baiia.toLocaleString('fr-CA', { useGrouping: true }).replace(/\$/g, '')} $` : 'N/D';

  // Déterminer le type d'annonce
  const getBusinessType = () => {
    // Si property_type est défini, c'est un immeuble
    if (property_type) {
      return { label: 'Immobilier', icon: Home, color: 'bg-emerald-500' };
    }
    if (sale_type === 'property') {
      return { label: 'Immobilier', icon: Home, color: 'bg-emerald-500' };
    }
    if (is_franchise) {
      return { label: 'Franchise', icon: TrendingUp, color: 'bg-[#FF6B00]' };
    }
    return { label: 'Entreprise', icon: Store, color: 'bg-blue-500' };
  };

  const businessType = getBusinessType();

  const handleClick = () => {
    if (slug && status !== 'sold') {
      navigate(`/entreprise/${slug}`);
    }
  };

  return (
    <div 
      ref={itemRef}
      className={`group relative flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-card border border-border rounded-xl transition-all duration-300 ${
        status !== 'sold' ? 'hover:shadow-[var(--shadow-hover)] cursor-pointer' : 'cursor-default'
      } overflow-hidden ${
        featured ? 'ring-2 ring-amber-500/30' : ''
      }`}
      onClick={handleClick}
      data-business-id={id}
    >
      {/* Sold Diagonal Banner */}
      {status === 'sold' && (
        <>
          {/* Semi-transparent overlay - derrière tout */}
          <div className="absolute inset-0 z-[8] bg-background/60 pointer-events-none" />
          
          {/* Banderole VENDU - au-dessus de tout, sans flou */}
          <div className="absolute inset-0 z-20 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-[50%] left-[-25%] w-[150%] h-12 md:h-16 bg-gradient-to-r from-primary via-primary-dark to-primary transform -translate-y-1/2 rotate-[-45deg] shadow-2xl flex items-center justify-center">
                <span className="text-white text-2xl md:text-3xl font-display font-bold uppercase tracking-[0.3em] drop-shadow-lg">
                  VENDU
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Image - pleine largeur sur mobile, à gauche sur desktop */}
      <div className="relative w-full sm:w-28 md:w-32 h-40 sm:h-28 md:h-32 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
        {imageLoading ? (
          <Skeleton className="w-full h-full" />
        ) : mainImageUrl ? (
          <OptimizedImage
            src={mainImageUrl}
            alt={title}
            className="w-full h-full object-contain bg-muted"
            objectFit="contain"
            width={400}
            quality={70}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <ImageIcon className="w-8 h-8 text-muted-foreground/40 mb-1" />
            <p className="text-xs text-muted-foreground">Voir photos</p>
          </div>
        )}
      </div>

      {/* Content container - full width sur mobile */}
      <div className="flex-1 min-w-0 flex flex-col gap-3 sm:gap-2">
        {/* Badges & Title */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Badge En Vedette en premier */}
            {featured && (
              <Badge className="relative bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-amber-950 border-2 border-amber-300/50 shadow-[0_0_20px_rgba(251,191,36,0.5)] font-bold tracking-wide text-[10px] sm:text-xs animate-pulse">
                <Star className="w-2.5 sm:w-3 h-2.5 sm:h-3 fill-amber-950 mr-1 drop-shadow-sm" />
                EN VEDETTE
              </Badge>
            )}
            
            {/* Badge Type d'annonce */}
            <Badge className={`${businessType.color} text-white border-0 shadow-md text-[10px] sm:text-xs`}>
              <businessType.icon className="w-2.5 sm:w-3 h-2.5 sm:h-3 mr-1" />
              {businessType.label}
            </Badge>
            
            {/* Badge Démo */}
            {is_demo && (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div onClick={(e) => e.stopPropagation()}>
                      <Badge className="bg-purple-500 text-white border-0 shadow-md cursor-help text-[10px] sm:text-xs hover:bg-purple-600 transition-colors">
                        <HelpCircle className="w-2.5 sm:w-3 h-2.5 sm:h-3 mr-1" />
                        Annonce fictive
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs bg-popover border-border">
                    <p className="font-semibold mb-2 text-foreground">Annonce fictive</p>
                    <p className="text-sm mb-2 text-muted-foreground">Cette annonce est à titre démonstratif en attendant le lancement officiel du site.</p>
                    <p className="text-sm font-medium text-foreground">Il est déjà possible de soumettre votre annonce pour le grand lancement prévu le 1er décembre 2025!</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-foreground group-hover:text-accent transition-colors line-clamp-2">
              {title}
            </h3>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <MapPin className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0" />
              <span className="truncate font-medium">
                {city || location}
                {region && <span className="text-muted-foreground/70">, {region}</span>}
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-1">
            {stripHtml(description)}
          </p>
        </div>

        {/* Stats - visible sur toutes les tailles */}
        <div className={`flex items-center gap-3 sm:gap-6 flex-wrap ${status === 'sold' ? 'blur-sm' : ''}`}>
          {!is_franchise && (
            <>
              <div className="flex-1 min-w-[100px]">
                <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Chiffre d'affaires</p>
                <p className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-accent" />
                  {displayRevenue}
                </p>
              </div>
              <div className="flex-1 min-w-[80px]">
                <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-0.5">BAIIA</p>
                <p className="text-xs sm:text-sm font-semibold text-accent">{displayBaiia}</p>
              </div>
            </>
          )}
          {is_franchise && (
            <div className="flex-1">
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-0.5">Type</p>
              <p className="text-xs sm:text-sm font-semibold text-foreground">Opportunité Franchise</p>
            </div>
          )}
        </div>
      </div>

      {/* Price & Actions - sticky sur mobile en bas */}
      <div className="flex sm:flex-col items-center justify-between sm:justify-start gap-3 sm:gap-2 border-t sm:border-t-0 sm:border-l border-border pt-3 sm:pt-0 sm:pl-4">
        <div className={`text-left sm:text-right ${status === 'sold' ? 'blur-sm' : ''}`}>
          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-0.5 sm:mb-1">Prix demandé</p>
          <p className="text-lg sm:text-xl font-bold text-primary whitespace-nowrap">
            {displayPrice}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {id && (
            <FavoriteButton businessId={id} userId={userId} />
          )}
          {status !== 'sold' && (
            <Button 
              size="sm"
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-md text-xs sm:text-sm px-3 sm:px-4"
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              Voir
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessListItem;
