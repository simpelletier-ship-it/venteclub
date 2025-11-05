import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
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
  rental_units?: Array<{unit_type: string, monthly_rent: number | null, count: number}> | null;
  address?: string;
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
    console.log('[MAP] Fetching businesses...');
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
        rental_units,
        address,
        business_photos(photo_url)
      `)
      .eq('status', 'active')
      .eq('approval_status', 'approved')
      .neq('status', 'sold');
    
    console.log('[MAP] Query built');

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
          : null,
        rental_units: b.rental_units && Array.isArray(b.rental_units) 
          ? b.rental_units as Array<{unit_type: string, monthly_rent: number | null, count: number}>
          : null
      }));
      
      // Fonction pour vérifier si un point est dans l'eau (approximatif pour le Québec)
      const isInWater = (lat: number, lng: number): boolean => {
        // Golfe du Saint-Laurent et zones côtières approximatives
        if (lat > 48.5 && lng > -64) return true;
        if (lat > 49.5 && lng < -66) return true;
        if (lat > 51 && lng < -78) return true;
        if (lng > -62) return true;
        return false;
      };

      const businessesWithCoords = await Promise.all(
        businessesWithPhotos.map(async (business) => {
          if (!business.latitude || !business.longitude) {
            try {
              if (business.address && business.property_type) {
                console.log('[MAP] Geocoding address for property:', business.title, business.address);
                const { data: geocodeData } = await supabase.functions.invoke('geocode-address', {
                  body: { query: business.address }
                });
                
                if (geocodeData?.success && geocodeData.latitude && geocodeData.longitude) {
                  console.log('[MAP] Geocoded property:', geocodeData.latitude, geocodeData.longitude);
                  return {
                    ...business,
                    latitude: geocodeData.latitude,
                    longitude: geocodeData.longitude
                  };
                }
              }
              
              if (business.city) {
                console.log('[MAP] Geocoding city for business:', business.title, business.city);
                const { data: geocodeData } = await supabase.functions.invoke('geocode-city', {
                  body: { city: business.city, province: 'Québec' }
                });
                
                if (geocodeData?.success && geocodeData.latitude && geocodeData.longitude) {
                  console.log('[MAP] Geocoded city:', geocodeData.latitude, geocodeData.longitude);
                  return {
                    ...business,
                    latitude: geocodeData.latitude,
                    longitude: geocodeData.longitude
                  };
                }
              }
            } catch (err) {
              console.error('[MAP] Geocoding error:', err);
            }
          }
          return business;
        })
      );
      
      const validBusinesses = businessesWithCoords.filter(b => 
        b.latitude && 
        b.longitude && 
        !isInWater(b.latitude, b.longitude)
      );
      console.log('[MAP] Valid businesses with coordinates:', validBusinesses.length);
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
    if (!map.current || !draw.current) return;

    const updateArea = () => {
      if (!draw.current) return;
      
      const data = draw.current.getAll();
      console.log('[MAP] Draw data:', data);
      
      if (data.features.length > 0) {
        const polygon = data.features[0];
        
        if (polygon.geometry.type === 'Polygon') {
          const coordinates = polygon.geometry.coordinates[0];
          filterBusinessesInPolygon(coordinates);
        }
      } else {
        setFilteredBusinesses([]);
        setShowSidebar(false);
      }
    };

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

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initMap = async () => {
      try {
        // Récupérer le token Mapbox depuis l'edge function
        console.log('[MAP] Fetching Mapbox token...');
        const { data: tokenData, error: tokenError } = await supabase.functions.invoke('get-mapbox-token');
        
        if (tokenError) {
          console.error('[MAP] Error fetching Mapbox token:', tokenError);
        }
        
        if (!tokenData?.token) {
          console.error('[MAP] No token received from edge function');
          return;
        }

        console.log('[MAP] Mapbox token received successfully');
        mapboxgl.accessToken = tokenData.token;

        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/outdoors-v12',
          center: [-71.2082, 46.8139],
          zoom: 6,
        });

        draw.current = new MapboxDraw({
          displayControlsDefault: false,
          controls: {
            polygon: true,
            trash: true
          },
          defaultMode: 'simple_select',
          styles: [
            {
              'id': 'gl-draw-polygon-fill',
              'type': 'fill',
              'filter': ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
              'paint': {
                'fill-color': '#3b82f6',
                'fill-opacity': 0.25
              }
            },
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

        map.current.on('draw.delete', () => {
          setFilteredBusinesses([]);
          setShowSidebar(false);
        });
      } catch (error) {
        console.error('[MAP] Error:', error);
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

  // Update markers
  useEffect(() => {
    if (!map.current || businesses.length === 0) return;

    const addLayers = () => {
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
            description: business.description,
            photo_url: business.photo_url || null,
            is_franchise: business.is_franchise || false,
            sale_type: business.sale_type || null,
            property_type: business.property_type || null,
          },
        })),
      };

      try {
        if (map.current.getLayer('clusters')) map.current.removeLayer('clusters');
        if (map.current.getLayer('cluster-count')) map.current.removeLayer('cluster-count');
        if (map.current.getLayer('unclustered-point')) map.current.removeLayer('unclustered-point');
        if (map.current.getSource('businesses')) map.current.removeSource('businesses');
      } catch (e) {
        console.log('[MAP] No existing layers');
      }

      map.current.addSource('businesses', {
        type: 'geojson',
        data: geojsonData,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      const primaryColor = '#3b82f6';
      const franchiseColor = '#FF6B00';
      const propertyColor = '#10b981';

      map.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'businesses',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': primaryColor,
          'circle-radius': 25,
          'circle-stroke-width': 4,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.9,
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
            franchiseColor,
            ['any', ['==', ['get', 'sale_type'], 'property'], ['!=', ['get', 'property_type'], null]],
            propertyColor,
            primaryColor
          ],
          'circle-radius': 20,
          'circle-stroke-width': 4,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.9,
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
        maxWidth: '380px',
      });

      map.current.on('click', 'unclustered-point', (e) => {
        const businessSlug = e.features![0].properties!.slug;
        navigate(`/entreprise/${businessSlug}`);
      });

      map.current.on('mouseenter', 'clusters', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });

      map.current.on('mouseleave', 'clusters', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });

      if (businesses.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        businesses.forEach(b => bounds.extend([b.longitude, b.latitude]));
        map.current.fitBounds(bounds, { padding: 50, duration: 1000 });
      }
    };

    if (map.current.isStyleLoaded()) {
      addLayers();
    } else {
      map.current.once('load', addLayers);
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
