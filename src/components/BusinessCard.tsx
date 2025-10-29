import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, MapPin, Star, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FavoriteButton } from "./FavoriteButton";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BusinessCardProps {
  id?: string;
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
  onWithdraw?: () => void;
  onFeature?: () => void;
  showActions?: boolean;
}

const BusinessCard = ({
  id,
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
  onWithdraw,
  onFeature,
  showActions = false,
}: BusinessCardProps) => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id);
    });
  }, []);
  
  const displayRevenue = annual_revenue ? `${annual_revenue.toLocaleString('fr-CA')} $` : 'N/A';
  const displayPrice = asking_price ? `${asking_price.toLocaleString('fr-CA')} $` : 'N/A';
  const displayBaiia = baiia ? `${baiia.toLocaleString('fr-CA')} $` : 'N/D';

  const handleClick = () => {
    if (id && status !== 'sold') {
      navigate(`/business/${id}`);
    }
  };

  return (
    <Card 
      className={`group relative overflow-hidden card-premium border-border/50 ${
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

      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {featured && (
                <Badge className="bg-gradient-to-r from-accent to-accent/80 text-accent-foreground border-0 shadow-md">
                  <Star className="w-3 h-3 fill-current mr-1" />
                  En Vedette
                </Badge>
              )}
              {is_franchise && (
                <Badge className="bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground border-0 shadow-md">
                  🏢 Franchise
                </Badge>
              )}
              {showActions && approval_status === 'approved' && (
                <Badge className="bg-green-500 text-white">✓ Approuvée</Badge>
              )}
              {showActions && approval_status === 'pending' && (
                <Badge className="bg-orange-500 text-white">⏳ En attente</Badge>
              )}
            </div>
            <h3 className="text-2xl font-display font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {title}
            </h3>
            <div className={`flex items-center gap-2 text-muted-foreground ${status === 'sold' ? 'opacity-60' : ''}`}>
              <MapPin className="w-4 h-4" />
              <span className="font-medium">
                {city}{region && `, ${region}`}
              </span>
            </div>
          </div>
          {id && status !== 'sold' && <FavoriteButton businessId={id} userId={userId} />}
        </div>

        <p className={`text-muted-foreground line-clamp-2 leading-relaxed ${status === 'sold' ? 'opacity-60' : ''}`}>{description}</p>

        <div className={`grid grid-cols-2 gap-4 pt-4 border-t border-border/50 ${status === 'sold' ? 'opacity-60' : ''}`}>
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
        </div>

        <div className={`flex items-end justify-between pt-4 border-t border-border/50 ${status === 'sold' ? 'opacity-60' : ''}`}>
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
