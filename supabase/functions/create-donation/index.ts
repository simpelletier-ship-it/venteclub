import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { amount, email, name } = await req.json();
    
    if (!amount || amount < 100) {
      throw new Error("Le montant minimum est de 1$");
    }

    console.log("[CREATE-DONATION] Creating donation session for:", { amount, email, name });

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Create a one-time payment session with custom amount
    const session = await stripe.checkout.sessions.create({
      customer_email: email || undefined,
      line_items: [
        {
          price_data: {
            currency: "cad",
            product_data: {
              name: "Don - Soutien Vente.Club",
              description: `Merci ${name || 'généreux donateur'} pour votre soutien au développement de Vente.Club!`,
            },
            unit_amount: amount, // Amount in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/soutien?success=true`,
      cancel_url: `${req.headers.get("origin")}/soutien?canceled=true`,
      metadata: {
        type: "donation",
        donor_name: name || "Anonyme",
      },
    });

    console.log("[CREATE-DONATION] Session created:", session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("[CREATE-DONATION] Error:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
