import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name }: WelcomeEmailRequest = await req.json();
    
    console.log("Sending welcome email to:", email);

    const emailResponse = await resend.emails.send({
      from: "Vente.club <info@vente.club>",
      to: [email],
      subject: "Bienvenue sur Vente.club - Votre plateforme de vente d'entreprises au Québec",
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
              .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
              .features { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .feature-item { margin: 15px 0; padding-left: 25px; position: relative; }
              .feature-item:before { content: "✓"; position: absolute; left: 0; color: #667eea; font-weight: bold; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">🎉 Bienvenue sur Vente.club</h1>
              </div>
              <div class="content">
                <p style="font-size: 18px; color: #667eea; font-weight: 600;">Bonjour ${name || 'cher membre'},</p>
                
                <p>Nous sommes ravis de vous accueillir sur <strong>Vente.club</strong>, la plateforme #1 pour acheter et vendre des entreprises au Québec.</p>
                
                <div class="features">
                  <h3 style="color: #667eea; margin-top: 0;">Ce que vous pouvez faire dès maintenant :</h3>
                  <div class="feature-item">Parcourir des centaines d'entreprises à vendre</div>
                  <div class="feature-item">Contacter directement les vendeurs</div>
                  <div class="feature-item">Créer des alertes personnalisées</div>
                  <div class="feature-item">Mettre vos annonces en vedette</div>
                  <div class="feature-item">Accéder à des outils d'évaluation</div>
                </div>

                <div style="text-align: center;">
                  <a href="${Deno.env.get("VITE_SUPABASE_URL")?.replace("supabase.co", "vente.club") || "https://vente.club"}" class="button">
                    Explorer les opportunités
                  </a>
                </div>

                <p style="margin-top: 30px;">Besoin d'aide ? Notre équipe est à votre disposition pour répondre à toutes vos questions.</p>
                
                <p style="margin-top: 20px;">À bientôt,<br><strong>L'équipe Vente.club</strong></p>
              </div>
              <div class="footer">
                <p>© 2025 Vente.club. Tous droits réservés.</p>
                <p>La plateforme de référence pour la vente d'entreprises au Québec</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
