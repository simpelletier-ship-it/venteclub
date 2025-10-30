import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyCodeRequest {
  email: string;
  code: string;
  password: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code, password }: VerifyCodeRequest = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Vérifier le code
    const { data: verificationData, error: verificationError } = await supabase
      .from('email_verification_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (verificationError) {
      console.error("Error checking verification code:", verificationError);
      throw verificationError;
    }

    if (!verificationData) {
      return new Response(
        JSON.stringify({ error: "Code invalide ou expiré" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Marquer le code comme vérifié
    await supabase
      .from('email_verification_codes')
      .update({ verified: true })
      .eq('id', verificationData.id);

    // Créer le compte utilisateur
    const { data: userData, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Le code a déjà été vérifié
    });

    if (signUpError) {
      console.error("Error creating user:", signUpError);
      throw signUpError;
    }

    // Envoyer l'email de bienvenue
    try {
      await supabase.functions.invoke('send-welcome-email', {
        body: {
          email,
          name: email.split('@')[0]
        }
      });
    } catch (emailError) {
      console.error("Error sending welcome email:", emailError);
    }

    console.log("User created successfully:", email);

    return new Response(
      JSON.stringify({ 
        success: true,
        user: userData.user
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in verify-code-and-signup function:", error);
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
