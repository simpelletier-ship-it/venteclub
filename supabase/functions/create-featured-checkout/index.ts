import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
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
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { businessId, duration = 7 } = await req.json();
    if (!businessId) throw new Error("Business ID required");
    if (![7, 14, 30].includes(duration)) throw new Error("Invalid duration");

    // Verify user owns this business
    const { data: business, error: businessError } = await supabaseClient
      .from("businesses")
      .select("id, seller_id")
      .eq("id", businessId)
      .eq("seller_id", user.id)
      .single();

    if (businessError || !business) {
      throw new Error("Business not found or you don't have permission");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Déterminer le price_id en fonction de la durée
    const priceMap: Record<number, string> = {
      7: "price_1SNOYwARiAO4VbXUWgbYsQgZ",  // 75$ pour 7 jours
      14: "price_1SNOYwARiAO4VbXUWgbYsQgZ", // 100$ pour 14 jours (à remplacer)
      30: "price_1SNOYwARiAO4VbXUWgbYsQgZ", // 110$ pour 30 jours (à remplacer)
    };

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: 'cad',
            product_data: {
              name: `Mise en avant - ${duration} jours`,
              description: `Mettez votre annonce en vedette pendant ${duration} jours`,
            },
            unit_amount: duration === 7 ? 750 : duration === 14 ? 1000 : 1150,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/dashboard?featured_success=true`,
      cancel_url: `${req.headers.get("origin")}/dashboard?featured_canceled=true`,
      metadata: {
        business_id: businessId,
        user_id: user.id,
        duration: duration.toString(),
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in create-featured-checkout:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
