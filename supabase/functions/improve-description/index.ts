import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description, title, industry, type = 'business' } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // System prompts based on type
    const systemPrompts: Record<string, string> = {
      business: 'Tu es un expert en rédaction de descriptions d\'entreprises à vendre. Tu dois améliorer les descriptions pour qu\'elles soient professionnelles, attrayantes et convaincantes, tout en restant concises (maximum 200 mots). Mets en avant les points forts et l\'opportunité d\'investissement.',
      franchise: 'Tu es un expert en rédaction de descriptions de franchises à vendre. Tu dois améliorer les descriptions en mettant en avant la notoriété de la marque, le potentiel de développement, et les avantages du réseau franchisé. Reste concis (maximum 200 mots) et professionnel.',
      property: 'Tu es un expert en rédaction de descriptions d\'immeubles commerciaux à vendre. Tu dois améliorer les descriptions en mettant en avant l\'emplacement stratégique, les caractéristiques du bâtiment, le potentiel commercial et les opportunités d\'investissement. Reste concis (maximum 200 mots) et professionnel.',
    };

    // User prompts based on type
    const userPrompts: Record<string, string> = {
      business: `Améliore cette description pour une entreprise à vendre:\n\nTitre: ${title}\nIndustrie: ${industry}\nDescription actuelle: ${description}\n\nDonne uniquement la description améliorée, sans commentaires additionnels.`,
      franchise: `Améliore cette description pour une franchise à vendre:\n\nTitre: ${title}\nSecteur: ${industry}\nDescription actuelle: ${description}\n\nDonne uniquement la description améliorée, sans commentaires additionnels.`,
      property: `Améliore cette description pour un immeuble commercial à vendre:\n\nTitre: ${title}\nType: ${industry}\nDescription actuelle: ${description}\n\nDonne uniquement la description améliorée, sans commentaires additionnels.`,
    };

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: systemPrompts[type] || systemPrompts.business
          },
          {
            role: 'user',
            content: userPrompts[type] || userPrompts.business
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API Error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requêtes atteinte. Veuillez réessayer dans quelques instants.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Crédits insuffisants. Veuillez recharger votre compte Lovable.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const improvedDescription = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ improvedDescription }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in improve-description:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Une erreur est survenue' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});