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

    // Récupérer toutes les annonces demo
    const { data: businesses, error: fetchError } = await supabaseClient
      .from('businesses')
      .select('id, title, industry, is_franchise, sale_type, property_type')
      .eq('is_demo', true)
      .eq('approval_status', 'approved');

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${businesses?.length || 0} demo businesses`);

    if (!businesses || businesses.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No demo businesses found',
          processed: 0,
          successful: 0,
          results: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    for (const business of businesses) {
      try {
        console.log(`Processing business: ${business.title} (${business.id})`);
        
        // Supprimer les anciennes photos pour cette annonce démo
        const { error: deleteError } = await supabaseClient
          .from('business_photos')
          .delete()
          .eq('business_id', business.id);

        if (deleteError) {
          console.error(`Delete error for ${business.id}:`, deleteError);
        } else {
          console.log(`Deleted existing photos for ${business.title}`);
        }

        // Mapper les industries aux images réalistes
        const industryImages: Record<string, string> = {
          'restaurant': 'restaurant-real.jpg',
          'beaute_esthetique': 'salon-real.jpg',
          'garage_mecanique_concessionnaire': 'garage-real.jpg',
          'boutique_commerce_detail': 'boutique-real.jpg',
          'communications_informatique': 'agence-real.jpg',
          'bar_bistro_discotheque': 'cafe-real.jpg',
          'epicerie_depanneur': 'depanneur-real.jpg',
          'entreprise_service': 'entretien-real.jpg',
          'education_garderie': 'garderie-real.jpg',
          'boulangerie_patisserie': 'boulangerie-real.jpg'
        };

        // Déterminer quelle image utiliser
        let imageName = '';
        if (business.property_type) {
          // Pour les propriétés immobilières, utiliser l'image de bureau par défaut
          imageName = 'agence-real.jpg';
        } else if (business.is_franchise) {
          // Pour les franchises, utiliser l'image appropriée selon l'industrie
          imageName = industryImages[business.industry] || 'boutique-real.jpg';
        } else {
          imageName = industryImages[business.industry] || 'agence-real.jpg';
        }

        console.log(`Using realistic image ${imageName} for ${business.title}`);

        // Récupérer l'image depuis le dossier public
        const imageUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/business-photos/demo-photos/${imageName}`;
        
        // Télécharger l'image depuis public/demo-photos
        const imageResponse = await fetch(`https://xmwsrvaricrfxovimffm.supabase.co/storage/v1/object/public/business-photos/demo-photos/${imageName}`);
        
        if (!imageResponse.ok) {
          // Fallback: essayer de récupérer depuis l'ancien emplacement
          const fallbackUrl = `/demo-photos/${imageName}`;
          console.log(`Image not found in storage, trying to copy from public folder: ${fallbackUrl}`);
          
          // Pour l'instant, on utilise une URL publique directe
          const publicImageUrl = `https://xmwsrvaricrfxovimffm.supabase.co/storage/v1/object/public/business-photos/demo-photos/${imageName}`;
          
          // Insérer directement l'URL publique
          const { error: insertError } = await supabaseClient
            .from('business_photos')
            .insert({
              business_id: business.id,
              photo_url: publicImageUrl,
              display_order: 0
            });

          if (insertError) {
            console.error(`Insert error for ${business.id}:`, insertError);
            continue;
          }

          results.push({
            business_id: business.id,
            title: business.title,
            photo_url: publicImageUrl,
            success: true
          });

          console.log(`Successfully assigned photo for ${business.title}`);
          continue;
        }

        const imageBlob = await imageResponse.blob();
        const imageBuffer = await imageBlob.arrayBuffer();
        
        // Upload vers le bucket business-photos
        const fileName = `${business.id}/main-photo.jpg`;
        const { error: uploadError } = await supabaseClient.storage
          .from('business-photos')
          .upload(fileName, imageBuffer, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (uploadError) {
          console.error(`Upload error for ${business.id}:`, uploadError);
          continue;
        }

        // Obtenir l'URL publique
        const { data: { publicUrl } } = supabaseClient.storage
          .from('business-photos')
          .getPublicUrl(fileName);

        // Insérer dans business_photos
        const { error: insertError } = await supabaseClient
          .from('business_photos')
          .insert({
            business_id: business.id,
            photo_url: publicUrl,
            display_order: 0
          });

        if (insertError) {
          console.error(`Insert error for ${business.id}:`, insertError);
          continue;
        }

        results.push({
          business_id: business.id,
          title: business.title,
          photo_url: publicUrl,
          success: true
        });

        console.log(`Successfully generated and uploaded photo for ${business.title}`);

        // Attendre un peu entre chaque génération pour éviter le rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`Error processing business ${business.id}:`, error);
        results.push({
          business_id: business.id,
          title: business.title,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Photo generation complete',
        results,
        processed: results.length,
        successful: results.filter(r => r.success).length
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
