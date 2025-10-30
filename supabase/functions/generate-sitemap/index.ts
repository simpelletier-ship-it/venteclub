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

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

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
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>
  
  <!-- Blog -->
  <url>
    <loc>https://vente.club/blog</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
    <lastmod>${new Date().toISOString()}</lastmod>
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
`;

    // Add business listings
    if (businesses && businesses.length > 0) {
      businesses.forEach((business) => {
        const lastmod = business.updated_at 
          ? new Date(business.updated_at).toISOString() 
          : new Date().toISOString();
        
        xml += `  <url>
    <loc>https://vente.club/business/${business.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <lastmod>${lastmod}</lastmod>
  </url>
`;
      });
    }

    // Add blog posts
    if (blogPosts && blogPosts.length > 0) {
      blogPosts.forEach((post) => {
        const lastmod = post.updated_at 
          ? new Date(post.updated_at).toISOString() 
          : new Date().toISOString();
        
        xml += `  <url>
    <loc>https://vente.club/blog/${post.slug}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
    <lastmod>${lastmod}</lastmod>
  </url>
`;
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
    });

    xml += `</urlset>`;

    console.log(`[SITEMAP] Generated sitemap with ${businesses?.length || 0} businesses and ${blogPosts?.length || 0} blog posts`);

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600",
      },
      status: 200,
    });
  } catch (error) {
    console.error("[SITEMAP] Error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate sitemap" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
