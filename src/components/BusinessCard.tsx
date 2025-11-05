import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, MapPin, Star, XCircle, Building2, Home, Store, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FavoriteButton } from "./FavoriteButton";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BusinessCardProps {
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
  approval_status?: string;
  is_franchise?: boolean;
  sale_type?: 'assets' | 'shares' | 'both' | 'property';
  has_pending_changes?: boolean;
  onWithdraw?: () => void;
  onFeature?: () => void;
  showActions?: boolean;
  showPendingBadge?: boolean;
  property_type?: string;
  year_built?: number;
  square_footage?: number;
  is_rental_property?: boolean;
  rental_units?: Array<{unit_type: string, monthly_rent: number, count: number}>;
  is_demo?: boolean;
}

const BusinessCard = ({
  id,
  slug,
  title,
  city,
  region,
  annual_revenue,
  asking_price,
  baiia,
  description,
  featured = false,
  status,
  approval_status,
  is_franchise = false,
  sale_type,
  has_pending_changes = false,
  onWithdraw,
  onFeature,
  showActions = false,
  showPendingBadge = false,
  property_type,
  year_built,
  square_footage,
  is_rental_property,
  rental_units,
  is_demo = false,
}: BusinessCardProps) => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const [showFullDescription, setShowFullDescription] = useState(false);
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
          console.error('[BUSINESS-CARD] Error fetching photo:', error);
          setMainImage(null);
        } else if (data && data.length > 0 && data[0]?.photo_url) {
          setMainImage(data[0].photo_url);
        } else {
          setMainImage(null);
        }
      }
    };
    
    fetchMainImage();
    
    // Subscribe to changes in business_photos for this business
    // Only update when photos are actually changed (INSERT/UPDATE/DELETE)
    if (id) {
      const channel = supabase
        .channel(`business_photos_card_${id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'business_photos',
            filter: `business_id=eq.${id}`
          },
          () => {
            console.log('[REALTIME-CARD] Photos changed for business, refreshing image...');
            fetchMainImage();
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [id]);
  
  const displayRevenue = annual_revenue ? `${annual_revenue.toLocaleString('fr-CA')} $` : 'N/A';
  const displayPrice = asking_price === 0 ? 'À discuter' : asking_price ? `${asking_price.toLocaleString('fr-CA')} $` : 'N/A';
  const displayBaiia = baiia ? `${baiia.toLocaleString('fr-CA')} $` : 'N/D';

  // Déterminer le type d'annonce - check sale_type, property_type, and keywords
  const getBusinessType = () => {
    // Si property_type est défini, c'est définitivement un immeuble
    if (property_type) {
      return { label: 'Immobilier', icon: Home, color: 'bg-emerald-500' };
    }
    
    // Vérifier sale_type
    if (sale_type === 'property') {
      return { label: 'Immobilier', icon: Home, color: 'bg-emerald-500' };
    }
    
    // Vérifier si c'est une franchise
    if (is_franchise) {
      return { label: 'Franchise', icon: TrendingUp, color: 'bg-[#FF6B00]' };
    }
    
    // Par défaut, c'est une entreprise
    return { label: 'Entreprise', icon: Store, color: 'bg-blue-500' };
  };

  const businessType = getBusinessType();

  const handleClick = () => {
    if (slug && status !== 'sold') {
      navigate(`/entreprise/${slug}`);
    }
  };

  return (
    <Card 
      className={`group relative overflow-hidden card-premium border-border/50 h-full flex flex-col ${
        status !== 'sold' ? 'hover:shadow-premium cursor-pointer' : 'cursor-default'
      } ${featured ? 'ring-2 ring-accent/30' : ''}`}
      onClick={handleClick}
    >
      {/* Image principale */}
      <div className="relative w-full h-48 overflow-hidden bg-muted">
        {mainImage ? (
          <img 
            src={mainImage} 
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <p className="text-2xl font-bold text-foreground mb-2">vente.club</p>
            <p className="text-sm text-muted-foreground">Aucune photo disponible</p>
          </div>
        )}
      </div>

      {/* Sold Diagonal Banner */}
      {status === 'sold' && (
        <>
          {/* Semi-transparent overlay - derrière tout */}
          <div className="absolute inset-0 z-[8] bg-background/60 pointer-events-none" />
          
          {/* Banderole VENDU - au-dessus de tout, sans flou */}
          <div className="absolute inset-0 z-20 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-[50%] left-[-25%] w-[150%] h-16 bg-gradient-to-r from-primary via-primary-dark to-primary transform -translate-y-1/2 rotate-[-45deg] shadow-2xl flex items-center justify-center">
                <span className="text-white text-3xl font-display font-bold uppercase tracking-[0.3em] drop-shadow-lg">
                  VENDU
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      <CardContent className="p-6 space-y-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Badge En Vedette en premier */}
              {featured && (
                <Badge className="relative bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-amber-950 border-2 border-amber-300/50 shadow-[0_0_20px_rgba(251,191,36,0.5)] font-bold tracking-wide">
                  <Star className="w-3 h-3 fill-amber-950 mr-1 drop-shadow-sm" />
                  EN VEDETTE
                </Badge>
              )}
              
              {/* Badge Type d'annonce */}
              <Badge className={`${businessType.color} text-white border-0 shadow-md`}>
                <businessType.icon className="w-3 h-3 mr-1" />
                {businessType.label}
              </Badge>
              
              {/* Badge Démo */}
              {is_demo && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge className="bg-purple-500 text-white border-0 shadow-md cursor-help">
                        <HelpCircle className="w-3 h-3 mr-1" />
                        DÉMO
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="font-semibold mb-2">Annonce fictive</p>
                      <p className="text-sm mb-2">Cette annonce est à titre démonstratif en attendant le lancement officiel du site.</p>
                      <p className="text-sm font-medium">Il est déjà possible de soumettre votre annonce pour le grand lancement prévu le 1er décembre 2025!</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {has_pending_changes && showPendingBadge && (
                <Badge className="bg-orange-500 text-white">
                  ✏️ Modification en attente d'approbation
                </Badge>
              )}
              {showActions && approval_status === 'approved' && (
                <Badge className="bg-green-500 text-white">✓ Approuvée</Badge>
              )}
              {showActions && approval_status === 'pending' && (
                <Badge className="bg-orange-500 text-white">⏳ En attente</Badge>
              )}
            </div>
            <h3 className={`text-lg sm:text-2xl font-display font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 ${status === 'sold' ? 'blur-[0.5px]' : ''}`}>
              {title}
            </h3>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="font-medium">
                {city}{region && `, ${region}`}
              </span>
            </div>
          </div>
          {id && status !== 'sold' && <FavoriteButton businessId={id} userId={userId} />}
        </div>

        <div>
          <p className={`text-muted-foreground leading-relaxed ${status === 'sold' ? 'blur-[1px]' : ''} ${showFullDescription ? '' : 'line-clamp-3'}`}>
            {description}
          </p>
          {description.length > 150 && status !== 'sold' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowFullDescription(!showFullDescription);
              }}
              className="text-sm text-primary hover:text-primary/80 font-medium mt-2 transition-colors"
            >
              {showFullDescription ? 'Voir moins' : 'Voir plus'}
            </button>
          )}
        </div>

        <div className="flex-1" />

        <div className={`grid grid-cols-2 gap-4 pt-4 border-t border-border/50 ${status === 'sold' ? 'blur-[8px]' : ''}`}>
          {/* Check if it's a property listing */}
          {(sale_type === 'property' || property_type) && (
            <>
              {year_built && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Année construction</p>
                  <p className="text-lg font-bold text-foreground">{year_built}</p>
                </div>
              )}
              {square_footage && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Superficie</p>
                  <p className="text-lg font-bold text-secondary">{square_footage.toLocaleString('fr-CA')} pi²</p>
                </div>
              )}
              {property_type && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Type</p>
                  <p className="text-sm font-bold text-foreground">
                    {property_type === 'bureau' && 'Bureau commercial'}
                    {property_type === 'commerce' && 'Espace commercial'}
                    {property_type === 'industriel' && 'Bâtiment industriel'}
                    {property_type === 'terrain' && 'Terrain commercial'}
                    {property_type === 'immeuble_logement' && 'Immeuble à logement'}
                    {property_type === 'mixte' && 'Propriété mixte'}
                    {property_type === 'autre' && 'Autre'}
                  </p>
                </div>
              )}
              {is_rental_property && rental_units && rental_units.length > 0 && (
                <div className="col-span-2 space-y-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Unités locatives</p>
                  <div className="space-y-1">
                    {rental_units.map((unit, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm bg-muted/50 px-3 py-2 rounded-lg">
                        <span className="font-semibold">{unit.count}x {unit.unit_type}</span>
                        {unit.monthly_rent && (
                          <span className="text-muted-foreground">{unit.monthly_rent.toLocaleString('fr-CA')} $/mois</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          {/* Regular business listing */}
          {!sale_type && !property_type && !is_franchise && (
            <>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Revenus</p>
                <p className="text-lg font-bold text-foreground flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-accent" />
                  {displayRevenue}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">BAIIA</p>
                <p className="text-lg font-bold text-secondary">{displayBaiia}</p>
              </div>
            </>
          )}
          {is_franchise && (
            <>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Type</p>
                <p className="text-lg font-bold text-foreground">Opportunité Franchise</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Droit d'entrée</p>
                <p className="text-lg font-bold text-[#FF6B00]">{displayPrice}</p>
              </div>
            </>
          )}
        </div>

        <div className={`flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 pt-4 border-t border-border/50 ${status === 'sold' ? 'blur-[8px]' : ''}`}>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Prix demandé</p>
            <p className="text-2xl sm:text-3xl font-display font-bold text-primary">{displayPrice}</p>
          </div>
          {status !== 'sold' && (
            <Button 
              size="lg"
              className="btn-premium bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-soft w-full sm:w-auto"
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
            >
              Voir l'annonce
            </Button>
          )}
        </div>

        {showActions && (
          <div className="flex gap-2 pt-3 border-t border-border/50">
            {status !== 'sold' && approval_status === 'approved' && onWithdraw && (
              <Button onClick={(e) => { e.stopPropagation(); onWithdraw(); }} size="sm" variant="destructive" className="flex-1">
                <XCircle className="mr-1 h-3 w-3" />
                Retirer
              </Button>
            )}
            {!featured && approval_status === 'approved' && status !== 'sold' && onFeature && (
              <Button onClick={(e) => { e.stopPropagation(); onFeature(); }} size="sm" variant="secondary" className="flex-1">
                <Star className="mr-1 h-3 w-3" />
                Mettre en avant
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BusinessCard;
