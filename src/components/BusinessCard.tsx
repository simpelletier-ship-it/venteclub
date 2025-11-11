import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TrendingUp, MapPin, Star, XCircle, Building2, Home, Store, HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FavoriteButton } from "./FavoriteButton";
import { OptimizedImage } from "./OptimizedImage";
import { AnimatedBadge } from "./AnimatedBadge";
import { AnimatedNumber } from "./AnimatedNumber";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePreloadBusinessImages } from "@/hooks/useVisibleBusinesses";

import { formatPrice } from "@/lib/priceFormatter";
import { stripHtml } from "@/lib/htmlUtils";

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
  asking_price_max?: number;
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
  updated_by_admin?: boolean;
  admin_updated_at?: string;
}

const BusinessCard = ({
  id,
  slug,
  title,
  city,
  region,
  annual_revenue,
  asking_price,
  asking_price_max,
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
  updated_by_admin = false,
  admin_updated_at,
}: BusinessCardProps) => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [mainImageUrl, setMainImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Précharger l'image quand la carte devient visible
  const isPreloaded = usePreloadBusinessImages(id || '', mainImageUrl, isVisible);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id);
    });
  }, []);

  // Intersection Observer pour détecter la visibilité
  useEffect(() => {
    if (!cardRef.current) return;

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

    observer.observe(cardRef.current);

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

  
  const displayRevenue = annual_revenue ? `${annual_revenue.toLocaleString('fr-CA')} $` : 'N/A';
  const displayPrice = formatPrice(asking_price, asking_price_max);
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
    return { label: 'Entreprise', icon: Store, color: 'bg-primary' };
  };

  const businessType = getBusinessType();

  const handleClick = () => {
    if (slug && status !== 'sold') {
      navigate(`/entreprise/${slug}`);
    }
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -8, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="h-full"
      data-business-id={id}
    >
      <Card
        className={`group relative overflow-hidden card-premium border-border/50 h-full flex flex-col transition-all duration-500 ${
          status !== 'sold' ? 'hover:shadow-premium hover:border-primary/50 hover:shadow-primary/20 cursor-pointer' : 'cursor-default'
        } ${featured ? 'ring-2 ring-primary/40 shadow-lg shadow-primary/20' : ''}`}
        onClick={handleClick}
      >
        {/* Enhanced gradient overlay on hover */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none z-[1]" 
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Image principale seulement */}
        <div className="relative w-full h-56 sm:h-64 overflow-hidden bg-muted">
          {!imageLoading && mainImageUrl ? (
            <OptimizedImage
              src={mainImageUrl}
              alt={title}
              className="w-full h-full object-cover"
              objectFit="cover"
              width={600}
              quality={75}
            />
          ) : null}
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

      <CardContent className="p-4 sm:p-5 space-y-2 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Badge En Vedette en premier */}
              {featured && (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div onClick={(e) => e.stopPropagation()}>
                        <AnimatedBadge className="relative bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-amber-950 border-2 border-amber-300/50 shadow-[0_0_20px_rgba(251,191,36,0.5)] cursor-help animate-pulse-glow" pulse glow>
                          <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            <Star className="w-4 h-4 fill-amber-950 drop-shadow-sm" />
                          </motion.div>
                        </AnimatedBadge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-popover border-border">
                      <p className="font-semibold text-foreground">Annonce mise de l'avant</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {/* Badge Type d'annonce */}
              <AnimatedBadge className={`${businessType.color} text-white border-0 shadow-md`}>
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className="flex items-center"
                >
                  <businessType.icon className="w-3 h-3 mr-1" />
                </motion.div>
                {businessType.label}
              </AnimatedBadge>

              {/* Badge Modifié par admin */}
              {updated_by_admin && (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-xs border-blue-500/50 bg-blue-500/10 text-blue-600">
                        ✓ Vérifié
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-popover border-border">
                      <p className="text-sm">
                        Annonce vérifiée et mise à jour par notre équipe
                        {admin_updated_at && (
                          <span className="block text-xs text-muted-foreground mt-1">
                            Le {new Date(admin_updated_at).toLocaleDateString('fr-CA')}
                          </span>
                        )}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {/* Badge Démo */}
              {is_demo && (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div onClick={(e) => e.stopPropagation()}>
                        <Badge className="bg-purple-500 text-white border-0 shadow-md cursor-help hover:bg-purple-600 transition-colors">
                          <HelpCircle className="w-3 h-3 mr-1" />
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
            <motion.h3 
              className={`text-xl sm:text-2xl font-display font-bold text-foreground transition-colors line-clamp-2 leading-tight ${status === 'sold' ? 'blur-[0.5px]' : ''}`}
              initial={{ x: 0 }}
              whileHover={{ x: 3 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <motion.span 
                className="relative group-hover:text-primary transition-colors duration-300"
                whileHover={{ scale: 1.02 }}
              >
                {title}
              </motion.span>
            </motion.h3>
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
              <MapPin className="w-3.5 h-3.5" />
              <span className="font-semibold">
                {city}{region && `, ${region}`}
              </span>
            </div>
          </div>
          {id && status !== 'sold' && <FavoriteButton businessId={id} userId={userId} />}
        </div>

        <div>
          <p className={`text-muted-foreground text-sm leading-relaxed ${status === 'sold' ? 'blur-[1px]' : ''} ${showFullDescription ? '' : 'line-clamp-2'}`}>
            {stripHtml(description)}
          </p>
          {stripHtml(description).length > 120 && status !== 'sold' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowFullDescription(!showFullDescription);
              }}
              className="text-xs text-primary hover:text-primary/80 font-semibold transition-colors"
            >
              {showFullDescription ? 'Voir moins' : 'Voir plus'}
            </button>
          )}
        </div>

        <div className="flex-1 min-h-0" />

        <div className={`grid grid-cols-2 gap-2.5 pt-2 border-t border-border/50 ${status === 'sold' ? 'blur-[8px]' : ''}`}>
          {/* Check if it's a property listing */}
          {(sale_type === 'property' || property_type) && (
            <>
              {year_built && (
                <div className="bg-muted/30 p-2.5 rounded-lg border border-border/30">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-0.5">Année</p>
                  <p className="text-base font-bold text-foreground">{year_built}</p>
                </div>
              )}
              {square_footage && (
                <div className="bg-muted/30 p-2.5 rounded-lg border border-border/30">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-0.5">Superficie</p>
                  <p className="text-base font-bold text-secondary">{square_footage.toLocaleString('fr-CA')} pi²</p>
                </div>
              )}
              {property_type && (
                <div className="col-span-2 bg-muted/30 p-2.5 rounded-lg border border-border/30">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-0.5">Type de propriété</p>
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
              <div className="bg-muted/30 p-2.5 rounded-lg border border-border/30">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-0.5">Revenus</p>
                <p className="text-base font-bold text-[hsl(var(--success))] flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-[hsl(var(--success-light))]" />
                  {displayRevenue}
                </p>
              </div>
              <div className="bg-muted/30 p-2.5 rounded-lg border border-border/30">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-0.5">BAIIA</p>
                <p className="text-base font-bold text-[hsl(var(--primary-pale-foreground))]">{displayBaiia}</p>
              </div>
            </>
          )}
          {is_franchise && (
            <>
              <div className="col-span-2 bg-muted/30 p-2.5 rounded-lg border border-border/30">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-0.5">Type</p>
                <p className="text-base font-bold text-foreground">Opportunité Franchise</p>
              </div>
              <div className="col-span-2 bg-muted/30 p-2.5 rounded-lg border border-border/30">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-0.5">Droit d'entrée</p>
                <p className="text-base font-bold text-[#FF6B00]">{displayPrice}</p>
              </div>
            </>
          )}
        </div>

        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pt-2 border-t border-border/50 ${status === 'sold' ? 'blur-[8px]' : ''}`}>
          <div className="bg-gradient-to-br from-secondary/10 via-secondary/5 to-transparent p-3 rounded-lg border border-secondary/20 flex-1 w-full sm:w-auto">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">Prix demandé</p>
            <p className="text-2xl sm:text-3xl font-display font-bold text-[hsl(var(--secondary))] leading-none">{displayPrice}</p>
          </div>
          {status !== 'sold' && (
            <Button 
              size="lg"
              className="btn-premium bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary))]/90 text-secondary-foreground font-semibold shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto px-6"
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
    </motion.div>
  );
};

export default BusinessCard;
