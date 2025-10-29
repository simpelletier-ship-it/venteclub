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

    const businessId = session.metadata?.businessId;
    const userId = session.metadata?.userId;
    const accessType = session.metadata?.accessType;
    
    if (!businessId || !userId || !accessType) {
      throw new Error("Missing metadata in session");
    }

    if (userId !== user.id) {
      throw new Error("Unauthorized");
    }

    // Calculate expiration date for subscriptions
    let expiresAt = null;
    if (accessType === 'subscription') {
      // For subscriptions, set expiry to 30 days from now
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      expiresAt = expiryDate.toISOString();
    }

    // Check if access already exists
    const { data: existingAccess } = await supabaseClient
      .from("contact_access")
      .select("id")
      .eq("business_id", businessId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existingAccess) {
      // Grant access by creating contact_access record
      const { error: accessError } = await supabaseClient
        .from("contact_access")
        .insert({
          business_id: businessId,
          user_id: user.id,
          access_type: accessType,
          stripe_payment_id: sessionId,
          expires_at: expiresAt,
        });

      if (accessError) {
        console.error("Access creation error:", accessError);
        throw new Error("Failed to grant access");
      }
    }

    // Fetch seller contact info
    const { data: business } = await supabaseClient
      .from("businesses")
      .select("seller_id")
      .eq("id", businessId)
      .single();

    if (!business) {
      throw new Error("Business not found");
    }

    const { data: sellerContact } = await supabaseClient
      .from("seller_contacts")
      .select("email, phone")
      .eq("seller_id", business.seller_id)
      .maybeSingle();

    return new Response(
      JSON.stringify({ 
        success: true,
        sellerContact: sellerContact || null
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in verify-contact-payment:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
