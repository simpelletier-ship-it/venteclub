import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface Business {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  asking_price: number;
  industry: string;
}

const BusinessMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    const { data, error } = await supabase
      .from('businesses')
      .select('id, title, latitude, longitude, asking_price, industry')
      .eq('status', 'active')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (data && !error) {
      setBusinesses(data);
    }
  };

  useEffect(() => {
    if (!mapContainer.current || businesses.length === 0) return;

    // Check if we have the Mapbox token
    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!mapboxToken) {
      console.warn('Mapbox token not found');
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    // Initialize map centered on Quebec
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-71.2082, 46.8139], // Quebec City coordinates
      zoom: 6,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Add markers for each business
    businesses.forEach((business) => {
      if (!map.current) return;

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'business-marker';
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = 'hsl(270 100% 60%)';
      el.style.border = '3px solid white';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px;">
          <h3 style="font-weight: bold; margin-bottom: 4px;">${business.title}</h3>
          <p style="color: hsl(252 15% 50%); font-size: 12px; margin-bottom: 4px;">${business.industry}</p>
          <p style="font-weight: bold; color: hsl(270 100% 60%);">${business.asking_price.toLocaleString()} CAD</p>
        </div>
      `);

      // Add marker with click handler
      const marker = new mapboxgl.Marker(el)
        .setLngLat([business.longitude, business.latitude])
        .setPopup(popup)
        .addTo(map.current);

      el.addEventListener('click', () => {
        navigate(`/business/${business.id}`);
      });
    });

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [businesses, navigate]);

  return (
    <div className="relative w-full h-[600px] rounded-2xl overflow-hidden shadow-elegant border border-border">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};

export default BusinessMap;