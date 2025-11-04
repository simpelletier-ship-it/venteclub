import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, MapPin, Star, Home, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FavoriteButton } from "./FavoriteButton";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  profit?: string;
  profit_margin?: number;
  baiia?: number;
  description: string;
  featured?: boolean;
  status?: string;
  is_franchise?: boolean;
  sale_type?: 'assets' | 'shares' | 'both' | 'property';
  property_type?: string;
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
  profit,
  profit_margin,
  baiia,
  description,
  featured = false,
  status,
  is_franchise = false,
  sale_type,
  property_type,
}: BusinessListItemProps) => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const [mainImage, setMainImage] = useState<string | null>(null);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id);
    });
  }, []);

  useEffect(() => {
    const fetchMainImage = async () => {
      if (id) {
        const { data, error } = await supabase
          .from('business_photos')
          .select('photo_url')
          .eq('business_id', id)
          .order('display_order', { ascending: true })
          .limit(1);
        
        if (error) {
          console.error('[BUSINESS-LIST] Error fetching photo:', error);
          setMainImage(null);
        } else if (data && data.length > 0 && data[0]?.photo_url) {
          setMainImage(data[0].photo_url);
        } else {
          setMainImage(null);
        }
      }
    };
    
    fetchMainImage();
    
    // Subscribe to photo changes
    if (id) {
      const channel = supabase
        .channel(`business_photos_list_${id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'business_photos',
            filter: `business_id=eq.${id}`
          },
          () => {
            console.log('[REALTIME-LIST] Photos changed, refreshing...');
            fetchMainImage();
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [id]);
  
  const displayRevenue = revenue || (annual_revenue ? `${annual_revenue.toLocaleString('fr-CA', { useGrouping: true }).replace(/\$/g, '')} $` : 'N/A');
  const displayPrice = price || (asking_price === 0 ? 'À discuter' : asking_price ? `${asking_price.toLocaleString('fr-CA', { useGrouping: true }).replace(/\$/g, '')} $` : 'N/A');
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
      className={`group relative flex items-center gap-4 p-4 bg-card border border-border rounded-xl transition-all duration-300 ${
        status !== 'sold' ? 'hover:shadow-[var(--shadow-hover)] cursor-pointer' : 'cursor-default'
      } overflow-hidden ${
        featured ? 'ring-2 ring-amber-500/30' : ''
      }`}
      onClick={handleClick}
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

      {/* Image à gauche */}
      <div className="relative w-32 h-32 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
        {mainImage ? (
          <img 
            src={mainImage} 
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <p className="text-xs font-bold text-foreground">vente.club</p>
            <p className="text-[10px] text-muted-foreground">Aucune photo</p>
          </div>
        )}
      </div>

      {/* Left section - Badges & Title */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Badge En Vedette en premier */}
          {featured && (
            <Badge className="relative bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-amber-950 border-2 border-amber-300/50 shadow-[0_0_20px_rgba(251,191,36,0.5)] font-bold tracking-wide text-xs animate-pulse">
              <Star className="w-3 h-3 fill-amber-950 mr-1 drop-shadow-sm" />
              EN VEDETTE
            </Badge>
          )}
          
          {/* Badge Type d'annonce */}
          <Badge className={`${businessType.color} text-white border-0 shadow-md text-xs`}>
            <businessType.icon className="w-3 h-3 mr-1" />
            {businessType.label}
          </Badge>
        </div>
        
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-foreground group-hover:text-accent transition-colors line-clamp-2">
            {title}
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate font-medium">
              {city || location}
              {region && <span className="text-muted-foreground/70">, {region}</span>}
            </span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-1">
          {description}
        </p>
      </div>

      {/* Middle section - Stats */}
      <div className={`hidden md:flex items-center gap-6 ${status === 'sold' ? 'blur-sm' : ''}`}>
        {!is_franchise && (
          <>
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Chiffre d'affaires</p>
              <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-accent" />
                {displayRevenue}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">BAIIA</p>
              <p className="text-sm font-semibold text-accent">{displayBaiia}</p>
            </div>
          </>
        )}
        {is_franchise && (
          <div className="text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Type</p>
            <p className="text-sm font-semibold text-foreground">Opportunité Franchise</p>
          </div>
        )}
      </div>

      {/* Right section - Price & Actions */}
      <div className="flex items-center gap-4">
        <div className={`text-right ${status === 'sold' ? 'blur-sm' : ''}`}>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Prix demandé</p>
          <p className="text-xl font-bold text-primary whitespace-nowrap">
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
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-md"
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
