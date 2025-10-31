import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { X, MapPin, DollarSign } from 'lucide-react';

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
  city?: string;
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
  const draw = useRef<MapboxDraw | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBusinesses();

    const channel = supabase
      .channel('businesses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'businesses'
        },
        () => {
          fetchBusinesses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filters]);

  const fetchBusinesses = async () => {
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

    if (error) {
      console.error('[MAP] Error fetching businesses:', error);
      return;
    }

    if (data) {
      const businessesWithPhotos = data.map(b => ({
        ...b,
        photo_url: Array.isArray(b.business_photos) && b.business_photos.length > 0 
          ? b.business_photos[0].photo_url 
          : null
      }));
      
      const businessesWithCoords = await Promise.all(
        businessesWithPhotos.map(async (business) => {
          if ((!business.latitude || !business.longitude) && business.city) {
            try {
              const { data: geocodeData } = await supabase.functions.invoke('geocode-city', {
                body: { city: business.city, province: 'Québec' }
              });
              
              if (geocodeData?.success && geocodeData.latitude && geocodeData.longitude) {
                return {
                  ...business,
                  latitude: geocodeData.latitude,
                  longitude: geocodeData.longitude
                };
              }
            } catch (err) {
              console.error('[MAP] Geocoding error:', err);
            }
          }
          return business;
        })
      );
      
      const validBusinesses = businessesWithCoords.filter(b => b.latitude && b.longitude);
      setBusinesses(validBusinesses);
    }
  };

  const filterBusinessesInPolygon = (polygon: number[][]) => {
    const filtered = businesses.filter(business => {
      return isPointInPolygon([business.longitude, business.latitude], polygon);
    });
    setFilteredBusinesses(filtered);
    setShowSidebar(filtered.length > 0);
  };

  const isPointInPolygon = (point: number[], polygon: number[][]) => {
    const x = point[0];
    const y = point[1];
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][0];
      const yi = polygon[i][1];
      const xj = polygon[j][0];
      const yj = polygon[j][1];

      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }

    return inside;
  };

  useEffect(() => {
    if (!mapContainer.current) return;

    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!mapboxToken) {
      console.error('[MAP] Mapbox token not found');
      return;
    }

    if (!map.current) {
      mapboxgl.accessToken = mapboxToken;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/outdoors-v12',
        center: [-71.2082, 46.8139],
        zoom: 6,
      });

      // Initialize draw control
      draw.current = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          trash: true
        },
        defaultMode: 'simple_select'
      });

      map.current.addControl(draw.current, 'top-left');

      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );

      // Listen to draw events
      map.current.on('draw.create', updateArea);
      map.current.on('draw.update', updateArea);
      map.current.on('draw.delete', () => {
        setFilteredBusinesses([]);
        setShowSidebar(false);
      });
    }

    if (!map.current || businesses.length === 0) return;

    const addBusinessLayers = () => {
      if (!map.current) return;

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

      if (map.current.getLayer('clusters')) map.current.removeLayer('clusters');
      if (map.current.getLayer('cluster-count')) map.current.removeLayer('cluster-count');
      if (map.current.getLayer('unclustered-point')) map.current.removeLayer('unclustered-point');
      if (map.current.getSource('businesses')) map.current.removeSource('businesses');

      map.current.addSource('businesses', {
        type: 'geojson',
        data: geojsonData,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
      const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      const franchiseColor = '45 76 212';
      
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

      map.current.on('click', 'unclustered-point', (e) => {
        const businessSlug = e.features![0].properties!.slug;
        navigate(`/entreprise/${businessSlug}`);
      });

      const handlePopupNavigation = (event: CustomEvent) => {
        navigate(`/entreprise/${event.detail}`);
      };
      
      window.addEventListener('navigate-to-business', handlePopupNavigation as EventListener);

      map.current.on('mouseenter', 'clusters', () => {
        if (!map.current) return;
        map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current.on('mouseleave', 'clusters', () => {
        if (!map.current) return;
        map.current.getCanvas().style.cursor = '';
      });

      if (businesses.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        businesses.forEach(b => bounds.extend([b.longitude, b.latitude]));
        map.current.fitBounds(bounds, { padding: 50 });
      }
    };

    if (map.current.loaded()) {
      addBusinessLayers();
    } else {
      const loadHandler = () => {
        addBusinessLayers();
        map.current?.off('load', loadHandler);
      };
      map.current.on('load', loadHandler);
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [businesses, navigate]);

  const updateArea = () => {
    if (!draw.current) return;
    
    const data = draw.current.getAll();
    if (data.features.length > 0) {
      const polygon = data.features[0];
      if (polygon.geometry.type === 'Polygon') {
        filterBusinessesInPolygon(polygon.geometry.coordinates[0]);
      }
    }
  };

  return (
    <div className="relative w-full h-[600px] rounded-xl overflow-hidden shadow-2xl border border-border/50">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {showSidebar && (
        <div className="absolute top-0 right-0 bottom-0 w-[400px] bg-background/95 backdrop-blur-lg border-l border-border/50 shadow-2xl">
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-border/50 bg-gradient-to-r from-primary/5 to-secondary/5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-foreground">
                  Annonces dans la zone
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (draw.current) {
                      draw.current.deleteAll();
                    }
                    setShowSidebar(false);
                    setFilteredBusinesses([]);
                  }}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {filteredBusinesses.length} {filteredBusinesses.length > 1 ? 'entreprises trouvées' : 'entreprise trouvée'}
              </p>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {filteredBusinesses.map((business) => (
                  <Card 
                    key={business.id}
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/50"
                    onClick={() => navigate(`/entreprise/${business.slug}`)}
                  >
                    <CardContent className="p-4">
                      {business.photo_url && (
                        <img
                          src={business.photo_url}
                          alt={business.title}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                      )}
                      <h4 className="font-bold text-foreground mb-2 line-clamp-2">
                        {business.title}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <MapPin className="h-4 w-4" />
                        <span>{business.city || business.location}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase mb-1">Prix</p>
                          <p className="font-bold text-primary flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {business.asking_price.toLocaleString('fr-CA')}
                          </p>
                        </div>
                        {business.is_franchise && (
                          <Badge className="bg-purple-500 text-white">Franchise</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessMap;
