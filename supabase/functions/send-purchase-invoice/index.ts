import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PurchaseInvoiceRequest {
  email: string;
  name?: string;
  businessTitle: string;
  accessType: string;
  amount: number;
  currency: string;
  invoiceId: string;
  purchaseDate: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      email, 
      name, 
      businessTitle, 
      accessType, 
      amount, 
      currency, 
      invoiceId,
      purchaseDate 
    }: PurchaseInvoiceRequest = await req.json();
    
    console.log("Sending purchase invoice to:", email);

    const formattedAmount = new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: currency || 'CAD',
    }).format(amount / 100);

    const formattedDate = new Date(purchaseDate).toLocaleDateString('fr-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const accessTypeLabel = accessType === 'one_time' ? 'Accès unique' : 'Abonnement mensuel';

    const emailResponse = await resend.emails.send({
      from: "Vente.club <info@vente.club>",
      to: [email],
      subject: `Facture #${invoiceId} - Accès déverrouillé sur Vente.club`,
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
              .invoice-header { display: flex; justify-content: space-between; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #667eea; }
              .invoice-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e0e0e0; }
              .invoice-row.total { border-top: 2px solid #667eea; border-bottom: none; font-weight: bold; font-size: 18px; color: #667eea; padding-top: 20px; margin-top: 10px; }
              .success-box { background: #d4edda; border: 2px solid #28a745; color: #155724; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
              .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">Facture de votre achat</h1>
              </div>
              <div class="content">
                <p style="font-size: 18px; color: #667eea; font-weight: 600;">Bonjour ${name || 'cher membre'},</p>
                
                <p>Merci pour votre achat sur Vente.club. Voici votre facture détaillée.</p>
                
                <div class="success-box">
                  <h3 style="margin: 0 0 10px 0;">Accès déverrouillé avec succès</h3>
                  <p style="margin: 0;">Vous pouvez maintenant contacter le vendeur de "<strong>${businessTitle}</strong>"</p>
                </div>

                <div class="invoice-box">
                  <div class="invoice-header">
                    <div>
                      <strong style="color: #667eea; font-size: 16px;">FACTURE</strong><br>
                      <span style="color: #666;">#${invoiceId}</span>
                    </div>
                    <div style="text-align: right;">
                      <strong>Vente.club</strong><br>
                      <span style="color: #666; font-size: 14px;">${formattedDate}</span>
                    </div>
                  </div>
                  
                  <div class="invoice-row">
                    <span>Entreprise</span>
                    <span><strong>${businessTitle}</strong></span>
                  </div>
                  <div class="invoice-row">
                    <span>Type d'accès</span>
                    <span>${accessTypeLabel}</span>
                  </div>
                  <div class="invoice-row">
                    <span>Date d'achat</span>
                    <span>${formattedDate}</span>
                  </div>
                  <div class="invoice-row total">
                    <span>Total payé</span>
                    <span>${formattedAmount}</span>
                  </div>
                </div>

                <p style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0;">
                  <strong>Note :</strong> Vous pouvez retrouver vos achats et factures dans votre espace membre, section "Mes achats".
                </p>

                <p style="margin-top: 30px;">Si vous avez des questions, n'hésitez pas à nous contacter.</p>
                
                <p style="margin-top: 20px;">Cordialement,<br><strong>L'équipe Vente.club</strong></p>
              </div>
              <div class="footer">
                <p>© 2025 Vente.club. Tous droits réservés.</p>
                <p>Cette facture a été générée automatiquement et constitue une preuve d'achat valide.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("Purchase invoice sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending purchase invoice:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
