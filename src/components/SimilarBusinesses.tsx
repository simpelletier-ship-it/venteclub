import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { formatPrice } from '@/lib/priceFormat';
import { TrendingUp, MapPin, Building2, ArrowRight } from 'lucide-react';

interface Business {
  id: string;
  slug: string;
  title: string;
  city: string;
  asking_price: number;
  annual_revenue: number;
  industry: string;
  is_franchise: boolean;
}

interface SimilarBusinessesProps {
  currentBusinessId: string;
  industry: string;
  city: string;
  priceRange: [number, number];
}

export const SimilarBusinesses = ({ 
  currentBusinessId, 
  industry, 
  city, 
  priceRange 
}: SimilarBusinessesProps) => {
  const [similarBusinesses, setSimilarBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSimilarBusinesses();
  }, [currentBusinessId, industry, city]);

  const fetchSimilarBusinesses = async () => {
    try {
      setLoading(true);
      const [minPrice, maxPrice] = priceRange;
      const priceBuffer = (maxPrice - minPrice) * 0.3; // 30% buffer

      const { data, error } = await supabase
        .from('businesses')
        .select('id, slug, title, city, asking_price, annual_revenue, industry, is_franchise')
        .eq('status', 'active')
        .eq('approval_status', 'approved')
        .neq('id', currentBusinessId)
        .or(`industry.eq.${industry},city.eq.${city}`)
        .gte('asking_price', minPrice - priceBuffer)
        .lte('asking_price', maxPrice + priceBuffer)
        .limit(6);

      if (error) throw error;
      setSimilarBusinesses(data || []);
    } catch (error) {
      console.error('Error fetching similar businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || similarBusinesses.length === 0) return null;

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Annonces similaires
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Découvrez d'autres opportunités qui pourraient vous intéresser
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {similarBusinesses.map((business) => (
            <div
              key={business.id}
              className="group p-4 rounded-lg border border-border hover:border-primary hover:shadow-md transition-all cursor-pointer"
              onClick={() => navigate(`/entreprise/${business.slug}`)}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                    {business.title}
                  </h3>
                  {business.is_franchise && (
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      Franchise
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{business.city}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span>{business.industry}</span>
                  </div>
                  {business.annual_revenue > 0 && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      <span>{formatPrice(business.annual_revenue)}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-lg font-bold text-primary">
                    {formatPrice(business.asking_price)}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={() => navigate('/entreprises')}
        >
          Voir toutes les annonces
        </Button>
      </CardContent>
    </Card>
  );
};
