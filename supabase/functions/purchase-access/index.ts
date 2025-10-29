import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user's JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('Unauthorized');
    }

    const { businessId, planId } = await req.json();
    
    if (!businessId || !planId) {
      throw new Error('Missing businessId or planId');
    }

    console.log(`Processing purchase for user ${user.id}, business ${businessId}, plan ${planId}`);

    // Check if user already has access
    const { data: existingInquiry } = await supabaseClient
      .from('business_inquiries')
      .select('id')
      .eq('business_id', businessId)
      .eq('buyer_id', user.id)
      .maybeSingle();

    if (existingInquiry) {
      return new Response(
        JSON.stringify({ error: 'You already have access to this business' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get or create user subscription
    const { data: subscription } = await supabaseClient
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('plan_id', planId)
      .gt('expires_at', new Date().toISOString())
      .gt('credits_remaining', 0)
      .maybeSingle();

    if (!subscription) {
      // Create new subscription for the user
      const { data: plan } = await supabaseClient
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (!plan) {
        throw new Error('Invalid plan');
      }

      // In a real implementation, here you would:
      // 1. Verify Stripe payment
      // 2. Create subscription only after successful payment
      // For now, we'll create the subscription (YOU MUST INTEGRATE STRIPE HERE)
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + plan.duration_days);

      const { data: newSubscription, error: subError } = await supabaseClient
        .from('user_subscriptions')
        .insert({
          user_id: user.id,
          plan_id: planId,
          credits_remaining: plan.credits,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (subError) {
        console.error('Subscription creation error:', subError);
        throw new Error('Failed to create subscription');
      }

      // Deduct credit and create inquiry
      await supabaseClient
        .from('user_subscriptions')
        .update({ credits_remaining: newSubscription.credits_remaining - 1 })
        .eq('id', newSubscription.id);
    } else {
      // Deduct credit from existing subscription
      await supabaseClient
        .from('user_subscriptions')
        .update({ credits_remaining: subscription.credits_remaining - 1 })
        .eq('id', subscription.id);
    }

    // Grant access by creating business inquiry
    const { error: inquiryError } = await supabaseClient
      .from('business_inquiries')
      .insert({
        business_id: businessId,
        buyer_id: user.id,
      });

    if (inquiryError) {
      console.error('Inquiry creation error:', inquiryError);
      throw new Error('Failed to grant access');
    }

    // Fetch seller contact info
    const { data: business } = await supabaseClient
      .from('businesses')
      .select('seller_id')
      .eq('id', businessId)
      .single();

    if (!business) {
      throw new Error('Business not found');
    }

    const { data: sellerContact } = await supabaseClient
      .from('seller_contacts')
      .select('email, phone')
      .eq('seller_id', business.seller_id)
      .maybeSingle();

    console.log(`Access granted successfully for user ${user.id} to business ${businessId}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        sellerContact: sellerContact || null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in purchase-access function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});