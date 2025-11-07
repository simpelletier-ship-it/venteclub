import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getListingApprovedEmail } from "../_shared/email-templates.ts";

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
    const businessLocation = `${business.city}, ${business.province}`;

    const html = getListingApprovedEmail(
      sellerName,
      business.title,
      formattedPrice,
      businessLocation,
      businessUrl
    );

    const emailResponse = await resend.emails.send({
      from: "Vente.Club <info@vente.club>",
      to: [profile.email],
      subject: `✅ Votre annonce "${business.title}" a été approuvée`,
      html,
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
