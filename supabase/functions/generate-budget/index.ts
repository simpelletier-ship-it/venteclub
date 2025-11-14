import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { income, grossIncome, incomeType, hoursPerWeek, dependents, location, expenses } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Tu es un expert en planification budgétaire personnelle au Québec. 
Tu dois créer un budget mensuel réaliste et équilibré basé sur les informations de l'utilisateur.
Retourne UNIQUEMENT un objet JSON valide avec cette structure exacte (pas de texte avant ou après):
{
  "income": [
    {"name": "Salaire", "amount": montant, "icon": "💰"}
  ],
  "expenses": [
    {"name": "Logement", "amount": montant, "icon": "🏠"},
    {"name": "Alimentation", "amount": montant, "icon": "🍔"},
    {"name": "Transport", "amount": montant, "icon": "🚗"}
  ],
  "explanation": "Brève explication du budget"
}`;

    let incomeDescription = `Revenu mensuel net: ${income}$`;
    if (grossIncome && incomeType) {
      if (incomeType === "hourly") {
        incomeDescription = `Salaire horaire brut: ${grossIncome}$/h (${hoursPerWeek}h/sem) → Net mensuel: ${income}$`;
      } else if (incomeType === "yearly") {
        incomeDescription = `Salaire annuel brut: ${grossIncome}$/an → Net mensuel: ${income}$`;
      } else {
        incomeDescription = `Salaire mensuel brut: ${grossIncome}$/mois → Net mensuel: ${income}$`;
      }
    }

    const userPrompt = `Crée un budget mensuel réaliste pour le Québec:
- ${incomeDescription}
- Nombre de personnes à charge: ${dependents}
- Région: ${location}
- Dépenses actuelles connues: ${expenses || 'Aucune'}

IMPORTANT: Base tes calculs sur le revenu NET mensuel de ${income}$. 
Utilise la règle 50/30/20 adaptée au Québec (50% besoins essentiels, 30% loisirs/envies, 20% épargne).
Tiens compte du coût de la vie à ${location}.
Inclus des catégories réalistes: logement, alimentation, transport, services publics, télécommunications, assurances, épargne, loisirs, etc.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Trop de requêtes, veuillez réessayer dans quelques instants." }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits insuffisants, veuillez ajouter des crédits à votre espace de travail Lovable." }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content in AI response");
    }

    // Extract JSON from the response
    let budgetData;
    try {
      // Try to find JSON in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        budgetData = JSON.parse(jsonMatch[0]);
      } else {
        budgetData = JSON.parse(content);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response");
    }

    return new Response(
      JSON.stringify(budgetData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-budget function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Une erreur est survenue lors de la génération du budget" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
