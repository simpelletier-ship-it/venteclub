import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const getConfirmationEmailHtml = (confirmationUrl: string, userEmail: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue au Club !</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif; background-color: #f6f9fc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; margin: 0 auto; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 32px; text-align: center; border-bottom: 1px solid #e6e6e6;">
              <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #1a1a1a;">
                Vente<span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">.Club</span>
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 40px;">
              <h2 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: #1a1a1a;">
                🎉 Bienvenue au Club !
              </h2>
              
              <p style="margin: 16px 0; font-size: 16px; line-height: 1.6; color: #525252;">
                Bonjour,
              </p>
              
              <p style="margin: 16px 0; font-size: 16px; line-height: 1.6; color: #525252;">
                Vous venez de <strong>rejoindre le cercle exclusif</strong> des membres de Vente.Club, 
                la plateforme de référence pour l'achat et la vente d'entreprises au Québec.
              </p>
              
              <p style="margin: 16px 0; font-size: 16px; line-height: 1.6; color: #525252;">
                Pour <strong>activer votre adhésion</strong> et commencer à explorer les opportunités, 
                cliquez sur le bouton ci-dessous :
              </p>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${confirmationUrl}" style="display: inline-block; padding: 14px 32px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.3);">
                      Confirmer mon adhésion au Club
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 8px; font-size: 14px; color: #737373;">
                Ou copiez ce lien dans votre navigateur :
              </p>
              <p style="margin: 0; font-size: 14px; word-break: break-all;">
                <a href="${confirmationUrl}" style="color: #667eea; text-decoration: underline;">${confirmationUrl}</a>
              </p>

              <hr style="border: none; border-top: 1px solid #e6e6e6; margin: 32px 0;">

              <!-- Benefits -->
              <p style="margin: 24px 0 16px; font-size: 18px; font-weight: 600; color: #1a1a1a;">
                ✨ Vos privilèges de membre :
              </p>
              
              <p style="margin: 12px 0; font-size: 15px; line-height: 1.6; color: #525252;">
                <strong>🔍 Accès illimité</strong> aux milliers d'opportunités d'affaires
              </p>
              <p style="margin: 12px 0; font-size: 15px; line-height: 1.6; color: #525252;">
                <strong>💬 Connexion directe</strong> avec les vendeurs et acheteurs
              </p>
              <p style="margin: 12px 0; font-size: 15px; line-height: 1.6; color: #525252;">
                <strong>📢 Publication gratuite</strong> de vos propres annonces
              </p>
              <p style="margin: 12px 0; font-size: 15px; line-height: 1.6; color: #525252;">
                <strong>🔔 Alertes personnalisées</strong> pour ne rien manquer
              </p>

              <hr style="border: none; border-top: 1px solid #e6e6e6; margin: 32px 0;">

              <!-- Security Note -->
              <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #525252;">
                  🔒 <strong>Note de sécurité :</strong> Ce lien expirera dans 24 heures. 
                  Si vous n'avez pas créé de compte sur Vente.Club, vous pouvez ignorer cet email en toute sécurité.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; text-align: center; background-color: #f9fafb; border-top: 1px solid #e6e6e6;">
              <p style="margin: 8px 0; font-size: 14px; line-height: 1.6; color: #737373;">
                Des questions ? Notre équipe est là pour vous.
              </p>
              <p style="margin: 8px 0; font-size: 14px; line-height: 1.6; color: #737373;">
                <a href="https://vente.club/contact" style="color: #667eea; text-decoration: none; font-weight: 500;">Contactez-nous</a>
                · 
                <a href="https://vente.club/faq" style="color: #667eea; text-decoration: none; font-weight: 500;">FAQ</a>
                · 
                <a href="https://vente.club/a-propos" style="color: #667eea; text-decoration: none; font-weight: 500;">À propos</a>
              </p>
              <p style="margin: 16px 0 8px; font-size: 12px; color: #a3a3a3;">
                © 2025 Vente.Club - Votre partenaire pour l'achat et la vente d'entreprises au Québec
              </p>
              <p style="margin: 4px 0; font-size: 12px; color: #a3a3a3;">
                Cet email a été envoyé à ${userEmail}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

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

    const html = getConfirmationEmailHtml(confirmationUrl, email);

    // Envoyer l'email via Resend
    const { error: emailError } = await resend.emails.send({
      from: "Vente.Club <bienvenue@vente.club>",
      to: [email],
      subject: "🎉 Bienvenue au Club ! Confirmez votre compte",
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
