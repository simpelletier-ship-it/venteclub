import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

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

    // Liste des images à uploader avec leurs URLs depuis Unsplash
    const images = [
      { name: 'cafe-real.jpg', url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&h=800&fit=crop&q=85' },
      { name: 'restaurant-real.jpg', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=800&fit=crop&q=85' },
      { name: 'boutique-real.jpg', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=800&fit=crop&q=85' },
      { name: 'garage-real.jpg', url: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1200&h=800&fit=crop&q=85' },
      { name: 'salon-real.jpg', url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&h=800&fit=crop&q=85' },
      { name: 'boulangerie-real.jpg', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&h=800&fit=crop&q=85' },
      { name: 'garderie-real.jpg', url: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=1200&h=800&fit=crop&q=85' },
      { name: 'depanneur-real.jpg', url: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=1200&h=800&fit=crop&q=85' },
      { name: 'agence-real.jpg', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=800&fit=crop&q=85' },
      { name: 'entretien-real.jpg', url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&h=800&fit=crop&q=85' }
    ];

    const results = [];

    for (const image of images) {
      try {
        console.log(`Uploading ${image.name}...`);

        // Télécharger l'image depuis Unsplash
        const response = await fetch(image.url);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${image.name}: ${response.statusText}`);
        }

        const imageBlob = await response.blob();
        const imageBuffer = await imageBlob.arrayBuffer();

        // Upload vers le bucket business-photos dans le dossier demo-photos
        const fileName = `demo-photos/${image.name}`;
        const { error: uploadError } = await supabaseClient.storage
          .from('business-photos')
          .upload(fileName, imageBuffer, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (uploadError) {
          console.error(`Upload error for ${image.name}:`, uploadError);
          results.push({
            name: image.name,
            success: false,
            error: uploadError.message
          });
          continue;
        }

        // Obtenir l'URL publique
        const { data: { publicUrl } } = supabaseClient.storage
          .from('business-photos')
          .getPublicUrl(fileName);

        results.push({
          name: image.name,
          success: true,
          publicUrl
        });

        console.log(`Successfully uploaded ${image.name}`);
      } catch (error) {
        console.error(`Error uploading ${image.name}:`, error);
        results.push({
          name: image.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return new Response(
      JSON.stringify({
        message: 'Image upload complete',
        results,
        total: results.length,
        successful: successCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
