import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from './ui/card';
import { MapPin } from 'lucide-react';

interface Business {
  id: string;
  title: string;
  slug: string;
  city: string;
  latitude: number;
  longitude: number;
  asking_price: number;
  is_franchise: boolean;
  sale_type: string;
}

const BusinessMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initMap = async () => {
      try {
        const { data: tokenData } = await supabase.functions.invoke('get-mapbox-token');
        if (!tokenData?.token) return;

        mapboxgl.accessToken = tokenData.token;

        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [-71.2082, 46.8139],
          zoom: 6,
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Fetch businesses
        const { data } = await supabase
          .from('businesses')
          .select('id, title, slug, city, latitude, longitude, asking_price, is_franchise, sale_type')
          .eq('status', 'active')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .limit(100);

        if (data) {
          setBusinesses(data);
          
          // Add markers
          data.forEach((business: Business) => {
            const el = document.createElement('div');
            el.className = 'custom-marker';
            el.style.width = '30px';
            el.style.height = '30px';
            el.style.borderRadius = '50%';
            el.style.cursor = 'pointer';
            el.style.backgroundColor = business.is_franchise ? '#a855f7' : business.sale_type === 'property' ? '#10b981' : '#3b82f6';
            el.style.border = '3px solid white';
            el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

            new mapboxgl.Marker(el)
              .setLngLat([business.longitude, business.latitude])
              .setPopup(
                new mapboxgl.Popup({ offset: 25 })
                  .setHTML(`
                    <div style="padding: 8px;">
                      <h3 style="font-weight: bold; margin-bottom: 4px;">${business.title}</h3>
                      <p style="font-size: 12px; color: #666; margin-bottom: 4px;">${business.city}</p>
                      <p style="font-weight: bold; color: #3b82f6;">${business.asking_price.toLocaleString('fr-CA')} $</p>
                    </div>
                  `)
              )
              .addTo(map.current!);
          });
        }
      } catch (error) {
        console.error('Map error:', error);
      }
    };

    initMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full space-y-6">
      <div ref={mapContainer} className="w-full h-[600px] rounded-xl border border-border shadow-xl" />
      
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            <MapPin className="inline w-4 h-4 mr-2" />
            {businesses.length} entreprises sur la carte
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessMap;
