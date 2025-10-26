import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, MapPin, DollarSign } from "lucide-react";

interface BusinessCardProps {
  title: string;
  industry: string;
  location: string;
  revenue: string;
  price: string;
  profit: string;
  description: string;
  featured?: boolean;
}

const BusinessCard = ({
  title,
  industry,
  location,
  revenue,
  price,
  profit,
  description,
  featured = false,
}: BusinessCardProps) => {
  return (
    <Card className="group hover:shadow-[var(--shadow-hover)] transition-all duration-300 bg-gradient-to-b from-card to-background border-border">
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
              {revenue}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Bénéfice annuel</p>
            <p className="font-semibold text-accent">{profit}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Prix demandé</p>
            <p className="text-2xl font-bold text-accent flex items-center gap-1">
              <DollarSign className="w-5 h-5" />
              {price}€
            </p>
          </div>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            Voir détails
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BusinessCard;