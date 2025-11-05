import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Try MAPBOX_ACCESS_TOKEN first, then fallback to VITE_MAPBOX_TOKEN
    const mapboxToken = Deno.env.get('MAPBOX_ACCESS_TOKEN') || Deno.env.get('VITE_MAPBOX_TOKEN');
    
    if (!mapboxToken) {
      throw new Error('Mapbox token not configured');
    }

    console.log('[MAPBOX TOKEN] Token found and returned');

    return new Response(
      JSON.stringify({ token: mapboxToken }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
        } 
      }
    );
  } catch (error) {
    console.error('Error getting Mapbox token:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
