import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { formatPrice } from '@/lib/priceFormat';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { X, ExternalLink } from 'lucide-react';

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
  industry: string;
  annual_revenue: number;
}

interface MapClusterViewProps {
  businesses: Business[];
  onBusinessHover?: (businessId: string | null) => void;
  filters?: any;
}

export const MapClusterView = ({ businesses, onBusinessHover, filters }: MapClusterViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const navigate = useNavigate();
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initMap = async () => {
      try {
        const { data: tokenData, error: tokenError } = await supabase.functions.invoke('get-mapbox-token');
        
        if (tokenError || !tokenData?.token) {
          console.error('[MAP] Error fetching token');
          return;
        }

        mapboxgl.accessToken = tokenData.token;

        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [-71.2082, 46.8139],
          zoom: 6.5,
          pitch: 45,
          bearing: 0,
          antialias: true
        });

        map.current.on('load', () => {
          if (!map.current) return;

          // Add 3D buildings
          map.current.addLayer({
            'id': '3d-buildings',
            'source': 'composite',
            'source-layer': 'building',
            'filter': ['==', 'extrude', 'true'],
            'type': 'fill-extrusion',
            'minzoom': 12,
            'paint': {
              'fill-extrusion-color': 'hsl(var(--muted))',
              'fill-extrusion-height': [
                'interpolate',
                ['linear'],
                ['zoom'],
                12,
                0,
                15.05,
                ['get', 'height']
              ],
              'fill-extrusion-base': [
                'interpolate',
                ['linear'],
                ['zoom'],
                12,
                0,
                15.05,
                ['get', 'min_height']
              ],
              'fill-extrusion-opacity': 0.6
            }
          });

          // Add businesses data source
          map.current.addSource('businesses', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: businesses.map(b => ({
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [b.longitude, b.latitude]
                },
                properties: {
                  id: b.id,
                  title: b.title,
                  slug: b.slug,
                  price: b.asking_price,
                  industry: b.industry,
                  city: b.city,
                  revenue: b.annual_revenue
                }
              }))
            },
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50
          });

          // Clusters
          map.current.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'businesses',
            filter: ['has', 'point_count'],
            paint: {
              'circle-color': [
                'step',
                ['get', 'point_count'],
                'hsl(var(--primary))',
                10,
                'hsl(var(--chart-2))',
                30,
                'hsl(var(--chart-3))'
              ],
              'circle-radius': [
                'step',
                ['get', 'point_count'],
                20,
                10,
                30,
                30,
                40
              ],
              'circle-opacity': 0.8,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#fff'
            }
          });

          // Cluster count
          map.current.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: 'businesses',
            filter: ['has', 'point_count'],
            layout: {
              'text-field': '{point_count_abbreviated}',
              'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
              'text-size': 14
            },
            paint: {
              'text-color': '#ffffff'
            }
          });

          // Individual points
          map.current.addLayer({
            id: 'unclustered-point',
            type: 'circle',
            source: 'businesses',
            filter: ['!', ['has', 'point_count']],
            paint: {
              'circle-color': 'hsl(var(--primary))',
              'circle-radius': 8,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#fff',
              'circle-opacity': 0.9
            }
          });

          // Point price labels
          map.current.addLayer({
            id: 'unclustered-point-label',
            type: 'symbol',
            source: 'businesses',
            filter: ['!', ['has', 'point_count']],
            layout: {
              'text-field': ['concat', ['number-format', ['get', 'price'], {'min-fraction-digits': 0, 'max-fraction-digits': 0}], '$'],
              'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
              'text-size': 10,
              'text-offset': [0, 1.5],
              'text-anchor': 'top'
            },
            paint: {
              'text-color': 'hsl(var(--foreground))',
              'text-halo-color': 'hsl(var(--background))',
              'text-halo-width': 1
            }
          });

          // Click handlers
          map.current.on('click', 'clusters', (e) => {
            if (!map.current) return;
            const features = map.current.queryRenderedFeatures(e.point, {
              layers: ['clusters']
            });
            const clusterId = features[0].properties.cluster_id;
            (map.current.getSource('businesses') as mapboxgl.GeoJSONSource)
              .getClusterExpansionZoom(clusterId, (err, zoom) => {
                if (err || !map.current) return;
                const coords = (features[0].geometry as any).coordinates;
                map.current.easeTo({
                  center: coords,
                  zoom: zoom
                });
              });
          });

          map.current.on('click', 'unclustered-point', (e) => {
            if (!map.current || !e.features || !e.features[0]) return;
            
            const coordinates = (e.features[0].geometry as any).coordinates.slice();
            const properties = e.features[0].properties;
            
            const business = businesses.find(b => b.id === properties.id);
            if (business) {
              setSelectedBusiness(business);
              
              // Create popup
              if (popupRef.current) {
                popupRef.current.remove();
              }
              
              const popupContent = document.createElement('div');
              popupContent.className = 'p-2';
              popupContent.innerHTML = `
                <div class="space-y-2">
                  <h3 class="font-bold text-sm">${properties.title}</h3>
                  <p class="text-xs text-muted-foreground">${properties.city}</p>
                  <p class="text-sm font-semibold text-primary">${formatPrice(properties.price)}</p>
                  <p class="text-xs">${properties.industry}</p>
                </div>
              `;
              
              popupRef.current = new mapboxgl.Popup({ offset: 25 })
                .setLngLat(coordinates)
                .setDOMContent(popupContent)
                .addTo(map.current);
            }
          });

          // Hover effects
          map.current.on('mouseenter', 'clusters', () => {
            if (map.current) map.current.getCanvas().style.cursor = 'pointer';
          });
          map.current.on('mouseleave', 'clusters', () => {
            if (map.current) map.current.getCanvas().style.cursor = '';
          });
          map.current.on('mouseenter', 'unclustered-point', () => {
            if (map.current) map.current.getCanvas().style.cursor = 'pointer';
          });
          map.current.on('mouseleave', 'unclustered-point', () => {
            if (map.current) map.current.getCanvas().style.cursor = '';
          });

          // Add controls
          map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
          map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');
        });

      } catch (error) {
        console.error('[MAP] Error:', error);
      }
    };

    initMap();

    return () => {
      if (popupRef.current) {
        popupRef.current.remove();
      }
      map.current?.remove();
    };
  }, []);

  // Update data when businesses change
  useEffect(() => {
    if (map.current && map.current.isStyleLoaded()) {
      const source = map.current.getSource('businesses') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: businesses.map(b => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [b.longitude, b.latitude]
            },
            properties: {
              id: b.id,
              title: b.title,
              slug: b.slug,
              price: b.asking_price,
              industry: b.industry,
              city: b.city,
              revenue: b.annual_revenue
            }
          }))
        });
      }
    }
  }, [businesses]);

  return (
    <div className="relative w-full h-[600px] rounded-lg overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Selected Business Card */}
      {selectedBusiness && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-card border rounded-lg p-4 shadow-lg">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-lg pr-6">{selectedBusiness.title}</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedBusiness(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Prix:</span>
              <span className="font-semibold text-primary">
                {formatPrice(selectedBusiness.asking_price)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Revenus:</span>
              <span className="font-medium">
                {formatPrice(selectedBusiness.annual_revenue)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Industrie:</span>
              <span>{selectedBusiness.industry}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ville:</span>
              <span>{selectedBusiness.city}</span>
            </div>
          </div>

          <Button
            className="w-full mt-4 gap-2"
            onClick={() => navigate(`/entreprise/${selectedBusiness.slug}`)}
          >
            Voir les détails
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
