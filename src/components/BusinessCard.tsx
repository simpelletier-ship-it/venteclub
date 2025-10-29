import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, MapPin, DollarSign, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FavoriteButton } from "./FavoriteButton";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BusinessCardProps {
  id?: string;
  title: string;
  industry: string;
  location: string;
  revenue?: string;
  annual_revenue?: number;
  price?: string;
  asking_price?: number;
  profit?: string;
  profit_margin?: number;
  description: string;
  featured?: boolean;
}

const BusinessCard = ({
  id,
  title,
  industry,
  location,
  revenue,
  annual_revenue,
  price,
  asking_price,
  profit,
  profit_margin,
  description,
  featured = false,
}: BusinessCardProps) => {
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

  const handleClick = () => {
    if (id) {
      navigate(`/business/${id}`);
    }
  };

  return (
    <Card 
      className={`group relative overflow-hidden bg-card border-border transition-all duration-500 hover:shadow-[var(--shadow-hover)] ${
        featured ? 'ring-2 ring-amber-500/30' : ''
      }`}
      onClick={handleClick}
    >
      {/* Content Section */}
      <div className="p-4 space-y-3">
        {/* Title & Location with Favorite */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-2 flex-1">
            {featured && (
              <Badge className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white border-0 shadow-md text-xs">
                <Star className="w-3 h-3 fill-white mr-1" />
                En Vedette
              </Badge>
            )}
            <h3 className="text-xl font-bold text-foreground group-hover:text-accent transition-colors line-clamp-1">
              {title}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="line-clamp-1">{location}</span>
            </div>
          </div>
          {id && (
            <div className="pt-1">
              <FavoriteButton businessId={id} userId={userId} />
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {description}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Chiffre d'affaires</p>
            <p className="text-sm font-semibold text-foreground flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-accent" />
              {displayRevenue}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Bénéfice</p>
            <p className="text-sm font-semibold text-accent">{displayProfit}</p>
          </div>
        </div>

        {/* Price & CTA */}
        <div className="flex items-end justify-between pt-4 border-t border-border/50">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Prix demandé</p>
            <p className="text-2xl font-bold text-primary">
              {displayPrice}
            </p>
          </div>
          <Button 
            size="sm"
            className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-6 shadow-md"
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
          >
            Voir l'annonce
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default BusinessCard;
