import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    console.log("Sending verification code to:", email);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0; padding: 0;">
            <tr>
              <td style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px 12px 0 0;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Vente.Club</h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 24px; font-weight: 600;">Code de vérification</h2>
                      <p style="margin: 0 0 30px; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                        Bienvenue sur Vente.Club ! Pour finaliser la création de votre compte, veuillez utiliser le code de vérification suivant :
                      </p>
                      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                        <tr>
                          <td style="padding: 30px; background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); border-radius: 8px; text-align: center; border: 2px dashed #667eea;">
                            <div style="font-size: 36px; font-weight: 700; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                              ${token}
                            </div>
                          </td>
                        </tr>
                      </table>
                      <p style="margin: 30px 0 0; color: #4a4a4a; font-size: 14px; line-height: 1.6;">
                        Ce code est valide pendant <strong>60 minutes</strong>. Si vous n'avez pas demandé ce code, vous pouvez ignorer cet email en toute sécurité.
                      </p>
                      <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #e5e5e5;">
                        <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.6;">
                          <strong>Conseils de sécurité :</strong><br>
                          • Ne partagez jamais ce code avec personne<br>
                          • Vente.Club ne vous demandera jamais ce code par téléphone<br>
                          • Consultez vos courriels indésirables si vous ne voyez pas cet email
                        </p>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 30px 40px; background-color: #f8f8f8; border-radius: 0 0 12px 12px; text-align: center;">
                      <p style="margin: 0 0 10px; color: #999999; font-size: 13px;">
                        © 2025 Vente.Club - Plateforme d'achat et vente d'entreprises au Québec
                      </p>
                      <p style="margin: 0; color: #999999; font-size: 12px;">
                        Des questions ? Contactez-nous à <a href="mailto:info@vente.club" style="color: #667eea; text-decoration: none;">info@vente.club</a>
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

    // Utiliser l'API Resend directement avec fetch
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Vente.Club <onboarding@resend.dev>",
        to: [email],
        subject: "Code de vérification Vente.Club",
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error("Resend API error:", errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const emailResponse = await resendResponse.json();
    console.log("Verification email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-verification-code function:", error);
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
