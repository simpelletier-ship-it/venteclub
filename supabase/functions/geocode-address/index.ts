import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const MAPBOX_ACCESS_TOKEN = Deno.env.get('MAPBOX_ACCESS_TOKEN');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, limit = 5 } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!MAPBOX_ACCESS_TOKEN) {
      console.error('MAPBOX_ACCESS_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Mapbox token not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Geocode using Mapbox API
    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=CA&types=address&limit=${limit}&language=fr`;

    console.log('Fetching from Mapbox:', url.replace(MAPBOX_ACCESS_TOKEN, 'REDACTED'));

    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mapbox API error:', errorText);
      throw new Error(`Mapbox API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract coordinates from Mapbox response
    if (data.features && data.features.length > 0) {
      const [longitude, latitude] = data.features[0].center;
      console.log('Geocoded successfully:', { latitude, longitude });
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          latitude, 
          longitude,
          place_name: data.features[0].place_name
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    } else {
      console.log('No results found');
      return new Response(
        JSON.stringify({ success: false, error: 'No results found' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Error in geocode-address function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
