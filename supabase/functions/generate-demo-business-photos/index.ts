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

        // Mapper les industries aux images réalistes - maintenant avec plusieurs images par type
        const industryImageSets: Record<string, string[]> = {
          'restaurant': ['restaurant-real.jpg', 'trattoria.jpg', 'cafe-real.jpg'],
          'beaute_esthetique': ['salon-real.jpg', 'salon.jpg'],
          'garage_mecanique_concessionnaire': ['garage-real.jpg', 'garage.jpg'],
          'boutique_commerce_detail': ['boutique-real.jpg', 'boutique.jpg'],
          'communications_informatique': ['agence-real.jpg', 'agence.jpg'],
          'bar_bistro_discotheque': ['cafe-real.jpg', 'cafe.jpg'],
          'epicerie_depanneur': ['depanneur-real.jpg', 'depanneur.jpg'],
          'entreprise_service': ['entretien-real.jpg', 'entretien.jpg'],
          'education_garderie': ['garderie-real.jpg', 'garderie.jpg'],
          'boulangerie_patisserie': ['boulangerie-real.jpg', 'boulangerie.jpg']
        };

        // Images complémentaires génériques pour éviter les doublons
        const genericImages = ['agence-real.jpg', 'boutique-real.jpg', 'entretien-real.jpg', 'cafe-real.jpg'];

        // Déterminer quelles images utiliser (4-5 images par annonce, sans doublons)
        let imageNames: string[] = [];
        if (business.property_type) {
          // Pour les propriétés immobilières
          imageNames = ['agence-real.jpg', 'agence.jpg', 'boutique-real.jpg', 'entretien-real.jpg'];
        } else if (business.is_franchise) {
          // Pour les franchises
          const baseImages = industryImageSets[business.industry] || ['boutique-real.jpg', 'boutique.jpg'];
          imageNames = [...baseImages];
          
          // Ajouter des images génériques uniques pour avoir 4-5 images
          for (const genericImage of genericImages) {
            if (imageNames.length >= 4) break;
            if (!imageNames.includes(genericImage)) {
              imageNames.push(genericImage);
            }
          }
        } else {
          const baseImages = industryImageSets[business.industry] || ['agence-real.jpg', 'agence.jpg'];
          imageNames = [...baseImages];
          
          // Ajouter des images génériques uniques
          for (const genericImage of genericImages) {
            if (imageNames.length >= 4) break;
            if (!imageNames.includes(genericImage)) {
              imageNames.push(genericImage);
            }
          }
        }

        console.log(`Using ${imageNames.length} unique realistic images for ${business.title}`);

        // Générer et uploader chaque image
        const uploadedPhotos = [];
        for (let i = 0; i < imageNames.length; i++) {
          const imageName = imageNames[i];
          const displayOrder = i;

          try {
            // URL publique de l'image
            const publicImageUrl = `https://xmwsrvaricrfxovimffm.supabase.co/storage/v1/object/public/business-photos/demo-photos/${imageName}`;
            
            // Télécharger l'image
            const imageResponse = await fetch(publicImageUrl);
            
            if (!imageResponse.ok) {
              console.log(`Image not found: ${imageName}, skipping`);
              continue;
            }

            const imageBlob = await imageResponse.blob();
            const imageBuffer = await imageBlob.arrayBuffer();
            
            // Upload vers le bucket business-photos avec un nom unique
            const fileName = `${business.id}/photo-${i + 1}.jpg`;
            const { error: uploadError } = await supabaseClient.storage
              .from('business-photos')
              .upload(fileName, imageBuffer, {
                contentType: 'image/jpeg',
                upsert: true
              });

            if (uploadError) {
              console.error(`Upload error for ${business.id} photo ${i + 1}:`, uploadError);
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
                display_order: displayOrder
              });

            if (insertError) {
              console.error(`Insert error for ${business.id} photo ${i + 1}:`, insertError);
              continue;
            }

            uploadedPhotos.push({
              photo_url: publicUrl,
              display_order: displayOrder
            });

            console.log(`Successfully uploaded photo ${i + 1}/${imageNames.length} for ${business.title}`);
            
            // Attendre un peu entre chaque upload
            await new Promise(resolve => setTimeout(resolve, 500));

          } catch (photoError) {
            console.error(`Error processing photo ${i + 1} for ${business.id}:`, photoError);
          }
        }

        results.push({
          business_id: business.id,
          title: business.title,
          photos_count: uploadedPhotos.length,
          photos: uploadedPhotos,
          success: uploadedPhotos.length > 0
        });

        console.log(`Successfully generated and uploaded ${uploadedPhotos.length} photos for ${business.title}`);

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
