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
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [zoomLevel, setZoomLevel] = useState(6);
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
        style: 'mapbox://styles/mapbox/streets-v12',
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
    if (!map.current || businesses.length === 0) return;

    // Wait for map to load before adding sources and layers
    const addBusinessLayers = () => {
      if (!map.current) return;

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
            title: business.title,
            location: business.location,
            asking_price: business.asking_price,
            annual_revenue: business.annual_revenue || null,
            description: business.description,
            photo_url: business.photo_url || null,
            status: business.status,
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

      // Add cluster circles layer
      map.current.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'businesses',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            'hsl(270 100% 60%)', // Color for small clusters
            10,
            'hsl(270 100% 55%)', // Color for medium clusters
            30,
            'hsl(270 100% 50%)', // Color for large clusters
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            20, // Size for small clusters
            10,
            30, // Size for medium clusters
            30,
            40, // Size for large clusters
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

      // Add unclustered points layer
      map.current.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'businesses',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': 'hsl(270 100% 60%)',
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

        const popupContent = `
          <div style="padding: 0; max-width: 300px;">
            ${props.photo_url ? `
              <img 
                src="${props.photo_url}" 
                alt="${props.title}"
                style="width: 100%; height: 150px; object-fit: cover; border-radius: 12px 12px 0 0;"
              />
            ` : ''}
            <div style="padding: 12px;">
              <h3 style="font-weight: 700; margin-bottom: 8px; font-size: 16px; color: hsl(252 47% 11%); line-height: 1.3;">
                ${props.title}
              </h3>
              <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 8px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(270 100% 60%)" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span style="color: hsl(252 15% 50%); font-size: 13px;">${props.location}</span>
              </div>
              <p style="color: hsl(252 15% 50%); font-size: 13px; margin-bottom: 10px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                ${props.description}
              </p>
              <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid hsl(252 20% 90%);">
                <div>
                  <div style="font-size: 11px; color: hsl(252 15% 50%); text-transform: uppercase; margin-bottom: 2px;">Prix demandé</div>
                  <div style="font-weight: 700; color: hsl(270 100% 60%); font-size: 18px;">
                    ${Number(props.asking_price).toLocaleString('fr-CA')} $
                  </div>
                </div>
                ${props.annual_revenue ? `
                  <div style="text-align: right;">
                    <div style="font-size: 11px; color: hsl(252 15% 50%); text-transform: uppercase; margin-bottom: 2px;">Chiffre d'affaires</div>
                    <div style="font-size: 13px; font-weight: 600; color: hsl(252 47% 11%);">
                      ${Number(props.annual_revenue).toLocaleString('fr-CA')} $
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

        popup.setLngLat(coordinates).setHTML(popupContent).addTo(map.current);
      });

      map.current.on('mouseleave', 'unclustered-point', () => {
        if (!map.current) return;
        map.current.getCanvas().style.cursor = '';
        popup.remove();
      });

      // Click on unclustered point to navigate
      map.current.on('click', 'unclustered-point', (e) => {
        const businessId = e.features![0].properties!.id;
        navigate(`/business/${businessId}`);
      });

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

    if (map.current.isStyleLoaded()) {
      addBusinessLayers();
    } else {
      map.current.on('load', addBusinessLayers);
    }

  }, [businesses, navigate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
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