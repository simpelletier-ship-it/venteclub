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
  location: string;
  description: string;
  annual_revenue?: number;
  status?: string;
  photo_url?: string | null;
}

interface BusinessMapProps {
  filters?: {
    city?: string;
    industry?: string;
    minPrice?: number;
    maxPrice?: number;
  };
}

const BusinessMap = ({ filters }: BusinessMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBusinesses();
  }, [filters]);

  const fetchBusinesses = async () => {
    let query = supabase
      .from('businesses')
      .select(`
        id, 
        title, 
        latitude, 
        longitude, 
        asking_price, 
        industry, 
        location, 
        description, 
        annual_revenue, 
        status,
        business_photos!business_photos_business_id_fkey(photo_url)
      `)
      .in('status', ['active', 'sold'])
      .eq('approval_status', 'approved')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    // Apply filters
    if (filters?.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }
    if (filters?.industry) {
      query = query.eq('industry', filters.industry as any);
    }
    if (filters?.minPrice !== undefined) {
      query = query.gte('asking_price', filters.minPrice);
    }
    if (filters?.maxPrice !== undefined) {
      query = query.lte('asking_price', filters.maxPrice);
    }

    const { data, error } = await query;

    if (data && !error) {
      // Transform data to include first photo URL
      const businessesWithPhotos = data.map(b => ({
        ...b,
        photo_url: Array.isArray(b.business_photos) && b.business_photos.length > 0 
          ? b.business_photos[0].photo_url 
          : null
      }));
      setBusinesses(businessesWithPhotos);
    }
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    // Check if we have the Mapbox token
    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!mapboxToken) {
      console.warn('Mapbox token not found');
      return;
    }

    if (!map.current) {
      mapboxgl.accessToken = mapboxToken;

      // Initialize map centered on Quebec
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-71.2082, 46.8139],
        zoom: 6,
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );
    }

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Only add markers if map is ready
    if (!map.current) return;

    // Add markers for each business
    businesses.forEach((business) => {
      if (!map.current) return;

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'business-marker';
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = 'hsl(270 100% 60%)';
      el.style.border = '3px solid white';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
      el.style.transition = 'transform 0.2s, box-shadow 0.2s';
      el.style.transformOrigin = 'center center';
      el.style.position = 'relative';

      // Hover effect
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.2)';
        el.style.boxShadow = '0 6px 16px rgba(0,0,0,0.4)';
        el.style.zIndex = '999';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        el.style.zIndex = '1';
      });

      // Create rich popup with preview and image
      const popupContent = `
        <div style="padding: 0; max-width: 300px;">
          ${business.photo_url ? `
            <img 
              src="${business.photo_url}" 
              alt="${business.title}"
              style="width: 100%; height: 150px; object-fit: cover; border-radius: 12px 12px 0 0;"
            />
          ` : ''}
          <div style="padding: 12px;">
            <h3 style="font-weight: 700; margin-bottom: 8px; font-size: 16px; color: hsl(252 47% 11%); line-height: 1.3;">
              ${business.title}
            </h3>
            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 8px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(270 100% 60%)" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span style="color: hsl(252 15% 50%); font-size: 13px;">${business.location}</span>
            </div>
            <p style="color: hsl(252 15% 50%); font-size: 13px; margin-bottom: 10px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
              ${business.description}
            </p>
            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid hsl(252 20% 90%);">
              <div>
                <div style="font-size: 11px; color: hsl(252 15% 50%); text-transform: uppercase; margin-bottom: 2px;">Prix demandé</div>
                <div style="font-weight: 700; color: hsl(270 100% 60%); font-size: 18px;">
                  ${business.asking_price.toLocaleString('fr-CA')} $
                </div>
              </div>
              ${business.annual_revenue ? `
                <div style="text-align: right;">
                  <div style="font-size: 11px; color: hsl(252 15% 50%); text-transform: uppercase; margin-bottom: 2px;">Chiffre d'affaires</div>
                  <div style="font-size: 13px; font-weight: 600; color: hsl(252 47% 11%);">
                    ${business.annual_revenue.toLocaleString('fr-CA')} $
                  </div>
                </div>
              ` : ''}
            </div>
            <div style="margin-top: 12px; padding: 8px; background: hsl(270 100% 60% / 0.1); border-radius: 6px; text-align: center; font-size: 12px; color: hsl(270 100% 60%); font-weight: 600;">
              Cliquez pour voir les détails
            </div>
          </div>
        </div>
      `;

      // Create popup (not attached to marker to avoid position shifts)
      const popup = new mapboxgl.Popup({ 
        offset: 25,
        closeButton: false,
        closeOnClick: false,
        className: 'business-popup',
        maxWidth: '300px',
        anchor: 'bottom' // Fixed anchor position
      }).setHTML(popupContent);

      // Create marker with fixed coordinates - never changes
      const markerLngLat: [number, number] = [business.longitude, business.latitude];
      const marker = new mapboxgl.Marker({ 
        element: el, 
        anchor: 'center' 
      })
        .setLngLat(markerLngLat)
        .addTo(map.current);

      // Handle popup visibility manually
      let hideTimeout: NodeJS.Timeout;
      let isPopupHovered = false;
      let isMarkerHovered = false;
      
      const showPopup = () => {
        clearTimeout(hideTimeout);
        if (!popup.isOpen() && map.current) {
          // Always use the same fixed coordinates
          popup.setLngLat(markerLngLat).addTo(map.current);
          
          // Attach hover listeners to popup after it's added
          setTimeout(() => {
            const popupEl = popup.getElement();
            if (popupEl) {
              popupEl.addEventListener('mouseenter', () => {
                isPopupHovered = true;
                clearTimeout(hideTimeout);
              });
              popupEl.addEventListener('mouseleave', () => {
                isPopupHovered = false;
                hidePopup();
              });
            }
          }, 0);
        }
      };
      
      const hidePopup = () => {
        hideTimeout = setTimeout(() => {
          if (!isPopupHovered && !isMarkerHovered && popup.isOpen()) {
            popup.remove();
          }
        }, 200);
      };
      
      // Marker hover events
      el.addEventListener('mouseenter', () => {
        isMarkerHovered = true;
        showPopup();
      });
      
      el.addEventListener('mouseleave', () => {
        isMarkerHovered = false;
        hidePopup();
      });

      // Navigate on click
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        navigate(`/business/${business.id}`);
      });

      markers.current.push(marker);
    });

    // Fit bounds if there are businesses
    if (businesses.length > 0 && map.current) {
      const bounds = new mapboxgl.LngLatBounds();
      businesses.forEach(b => bounds.extend([b.longitude, b.latitude]));
      map.current.fitBounds(bounds, { padding: 50 });
    }

  }, [businesses, navigate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      markers.current.forEach(marker => marker.remove());
      map.current?.remove();
    };
  }, []);

  return (
    <div className="relative w-full h-[600px] rounded-2xl overflow-hidden shadow-elegant border border-border">
      <div ref={mapContainer} className="absolute inset-0" />
      <style>{`
        .business-popup .mapboxgl-popup-content {
          padding: 0;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        }
        .business-popup .mapboxgl-popup-tip {
          border-top-color: white;
        }
      `}</style>
    </div>
  );
};

export default BusinessMap;