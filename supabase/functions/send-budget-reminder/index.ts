import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReminderPayload {
  reminderId?: string;
  sendPending?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { reminderId, sendPending }: ReminderPayload = await req.json();

    let reminders = [];

    if (reminderId) {
      // Envoyer un rappel spécifique
      const { data, error } = await supabase
        .from("budget_reminders")
        .select(`
          *,
          profiles:user_id (email, full_name)
        `)
        .eq("id", reminderId)
        .single();

      if (error) throw error;
      reminders = [data];
    } else if (sendPending) {
      // Envoyer tous les rappels en attente
      const { data, error } = await supabase
        .from("budget_reminders")
        .select(`
          *,
          profiles:user_id (email, full_name)
        `)
        .eq("email_sent", false)
        .eq("is_completed", false)
        .lte("reminder_date", new Date().toISOString());

      if (error) throw error;
      reminders = data || [];
    }

    console.log(`Found ${reminders.length} reminders to send`);

    const results = [];

    for (const reminder of reminders) {
      const userEmail = reminder.profiles?.email;
      const userName = reminder.profiles?.full_name || "utilisateur";

      if (!userEmail) {
        console.log(`No email for reminder ${reminder.id}, skipping`);
        continue;
      }

      // Déterminer le contenu du email selon le type de rappel
      let subject = "";
      let htmlContent = "";

      switch (reminder.reminder_type) {
        case "goal_deadline":
          subject = `⏰ Rappel : Échéance de votre objectif`;
          htmlContent = `
            <h1>Rappel d'objectif</h1>
            <p>Bonjour ${userName},</p>
            <p><strong>${reminder.title}</strong></p>
            <p>${reminder.description}</p>
            <p>N'oubliez pas de consulter votre planificateur budgétaire pour suivre vos progrès !</p>
            <a href="https://vente.club/outils/budget" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">
              Voir mon budget
            </a>
          `;
          break;

        case "subscription_renewal":
          subject = `💳 Rappel : Renouvellement d'abonnement`;
          htmlContent = `
            <h1>Renouvellement d'abonnement détecté</h1>
            <p>Bonjour ${userName},</p>
            <p><strong>${reminder.title}</strong></p>
            <p>${reminder.description}</p>
            <p>Vérifiez si cet abonnement est toujours nécessaire pour optimiser vos dépenses.</p>
            <a href="https://vente.club/outils/budget" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">
              Gérer mes abonnements
            </a>
          `;
          break;

        case "budget_overrun":
          subject = `⚠️ Alerte : Dépassement budgétaire prévu`;
          htmlContent = `
            <h1>Alerte budgétaire</h1>
            <p>Bonjour ${userName},</p>
            <p><strong>${reminder.title}</strong></p>
            <p>${reminder.description}</p>
            <p>Consultez votre tableau de bord pour ajuster vos dépenses ce mois-ci.</p>
            <a href="https://vente.club/outils/budget" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">
              Voir les détails
            </a>
          `;
          break;

        case "tax_optimization":
          subject = `💰 Opportunité : Optimisation fiscale REER/CELI`;
          htmlContent = `
            <h1>Opportunité d'optimisation fiscale</h1>
            <p>Bonjour ${userName},</p>
            <p><strong>${reminder.title}</strong></p>
            <p>${reminder.description}</p>
            <p>Profitez des avantages fiscaux avant la fin de l'année !</p>
            <a href="https://vente.club/outils/budget" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">
              En savoir plus
            </a>
          `;
          break;

        default:
          subject = `📋 Rappel budgétaire`;
          htmlContent = `
            <h1>Rappel</h1>
            <p>Bonjour ${userName},</p>
            <p><strong>${reminder.title}</strong></p>
            <p>${reminder.description}</p>
            <a href="https://vente.club/outils/budget" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">
              Accéder au planificateur
            </a>
          `;
      }

      try {
        const emailResponse = await resend.emails.send({
          from: "Planificateur Budget <budget@vente.club>",
          to: [userEmail],
          subject: subject,
          html: htmlContent,
        });

        console.log(`Email sent for reminder ${reminder.id}:`, emailResponse);

        // Marquer le rappel comme envoyé
        await supabase
          .from("budget_reminders")
          .update({ email_sent: true })
          .eq("id", reminder.id);

        results.push({
          reminderId: reminder.id,
          success: true,
          emailId: emailResponse.data?.id,
        });
      } catch (emailError: any) {
        console.error(`Failed to send email for reminder ${reminder.id}:`, emailError);
        results.push({
          reminderId: reminder.id,
          success: false,
          error: String(emailError?.message || emailError),
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        remindersSent: results.length,
        results,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-budget-reminder function:", error);
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
