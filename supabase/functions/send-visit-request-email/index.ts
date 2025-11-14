import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      businessTitle,
      businessId,
      sellerId,
      visitorName,
      visitorEmail,
      visitorPhone,
      preferredDate,
      preferredTime,
      message,
    } = await req.json();

    console.log('[VISIT-REQUEST] Processing visit request for business:', businessTitle);

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get seller email
    const { data: seller, error: sellerError } = await supabaseClient
      .from('profiles')
      .select('email, full_name')
      .eq('id', sellerId)
      .single();

    if (sellerError || !seller?.email) {
      console.error('[VISIT-REQUEST] Error fetching seller:', sellerError);
      throw new Error('Seller email not found');
    }

    // Send email using Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #667eea; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📅 Nouvelle demande de visite</h1>
          </div>
          <div class="content">
            <p>Bonjour ${seller.full_name || 'Vendeur'},</p>
            
            <p>Vous avez reçu une nouvelle demande de visite pour votre annonce :</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0; color: #667eea;">🏢 ${businessTitle}</h3>
            </div>

            <h3>Informations du visiteur :</h3>
            <div class="info-box">
              <p><strong>👤 Nom :</strong> ${visitorName}</p>
              <p><strong>📧 Email :</strong> <a href="mailto:${visitorEmail}">${visitorEmail}</a></p>
              <p><strong>📱 Téléphone :</strong> <a href="tel:${visitorPhone}">${visitorPhone}</a></p>
            </div>

            <h3>Date et heure souhaitées :</h3>
            <div class="info-box">
              <p><strong>📅 Date :</strong> ${preferredDate}</p>
              <p><strong>🕒 Heure :</strong> ${preferredTime}</p>
            </div>

            ${message ? `
              <h3>Message :</h3>
              <div class="info-box">
                <p>${message}</p>
              </div>
            ` : ''}

            <p style="margin-top: 30px;">
              <strong>Prochaines étapes :</strong><br>
              Contactez ${visitorName} par email ou téléphone pour confirmer la visite.
            </p>

            <div style="text-align: center;">
              <a href="https://vente.club/messages" class="button">Voir mes messages</a>
            </div>

            <div class="footer">
              <p>Vente.club - Plateforme de vente d'entreprises au Québec</p>
              <p>Cet email a été envoyé automatiquement suite à une demande de visite.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Vente.club <notifications@vente.club>',
        to: [seller.email],
        subject: `📅 Nouvelle demande de visite - ${businessTitle}`,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[VISIT-REQUEST] Resend error:', error);
      throw new Error(`Failed to send email: ${error}`);
    }

    console.log('[VISIT-REQUEST] Email sent successfully to:', seller.email);

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('[VISIT-REQUEST] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
