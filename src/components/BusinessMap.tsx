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
          style: 'mapbox://styles/mapbox/light-v11',
          center: [-71.2082, 46.8139],
          zoom: 6,
        });

        console.log('[MAP] Map instance created');

        map.current.on('load', async () => {
          console.log('[MAP] ✅ Map loaded successfully!');
          map.current!.addControl(new mapboxgl.NavigationControl(), 'top-right');
          
          // Fetch and display businesses
          console.log('[MAP] Fetching businesses...');
          const { data } = await supabase
            .from('businesses')
            .select('id, title, slug, city, latitude, longitude, asking_price, is_franchise, sale_type')
            .eq('status', 'active')
            .eq('approval_status', 'approved')
            .not('latitude', 'is', null)
            .not('longitude', 'is', null)
            .limit(100);

          if (data) {
            console.log('[MAP] Got', data.length, 'businesses');
            setBusinesses(data);
            
            data.forEach((business: Business) => {
              const el = document.createElement('div');
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
                      <div style="padding: 10px;">
                        <h3 style="font-weight: bold; margin-bottom: 4px;">${business.title}</h3>
                        <p style="font-size: 12px; color: #666; margin-bottom: 6px;">${business.city}</p>
                        <p style="font-weight: bold; color: #3b82f6; margin-bottom: 8px;">${business.asking_price.toLocaleString('fr-CA')} $</p>
                        <button 
                          onclick="window.location.href='/entreprise/${business.slug}'"
                          style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 6px 12px; border: none; border-radius: 6px; cursor: pointer; width: 100%;"
                        >
                          Voir l'annonce
                        </button>
                      </div>
                    `)
                )
                .addTo(map.current!);
            });
            
            console.log('[MAP] Added', data.length, 'markers');
          }
        });

        map.current.on('error', (e) => {
          console.error('[MAP] ✗ Map error:', e);
        });

      } catch (error) {
        console.error('Map init error:', error);
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
