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
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user) throw new Error("User not authenticated");

    const { sessionId } = await req.json();
    if (!sessionId) throw new Error("Session ID required");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    const businessId = session.metadata?.business_id;
    const duration = parseInt(session.metadata?.duration || '7');
    if (!businessId) throw new Error("Business ID not found in session");

    // Determine amount based on duration
    const amountMap: Record<number, number> = {
      7: 75.00,
      14: 100.00,
      30: 110.00,
    };
    const amount = amountMap[duration] || 75.00;

    // Calculate featured_until based on duration
    const featuredUntil = new Date();
    featuredUntil.setDate(featuredUntil.getDate() + duration);

    const { error: insertError } = await supabaseClient
      .from("featured_payments")
      .insert({
        user_id: user.id,
        business_id: businessId,
        amount: amount,
        currency: "CAD",
        payment_status: "completed",
        featured_until: featuredUntil.toISOString(),
      });

    if (insertError) throw insertError;

    // Update business featured status
    const { error: updateError } = await supabaseClient
      .from("businesses")
      .update({ featured: true })
      .eq("id", businessId);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in verify-featured-payment:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
