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
    const buyerId = session.metadata?.buyer_id;
    
    if (!businessId || !buyerId) {
      throw new Error("Missing metadata in session");
    }

    if (buyerId !== user.id) {
      throw new Error("Unauthorized");
    }

    // Check if inquiry already exists
    const { data: existingInquiry } = await supabaseClient
      .from("business_inquiries")
      .select("id")
      .eq("business_id", businessId)
      .eq("buyer_id", user.id)
      .maybeSingle();

    if (!existingInquiry) {
      // Grant access by creating business inquiry
      const { error: inquiryError } = await supabaseClient
        .from("business_inquiries")
        .insert({
          business_id: businessId,
          buyer_id: user.id,
        });

      if (inquiryError) {
        console.error("Inquiry creation error:", inquiryError);
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
