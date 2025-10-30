import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Sujets pertinents pour entrepreneurs québécois
const BLOG_TOPICS = [
  {
    category: "Acquisition",
    topics: [
      "Comment évaluer une entreprise avant l'achat au Québec",
      "Les erreurs courantes lors de l'acquisition d'une entreprise",
      "Guide complet du financement d'acquisition au Québec",
      "Due diligence: checklist essentielle pour acheteurs",
      "Négocier le prix d'achat d'une entreprise: stratégies gagnantes",
      "Les aspects légaux de l'achat d'entreprise au Québec",
      "Comment identifier les opportunités cachées dans une entreprise",
      "L'importance de la culture d'entreprise lors d'une acquisition"
    ]
  },
  {
    category: "Vente",
    topics: [
      "Préparer votre entreprise pour la vente: guide étape par étape",
      "Comment maximiser la valeur de votre entreprise avant la vente",
      "Les documents essentiels pour vendre votre entreprise",
      "Timing parfait: quand vendre votre entreprise au Québec",
      "Stratégies de marketing pour attirer des acheteurs qualifiés",
      "Comment gérer la confidentialité lors de la vente",
      "Les erreurs à éviter lors de la vente de votre entreprise",
      "Transition réussie: passer le flambeau à votre successeur"
    ]
  },
  {
    category: "Finance",
    topics: [
      "Options de financement pour l'achat d'entreprise au Québec",
      "Comprendre le BAIIA et son impact sur la valorisation",
      "Les ratios financiers clés pour évaluer une entreprise",
      "Comment négocier les termes de paiement avec le vendeur",
      "Investissement Québec: programmes d'aide disponibles",
      "Les implications fiscales de l'achat/vente d'entreprise",
      "Optimiser votre structure de capital pour l'acquisition",
      "Les garanties bancaires et leur rôle dans le financement"
    ]
  },
  {
    category: "Franchises",
    topics: [
      "Franchises vs entreprise indépendante: avantages et inconvénients",
      "Comment choisir la bonne franchise au Québec",
      "Les coûts cachés d'une franchise: ce qu'on ne vous dit pas",
      "Évaluer le potentiel de rentabilité d'une franchise",
      "Les obligations du franchiseur et du franchisé au Québec",
      "Top 10 des secteurs de franchises en croissance",
      "Comment négocier un contrat de franchise",
      "Réussir votre première année en tant que franchisé"
    ]
  },
  {
    category: "Tendances",
    topics: [
      "Tendances du marché des transactions d'entreprises 2025",
      "L'impact de l'intelligence artificielle sur les PME québécoises",
      "Secteurs d'activité en forte croissance au Québec",
      "Comment la démographie influence le marché de la transmission",
      "Technologies émergentes pour les entrepreneurs québécois",
      "L'économie circulaire: opportunités pour les entrepreneurs",
      "Télétravail et nouvelles dynamiques d'affaires post-pandémie",
      "Les défis de la main-d'œuvre pour les PME québécoises"
    ]
  }
];

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100);
}

