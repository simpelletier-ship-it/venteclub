import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubscriptionEmailRequest {
  email: string;
  name?: string;
  subscriptionType: string;
  amount: number;
  currency: string;
  periodEnd: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, subscriptionType, amount, currency, periodEnd }: SubscriptionEmailRequest = await req.json();
    
    console.log("Sending subscription email to:", email);

    const formattedAmount = new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: currency || 'CAD',
    }).format(amount / 100);

    const formattedDate = new Date(periodEnd).toLocaleDateString('fr-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const emailResponse = await resend.emails.send({
      from: "Vente.club <info@vente.club>",
      to: [email],
      subject: "Confirmation de votre abonnement Premium - Vente.club",
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
              .invoice-box { background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0; border: 2px solid #667eea; }
              .invoice-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e0e0e0; }
              .invoice-row.total { border-top: 2px solid #667eea; border-bottom: none; font-weight: bold; font-size: 18px; color: #667eea; padding-top: 20px; margin-top: 10px; }
              .benefits { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .benefit-item { margin: 12px 0; padding-left: 25px; position: relative; }
              .benefit-item:before { content: "✓"; position: absolute; left: 0; color: #667eea; font-weight: bold; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">Abonnement Premium Activé</h1>
              </div>
              <div class="content">
                <p style="font-size: 18px; color: #667eea; font-weight: 600;">Bonjour ${name || 'cher membre'},</p>
                
                <p>Votre abonnement <strong>${subscriptionType}</strong> est maintenant actif.</p>
                
                <div class="invoice-box">
                  <h3 style="margin-top: 0; color: #667eea;">Détails de votre facture</h3>
                  <div class="invoice-row">
                    <span>Abonnement</span>
                    <span><strong>${subscriptionType}</strong></span>
                  </div>
                  <div class="invoice-row">
                    <span>Période</span>
                    <span>Mensuel</span>
                  </div>
                  <div class="invoice-row">
                    <span>Renouvellement</span>
                    <span>${formattedDate}</span>
                  </div>
                  <div class="invoice-row total">
                    <span>Total</span>
                    <span>${formattedAmount}</span>
                  </div>
                </div>

                <div class="benefits">
                  <h3 style="color: #667eea; margin-top: 0;">Vos avantages Premium</h3>
                  <div class="benefit-item">Accès illimité aux contacts des vendeurs</div>
                  <div class="benefit-item">Messagerie directe sans restrictions</div>
                  <div class="benefit-item">Alertes en temps réel sur les nouvelles annonces</div>
                  <div class="benefit-item">Badge Premium sur votre profil</div>
                  <div class="benefit-item">Support prioritaire</div>
                  <div class="benefit-item">Outils d'analyse et statistiques</div>
                </div>

                <p style="margin-top: 30px;">Vous pouvez gérer votre abonnement à tout moment depuis votre espace membre.</p>
                
                <p style="margin-top: 20px;">Merci de votre confiance,<br><strong>L'équipe Vente.club</strong></p>
              </div>
              <div class="footer">
                <p>© 2025 Vente.club. Tous droits réservés.</p>
                <p>Cette facture a été générée automatiquement par notre système.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Subscription email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending subscription email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
