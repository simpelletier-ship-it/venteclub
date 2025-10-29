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

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    // Check if user is admin
    const { data: hasAdminRole } = await supabaseClient
      .rpc('has_role', { 
        _user_id: user.id, 
        _role: 'admin' 
      });
    
    if (!hasAdminRole) throw new Error("Unauthorized");

    const { blogPostId } = await req.json();
    if (!blogPostId) throw new Error("Blog post ID required");

    // Get the blog post
    const { data: blogPost, error: fetchError } = await supabaseClient
      .from('blog_posts')
      .select('*')
      .eq('id', blogPostId)
      .single();

    if (fetchError || !blogPost) throw new Error("Blog post not found");

    console.log(`[GENERATE-BLOG] Generating content for: ${blogPost.title}`);

    // Generate content using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `Tu es un expert en rédaction d'articles de blog sur l'achat et la vente d'entreprises au Québec.

Écris un article de blog complet et détaillé en français sur le sujet suivant:

Titre: ${blogPost.title}
Catégorie: ${blogPost.category}
Résumé: ${blogPost.excerpt}

INSTRUCTIONS IMPORTANTES:
1. L'article doit faire au moins 2000-3000 mots
2. Utilise uniquement des balises HTML pour la structure: <h2>, <h3>, <h4>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>
3. Structure l'article avec plusieurs sections et sous-sections
4. Inclus des listes à puces et numérotées quand approprié
5. Ajoute des citations inspirantes dans des <blockquote>
6. Utilise des exemples concrets du contexte québécois
7. Ton doit être professionnel mais accessible
8. Inclus des conseils pratiques et actionnables
9. Termine avec une conclusion forte

Structure recommandée:
- Introduction engageante
- 4-6 sections principales avec <h2>
- Plusieurs sous-sections avec <h3> et <h4>
- Exemples pratiques
- Conclusion avec appel à l'action

NE PAS inclure le titre principal (h1) car il est déjà affiché séparément.

Commence directement avec l'introduction en balise <p>.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "Tu es un rédacteur expert spécialisé dans les articles sur l'entrepreneuriat et les transactions d'entreprises au Québec. Tu écris en français québécois de manière professionnelle et engageante."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 8000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[GENERATE-BLOG] AI error:", aiResponse.status, errorText);
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const generatedContent = aiData.choices[0].message.content;

    console.log(`[GENERATE-BLOG] Content generated, length: ${generatedContent.length} chars`);

    // Update the blog post with generated content
    const { error: updateError } = await supabaseClient
      .from('blog_posts')
      .update({ content: generatedContent })
      .eq('id', blogPostId);

    if (updateError) throw updateError;

    console.log(`[GENERATE-BLOG] Blog post updated successfully`);

    return new Response(JSON.stringify({ 
      success: true,
      content: generatedContent,
      contentLength: generatedContent.length
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in generate-blog-content:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});