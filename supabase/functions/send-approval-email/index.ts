import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApprovalEmailRequest {
  businessId: string;
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
    const { businessId }: ApprovalEmailRequest = await req.json();
    
    console.log("Sending approval email for business:", businessId);

    // Fetch business details
    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('title, seller_id, asking_price, currency, city, province')
      .eq('id', businessId)
      .single();

    if (businessError || !business) {
      throw new Error("Business not found");
    }

    // Fetch seller profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name, first_name')
      .eq('id', business.seller_id)
      .single();

    if (!profile?.email) {
      throw new Error("Seller email not found");
    }

    const sellerName = profile.first_name || profile.full_name || profile.email.split('@')[0];
    const formattedPrice = new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: business.currency || 'CAD',
    }).format(business.asking_price);

    const businessUrl = `https://vente.club/business/${businessId}`;

    const emailResponse = await resend.emails.send({
      from: "Vente.club <info@vente.club>",
      to: [profile.email],
      subject: `✅ Votre annonce "${business.title}" a été approuvée !`,
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
              .business-details { background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 25px 0; }
              .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e0e0e0; }
              .detail-row:last-child { border-bottom: none; }
              .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 25px 0; text-align: center; }
              .tips-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; border-radius: 4px; margin: 20px 0; }
              .tip-item { margin: 10px 0; padding-left: 25px; position: relative; }
              .tip-item:before { content: "💡"; position: absolute; left: 0; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 32px;">Annonce Approuvée</h1>
              </div>
              <div class="content">
                <p style="font-size: 18px; color: #28a745; font-weight: 600;">Bonjour ${sellerName},</p>
                
                <div class="success-box">
                  <h2 style="margin: 0 0 10px 0; font-size: 24px;">Bonne nouvelle</h2>
                  <p style="margin: 10px 0; font-size: 18px;">Votre annonce "<strong>${business.title}</strong>" est maintenant en ligne.</p>
                </div>

                <p>Notre équipe a validé votre annonce et elle est désormais visible par les acheteurs potentiels sur Vente.club.</p>

                <div class="business-details">
                  <h3 style="color: #667eea; margin-top: 0;">Détails de votre annonce</h3>
                  <div class="detail-row">
                    <span>Titre</span>
                    <span><strong>${business.title}</strong></span>
                  </div>
                  <div class="detail-row">
                    <span>Prix demandé</span>
                    <span><strong style="color: #28a745;">${formattedPrice}</strong></span>
                  </div>
                  <div class="detail-row">
                    <span>Localisation</span>
                    <span>${business.city}, ${business.province}</span>
                  </div>
                  <div class="detail-row">
                    <span>Statut</span>
                    <span><strong style="color: #28a745;">En ligne</strong></span>
                  </div>
                </div>

                <div style="text-align: center;">
                  <a href="${businessUrl}" class="cta-button">
                    Voir mon annonce en ligne
                  </a>
                </div>

                <div class="tips-box">
                  <h3 style="margin-top: 0; color: #856404;">Conseils pour maximiser vos chances de vente</h3>
                  <div class="tip-item">Répondez rapidement aux demandes des acheteurs</div>
                  <div class="tip-item">Mettez à jour votre annonce si nécessaire</div>
                  <div class="tip-item">Ajoutez des photos de qualité pour attirer plus d'acheteurs</div>
                  <div class="tip-item">Soyez transparent sur les informations financières</div>
                  <div class="tip-item">Consultez régulièrement vos messages et notifications</div>
                </div>

                <p style="background: #e7f3ff; border-left: 4px solid #007bff; padding: 15px; border-radius: 4px; margin: 20px 0;">
                  <strong>Option disponible :</strong><br>
                  Mettez votre annonce en vedette pour apparaître en haut des résultats et augmenter sa visibilité.
                </p>

                <p style="margin-top: 30px;">Nous vous souhaitons une vente rapide et réussie. Notre équipe reste à votre disposition pour toute question.</p>
                
                <p style="margin-top: 20px;">Cordialement,<br><strong>L'équipe Vente.club</strong></p>
              </div>
              <div class="footer">
                <p>© 2025 Vente.club. Tous droits réservés.</p>
                <p>Vous recevez cet email car vous avez créé une annonce sur Vente.club</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Approval email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending approval email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
