import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

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
      from: "Vente.club <info@vente.club>",
      to: [email],
      subject: "Réinitialisation de votre mot de passe - Vente.club",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
              .content { background: #ffffff; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              .reset-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 25px 0; text-align: center; }
              .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
              .security-info { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .info-item { margin: 10px 0; padding-left: 25px; position: relative; }
              .info-item:before { content: "•"; position: absolute; left: 0; font-weight: bold; color: #667eea; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">Réinitialisation de mot de passe</h1>
              </div>
              <div class="content">
                <p style="font-size: 18px; color: #667eea; font-weight: 600;">Bonjour ${userName},</p>
                
                <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Vente.club.</p>

                <p>Pour créer un nouveau mot de passe, cliquez sur le bouton ci-dessous :</p>

                <div style="text-align: center;">
                  <a href="${resetLink}" class="reset-button">
                    Réinitialiser mon mot de passe
                  </a>
                </div>

                <div class="warning-box">
                  <strong>Important :</strong> Ce lien expirera dans 1 heure pour des raisons de sécurité.
                </div>

                <div class="security-info">
                  <h3 style="margin-top: 0; color: #667eea;">Conseils de sécurité</h3>
                  <div class="info-item">Choisissez un mot de passe d'au moins 8 caractères</div>
                  <div class="info-item">Utilisez une combinaison de lettres, chiffres et symboles</div>
                  <div class="info-item">Ne réutilisez pas de mots de passe d'autres comptes</div>
                  <div class="info-item">Activez l'authentification à deux facteurs si disponible</div>
                </div>

                <p style="background: #e7f3ff; border-left: 4px solid #007bff; padding: 15px; border-radius: 4px; margin: 20px 0;">
                  <strong>Vous n'avez pas demandé cette réinitialisation ?</strong><br>
                  Si vous n'avez pas fait cette demande, ignorez cet email et votre mot de passe restera inchangé. Votre compte est en sécurité.
                </p>

                <p style="margin-top: 30px;">Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
                <p style="word-break: break-all; color: #667eea; font-size: 12px;">${resetLink}</p>
                
                <p style="margin-top: 30px;">Cordialement,<br><strong>L'équipe Vente.club</strong></p>
              </div>
              <div class="footer">
                <p>© 2025 Vente.club. Tous droits réservés.</p>
                <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
              </div>
            </div>
          </body>
        </html>
      `,
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
