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
    console.log("[CHECK-PREMIUM] Starting subscription check");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw userError;
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    console.log("[CHECK-PREMIUM] User authenticated:", user.email);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    console.log("[CHECK-PREMIUM] Looking for Stripe customer with email:", user.email);
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      console.log("[CHECK-PREMIUM] No Stripe customer found");
      return new Response(JSON.stringify({ subscribed: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    console.log("[CHECK-PREMIUM] Found customer ID:", customerId);
    
    // Chercher d'abord les abonnements actifs, puis incomplete si aucun actif trouvé
    // IMPORTANT: Utiliser expand pour forcer Stripe à inclure tous les champs nécessaires
    let subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
      expand: ['data.items.data.price']
    });
    console.log("[CHECK-PREMIUM] Active subscriptions count:", subscriptions.data.length);
    
    // Si aucun abonnement actif, vérifier s'il y a des abonnements incomplete (en cours de création)
    if (subscriptions.data.length === 0) {
      console.log("[CHECK-PREMIUM] No active subscription, checking incomplete...");
      subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "incomplete",
        limit: 1,
        expand: ['data.items.data.price']
      });
      console.log("[CHECK-PREMIUM] Incomplete subscriptions count:", subscriptions.data.length);
    }

    const hasActiveSub = subscriptions.data.length > 0;
    let subscriptionEnd = null;

    if (hasActiveSub) {
      let subscription = subscriptions.data[0];
      console.log("[CHECK-PREMIUM] Initial subscription details:", {
        id: subscription.id,
        status: subscription.status,
        current_period_end: subscription.current_period_end
      });

      // Si current_period_end est manquant, récupérer l'abonnement complet
      if (!subscription.current_period_end || typeof subscription.current_period_end !== 'number') {
        console.log("[CHECK-PREMIUM] current_period_end missing, retrieving full subscription...");
        subscription = await stripe.subscriptions.retrieve(subscription.id, {
          expand: ['items.data.price']
        });
        console.log("[CHECK-PREMIUM] Retrieved subscription details:", {
          id: subscription.id,
          status: subscription.status,
          current_period_end: subscription.current_period_end
        });
      }

      // Vérifier à nouveau après le retrieve
      if (!subscription.current_period_end || typeof subscription.current_period_end !== 'number') {
        console.error("[CHECK-PREMIUM] current_period_end still invalid:", subscription.current_period_end);
        // Utiliser une valeur par défaut de 30 jours pour ne pas bloquer
        const defaultEnd = new Date();
        defaultEnd.setDate(defaultEnd.getDate() + 30);
        subscriptionEnd = defaultEnd.toISOString();
        console.warn("[CHECK-PREMIUM] Using default 30-day period as fallback:", subscriptionEnd);
      } else {
        subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
        console.log("[CHECK-PREMIUM] Subscription end date:", subscriptionEnd);
      }

      // Synchroniser l'abonnement dans la base de données Supabase
      console.log("[CHECK-PREMIUM] Syncing to database...");
      const { error: syncError } = await supabaseClient.rpc('sync_premium_subscription', {
        p_user_id: user.id,
        p_stripe_customer_id: customerId,
        p_stripe_subscription_id: subscription.id,
        p_status: subscription.status,
        p_current_period_end: subscriptionEnd
      });

      if (syncError) {
        console.error("[CHECK-PREMIUM] Error syncing subscription to database:", syncError);
        throw syncError;
      }
      console.log("[CHECK-PREMIUM] Successfully synced to database");
    } else {
      console.log("[CHECK-PREMIUM] No active subscription, updating status to canceled");
      // Mettre à jour le statut dans la base de données si l'abonnement n'est plus actif
      const { error: syncError } = await supabaseClient
        .from('premium_subscriptions')
        .update({ status: 'canceled' })
        .eq('user_id', user.id);

      if (syncError) {
        console.error("[CHECK-PREMIUM] Error updating subscription status:", syncError);
      }
    }

    console.log("[CHECK-PREMIUM] Returning result:", { subscribed: hasActiveSub, subscription_end: subscriptionEnd });
    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      subscription_end: subscriptionEnd
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("[CHECK-PREMIUM] FATAL ERROR:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      subscribed: false 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, // Retourner 200 même en cas d'erreur pour ne pas bloquer le frontend
    });
  }
});
