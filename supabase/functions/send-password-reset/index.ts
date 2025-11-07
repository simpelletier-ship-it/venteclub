import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getPasswordResetEmail } from "../_shared/email-templates.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  redirectUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { email, redirectUrl }: PasswordResetRequest = await req.json();
    
    console.log("Sending password reset email to:", email);

    // Generate password reset link using Supabase - toujours utiliser vente.club
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectUrl || "https://vente.club/reset-password"
      }
    });

    if (error) {
      throw new Error(`Failed to generate reset link: ${error.message}`);
    }

    const resetLink = data.properties?.action_link;
    if (!resetLink) {
      throw new Error("No reset link generated");
    }

    // Fetch user profile for personalization
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name, first_name')
      .eq('email', email)
      .single();

    const userName = profile?.first_name || profile?.full_name || email.split('@')[0];

    const emailResponse = await resend.emails.send({
      from: "Vente.Club <info@vente.club>",
      to: [email],
      subject: "Réinitialisation de mot de passe - Vente.Club",
      html: getPasswordResetEmail(resetLink, email),
    });

    console.log("Password reset email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending password reset email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
