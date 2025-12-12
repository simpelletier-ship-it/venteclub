import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LoginAttemptRequest {
  email: string;
  success: boolean;
  failure_reason?: string;
  ip_address?: string;
  user_agent?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { email, success, failure_reason, ip_address, user_agent }: LoginAttemptRequest = await req.json();

    console.log("Processing login attempt check");

    // Enregistrer la tentative de connexion
    const { error: insertError } = await supabase
      .from('login_attempts')
      .insert({
        email,
        success,
        failure_reason,
        ip_address,
        user_agent,
        attempted_at: new Date().toISOString()
      });

    if (insertError) {
      console.error("Error inserting login attempt:", insertError);
    }

    // Si la connexion a réussi, réinitialiser les compteurs
    if (success) {
      const { data: userData } = await supabase.auth.admin.listUsers();
      const user = userData?.users.find(u => u.email === email);

      if (user) {
        await supabase
          .from('security_settings')
          .update({
            failed_login_attempts: 0,
            account_locked_until: null,
            last_failed_login: null
          })
          .eq('user_id', user.id);
      }

      return new Response(
        JSON.stringify({ 
          allowed: true,
          message: "Login successful"
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Vérifier si le compte est verrouillé
    const { data: isLocked, error: lockError } = await supabase
      .rpc('is_account_locked', { user_email: email });

    if (lockError) {
      console.error("Error checking account lock:", lockError);
    }

    if (isLocked) {
      // Obtenir les détails du verrouillage
      const { data: userData } = await supabase.auth.admin.listUsers();
      const user = userData?.users.find(u => u.email === email);

      if (user) {
        const { data: securitySettings } = await supabase
          .from('security_settings')
          .select('account_locked_until, failed_login_attempts')
          .eq('user_id', user.id)
          .single();

        const lockUntil = securitySettings?.account_locked_until 
          ? new Date(securitySettings.account_locked_until)
          : null;
        
        const minutesRemaining = lockUntil 
          ? Math.ceil((lockUntil.getTime() - Date.now()) / 60000)
          : 30;

        return new Response(
          JSON.stringify({
            allowed: false,
            locked: true,
            message: `Compte temporairement verrouillé suite à ${securitySettings?.failed_login_attempts || 3} tentatives échouées. Veuillez réessayer dans ${minutesRemaining} minutes.`,
            lock_duration_minutes: minutesRemaining
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    }

    // Compter les tentatives récentes échouées
    const { data: recentAttempts, error: countError } = await supabase
      .from('login_attempts')
      .select('*', { count: 'exact' })
      .eq('email', email)
      .eq('success', false)
      .gte('attempted_at', new Date(Date.now() - 15 * 60 * 1000).toISOString());

    const attemptCount = recentAttempts?.length || 0;
    const remainingAttempts = Math.max(0, 3 - attemptCount);

    return new Response(
      JSON.stringify({
        allowed: true,
        locked: false,
        remaining_attempts: remainingAttempts,
        message: remainingAttempts > 0 
          ? `${remainingAttempts} tentative(s) restante(s) avant verrouillage temporaire du compte.`
          : "Dernière tentative avant verrouillage."
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in check-login-attempt:", error);
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
