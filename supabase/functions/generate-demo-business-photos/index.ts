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

    // Récupérer toutes les annonces demo sans photos
    const { data: businesses, error: fetchError } = await supabaseClient
      .from('businesses')
      .select('id, title, industry, is_franchise, sale_type, property_type')
      .eq('is_demo', true)
      .eq('approval_status', 'approved');

    if (fetchError) throw fetchError;

    if (!businesses || businesses.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No demo businesses found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = [];

    for (const business of businesses) {
      try {
        // Vérifier si cette annonce a déjà des photos
        const { data: existingPhotos } = await supabaseClient
          .from('business_photos')
          .select('id')
          .eq('business_id', business.id)
          .limit(1);

        if (existingPhotos && existingPhotos.length > 0) {
          console.log(`Business ${business.id} already has photos, skipping...`);
          continue;
        }

        // Générer un prompt basé sur le type d'entreprise
        let prompt = '';
        if (business.property_type) {
          prompt = `Professional high-quality real estate photo of a ${business.property_type} commercial property in Quebec. Modern, well-maintained building exterior shot. Clean, professional, inviting. Ultra high resolution. 16:9 aspect ratio.`;
        } else if (business.is_franchise) {
          prompt = `Professional franchise business storefront photo for ${business.title}. Clean, modern, inviting retail environment. High-quality commercial photography. Ultra high resolution. 16:9 aspect ratio.`;
        } else {
          // Prompts basés sur l'industrie
          const industryPrompts: Record<string, string> = {
            'restaurant': 'Professional interior photo of upscale restaurant dining room. Elegant tables, ambient lighting, inviting atmosphere. High-quality commercial photography. Ultra high resolution. 16:9 aspect ratio.',
            'beaute_esthetique': 'Professional interior photo of modern beauty salon. Clean, bright, welcoming spa environment with styling stations. High-quality commercial photography. Ultra high resolution. 16:9 aspect ratio.',
            'garage_mecanique_concessionnaire': 'Professional photo of modern auto repair shop. Clean garage with car lifts, professional equipment. High-quality commercial photography. Ultra high resolution. 16:9 aspect ratio.',
            'boutique_commerce_detail': 'Professional interior photo of upscale retail boutique. Well-merchandised displays, elegant lighting, inviting shopping environment. High-quality commercial photography. Ultra high resolution. 16:9 aspect ratio.',
            'communications_informatique': 'Professional modern office workspace photo. Clean desks, computers, collaborative environment. High-quality commercial photography. Ultra high resolution. 16:9 aspect ratio.',
            'bar_bistro_discotheque': 'Professional interior photo of trendy cafe bistro. Cozy seating, warm lighting, inviting atmosphere. High-quality commercial photography. Ultra high resolution. 16:9 aspect ratio.',
            'epicerie_depanneur': 'Professional interior photo of convenience store. Well-stocked shelves, clean aisles, modern retail environment. High-quality commercial photography. Ultra high resolution. 16:9 aspect ratio.',
            'entreprise_service': 'Professional office photo of service business. Clean, organized workspace with team collaboration. High-quality commercial photography. Ultra high resolution. 16:9 aspect ratio.',
            'education_garderie': 'Professional photo of bright, colorful daycare center. Safe play areas, educational materials, welcoming environment for children. High-quality commercial photography. Ultra high resolution. 16:9 aspect ratio.'
          };
          
          prompt = industryPrompts[business.industry] || 'Professional commercial business interior photo. Clean, modern, professional environment. High-quality commercial photography. Ultra high resolution. 16:9 aspect ratio.';
        }

        console.log(`Generating image for ${business.title} with prompt: ${prompt}`);

        // Générer l'image avec l'API Lovable AI
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash-image-preview',
            messages: [{
              role: 'user',
              content: prompt
            }],
            modalities: ['image', 'text']
          })
        });

        if (!response.ok) {
          throw new Error(`AI API failed: ${response.statusText}`);
        }

        const aiData = await response.json();
        const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageUrl) {
          console.error('No image URL returned from AI');
          continue;
        }

        // Convertir base64 en blob
        const base64Data = imageUrl.split(',')[1];
        const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        
        // Upload vers le bucket business-photos
        const fileName = `${business.id}/main-photo.jpg`;
        const { error: uploadError } = await supabaseClient.storage
          .from('business-photos')
          .upload(fileName, binaryData, {
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
