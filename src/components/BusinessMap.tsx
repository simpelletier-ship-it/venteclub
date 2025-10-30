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
  is_franchise?: boolean;
  slug: string;
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
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [zoomLevel, setZoomLevel] = useState(6);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBusinesses();

    // S'abonner aux changements en temps réel
    const channel = supabase
      .channel('businesses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'businesses'
        },
        (payload) => {
          console.log('[MAP] Database change detected:', payload);
          // Recharger les annonces quand il y a un changement
          fetchBusinesses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filters]);

  const fetchBusinesses = async () => {
    console.log('[MAP] Fetching businesses for map...');
    let query = supabase
      .from('businesses')
      .select(`
        id, 
        title, 
        city,
        slug,
        latitude, 
        longitude, 
        asking_price, 
        industry, 
        location, 
        description, 
        annual_revenue, 
        status,
        approval_status,
        is_franchise,
        business_photos(photo_url)
      `)
      .eq('status', 'active')
      .eq('approval_status', 'approved');

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

    console.log('[MAP] Query result:', { count: data?.length, error });

    if (error) {
      console.error('[MAP] Error fetching businesses:', error);
      return;
    }

    if (data) {
      // Transform data to include first photo URL
      const businessesWithPhotos = data.map(b => ({
        ...b,
        photo_url: Array.isArray(b.business_photos) && b.business_photos.length > 0 
          ? b.business_photos[0].photo_url 
          : null
      }));
      
      // Géocoder les annonces sans coordonnées
      const businessesWithCoords = await Promise.all(
        businessesWithPhotos.map(async (business) => {
          // Si pas de coordonnées mais a une ville, géocoder
          if ((!business.latitude || !business.longitude) && business.city) {
            console.log('[MAP] Geocoding business:', business.title, 'in', business.city);
            try {
              const { data: geocodeData } = await supabase.functions.invoke('geocode-city', {
                body: { city: business.city, province: 'Québec' }
              });
              
              if (geocodeData?.success && geocodeData.latitude && geocodeData.longitude) {
                console.log('[MAP] Geocoded:', business.city, '→', geocodeData.latitude, geocodeData.longitude);
                return {
                  ...business,
                  latitude: geocodeData.latitude,
                  longitude: geocodeData.longitude
                };
              }
            } catch (err) {
              console.error('[MAP] Geocoding error for', business.city, ':', err);
            }
          }
          return business;
        })
      );
      
      // Filtrer pour garder seulement ceux avec coordonnées
      const validBusinesses = businessesWithCoords.filter(b => b.latitude && b.longitude);
      
      console.log('[MAP] Businesses loaded for map:', {
        total: businessesWithPhotos.length,
        withCoords: validBusinesses.length,
        geocoded: businessesWithCoords.length - businessesWithPhotos.filter(b => b.latitude && b.longitude).length,
        sample: validBusinesses[0] ? {
          title: validBusinesses[0].title,
          lat: validBusinesses[0].latitude,
          lng: validBusinesses[0].longitude
        } : 'none'
      });
      setBusinesses(validBusinesses);
    }
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    // Check if we have the Mapbox token
    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
    console.log('[MAP] Mapbox token present:', !!mapboxToken);
    if (!mapboxToken) {
      console.error('[MAP] Mapbox token not found in environment variables');
      return;
    }

    if (!map.current) {
      mapboxgl.accessToken = mapboxToken;

      // Initialize map centered on Quebec with realistic map style
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/outdoors-v12',
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

      // Listen to zoom events
      map.current.on('zoom', () => {
        if (map.current) {
          setZoomLevel(map.current.getZoom());
        }
      });
    }

    // Only proceed if map is ready and businesses are loaded
    if (!map.current || businesses.length === 0) {
      console.log('[MAP] Waiting for map or businesses...', { mapReady: !!map.current, businessCount: businesses.length });
      return;
    }

    console.log('[MAP] Adding business layers to map, count:', businesses.length);

    // Wait for map to load before adding sources and layers
    const addBusinessLayers = () => {
      if (!map.current) return;
      
      console.log('[MAP] Running addBusinessLayers function');

      // Convert businesses to GeoJSON format
      const geojsonData = {
        type: 'FeatureCollection' as const,
        features: businesses.map((business) => ({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [business.longitude, business.latitude],
          },
          properties: {
            id: business.id,
            slug: business.slug,
            title: business.title,
            location: business.location,
            asking_price: business.asking_price,
            annual_revenue: business.annual_revenue || null,
            description: business.description,
            photo_url: business.photo_url || null,
            status: business.status,
            is_franchise: business.is_franchise || false,
          },
        })),
      };

      // Remove existing layers and source if they exist
      if (map.current.getLayer('clusters')) map.current.removeLayer('clusters');
      if (map.current.getLayer('cluster-count')) map.current.removeLayer('cluster-count');
      if (map.current.getLayer('unclustered-point')) map.current.removeLayer('unclustered-point');
      if (map.current.getSource('businesses')) map.current.removeSource('businesses');

      // Add source with clustering
      map.current.addSource('businesses', {
        type: 'geojson',
        data: geojsonData,
        cluster: true,
        clusterMaxZoom: 14, // Max zoom to cluster points on
        clusterRadius: 50, // Radius of each cluster when clustering points
      });

      // Get primary color from CSS variables
      const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
      const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      const franchiseColor = '45 76 212'; // Blue color for franchises (HSL format)
      
      // Convert HSL to hex for Mapbox
      const hslToHex = (hsl: string) => {
        const [h, s, l] = hsl.split(' ').map(v => parseFloat(v));
        const hue = h / 360;
        const saturation = s / 100;
        const lightness = l / 100;
        
        const hue2rgb = (p: number, q: number, t: number) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1/6) return p + (q - p) * 6 * t;
          if (t < 1/2) return q;
          if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
        };
        
        const q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
        const p = 2 * lightness - q;
        const r = Math.round(hue2rgb(p, q, hue + 1/3) * 255);
        const g = Math.round(hue2rgb(p, q, hue) * 255);
        const b = Math.round(hue2rgb(p, q, hue - 1/3) * 255);
        
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
      };
      
      const primaryHex = hslToHex(primaryColor);
      const accentHex = hslToHex(accentColor);
      const franchiseHex = hslToHex(franchiseColor);

      // Add cluster circles layer with theme colors
      map.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'businesses',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            primaryHex,
            10,
            accentHex,
            30,
            primaryHex,
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20,
            10,
            30,
            30,
            40,
          ],
          'circle-stroke-width': 3,
          'circle-stroke-color': '#fff',
        },
      });

      // Add cluster count labels
      map.current.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'businesses',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 14,
        },
        paint: {
          'text-color': '#ffffff',
        },
      });

      // Add unclustered points layer with different colors for franchises
      map.current.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'businesses',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'case',
            ['get', 'is_franchise'],
            franchiseHex,
            primaryHex
          ],
          'circle-radius': 16,
          'circle-stroke-width': 3,
          'circle-stroke-color': '#fff',
        },
      });

      // Click on cluster to zoom in
      map.current.on('click', 'clusters', (e) => {
        if (!map.current) return;
        const features = map.current.queryRenderedFeatures(e.point, {
          layers: ['clusters'],
        });
        
        if (!features.length) return;
        
        const clusterId = features[0].properties?.cluster_id;
        const source = map.current.getSource('businesses') as mapboxgl.GeoJSONSource;
        
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || !map.current) return;
          
          const coordinates = (features[0].geometry as any).coordinates;
          map.current.easeTo({
            center: coordinates,
            zoom: zoom,
          });
        });
      });

      // Show popup on unclustered point hover
      const popup = new mapboxgl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: 'business-popup',
        maxWidth: '300px',
      });

      map.current.on('mouseenter', 'unclustered-point', (e) => {
        if (!map.current) return;
        map.current.getCanvas().style.cursor = 'pointer';

        const coordinates = (e.features![0].geometry as any).coordinates.slice();
        const props = e.features![0].properties!;
        
        // Get theme colors
        const foregroundColor = getComputedStyle(document.documentElement).getPropertyValue('--foreground').trim();
        const mutedForegroundColor = getComputedStyle(document.documentElement).getPropertyValue('--muted-foreground').trim();
        const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border').trim();

        const popupContent = `
          <div 
            style="padding: 0; max-width: 300px; cursor: pointer;" 
            onclick="window.dispatchEvent(new CustomEvent('navigate-to-business', { detail: '${props.slug}' }))"
          >
            ${props.photo_url ? `
              <img 
                src="${props.photo_url}" 
                alt="${props.title}"
                style="width: 100%; height: 150px; object-fit: cover; border-radius: 12px 12px 0 0;"
              />
            ` : ''}
            <div style="padding: 12px;">
              <h3 style="font-weight: 700; margin-bottom: 8px; font-size: 16px; color: hsl(${foregroundColor}); line-height: 1.3;">
                ${props.title}
              </h3>
              <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 8px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${primaryHex}" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span style="color: hsl(${mutedForegroundColor}); font-size: 13px;">${props.location}</span>
              </div>
              <p style="color: hsl(${mutedForegroundColor}); font-size: 13px; margin-bottom: 10px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                ${props.description}
              </p>
              <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid hsl(${borderColor});">
                <div>
                  <div style="font-size: 11px; color: hsl(${mutedForegroundColor}); text-transform: uppercase; margin-bottom: 2px;">Prix demandé</div>
                  <div style="font-weight: 700; color: ${primaryHex}; font-size: 18px;">
                    ${Number(props.asking_price).toLocaleString('fr-CA')} $
                  </div>
                </div>
                ${props.annual_revenue ? `
                  <div style="text-align: right;">
                    <div style="font-size: 11px; color: hsl(${mutedForegroundColor}); text-transform: uppercase; margin-bottom: 2px;">Chiffre d'affaires</div>
                    <div style="font-size: 13px; font-weight: 600; color: hsl(${foregroundColor});">
                      ${Number(props.annual_revenue).toLocaleString('fr-CA')} $
                    </div>
                  </div>
                ` : ''}
              </div>
              <div style="margin-top: 12px; padding: 8px; background: ${primaryHex}15; border-radius: 6px; text-align: center; font-size: 12px; color: ${primaryHex}; font-weight: 600;">
                Cliquez pour voir les détails
              </div>
            </div>
          </div>
        `;

        popup.setLngLat(coordinates).setHTML(popupContent).addTo(map.current);
      });

      map.current.on('mouseleave', 'unclustered-point', () => {
        if (!map.current) return;
        map.current.getCanvas().style.cursor = '';
        popup.remove();
      });

      // Click on unclustered point to navigate
      map.current.on('click', 'unclustered-point', (e) => {
        const businessSlug = e.features![0].properties!.slug;
        navigate(`/entreprise/${businessSlug}`);
      });

      // Listen for navigation events from popup
      const handlePopupNavigation = (event: CustomEvent) => {
        navigate(`/entreprise/${event.detail}`);
      };
      
      window.addEventListener('navigate-to-business', handlePopupNavigation as EventListener);

      // Change cursor on cluster hover
      map.current.on('mouseenter', 'clusters', () => {
        if (!map.current) return;
        map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current.on('mouseleave', 'clusters', () => {
        if (!map.current) return;
        map.current.getCanvas().style.cursor = '';
      });

      // Fit bounds if there are businesses
      if (businesses.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        businesses.forEach(b => bounds.extend([b.longitude, b.latitude]));
        map.current.fitBounds(bounds, { padding: 50 });
      }
    };

    // Remove existing event listeners to avoid duplicates
    if (map.current.loaded()) {
      addBusinessLayers();
    } else {
      const loadHandler = () => {
        addBusinessLayers();
        map.current?.off('load', loadHandler);
      };
      map.current.on('load', loadHandler);
    }

  }, [businesses, navigate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup navigation event listener
      const handlePopupNavigation = (event: CustomEvent) => {
        navigate(`/entreprise/${event.detail}`);
      };
      window.removeEventListener('navigate-to-business', handlePopupNavigation as EventListener);
      
      map.current?.remove();
    };
  }, [navigate]);

  return (
    <div className="relative w-full max-w-6xl mx-auto h-[600px] rounded-2xl overflow-hidden shadow-elegant border border-border">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Message si aucune annonce */}
      {businesses.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
          <div className="text-center p-8">
            <p className="text-lg font-semibold text-foreground mb-2">
              Aucune annonce trouvée
            </p>
            <p className="text-sm text-muted-foreground">
              Essayez de modifier vos filtres pour voir plus d'annonces
            </p>
          </div>
        </div>
      )}
      
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