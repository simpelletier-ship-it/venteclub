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
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    console.log("[ADMIN-CANCEL] Starting admin subscription cancellation");
    
    // Verify admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw userError;
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    
    console.log("[ADMIN-CANCEL] User authenticated:", user.email);

    // Check if user is admin
    const { data: hasAdminRole } = await supabaseClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!hasAdminRole) {
      throw new Error("Unauthorized: Admin access required");
    }
    console.log("[ADMIN-CANCEL] Admin access confirmed");

    // Get subscription ID from request
    const { subscriptionId } = await req.json();
    if (!subscriptionId) {
      throw new Error("Subscription ID required");
    }
    console.log("[ADMIN-CANCEL] Cancelling subscription:", subscriptionId);

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Cancel the subscription in Stripe
    const canceledSubscription = await stripe.subscriptions.cancel(subscriptionId);
    console.log("[ADMIN-CANCEL] Subscription cancelled in Stripe:", canceledSubscription.id);

    // Update in Supabase database
    const { error: updateError } = await supabaseClient
      .from('premium_subscriptions')
      .update({ 
        status: 'canceled',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscriptionId);

    if (updateError) {
      console.error("[ADMIN-CANCEL] Error updating database:", updateError);
      throw updateError;
    }
    console.log("[ADMIN-CANCEL] Database updated successfully");

    return new Response(JSON.stringify({
      success: true,
      message: "Subscription cancelled successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("[ADMIN-CANCEL] ERROR:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
