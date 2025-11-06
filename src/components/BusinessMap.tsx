import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from './ui/card';
import { MapPin, Layers } from 'lucide-react';

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
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initMap = async () => {
      try {
        // Récupérer le token Mapbox
        console.log('[MAP] Fetching Mapbox token...');
        const { data: tokenData, error: tokenError } = await supabase.functions.invoke('get-mapbox-token');
        
        if (tokenError) {
          console.error('[MAP] Error fetching token:', tokenError);
          return;
        }
        
        if (!tokenData?.token) {
          console.error('[MAP] No token received');
          return;
        }

        console.log('[MAP] Token received, initializing map...');
        mapboxgl.accessToken = tokenData.token;

        // Créer la carte avec le style streets (VRAIE CARTE RÉELLE)
        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/light-v11', // Style clair avec bonne lisibilité
          center: [-71.2082, 46.8139], // Centre sur le Québec
          zoom: 6.5,
          pitch: 0,
          bearing: 0,
          antialias: true
        });

        console.log('[MAP] Map instance created with streets style');

        map.current.on('load', async () => {
          console.log('[MAP] ✅ Map loaded successfully!');
          
          // Add controls
          map.current!.addControl(new mapboxgl.NavigationControl(), 'top-right');
          
          // Add draw control for polygon selection
          const draw = new MapboxDraw({
            displayControlsDefault: false,
            controls: {
              polygon: true,
              trash: true
            },
            styles: [
              {
                'id': 'gl-draw-polygon-fill',
                'type': 'fill',
                'filter': ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
                'paint': {
                  'fill-color': 'hsl(var(--primary))',
                  'fill-opacity': 0.1
                }
              },
              {
                'id': 'gl-draw-polygon-stroke',
                'type': 'line',
                'filter': ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
                'layout': {
                  'line-cap': 'round',
                  'line-join': 'round'
                },
                'paint': {
                  'line-color': 'hsl(var(--primary))',
                  'line-width': 3
                }
              },
              {
                'id': 'gl-draw-line',
                'type': 'line',
                'filter': ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
                'layout': {
                  'line-cap': 'round',
                  'line-join': 'round'
                },
                'paint': {
                  'line-color': 'hsl(var(--primary))',
                  'line-width': 2
                }
              },
              {
                'id': 'gl-draw-polygon-and-line-vertex',
                'type': 'circle',
                'filter': ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
                'paint': {
                  'circle-radius': 6,
                  'circle-color': 'hsl(var(--primary))'
                }
              }
            ]
          });
          
          map.current!.addControl(draw, 'top-left');
          
          // Handle polygon drawing
          map.current!.on('draw.create', updateFilteredBusinesses);
          map.current!.on('draw.update', updateFilteredBusinesses);
          map.current!.on('draw.delete', () => {
            setFilteredBusinesses([]);
            updateMarkers(businesses);
          });
          
          function updateFilteredBusinesses() {
            const data = draw.getAll();
            if (data.features.length > 0) {
              const polygon = data.features[0];
              const filtered = businesses.filter((business: Business) => {
                const point = [business.longitude, business.latitude];
                return isPointInPolygon(point, polygon.geometry.coordinates[0]);
              });
              setFilteredBusinesses(filtered);
              updateMarkers(filtered);
            }
          }
          
          function isPointInPolygon(point: number[], polygon: number[][]) {
            let inside = false;
            for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
              const xi = polygon[i][0], yi = polygon[i][1];
              const xj = polygon[j][0], yj = polygon[j][1];
              const intersect = ((yi > point[1]) !== (yj > point[1]))
                && (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi);
              if (intersect) inside = !inside;
            }
            return inside;
          }
          
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
            updateMarkers(data);
          }
        });
        
        function updateMarkers(businessesToShow: Business[]) {
          // Clear existing markers
          markersRef.current.forEach(marker => marker.remove());
          markersRef.current = [];
          
          businessesToShow.forEach((business: Business) => {
            const el = document.createElement('div');
            el.className = 'business-marker';
            el.style.width = '32px';
            el.style.height = '32px';
            el.style.borderRadius = '50%';
            el.style.cursor = 'pointer';
            el.style.transition = 'all 0.3s ease';
            
            // Color based on type
            if (business.is_franchise) {
              el.style.background = 'linear-gradient(135deg, hsl(var(--franchise)), hsl(var(--franchise-light)))';
            } else if (business.sale_type === 'property') {
              el.style.background = 'linear-gradient(135deg, hsl(142, 76%, 36%), hsl(142, 76%, 46%))';
            } else {
              el.style.background = 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-light)))';
            }
            
            el.style.border = '3px solid white';
            el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
            
            // Hover effect
            el.addEventListener('mouseenter', () => {
              el.style.transform = 'scale(1.2)';
              el.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
            });
            el.addEventListener('mouseleave', () => {
              el.style.transform = 'scale(1)';
              el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
            });

            const marker = new mapboxgl.Marker(el)
              .setLngLat([business.longitude, business.latitude])
              .setPopup(
                new mapboxgl.Popup({ 
                  offset: 25,
                  className: 'business-popup'
                })
                  .setHTML(`
                    <div style="padding: 12px; min-width: 200px;">
                      <h3 style="font-weight: 700; margin-bottom: 6px; font-size: 15px; color: hsl(var(--foreground));">${business.title}</h3>
                      <p style="font-size: 13px; color: hsl(var(--muted-foreground)); margin-bottom: 8px; display: flex; align-items: center;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        ${business.city}
                      </p>
                      <p style="font-weight: 700; background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-light))); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 12px; font-size: 16px;">${business.asking_price.toLocaleString('fr-CA')} $</p>
                      <button 
                        onclick="window.location.href='/entreprise/${business.slug}'"
                        style="background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-light))); color: white; padding: 8px 16px; border: none; border-radius: 8px; cursor: pointer; width: 100%; font-weight: 600; font-size: 13px; transition: all 0.3s ease; box-shadow: 0 2px 8px hsla(var(--primary), 0.3);"
                        onmouseenter="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px hsla(var(--primary), 0.4)'"
                        onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px hsla(var(--primary), 0.3)'"
                      >
                        Voir l'annonce
                      </button>
                    </div>
                  `)
              )
              .addTo(map.current!);
            
            markersRef.current.push(marker);
          });
          
          console.log('[MAP] Added', businessesToShow.length, 'markers');
        }

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
      <Card className="border-border/50 shadow-lg overflow-hidden">
        <CardContent className="p-0">
          <div ref={mapContainer} className="w-full h-[650px]" />
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border/50 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total des entreprises</p>
                <p className="text-2xl font-bold text-foreground">{businesses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {filteredBusinesses.length > 0 && (
          <Card className="border-border/50 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Layers className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dans la zone sélectionnée</p>
                  <p className="text-2xl font-bold text-foreground">{filteredBusinesses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BusinessMap;