async function generateBlogArticle() {
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Sélectionner une catégorie aléatoire
  const categoryData = BLOG_TOPICS[Math.floor(Math.random() * BLOG_TOPICS.length)];
  const category = categoryData.category;
  
  // Sélectionner un sujet aléatoire dans cette catégorie
  const title = categoryData.topics[Math.floor(Math.random() * categoryData.topics.length)];
  
  console.log(`[AUTO-BLOG] Generating article: ${title}`);

  // Générer le slug
  const baseSlug = generateSlug(title);
  
  // Vérifier si le slug existe déjà et ajouter un suffixe si nécessaire
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const { data: existing } = await supabaseClient
      .from('blog_posts')
      .select('id')
      .eq('slug', slug)
      .single();
    
    if (!existing) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  // Générer l'excerpt avec AI
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const excerptPrompt = `Écris un résumé accrocheur de 2-3 phrases pour un article de blog intitulé "${title}". 
  Le résumé doit donner envie de lire l'article complet et cibler les entrepreneurs québécois.
  Maximum 200 caractères.`;

  const excerptResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "Tu es un rédacteur expert en marketing de contenu." },
        { role: "user", content: excerptPrompt }
      ],
      temperature: 0.9,
      max_tokens: 200,
    }),
  });

  if (!excerptResponse.ok) {
    throw new Error(`Failed to generate excerpt: ${excerptResponse.status}`);
  }

  const excerptData = await excerptResponse.json();
  const excerpt = excerptData.choices[0].message.content.trim();

  // Générer le contenu principal avec AI
  const contentPrompt = `Tu es un expert en rédaction d'articles de blog pour entrepreneurs québécois.

Écris un article de blog complet et approfondi sur le sujet suivant:

Titre: ${title}
Catégorie: ${category}

INSTRUCTIONS CRITIQUES POUR LE SEO:
1. L'article doit faire 2500-3500 mots minimum
2. Utilise UNIQUEMENT des balises HTML: <h2>, <h3>, <h4>, <p>, <ul>, <ol>, <li>, <strong>, <em>, <blockquote>
3. Structure avec 5-7 sections principales <h2>
4. Chaque section doit avoir 2-4 sous-sections <h3>
5. Utilise des mots-clés naturellement (entreprise, Québec, entrepreneur, PME, acquisition, vente)
6. Inclus des listes à puces et numérotées pour la lisibilité
7. Ajoute 2-3 citations inspirantes dans des <blockquote>
8. Utilise des exemples concrets du contexte québécois
9. Ton professionnel mais accessible et engageant
10. Inclus des conseils ULTRA-PRATIQUES et actionnables
11. Termine avec un appel à l'action fort
12. Intègre naturellement des termes comme "vente d'entreprise", "achat d'entreprise", "franchise", "entrepreneur québécois"

NE PAS inclure le titre h1 (déjà affiché séparément).
Commence directement avec une introduction engageante en <p>.

STRUCTURE OPTIMALE:
<p>Introduction captivante (2-3 paragraphes)</p>

<h2>Première grande section</h2>
<p>Contenu détaillé...</p>
<h3>Sous-section importante</h3>
<p>Explication approfondie...</p>
<ul><li>Point clé 1</li><li>Point clé 2</li></ul>

<h2>Deuxième grande section</h2>
<p>Plus de contenu...</p>
<blockquote>Citation inspirante pertinente</blockquote>

[Continue avec 3-5 sections supplémentaires...]

<h2>Conclusion</h2>
<p>Résumé des points clés et appel à l'action fort.</p>`;

  const contentResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
          content: "Tu es un rédacteur expert spécialisé dans les articles sur l'entrepreneuriat et les transactions d'entreprises au Québec. Tu écris en français québécois de manière professionnelle, engageante et optimisée pour le SEO."
        },
        { role: "user", content: contentPrompt }
      ],
      temperature: 0.8,
      max_tokens: 8000,
    }),
  });

  if (!contentResponse.ok) {
    throw new Error(`Failed to generate content: ${contentResponse.status}`);
  }

  const contentData = await contentResponse.json();
  const content = contentData.choices[0].message.content;

  // Calculer le temps de lecture (mots par minute: 200)
  const wordCount = content.split(/\s+/).length;
  const readTime = `${Math.ceil(wordCount / 200)} min`;

  // Créer l'article dans la base de données
  const { data: newPost, error } = await supabaseClient
    .from('blog_posts')
    .insert({
      title,
      slug,
      excerpt,
      content,
      category,
      read_time: readTime,
      published: true,
      date: new Date().toISOString().split('T')[0],
      image: `/blog-${category.toLowerCase()}.jpg` // Image par défaut basée sur la catégorie
    })
    .select()
    .single();

  if (error) {
    console.error("[AUTO-BLOG] Error creating post:", error);
    throw error;
  }

  console.log(`[AUTO-BLOG] Article created successfully: ${newPost.id}`);
  return newPost;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[AUTO-BLOG] Starting automatic blog generation...");
    
    const article = await generateBlogArticle();
    
    return new Response(JSON.stringify({ 
      success: true,
      article: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        category: article.category
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("[AUTO-BLOG] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
