import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY") as string);

// Template professionnel pour le code de vérification
const getVerificationCodeEmail = (code: string) => {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>Vente.Club</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f7f7f7; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { padding: 32px 40px; text-align: center; border-bottom: 1px solid #e8e8e8; }
    .logo { font-size: 24px; font-weight: 600; color: #1a1a1a; text-decoration: none; }
    .content { padding: 40px 40px; }
    .footer { padding: 32px 40px; background-color: #fafafa; border-top: 1px solid #e8e8e8; text-align: center; }
    .footer-text { font-size: 13px; color: #666666; line-height: 1.8; }
    .footer-links { margin-top: 16px; }
    .footer-link { color: #666666; text-decoration: none; margin: 0 8px; font-size: 13px; }
    .footer-link:hover { color: #007AFF; }
    h1 { font-size: 24px; font-weight: 600; color: #1a1a1a; margin-bottom: 16px; line-height: 1.3; }
    p { font-size: 15px; color: #4a4a4a; margin-bottom: 16px; line-height: 1.6; }
    .code-box { background-color: #f5f5f5; border-left: 3px solid #007AFF; padding: 20px; margin: 24px 0; border-radius: 4px; text-align: center; }
    .code { font-size: 32px; font-weight: 700; color: #007AFF; letter-spacing: 8px; font-family: 'Courier New', monospace; }
    .info-box { background-color: #f5f5f5; border-left: 3px solid #007AFF; padding: 16px 20px; margin: 24px 0; border-radius: 4px; }
    .info-box p { margin-bottom: 0; font-size: 14px; color: #4a4a4a; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .content, .header, .footer { padding: 24px 20px !important; }
      h1 { font-size: 22px !important; }
      .code { font-size: 28px !important; letter-spacing: 6px !important; }
    }
  </style>
</head>
<body>
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7f7f7; padding: 40px 0;">
    <tr>
      <td align="center">
        <table class="container" width="600" cellpadding="0" cellspacing="0">
          <tr>
            <td class="header">
              <a href="https://vente.club" class="logo">Vente.Club</a>
            </td>
          </tr>
          <tr>
            <td class="content">
              <h1>Confirmez votre compte</h1>
              <p>Bienvenue sur Vente.Club ! Pour activer votre compte, veuillez utiliser le code de vérification suivant :</p>
              <div class="code-box">
                <div class="code">${code}</div>
              </div>
              <p style="font-size: 14px; color: #666666;">Ce code est valide pendant 60 minutes. Si vous n'avez pas créé de compte, vous pouvez ignorer ce message en toute sécurité.</p>
              <div class="info-box">
                <p><strong>Conseils de sécurité :</strong></p>
                <p>• Ne partagez jamais ce code avec personne</p>
                <p>• Vente.Club ne vous demandera jamais ce code par téléphone</p>
              </div>
            </td>
          </tr>
          <tr>
            <td class="footer">
              <p class="footer-text">
                Vente.Club - Votre partenaire pour l'achat et la vente d'entreprises au Québec
              </p>
              <div class="footer-links">
                <a href="https://vente.club" class="footer-link">Accueil</a>
                <a href="https://vente.club/contact" class="footer-link">Contact</a>
                <a href="https://vente.club/terms" class="footer-link">Politique de confidentialité</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

interface VerificationEmailRequest {
  email: string;
  token: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, token }: VerificationEmailRequest = await req.json();
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    console.log("[VERIFICATION-EMAIL] ===== START =====");
    console.log("[VERIFICATION-EMAIL] Email destination:", email);
    console.log("[VERIFICATION-EMAIL] Token fourni:", token ? "OUI" : "NON");
    console.log("[VERIFICATION-EMAIL] RESEND_API_KEY configurée:", RESEND_API_KEY ? "OUI (longueur: " + RESEND_API_KEY.length + ")" : "NON");

    if (!RESEND_API_KEY) {
      console.error("[VERIFICATION-EMAIL] ❌ RESEND_API_KEY manquante !");
      throw new Error("RESEND_API_KEY is not configured");
    }

    if (!email || !token) {
      console.error("[VERIFICATION-EMAIL] ❌ Email ou token manquant !");
      throw new Error("Email and token are required");
    }

    console.log("[VERIFICATION-EMAIL] Préparation de l'email...");

    const html = getVerificationCodeEmail(token);

    console.log("[VERIFICATION-EMAIL] Envoi de l'email via Resend...");
    const { error: emailError } = await resend.emails.send({
      from: "Vente.Club <info@vente.club>",
      to: [email],
      subject: "Confirmez votre compte Vente.Club",
      html,
    });

    if (emailError) {
      console.error("[VERIFICATION-EMAIL] ❌ Erreur Resend:", emailError);
      throw emailError;
    }
    console.log("[VERIFICATION-EMAIL] ✅ Email envoyé avec succès!");
    console.log("[VERIFICATION-EMAIL] ===== END =====");

    return new Response(
      JSON.stringify({ success: true, message: "Email envoyé" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("[VERIFICATION-EMAIL] ❌ EXCEPTION:", error);
    console.error("[VERIFICATION-EMAIL] Message:", error.message);
    console.error("[VERIFICATION-EMAIL] Stack:", error.stack);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "Vérifiez les logs de la fonction pour plus d'informations"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
