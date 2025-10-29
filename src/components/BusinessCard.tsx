import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, MapPin, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";

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
  
  const displayRevenue = revenue || (annual_revenue ? `${annual_revenue.toLocaleString()}€` : 'N/A');
  const displayPrice = price || (asking_price ? asking_price.toLocaleString() : 'N/A');
  const displayProfit = profit || (profit_margin ? `${profit_margin}%` : 'N/A');

  const handleClick = () => {
    if (id) {
      navigate(`/business/${id}`);
    }
  };

  return (
    <Card 
      className="group hover:shadow-[var(--shadow-hover)] transition-all duration-300 bg-gradient-to-b from-card to-background border-border cursor-pointer"
      onClick={handleClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <Badge variant={featured ? "default" : "secondary"} className={featured ? "bg-accent text-accent-foreground" : ""}>
            {industry}
          </Badge>
          {featured && (
            <Badge className="bg-accent text-accent-foreground">
              En vedette
            </Badge>
          )}
        </div>
        <CardTitle className="text-xl font-bold text-foreground group-hover:text-accent transition-colors">
          {title}
        </CardTitle>
        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
          <MapPin className="w-4 h-4" />
          <span>{location}</span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {description}
        </p>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Chiffre d'affaires annuel</p>
            <p className="font-semibold text-foreground flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-accent" />
              {displayRevenue}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Bénéfice annuel</p>
            <p className="font-semibold text-accent">{displayProfit}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Prix demandé</p>
            <p className="text-2xl font-bold text-accent flex items-center gap-1">
              <DollarSign className="w-5 h-5" />
              {displayPrice}€
            </p>
          </div>
          <Button 
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
          >
            Voir détails
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BusinessCard;
