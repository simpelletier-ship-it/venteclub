import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SaleNotificationRequest {
  sellerEmail: string;
  sellerName?: string;
  businessTitle: string;
  salePrice: number;
  currency: string;
  saleDate: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      sellerEmail, 
      sellerName, 
      businessTitle, 
      salePrice, 
      currency,
      saleDate 
    }: SaleNotificationRequest = await req.json();
    
    console.log("Sending sale notification to:", sellerEmail);

    const formattedAmount = new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: currency || 'CAD',
    }).format(salePrice);

    const formattedDate = new Date(saleDate).toLocaleDateString('fr-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const emailResponse = await resend.emails.send({
      from: "Vente.club <noreply@vente.club>",
      to: [sellerEmail],
      subject: `🎉 Félicitations ! "${businessTitle}" a été vendue`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
              .content { background: #ffffff; padding: 40px 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              .success-box { background: #d4edda; border: 2px solid #28a745; color: #155724; padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center; }
              .details-box { background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0; }
              .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e0e0e0; }
              .next-steps { background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; border-radius: 4px; margin: 20px 0; }
              .next-step { margin: 12px 0; padding-left: 25px; position: relative; }
              .next-step:before { content: "→"; position: absolute; left: 0; color: #ffc107; font-weight: bold; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 32px;">🎉 Vente Confirmée !</h1>
              </div>
              <div class="content">
                <p style="font-size: 18px; color: #28a745; font-weight: 600;">Félicitations ${sellerName || 'cher vendeur'},</p>
                
                <div class="success-box">
                  <h2 style="margin: 0 0 10px 0; font-size: 24px;">Votre entreprise a été vendue ! 🎊</h2>
                  <p style="margin: 10px 0; font-size: 18px;"><strong>"${businessTitle}"</strong></p>
                  <p style="margin: 0; font-size: 16px;">Date de vente : ${formattedDate}</p>
                </div>

                <p>Nous sommes ravis de vous annoncer que votre annonce a été marquée comme vendue sur notre plateforme.</p>

                <div class="details-box">
                  <h3 style="color: #28a745; margin-top: 0;">📊 Résumé de la transaction</h3>
                  <div class="detail-row">
                    <span>Entreprise</span>
                    <span><strong>${businessTitle}</strong></span>
                  </div>
                  <div class="detail-row">
                    <span>Prix de vente</span>
                    <span><strong style="color: #28a745; font-size: 18px;">${formattedAmount}</strong></span>
                  </div>
                  <div class="detail-row" style="border-bottom: none;">
                    <span>Date de finalisation</span>
                    <span>${formattedDate}</span>
                  </div>
                </div>

                <div class="next-steps">
                  <h3 style="margin-top: 0; color: #856404;">📝 Prochaines étapes</h3>
                  <div class="next-step">Finalisez la transition avec l'acheteur</div>
                  <div class="next-step">Complétez les documents légaux nécessaires</div>
                  <div class="next-step">Organisez le transfert d'actifs et de propriété</div>
                  <div class="next-step">N'oubliez pas de mettre à jour vos registres fiscaux</div>
                </div>

                <p style="background: #e7f3ff; border-left: 4px solid #007bff; padding: 15px; border-radius: 4px; margin: 20px 0;">
                  💼 <strong>Vous avez d'autres entreprises à vendre ?</strong><br>
                  Créez une nouvelle annonce sur Vente.club et profitez de notre réseau d'acheteurs qualifiés.
                </p>

                <p style="margin-top: 30px;">Merci d'avoir fait confiance à Vente.club pour cette transaction importante. Nous vous souhaitons beaucoup de succès dans vos futurs projets !</p>
                
                <p style="margin-top: 20px;">Cordialement,<br><strong>L'équipe Vente.club</strong></p>
              </div>
              <div class="footer">
                <p>© 2025 Vente.club. Tous droits réservés.</p>
                <p>La plateforme de confiance pour vendre votre entreprise au Québec</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Sale notification sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending sale notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
