import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AlertEmailRequest {
  userEmail: string;
  businessTitle: string;
  businessId: string;
  businessCity: string;
  businessIndustry: string;
  businessPrice: number;
  alertType: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      userEmail,
      businessTitle,
      businessId,
      businessCity,
      businessIndustry,
      businessPrice,
      alertType,
    }: AlertEmailRequest = await req.json();

    console.log("[SEND-ALERT-EMAIL] Sending alert email to:", userEmail);

    const businessUrl = `https://vente.club/business/${businessId}`;
    
    let alertDescription = "";
    switch (alertType) {
      case "all":
        alertDescription = "Nouvelle annonce disponible";
        break;
      case "category":
        alertDescription = `Nouvelle annonce dans votre catégorie suivie`;
        break;
      case "city":
        alertDescription = `Nouvelle annonce dans votre ville suivie`;
        break;
      default:
        alertDescription = "Nouvelle opportunité";
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; 
              line-height: 1.6; 
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f4f4f4;
            }
            .container { 
              max-width: 600px; 
              margin: 20px auto; 
              background: white; 
              border-radius: 12px; 
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .header { 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
              color: white; 
              padding: 30px 20px; 
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content { 
              padding: 30px 20px; 
            }
            .business-card {
              background: #f8f9fa;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .business-card h2 {
              margin: 0 0 10px 0;
              color: #667eea;
              font-size: 22px;
            }
            .detail {
              margin: 8px 0;
              color: #555;
            }
            .detail strong {
              color: #333;
            }
            .price {
              font-size: 24px;
              font-weight: bold;
              color: #667eea;
              margin: 15px 0;
            }
            .button { 
              display: inline-block;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
              color: white; 
              padding: 14px 32px; 
              text-decoration: none; 
              border-radius: 8px; 
              margin: 20px 0;
              font-weight: 600;
            }
            .footer { 
              background: #f8f9fa; 
              padding: 20px; 
              text-align: center; 
              font-size: 12px; 
              color: #666;
              border-top: 1px solid #e0e0e0;
            }
            .alert-badge {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 6px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              margin-bottom: 15px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 Alerte Vente.Club</h1>
            </div>
            <div class="content">
              <div class="alert-badge">${alertDescription}</div>
              
              <p>Bonjour,</p>
              
              <p>Une nouvelle opportunité correspond à vos critères d'alerte :</p>
              
              <div class="business-card">
                <h2>${businessTitle}</h2>
                <div class="detail"><strong>📍 Localisation:</strong> ${businessCity}</div>
                <div class="detail"><strong>🏢 Secteur:</strong> ${businessIndustry}</div>
                <div class="price">${businessPrice.toLocaleString('fr-CA')} $ CAD</div>
              </div>
              
              <p>Ne manquez pas cette opportunité ! Consultez les détails complets de cette annonce dès maintenant.</p>
              
              <center>
                <a href="${businessUrl}" class="button">Voir l'annonce complète</a>
              </center>
              
              <p style="margin-top: 30px; font-size: 14px; color: #666;">
                💡 <strong>Conseil:</strong> Les meilleures opportunités partent vite. Agissez rapidement pour ne pas manquer cette occasion.
              </p>
            </div>
            <div class="footer">
              <p><strong>Vente.Club</strong> - Plateforme québécoise d'achat et vente d'entreprises</p>
              <p>
                <a href="https://vente.club" style="color: #667eea; text-decoration: none;">Visiter le site</a> | 
                <a href="https://vente.club/settings" style="color: #667eea; text-decoration: none;">Gérer mes alertes</a>
              </p>
              <p style="margin-top: 15px; font-size: 11px;">
                Vous recevez cet email car vous avez activé les alertes email sur Vente.Club.<br>
                Vous pouvez modifier vos préférences d'alerte dans vos paramètres.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: "Vente.Club Alertes <notifications@vente.club>",
      to: [userEmail],
      subject: `🔔 ${alertDescription}: ${businessTitle}`,
      html: emailHtml,
    });

    if (error) {
      console.error("[SEND-ALERT-EMAIL] Error:", error);
      throw error;
    }

    console.log("[SEND-ALERT-EMAIL] Email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("[SEND-ALERT-EMAIL] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
