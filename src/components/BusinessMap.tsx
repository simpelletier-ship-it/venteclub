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
  sale_type?: 'assets' | 'shares' | 'both' | 'property';
  property_type?: string;
  year_built?: number;
  square_footage?: number;
  is_rental_property?: boolean;
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
        sale_type,
        property_type,
        year_built,
        square_footage,
        is_rental_property,
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

  // Cleanup and re-attach draw events when businesses change
  useEffect(() => {
    if (!map.current || !draw.current) return;

    const updateArea = () => {
      if (!draw.current) return;
      
      const data = draw.current.getAll();
      console.log('[MAP] Draw data:', data);
      console.log('[MAP] Total businesses available:', businesses.length);
      
      if (data.features.length > 0) {
        const polygon = data.features[0];
        console.log('[MAP] Polygon:', polygon);
        
        if (polygon.geometry.type === 'Polygon') {
          const coordinates = polygon.geometry.coordinates[0];
          console.log('[MAP] Filtering businesses in polygon with', coordinates.length, 'points');
          filterBusinessesInPolygon(coordinates);
        }
      } else {
        console.log('[MAP] No features drawn');
        setFilteredBusinesses([]);
        setShowSidebar(false);
      }
    };

    // Re-attach event listeners with updated business data
    map.current.off('draw.create', updateArea);
    map.current.off('draw.update', updateArea);
    map.current.on('draw.create', updateArea);
    map.current.on('draw.update', updateArea);

    return () => {
      if (map.current) {
        map.current.off('draw.create', updateArea);
        map.current.off('draw.update', updateArea);
      }
    };
  }, [businesses]);

  // Initialize map only once
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!mapboxToken) {
      console.error('[MAP] Mapbox token not found');
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [-71.2082, 46.8139],
      zoom: 6,
    });

    // Initialize draw control with custom styles
    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true
      },
      defaultMode: 'simple_select',
      styles: [
        // Polygon fill
        {
          'id': 'gl-draw-polygon-fill',
          'type': 'fill',
          'filter': ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          'paint': {
            'fill-color': '#3b82f6',
            'fill-opacity': 0.25
          }
        },
        // Polygon outline
        {
          'id': 'gl-draw-polygon-stroke-active',
          'type': 'line',
          'filter': ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
          'layout': {
            'line-cap': 'round',
            'line-join': 'round'
          },
          'paint': {
            'line-color': '#3b82f6',
            'line-width': 3
          }
        },
        // Vertex points
        {
          'id': 'gl-draw-polygon-and-line-vertex-active',
          'type': 'circle',
          'filter': ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
          'paint': {
            'circle-radius': 6,
            'circle-color': '#3b82f6',
            'circle-stroke-color': '#fff',
            'circle-stroke-width': 2
          }
        }
      ]
    });

    map.current.addControl(draw.current, 'top-left');

    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Listen to delete event only (create/update handled in separate useEffect)
    map.current.on('draw.delete', () => {
      setFilteredBusinesses([]);
      setShowSidebar(false);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update business markers when businesses change
  useEffect(() => {
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
            sale_type: business.sale_type || null,
            property_type: business.property_type || null,
            year_built: business.year_built || null,
            square_footage: business.square_footage || null,
            is_rental_property: business.is_rental_property || false,
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

        // Déterminer si c'est une propriété immobilière
        const isProperty = props.sale_type === 'property' || props.property_type;
        
        // Créer les infos secondaires selon le type
        let secondaryInfo = '';
        if (isProperty) {
          // Pour les immeubles : superficie et année
          const sqFt = props.square_footage ? `${Number(props.square_footage).toLocaleString('fr-CA')} pi²` : 'N/D';
          const year = props.year_built || 'N/D';
          const propertyTypeLabel = props.property_type === 'bureau' ? 'Bureau' :
                                   props.property_type === 'commerce' ? 'Commerce' :
                                   props.property_type === 'industriel' ? 'Industriel' :
                                   props.property_type === 'immeuble_logement' ? 'Immeuble' :
                                   props.property_type === 'mixte' ? 'Mixte' : 'Propriété';
          
          secondaryInfo = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 10px;">
              <div>
                <div style="font-size: 11px; color: hsl(${mutedForegroundColor}); text-transform: uppercase; margin-bottom: 2px;">Type</div>
                <div style="font-size: 13px; font-weight: 600; color: hsl(${foregroundColor});">${propertyTypeLabel}</div>
              </div>
              <div>
                <div style="font-size: 11px; color: hsl(${mutedForegroundColor}); text-transform: uppercase; margin-bottom: 2px;">Superficie</div>
                <div style="font-size: 13px; font-weight: 600; color: hsl(${foregroundColor});">${sqFt}</div>
              </div>
              <div>
                <div style="font-size: 11px; color: hsl(${mutedForegroundColor}); text-transform: uppercase; margin-bottom: 2px;">Année</div>
                <div style="font-size: 13px; font-weight: 600; color: hsl(${foregroundColor});">${year}</div>
              </div>
              ${props.is_rental_property ? `
                <div>
                  <div style="font-size: 11px; color: hsl(${mutedForegroundColor}); text-transform: uppercase; margin-bottom: 2px;">Type</div>
                  <div style="font-size: 13px; font-weight: 600; color: hsl(${foregroundColor});">Locatif</div>
                </div>
              ` : ''}
            </div>
          `;
        } else if (props.is_franchise) {
          secondaryInfo = `
            <div style="text-align: right; margin-top: 10px;">
              <div style="font-size: 11px; color: hsl(${mutedForegroundColor}); text-transform: uppercase; margin-bottom: 2px;">Type</div>
              <div style="font-size: 13px; font-weight: 600; color: hsl(${foregroundColor});">Opportunité Franchise</div>
            </div>
          `;
        } else if (props.annual_revenue) {
          secondaryInfo = `
            <div style="text-align: right; margin-top: 10px;">
              <div style="font-size: 11px; color: hsl(${mutedForegroundColor}); text-transform: uppercase; margin-bottom: 2px;">Chiffre d'affaires</div>
              <div style="font-size: 13px; font-weight: 600; color: hsl(${foregroundColor});">
                ${Number(props.annual_revenue).toLocaleString('fr-CA')} $
              </div>
            </div>
          `;
        }

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
              <div style="padding-top: 10px; border-top: 1px solid hsl(${borderColor});">
                <div>
                  <div style="font-size: 11px; color: hsl(${mutedForegroundColor}); text-transform: uppercase; margin-bottom: 2px;">Prix demandé</div>
                  <div style="font-weight: 700; color: ${primaryHex}; font-size: 18px;">
                    ${Number(props.asking_price).toLocaleString('fr-CA')} $
                  </div>
                </div>
                ${secondaryInfo}
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
  }, [businesses, navigate]);

  return (
    <div className="w-full space-y-6">
      <div className="relative w-full h-[600px] rounded-xl overflow-hidden shadow-2xl border border-border/50">
        <div ref={mapContainer} className="absolute inset-0" />
      </div>
      
      {showSidebar && filteredBusinesses.length > 0 && (
        <div className="w-full">
          <Card className="bg-gradient-to-br from-background to-secondary/5 border-2 border-primary/20 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-1">
                    Annonces dans la zone sélectionnée
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {filteredBusinesses.length} {filteredBusinesses.length > 1 ? 'entreprises trouvées' : 'entreprise trouvée'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (draw.current) {
                      draw.current.deleteAll();
                    }
                    setShowSidebar(false);
                    setFilteredBusinesses([]);
                  }}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Effacer
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBusinesses.map((business) => {
                  const isProperty = business.sale_type === 'property' || business.property_type;
                  
                  return (
                    <Card 
                      key={business.id}
                      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/50 hover:scale-105"
                      onClick={() => navigate(`/entreprise/${business.slug}`)}
                    >
                      <CardContent className="p-4">
                        {business.photo_url && (
                          <img
                            src={business.photo_url}
                            alt={business.title}
                            className="w-full h-40 object-cover rounded-lg mb-3"
                          />
                        )}
                        
                        {/* Badge Type */}
                        <div className="mb-2">
                          {business.is_franchise && (
                            <Badge className="bg-purple-500 text-white">Franchise</Badge>
                          )}
                          {isProperty && (
                            <Badge className="bg-emerald-500 text-white">Immobilier</Badge>
                          )}
                          {!business.is_franchise && !isProperty && (
                            <Badge className="bg-blue-500 text-white">Entreprise</Badge>
                          )}
                        </div>
                        
                        <h4 className="font-bold text-foreground mb-2 line-clamp-2">
                          {business.title}
                        </h4>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{business.city || business.location}</span>
                        </div>
                        
                        {/* Info selon le type */}
                        {isProperty ? (
                          <div className="space-y-2 mb-3">
                            {business.property_type && (
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Type</span>
                                <span className="font-semibold">
                                  {business.property_type === 'bureau' && 'Bureau'}
                                  {business.property_type === 'commerce' && 'Commerce'}
                                  {business.property_type === 'industriel' && 'Industriel'}
                                  {business.property_type === 'immeuble_logement' && 'Immeuble'}
                                  {business.property_type === 'mixte' && 'Mixte'}
                                  {!['bureau', 'commerce', 'industriel', 'immeuble_logement', 'mixte'].includes(business.property_type) && 'Propriété'}
                                </span>
                              </div>
                            )}
                            {business.square_footage && (
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Superficie</span>
                                <span className="font-semibold">{business.square_footage.toLocaleString('fr-CA')} pi²</span>
                              </div>
                            )}
                            {business.year_built && (
                              <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Année</span>
                                <span className="font-semibold">{business.year_built}</span>
                              </div>
                            )}
                          </div>
                        ) : business.annual_revenue && !business.is_franchise ? (
                          <div className="mb-3">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Revenus annuels</span>
                              <span className="font-semibold">{business.annual_revenue.toLocaleString('fr-CA')} $</span>
                            </div>
                          </div>
                        ) : null}
                        
                        <div className="pt-3 border-t border-border/50">
                          <p className="text-xs text-muted-foreground uppercase mb-1">Prix demandé</p>
                          <p className="font-bold text-primary text-lg flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {business.asking_price.toLocaleString('fr-CA')} $
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default BusinessMap;
