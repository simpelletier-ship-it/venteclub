import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  email: string;
  businessTitle: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, businessTitle, status, rejectionReason }: EmailRequest = await req.json();

    let subject = "";
    let html = "";

    switch (status) {
      case 'pending':
        subject = "Votre annonce est en cours de révision";
        html = `
          <h1>Merci pour votre soumission</h1>
          <p>Bonjour,</p>
          <p>Nous avons bien reçu votre annonce "<strong>${businessTitle}</strong>".</p>
          <p>Votre annonce est actuellement <strong>en attente d'approbation</strong> par notre équipe. Nous examinerons votre soumission dans les plus brefs délais.</p>
          <p>Vous recevrez un email dès que votre annonce sera approuvée ou si nous avons besoin de plus d'informations.</p>
          <p>Cordialement,<br>L'équipe Vente.Club</p>
        `;
        break;
        
      case 'approved':
        subject = "Votre annonce a été approuvée !";
        html = `
          <h1>Félicitations !</h1>
          <p>Bonjour,</p>
          <p>Bonne nouvelle ! Votre annonce "<strong>${businessTitle}</strong>" a été <strong>approuvée</strong> et est maintenant visible sur notre plateforme.</p>
          <p>Les acheteurs potentiels peuvent désormais consulter votre annonce et vous contacter.</p>
          <p>Vous pouvez gérer votre annonce depuis votre <a href="${req.headers.get("origin")}/dashboard">tableau de bord</a>.</p>
          <p>Cordialement,<br>L'équipe Vente.Club</p>
        `;
        break;
        
      case 'rejected':
        subject = "Votre annonce a été refusée";
        html = `
          <h1>Annonce refusée</h1>
          <p>Bonjour,</p>
          <p>Nous regrettons de vous informer que votre annonce "<strong>${businessTitle}</strong>" n'a pas été approuvée.</p>
          ${rejectionReason ? `<p><strong>Raison :</strong> ${rejectionReason}</p>` : ''}
          <p>Si vous pensez qu'il s'agit d'une erreur ou si vous souhaitez plus d'informations, n'hésitez pas à nous contacter.</p>
          <p>Vous pouvez modifier votre annonce depuis votre <a href="${req.headers.get("origin")}/dashboard">tableau de bord</a> et la resoumettre.</p>
          <p>Cordialement,<br>L'équipe Vente.Club</p>
        `;
        break;
    }

    const emailResponse = await resend.emails.send({
      from: "Vente.Club <onboarding@resend.dev>",
      to: [email],
      subject: subject,
      html: html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-approval-email function:", error);
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
