import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

const getTestEmailHtml = (recipientEmail: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Email - Vente.Club</title>
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
                Vente<span style="color: #667eea;">.Club</span>
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 40px;">
              <h2 style="margin: 0 0 24px; font-size: 24px; font-weight: 700; color: #1a1a1a;">
                ✅ Test d'envoi d'email réussi !
              </h2>
              
              <p style="margin: 16px 0; font-size: 16px; line-height: 1.6; color: #525252;">
                Bonjour,
              </p>
              
              <p style="margin: 16px 0; font-size: 16px; line-height: 1.6; color: #525252;">
                Ceci est un <strong>email de test</strong> envoyé depuis la plateforme <strong>Vente.Club</strong>.
              </p>
              
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 24px; margin: 32px 0;">
                <p style="margin: 0; font-size: 18px; font-weight: 600; color: #ffffff; text-align: center;">
                  📧 Configuration Email Validée
                </p>
                <p style="margin: 12px 0 0; font-size: 14px; color: #ffffff; text-align: center; opacity: 0.95;">
                  L'email a été envoyé depuis <strong>info@vente.club</strong>
                </p>
              </div>

              <hr style="border: none; border-top: 1px solid #e6e6e6; margin: 32px 0;">

              <!-- Test Details -->
              <p style="margin: 24px 0 16px; font-size: 18px; font-weight: 600; color: #1a1a1a;">
                📋 Détails du test :
              </p>
              
              <table width="100%" cellpadding="8" cellspacing="0" style="margin: 16px 0; background-color: #f9fafb; border-radius: 8px;">
                <tr>
                  <td style="font-size: 14px; color: #737373; padding: 8px 16px;"><strong>Expéditeur:</strong></td>
                  <td style="font-size: 14px; color: #1a1a1a; padding: 8px 16px;">info@vente.club</td>
                </tr>
                <tr>
                  <td style="font-size: 14px; color: #737373; padding: 8px 16px;"><strong>Destinataire:</strong></td>
                  <td style="font-size: 14px; color: #1a1a1a; padding: 8px 16px;">${recipientEmail}</td>
                </tr>
                <tr>
                  <td style="font-size: 14px; color: #737373; padding: 8px 16px;"><strong>Date:</strong></td>
                  <td style="font-size: 14px; color: #1a1a1a; padding: 8px 16px;">${new Date().toLocaleString('fr-CA', { timeZone: 'America/Toronto' })}</td>
                </tr>
                <tr>
                  <td style="font-size: 14px; color: #737373; padding: 8px 16px;"><strong>Service:</strong></td>
                  <td style="font-size: 14px; color: #1a1a1a; padding: 8px 16px;">Resend API</td>
                </tr>
              </table>

              <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #065f46;">
                  ✅ <strong>Succès :</strong> Si vous recevez cet email, cela signifie que votre configuration Resend avec le domaine vente.club fonctionne parfaitement !
                </p>
              </div>

              <p style="margin: 24px 0 16px; font-size: 16px; line-height: 1.6; color: #525252;">
                Vous pouvez maintenant envoyer des emails professionnels depuis <strong>info@vente.club</strong> à vos utilisateurs.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; text-align: center; background-color: #f9fafb; border-top: 1px solid #e6e6e6;">
              <p style="margin: 8px 0; font-size: 14px; line-height: 1.6; color: #737373;">
                Plateforme de référence pour l'achat et la vente d'entreprises au Québec
              </p>
              <p style="margin: 16px 0 8px; font-size: 12px; color: #a3a3a3;">
                © 2025 Vente.Club - Tous droits réservés
              </p>
              <p style="margin: 4px 0; font-size: 12px; color: #a3a3a3;">
                Email de test envoyé à ${recipientEmail}
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
    console.log("[TEST-EMAIL] Starting test email send...");
    
    const { to } = await req.json();
    const recipientEmail = to || "simpelletier@hotmail.com";

    console.log(`[TEST-EMAIL] Sending test email to: ${recipientEmail}`);

    const html = getTestEmailHtml(recipientEmail);

    // Envoyer l'email via Resend
    const { data, error: emailError } = await resend.emails.send({
      from: "Vente.Club <info@vente.club>",
      to: [recipientEmail],
      subject: "✅ Test Email - Configuration Vente.Club",
      html,
    });

    if (emailError) {
      console.error("[TEST-EMAIL] Error sending email:", emailError);
      throw emailError;
    }

    console.log(`[TEST-EMAIL] Email sent successfully to ${recipientEmail}`, data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email de test envoyé avec succès à ${recipientEmail}`,
        emailId: data?.id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("[TEST-EMAIL] Error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Assurez-vous que votre domaine vente.club est vérifié dans Resend"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
