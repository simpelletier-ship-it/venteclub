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
import { X, MapPin, DollarSign, Filter, Building2, Store, Home } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

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
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Filtres locaux
  const [localFilters, setLocalFilters] = useState({
    industry: '',
    minPrice: '',
    maxPrice: '',
    businessType: 'all' // all, business, franchise, property
  });
  const [displayedBusinesses, setDisplayedBusinesses] = useState<Business[]>([]);

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
      setDisplayedBusinesses(validBusinesses);
    }
  };

  // Appliquer les filtres locaux
  useEffect(() => {
    let filtered = [...businesses];

    if (localFilters.industry) {
      filtered = filtered.filter(b => b.industry === localFilters.industry);
    }

    if (localFilters.minPrice) {
      const min = parseFloat(localFilters.minPrice);
      filtered = filtered.filter(b => b.asking_price >= min);
    }

    if (localFilters.maxPrice) {
      const max = parseFloat(localFilters.maxPrice);
      filtered = filtered.filter(b => b.asking_price <= max);
    }

    if (localFilters.businessType !== 'all') {
      if (localFilters.businessType === 'franchise') {
        filtered = filtered.filter(b => b.is_franchise === true);
      } else if (localFilters.businessType === 'property') {
        filtered = filtered.filter(b => b.sale_type === 'property' || b.property_type);
      } else if (localFilters.businessType === 'business') {
        filtered = filtered.filter(b => !b.is_franchise && !b.property_type && b.sale_type !== 'property');
      }
    }

    setDisplayedBusinesses(filtered);
  }, [businesses, localFilters]);

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
        setIsMapLoading(true);
        setMapError(null);
        
        // Récupérer le token Mapbox depuis l'edge function
        console.log('[MAP] Fetching Mapbox token...');
        const { data: tokenData, error: tokenError } = await supabase.functions.invoke('get-mapbox-token');
        
        if (tokenError || !tokenData?.token) {
          console.error('[MAP] Failed to get Mapbox token:', tokenError);
          setMapError('Impossible de charger la carte. Veuillez réessayer plus tard.');
          setIsMapLoading(false);
          return;
        }

        console.log('[MAP] Mapbox token retrieved successfully');
        mapboxgl.accessToken = tokenData.token;

        console.log('[MAP] Initializing map...');
        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/outdoors-v12',
          center: [-71.2082, 46.8139],
          zoom: 6,
        });

        console.log('[MAP] Map instance created');

        map.current.on('error', (e) => {
          console.error('[MAP] Mapbox error:', e);
          setMapError('Erreur lors du chargement de la carte.');
          setIsMapLoading(false);
        });

        map.current.on('load', () => {
          console.log('[MAP] Map style loaded successfully');
          setIsMapLoading(false);
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
        console.error('[MAP] Error initializing map:', error);
        setMapError('Erreur lors de l\'initialisation de la carte.');
        setIsMapLoading(false);
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
    if (!map.current || displayedBusinesses.length === 0) return;

    const addLayers = () => {
      if (!map.current) return;

      const geojsonData = {
        type: 'FeatureCollection' as const,
        features: displayedBusinesses.map((business) => ({
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

      if (displayedBusinesses.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        displayedBusinesses.forEach(b => bounds.extend([b.longitude, b.latitude]));
        map.current.fitBounds(bounds, { padding: 50, duration: 1000 });
      }
    };

    if (map.current.isStyleLoaded()) {
      addLayers();
    } else {
      map.current.once('load', addLayers);
    }
  }, [displayedBusinesses, navigate]);

  const resetFilters = () => {
    setLocalFilters({
      industry: '',
      minPrice: '',
      maxPrice: '',
      businessType: 'all'
    });
  };

  return (
    <div className="w-full space-y-6">
      {/* Filtres */}
      <Card className="bg-gradient-to-br from-background to-secondary/5 border-2 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Filtres de recherche</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Type d'entreprise */}
            <div className="space-y-2">
              <Label htmlFor="businessType" className="text-sm font-medium">Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={localFilters.businessType === 'all' ? 'default' : 'outline'}
                  onClick={() => setLocalFilters({ ...localFilters, businessType: 'all' })}
                  className="h-auto py-3 flex flex-col items-center gap-1"
                >
                  <Store className="h-4 w-4" />
                  <span className="text-xs">Tous</span>
                </Button>
                <Button
                  variant={localFilters.businessType === 'business' ? 'default' : 'outline'}
                  onClick={() => setLocalFilters({ ...localFilters, businessType: 'business' })}
                  className="h-auto py-3 flex flex-col items-center gap-1"
                >
                  <Building2 className="h-4 w-4" />
                  <span className="text-xs">Entreprise</span>
                </Button>
                <Button
                  variant={localFilters.businessType === 'franchise' ? 'default' : 'outline'}
                  onClick={() => setLocalFilters({ ...localFilters, businessType: 'franchise' })}
                  className="h-auto py-3 flex flex-col items-center gap-1 bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30"
                >
                  <Store className="h-4 w-4 text-purple-500" />
                  <span className="text-xs">Franchise</span>
                </Button>
                <Button
                  variant={localFilters.businessType === 'property' ? 'default' : 'outline'}
                  onClick={() => setLocalFilters({ ...localFilters, businessType: 'property' })}
                  className="h-auto py-3 flex flex-col items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30"
                >
                  <Home className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs">Immobilier</span>
                </Button>
              </div>
            </div>

            {/* Industrie */}
            <div className="space-y-2">
              <Label htmlFor="industry" className="text-sm font-medium">Industrie</Label>
              <Select
                value={localFilters.industry}
                onValueChange={(value) => setLocalFilters({ ...localFilters, industry: value })}
              >
                <SelectTrigger id="industry">
                  <SelectValue placeholder="Toutes les industries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="bar_bistro_discotheque">Bar / Bistro / Discothèque</SelectItem>
                  <SelectItem value="boutique_commerce_detail">Boutique / Commerce de détail</SelectItem>
                  <SelectItem value="beaute_esthetique">Beauté / Esthétique</SelectItem>
                  <SelectItem value="sante_services_medicaux">Santé / Services médicaux</SelectItem>
                  <SelectItem value="garage_mecanique_concessionnaire">Garage / Mécanique</SelectItem>
                  <SelectItem value="education_garderie">Éducation / Garderie</SelectItem>
                  <SelectItem value="communications_informatique">Communications / Informatique</SelectItem>
                  <SelectItem value="entreprise_service">Entreprise de service</SelectItem>
                  <SelectItem value="construction">Construction</SelectItem>
                  <SelectItem value="depanneur">Dépanneur</SelectItem>
                  <SelectItem value="autres">Autres</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Prix minimum */}
            <div className="space-y-2">
              <Label htmlFor="minPrice" className="text-sm font-medium">Prix minimum</Label>
              <Input
                id="minPrice"
                type="number"
                placeholder="Ex: 50000"
                value={localFilters.minPrice}
                onChange={(e) => setLocalFilters({ ...localFilters, minPrice: e.target.value })}
                className="bg-background"
              />
            </div>

            {/* Prix maximum */}
            <div className="space-y-2">
              <Label htmlFor="maxPrice" className="text-sm font-medium">Prix maximum</Label>
              <Input
                id="maxPrice"
                type="number"
                placeholder="Ex: 500000"
                value={localFilters.maxPrice}
                onChange={(e) => setLocalFilters({ ...localFilters, maxPrice: e.target.value })}
                className="bg-background"
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{displayedBusinesses.length}</span> annonce{displayedBusinesses.length > 1 ? 's' : ''} affichée{displayedBusinesses.length > 1 ? 's' : ''}
            </p>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Réinitialiser les filtres
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Carte */}
      <div className="relative w-full h-[600px] rounded-xl overflow-hidden shadow-2xl border border-border/50">
        <div ref={mapContainer} className="absolute inset-0" />
        
        {isMapLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto"></div>
              <p className="text-sm text-muted-foreground">Chargement de la carte interactive...</p>
            </div>
          </div>
        )}
        
        {mapError && (
          <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-center space-y-4 p-6">
              <div className="text-destructive text-4xl">⚠️</div>
              <p className="text-lg font-semibold text-foreground">{mapError}</p>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline"
              >
                Recharger la page
              </Button>
            </div>
          </div>
        )}
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
