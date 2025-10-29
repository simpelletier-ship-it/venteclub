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
  
  const displayRevenue = revenue || (annual_revenue ? `${annual_revenue.toLocaleString()} CAD` : 'N/A');
  const displayPrice = price || (asking_price ? `${asking_price.toLocaleString()} CAD` : 'N/A');
  const displayProfit = profit || (profit_margin ? `${profit_margin}%` : 'N/A');

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
      {/* Featured Badge */}
      {featured && (
        <div className="absolute top-0 left-0 right-0 z-10 flex justify-center -mt-3">
          <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-white px-6 py-2 rounded-full shadow-lg flex items-center gap-2 border-2 border-amber-300">
            <Star className="w-4 h-4 fill-white" />
            <span className="text-xs font-bold tracking-wider uppercase">En Vedette</span>
          </div>
        </div>
      )}

      {/* Image Section */}
      <div className="relative h-48 bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-muted-foreground/20 text-6xl font-bold">
            {title.charAt(0).toUpperCase()}
          </div>
        </div>
        
        {/* Favorite Button */}
        {id && (
          <div className="absolute top-3 right-3 z-20">
            <FavoriteButton businessId={id} userId={userId} />
          </div>
        )}

        {/* Industry Badge */}
        <div className="absolute bottom-3 left-3">
          <Badge variant="secondary" className="text-xs font-semibold px-3 py-1 backdrop-blur-sm bg-background/90 border border-border/50">
            {industry}
          </Badge>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 space-y-4">
        {/* Title & Location */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-foreground group-hover:text-accent transition-colors line-clamp-1">
            {title}
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="line-clamp-1">{location}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {description}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Revenus</p>
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
            <p className="text-2xl font-bold text-primary flex items-center gap-1">
              <DollarSign className="w-6 h-6" />
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
