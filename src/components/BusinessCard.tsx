import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, MapPin, Star, XCircle, Building2, Home, Store } from "lucide-react";
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
}: BusinessCardProps) => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id);
    });
  }, []);
  
  const displayRevenue = annual_revenue ? `${annual_revenue.toLocaleString('fr-CA')} $` : 'N/A';
  const displayPrice = asking_price === 0 ? 'À discuter' : asking_price ? `${asking_price.toLocaleString('fr-CA')} $` : 'N/A';
  const displayBaiia = baiia ? `${baiia.toLocaleString('fr-CA')} $` : 'N/D';

  // Déterminer le type d'annonce - check both sale_type and industry for property detection
  const getBusinessType = () => {
    const propertyIndustries = ['Immobilier', 'Construction', 'Location immobilière'];
    const isProperty = sale_type === 'property' || 
                      propertyIndustries.some(ind => title.toLowerCase().includes('immeuble') || 
                      title.toLowerCase().includes('propriété') ||
                      description?.toLowerCase().includes('immeuble') ||
                      description?.toLowerCase().includes('propriété'));
    
    if (isProperty) {
      return { label: 'Immobilier', icon: Home, color: 'bg-emerald-500' };
    }
    if (is_franchise) {
      return { label: 'Franchise', icon: TrendingUp, color: 'bg-purple-500' };
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
    <Card 
      className={`group relative overflow-hidden card-premium border-border/50 h-full flex flex-col ${
        status !== 'sold' ? 'hover:shadow-premium cursor-pointer' : 'cursor-default'
      } ${featured ? 'ring-2 ring-accent/30' : ''}`}
      onClick={handleClick}
    >
      {/* Sold Overlay - Modern Design */}
      {status === 'sold' && (
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-background/80 via-background/85 to-background/80">
          <div className="absolute top-8 right-8 px-6 py-3 bg-gradient-to-r from-primary to-primary-dark rounded-xl shadow-premium">
            <p className="text-xl font-display font-bold text-white uppercase tracking-wider">VENDU</p>
          </div>
        </div>
      )}

      <CardContent className="p-6 space-y-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Badge Type d'annonce */}
              <Badge className={`${businessType.color} text-white border-0 shadow-md`}>
                <businessType.icon className="w-3 h-3 mr-1" />
                {businessType.label}
              </Badge>
              
              {featured && (
                <Badge className="relative bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-amber-950 border-2 border-amber-300/50 shadow-[0_0_20px_rgba(251,191,36,0.5)] font-bold tracking-wide animate-pulse">
                  <Star className="w-3 h-3 fill-amber-950 mr-1 drop-shadow-sm" />
                  EN VEDETTE
                </Badge>
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
            <h3 className={`text-2xl font-display font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 ${status === 'sold' ? 'blur-[0.5px]' : ''}`}>
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
                <p className="text-lg font-bold text-secondary">{displayPrice}</p>
              </div>
            </>
          )}
        </div>

        <div className={`flex items-end justify-between pt-4 border-t border-border/50 ${status === 'sold' ? 'blur-[8px]' : ''}`}>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Prix demandé</p>
            <p className="text-3xl font-display font-bold text-primary">{displayPrice}</p>
          </div>
          {status !== 'sold' && (
            <Button 
              size="lg"
              className="btn-premium bg-accent hover:bg-accent/90 text-accent-foreground font-semibold shadow-soft"
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
