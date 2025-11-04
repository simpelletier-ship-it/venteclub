import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Fetching demo businesses...');
    
    // Récupérer toutes les annonces démo sans images
    const { data: demoBusinesses, error: fetchError } = await supabaseClient
      .from('businesses')
      .select('id, title, description, industry')
      .eq('is_demo', true);

    if (fetchError) {
      console.error('Error fetching demo businesses:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${demoBusinesses?.length || 0} demo businesses`);

    const results = [];

    for (const business of demoBusinesses || []) {
      try {
        console.log(`Generating image for: ${business.title}`);

        // Appeler l'edge function de génération d'image
        const { data: imageData, error: imageError } = await supabaseClient.functions.invoke(
          'generate-business-image',
          {
            body: {
              title: business.title,
              description: business.description,
              industry: business.industry,
            },
          }
        );

        if (imageError || !imageData?.imageUrl) {
          console.error(`Failed to generate image for ${business.title}:`, imageError);
          results.push({
            businessId: business.id,
            title: business.title,
            success: false,
            error: imageError?.message || 'No image URL returned',
          });
          continue;
        }

        console.log(`Image generated successfully for ${business.title}`);

        // Insérer l'image dans business_photos
        const { error: photoError } = await supabaseClient
          .from('business_photos')
          .insert({
            business_id: business.id,
            photo_url: imageData.imageUrl,
            display_order: 0,
          });

        if (photoError) {
          console.error(`Failed to save photo for ${business.title}:`, photoError);
          results.push({
            businessId: business.id,
            title: business.title,
            success: false,
            error: photoError.message,
          });
        } else {
          console.log(`Photo saved successfully for ${business.title}`);
          results.push({
            businessId: business.id,
            title: business.title,
            success: true,
            imageUrl: imageData.imageUrl,
          });
        }

        // Attendre un peu entre chaque génération pour éviter les rate limits
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error: any) {
        console.error(`Error processing ${business.title}:`, error);
        results.push({
          businessId: business.id,
          title: business.title,
          success: false,
          error: error?.message || 'Unknown error',
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    console.log(`Generation complete: ${successCount}/${results.length} successful`);

    return new Response(
      JSON.stringify({
        success: true,
        totalProcessed: results.length,
        successfulGenerations: successCount,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in generate-demo-images:', error);
    return new Response(
      JSON.stringify({
        error: error?.message || 'Unknown error',
        details: error?.toString() || 'No details available',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
