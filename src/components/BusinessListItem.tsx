import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, MapPin, Star } from "lucide-react";
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
}: BusinessListItemProps) => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id);
    });
  }, []);
  
  const displayRevenue = revenue || (annual_revenue ? `${annual_revenue.toLocaleString('fr-CA', { useGrouping: true }).replace(/\$/g, '')} $` : 'N/A');
  const displayPrice = price || (asking_price ? `${asking_price.toLocaleString('fr-CA', { useGrouping: true }).replace(/\$/g, '')} $` : 'N/A');
  const displayProfit = profit || (profit_margin ? `${profit_margin} %` : 'N/A');
  const displayBaiia = baiia ? `${baiia.toLocaleString('fr-CA', { useGrouping: true }).replace(/\$/g, '')} $` : 'N/D';

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
      {/* Sold Overlay */}
      {status === 'sold' && (
        <div className="absolute inset-0 z-[5] bg-background/30 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-30deg] w-[160%] md:w-[120%]">
            <div className="bg-purple-600 text-white py-4 md:py-6 shadow-2xl">
              <p className="text-2xl md:text-4xl font-bold text-center tracking-[0.4em] uppercase">
                VENDU
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Left section - Badges & Title */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          {featured && (
            <Badge className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white border-0 shadow-md text-xs">
              <Star className="w-3 h-3 fill-white mr-1" />
              En Vedette
            </Badge>
          )}
          {is_franchise && (
            <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-md text-xs">
              🏢 Franchise
            </Badge>
          )}
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
