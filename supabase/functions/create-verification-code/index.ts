import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateCodeRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: CreateCodeRequest = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limiting: Check for existing requests in the last hour
    const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    
    // Check rate limit by email (max 3 attempts per hour per email)
    const { data: emailRateLimit, error: rateLimitError } = await supabase
      .from('verification_code_rate_limit')
      .select('attempts, window_start')
      .eq('email', email)
      .gte('window_start', new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .maybeSingle();

    if (rateLimitError) {
      console.error("Rate limit check error:", rateLimitError);
    }

    if (emailRateLimit) {
      if (emailRateLimit.attempts >= 3) {
        console.warn(`Rate limit exceeded for email: ${email}`);
        return new Response(
          JSON.stringify({ 
            error: "Trop de tentatives. Veuillez réessayer dans une heure." 
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Increment attempts
      await supabase
        .from('verification_code_rate_limit')
        .update({ attempts: emailRateLimit.attempts + 1 })
        .eq('email', email)
        .eq('window_start', emailRateLimit.window_start);
    } else {
      // Create new rate limit record
      await supabase
        .from('verification_code_rate_limit')
        .insert({
          email,
          ip_address: clientIp,
          attempts: 1,
        });
    }

    // Générer un code à 6 chiffres
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Expiration dans 1 heure
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Supprimer les anciens codes non vérifiés pour cet email
    await supabase
      .from('email_verification_codes')
      .delete()
      .eq('email', email)
      .eq('verified', false);

    // Insérer le nouveau code
    const { error: insertError } = await supabase
      .from('email_verification_codes')
      .insert({
        email,
        code,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("Error inserting verification code:", insertError);
      throw insertError;
    }

    // Envoyer l'email avec le code
    const { error: emailError } = await supabase.functions.invoke('send-verification-code', {
      body: { email, token: code }
    });

    if (emailError) {
      console.error("Error sending verification email:", emailError);
      throw emailError;
    }

    console.log("Verification code created and sent for:", email);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in create-verification-code function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
