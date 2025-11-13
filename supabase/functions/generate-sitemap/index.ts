import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Parse request body to get source
    let source = 'manual';
    try {
      const body = await req.json();
      source = body.source || 'manual';
    } catch {
      // Si pas de body, c'est un appel manuel direct
    }

    console.log(`[SITEMAP] Starting generation from source: ${source}`);

    // Vérifier le cache (uniquement pour les appels non-manuels)
    if (source !== 'manual') {
      const { data: cachedSitemap } = await supabaseClient
        .from('sitemap_cache')
        .select('xml_content, generated_at')
        .order('generated_at', { ascending: false })
        .limit(1)
        .single();

      if (cachedSitemap) {
        const timeSinceGeneration = Date.now() - new Date(cachedSitemap.generated_at).getTime();
        const fiveMinutes = 5 * 60 * 1000;

        // Si moins de 5 minutes, retourner le cache
        if (timeSinceGeneration < fiveMinutes) {
          console.log(`[SITEMAP] Returning cached sitemap (${Math.floor(timeSinceGeneration / 1000)}s old)`);
          return new Response(cachedSitemap.xml_content, {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/xml",
              "Cache-Control": "public, max-age=300",
              "X-Sitemap-Source": "cache",
            },
            status: 200,
          });
        }
      }
    }

    // Fetch all approved businesses
    const { data: businesses, error: businessError } = await supabaseClient
      .from('businesses')
      .select('slug, updated_at, status')
      .eq('approval_status', 'approved')
      .eq('status', 'active');

    if (businessError) {
      console.error('[SITEMAP] Error fetching businesses:', businessError);
    }

    // Fetch all published blog posts
    const { data: blogPosts, error: blogError } = await supabaseClient
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('published', true);

    if (blogError) {
      console.error('[SITEMAP] Error fetching blog posts:', blogError);
    }

    const today = new Date().toISOString();

    // Generate XML sitemap
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  
  <!-- Homepage -->
  <url>
    <loc>https://vente.club/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <lastmod>${today}</lastmod>
  </url>
  
  <!-- Main Pages -->
  <url>
    <loc>https://vente.club/businesses</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
    <lastmod>${today}</lastmod>
  </url>
  
  <url>
    <loc>https://vente.club/blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
    <lastmod>${today}</lastmod>
  </url>
  
  <!-- Outils Financiers -->
  <url>
    <loc>https://vente.club/outils</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <lastmod>${today}</lastmod>
  </url>
  
  <url>
    <loc>https://vente.club/outils/salaire</loc>
    <changefreq>monthly</changefreq>
    <priority>0.95</priority>
    <lastmod>${today}</lastmod>
  </url>
  
  <url>
    <loc>https://vente.club/outils/retour-impot</loc>
    <changefreq>monthly</changefreq>
    <priority>0.95</priority>
    <lastmod>${today}</lastmod>
  </url>
  
  <url>
    <loc>https://vente.club/outils/budget</loc>
    <changefreq>weekly</changefreq>
    <priority>0.95</priority>
    <lastmod>${today}</lastmod>
  </url>
  
  <!-- Static Pages -->
  <url>
    <loc>https://vente.club/map</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <url>
    <loc>https://vente.club/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>https://vente.club/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>https://vente.club/sell</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <url>
    <loc>https://vente.club/list-business</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <url>
    <loc>https://vente.club/faq</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>https://vente.club/resources</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;

    let entryCount = 13; // Nombre de pages statiques

    // Add business listings
    if (businesses && businesses.length > 0) {
      businesses.forEach((business) => {
        const lastmod = business.updated_at 
          ? new Date(business.updated_at).toISOString() 
          : today;
        
        xml += `  <url>
    <loc>https://vente.club/business/${business.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <lastmod>${lastmod}</lastmod>
  </url>
`;
        entryCount++;
      });
    }

    // Add blog posts
    if (blogPosts && blogPosts.length > 0) {
      blogPosts.forEach((post) => {
        const lastmod = post.updated_at 
          ? new Date(post.updated_at).toISOString() 
          : today;
        
        xml += `  <url>
    <loc>https://vente.club/blog/${post.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
    <lastmod>${lastmod}</lastmod>
  </url>
`;
        entryCount++;
      });
    }

    // Add major Quebec cities
    const quebecCities = [
      'montreal', 'quebec', 'laval', 'gatineau', 'longueuil', 
      'sherbrooke', 'saguenay', 'trois-rivieres', 'terrebonne', 'saint-jean-sur-richelieu'
    ];

    quebecCities.forEach((city) => {
      xml += `  <url>
    <loc>https://vente.club/city/${city}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;
      entryCount++;
    });

    xml += `</urlset>`;

    const generationTime = Date.now() - startTime;

    console.log(`[SITEMAP] Generated sitemap with ${entryCount} entries in ${generationTime}ms`);
    console.log(`[SITEMAP] - ${businesses?.length || 0} businesses`);
    console.log(`[SITEMAP] - ${blogPosts?.length || 0} blog posts`);
    console.log(`[SITEMAP] - ${quebecCities.length} cities`);
    console.log(`[SITEMAP] - 13 static pages (including 3 tools)`);

    // Sauvegarder dans le cache (supprime l'ancien cache)
    try {
      await supabaseClient.from('sitemap_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      await supabaseClient
        .from('sitemap_cache')
        .insert({
          xml_content: xml,
          entry_count: entryCount
        });

      console.log('[SITEMAP] Saved to cache');
    } catch (cacheError) {
      console.error('[SITEMAP] Error saving to cache:', cacheError);
    }

    // Logger la génération
    try {
      await supabaseClient
        .from('sitemap_generation_log')
        .insert({
          trigger_source: source,
          entry_count: entryCount,
          generation_time_ms: generationTime
        });

      console.log('[SITEMAP] Logged generation');
    } catch (logError) {
      console.error('[SITEMAP] Error logging:', logError);
    }

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=300",
        "X-Sitemap-Source": "fresh",
        "X-Sitemap-Entries": entryCount.toString(),
        "X-Generation-Time": `${generationTime}ms`,
      },
      status: 200,
    });
  } catch (error) {
    console.error("[SITEMAP] Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: "Failed to generate sitemap", details: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
