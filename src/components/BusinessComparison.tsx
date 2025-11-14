import { useState, useEffect } from 'react';
import { X, TrendingUp, Building2, MapPin, Calendar, DollarSign, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/lib/priceFormat';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Business {
  id: string;
  slug: string;
  title: string;
  city: string;
  region: string;
  asking_price: number;
  annual_revenue: number;
  baiia: number;
  industry: string;
  sale_type: string;
  is_franchise: boolean;
  created_at: string;
  square_footage?: number;
  year_built?: number;
}

interface BusinessComparisonProps {
  businessIds: string[];
  onRemove: (id: string) => void;
  onClose: () => void;
}

export const BusinessComparison = ({ businessIds, onRemove, onClose }: BusinessComparisonProps) => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBusinesses();
  }, [businessIds]);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('businesses')
        .select('id, slug, title, city, region, asking_price, annual_revenue, baiia, industry, sale_type, is_franchise, created_at, square_footage, year_built')
        .in('id', businessIds);

      if (error) throw error;
      if (data) setBusinesses(data);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || businesses.length === 0) return null;

  const getComparisonValue = (business: Business, key: keyof Business) => {
    const value = business[key];
    if (typeof value === 'number') {
      if (key === 'asking_price' || key === 'annual_revenue' || key === 'baiia') {
        return formatPrice(value);
      }
      return value.toLocaleString();
    }
    return value || 'N/A';
  };

  const comparisonFields = [
    { key: 'asking_price' as keyof Business, label: 'Prix demandé', icon: DollarSign },
    { key: 'annual_revenue' as keyof Business, label: 'Revenus annuels', icon: TrendingUp },
    { key: 'baiia' as keyof Business, label: 'BAIIA', icon: BarChart3 },
    { key: 'industry' as keyof Business, label: 'Industrie', icon: Building2 },
    { key: 'city' as keyof Business, label: 'Ville', icon: MapPin },
    { key: 'year_built' as keyof Business, label: 'Année', icon: Calendar },
  ];

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 overflow-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Comparaison d'entreprises</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {businesses.map((business) => (
            <Card key={business.id} className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 z-10"
                onClick={() => onRemove(business.id)}
              >
                <X className="h-4 w-4" />
              </Button>

              <CardHeader>
                <CardTitle className="text-lg pr-8">
                  {business.title}
                </CardTitle>
                <div className="flex gap-2 flex-wrap mt-2">
                  {business.is_franchise && (
                    <Badge variant="secondary">Franchise</Badge>
                  )}
                  <Badge variant="outline">{business.sale_type}</Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {comparisonFields.map((field) => (
                  <div key={field.key}>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <field.icon className="h-4 w-4" />
                      <span>{field.label}</span>
                    </div>
                    <div className="font-semibold">
                      {getComparisonValue(business, field.key)}
                    </div>
                    {field.key === 'asking_price' && business.annual_revenue > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Multiple: {(business.asking_price / business.annual_revenue).toFixed(2)}x
                      </div>
                    )}
                  </div>
                ))}

                <Separator />

                <Button
                  className="w-full"
                  onClick={() => navigate(`/entreprise/${business.slug}`)}
                >
                  Voir les détails
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
