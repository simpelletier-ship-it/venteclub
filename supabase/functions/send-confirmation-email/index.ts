import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { getWelcomeEmail } from "../_shared/email-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, confirmationUrl } = await req.json();
    
    if (!email) {
      throw new Error("Email not provided");
    }

    if (!confirmationUrl) {
      throw new Error("Confirmation URL not provided");
    }

    const html = getWelcomeEmail(confirmationUrl, email);

    // Envoyer l'email via Resend
    const { error: emailError } = await resend.emails.send({
      from: "Vente.Club <info@vente.club>",
      to: [email],
      subject: "Bienvenue sur Vente.Club - Confirmez votre compte",
      html,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      throw emailError;
    }

    console.log(`Confirmation email sent successfully to ${email}`);

    return new Response(
      JSON.stringify({ success: true, message: "Confirmation email sent" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-confirmation-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
