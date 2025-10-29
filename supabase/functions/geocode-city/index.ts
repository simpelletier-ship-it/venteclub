import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { city, province } = await req.json();
    
    if (!city) {
      throw new Error('City is required');
    }

    const mapboxToken = Deno.env.get('VITE_MAPBOX_TOKEN');
    if (!mapboxToken) {
      throw new Error('Mapbox token not configured');
    }

    // Construire la requête de géocodage
    const searchQuery = province ? `${city}, ${province}, Canada` : `${city}, Québec, Canada`;
    const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxToken}&country=CA&limit=1`;

    console.log('[GEOCODE] Searching for:', searchQuery);

    const response = await fetch(geocodingUrl);
    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      console.log('[GEOCODE] No results found');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Location not found' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      );
    }

    const [longitude, latitude] = data.features[0].center;
    const placeName = data.features[0].place_name;

    console.log('[GEOCODE] Found coordinates:', { latitude, longitude, placeName });

    return new Response(
      JSON.stringify({
        success: true,
        latitude,
        longitude,
        placeName
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('[GEOCODE] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});