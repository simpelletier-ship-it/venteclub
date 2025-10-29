import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const mapboxToken = Deno.env.get('VITE_MAPBOX_TOKEN');
    if (!mapboxToken) {
      throw new Error('Mapbox token not configured');
    }

    // Récupérer toutes les annonces sans coordonnées
    const { data: businesses, error: fetchError } = await supabaseClient
      .from('businesses')
      .select('id, city, province')
      .or('latitude.is.null,longitude.is.null');

    if (fetchError) throw fetchError;

    console.log(`[UPDATE-COORDS] Found ${businesses?.length || 0} businesses without coordinates`);

    const results = {
      total: businesses?.length || 0,
      updated: 0,
      failed: 0,
      errors: [] as string[]
    };

    if (!businesses || businesses.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No businesses need coordinate updates',
          results 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Mettre à jour chaque annonce
    for (const business of businesses) {
      try {
        if (!business.city) {
          console.log(`[UPDATE-COORDS] Skipping business ${business.id} - no city`);
          results.failed++;
          results.errors.push(`${business.id}: No city specified`);
          continue;
        }

        const searchQuery = business.province 
          ? `${business.city}, ${business.province}, Canada` 
          : `${business.city}, Québec, Canada`;
        
        const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxToken}&country=CA&limit=1`;

        console.log(`[UPDATE-COORDS] Geocoding: ${searchQuery}`);

        const response = await fetch(geocodingUrl);
        const data = await response.json();

        if (!data.features || data.features.length === 0) {
          console.log(`[UPDATE-COORDS] No results for ${searchQuery}`);
          results.failed++;
          results.errors.push(`${business.id}: Location not found for ${searchQuery}`);
          continue;
        }

        const [longitude, latitude] = data.features[0].center;

        // Mettre à jour l'annonce
        const { error: updateError } = await supabaseClient
          .from('businesses')
          .update({ latitude, longitude })
          .eq('id', business.id);

        if (updateError) {
          console.error(`[UPDATE-COORDS] Error updating ${business.id}:`, updateError);
          results.failed++;
          results.errors.push(`${business.id}: ${updateError.message}`);
        } else {
          console.log(`[UPDATE-COORDS] Updated ${business.id}: ${latitude}, ${longitude}`);
          results.updated++;
        }

        // Petit délai pour ne pas surcharger l'API Mapbox
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[UPDATE-COORDS] Error processing ${business.id}:`, error);
        results.failed++;
        results.errors.push(`${business.id}: ${errorMessage}`);
      }
    }

    console.log('[UPDATE-COORDS] Results:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Updated ${results.updated} of ${results.total} businesses`,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[UPDATE-COORDS] Error:', error);
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