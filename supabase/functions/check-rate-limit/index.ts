import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { identifier, identifierType, actionType } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const windowStart = new Date(now.getTime() - 15 * 60 * 1000); // 15 minutes

    // Vérifier si l'IP est bloquée
    if (identifierType === 'ip') {
      const { data: blockedIp } = await supabase
        .from('blocked_ips')
        .select('*')
        .eq('ip_address', identifier)
        .single();

      if (blockedIp) {
        if (blockedIp.permanent || (blockedIp.blocked_until && new Date(blockedIp.blocked_until) > now)) {
          return new Response(
            JSON.stringify({
              allowed: false,
              blocked: true,
              reason: blockedIp.reason,
              blockedUntil: blockedIp.blocked_until,
              permanent: blockedIp.permanent
            }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Nettoyer les anciens enregistrements
    await supabase
      .from('rate_limits')
      .delete()
      .lt('window_start', windowStart.toISOString());

    // Obtenir ou créer l'enregistrement de rate limit
    const { data: existingLimit } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .eq('identifier_type', identifierType)
      .eq('action_type', actionType)
      .gte('window_start', windowStart.toISOString())
      .single();

    let attempts = 0;
    let blocked = false;
    let blockedUntil = null;

    // Définir les limites selon le type d'action
    const limits = {
      login: { maxAttempts: 5, windowMinutes: 15, blockDuration: 30 },
      signup: { maxAttempts: 3, windowMinutes: 60, blockDuration: 120 },
      password_reset: { maxAttempts: 3, windowMinutes: 60, blockDuration: 60 }
    };

    const limit = limits[actionType as keyof typeof limits] || limits.login;

    if (existingLimit) {
      // Vérifier si déjà bloqué
      if (existingLimit.blocked_until && new Date(existingLimit.blocked_until) > now) {
        return new Response(
          JSON.stringify({
            allowed: false,
            blocked: true,
            attempts: existingLimit.attempts,
            maxAttempts: limit.maxAttempts,
            blockedUntil: existingLimit.blocked_until,
            minutesRemaining: Math.ceil((new Date(existingLimit.blocked_until).getTime() - now.getTime()) / 60000)
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      attempts = existingLimit.attempts + 1;

      // Bloquer si limite dépassée
      if (attempts >= limit.maxAttempts) {
        blocked = true;
        blockedUntil = new Date(now.getTime() + limit.blockDuration * 60 * 1000);

        // Si c'est une IP et trop de tentatives, la bloquer dans blocked_ips
        if (identifierType === 'ip' && attempts >= limit.maxAttempts * 2) {
          await supabase
            .from('blocked_ips')
            .upsert({
              ip_address: identifier,
              reason: `Trop de tentatives de ${actionType}`,
              blocked_until: blockedUntil.toISOString(),
              failed_attempts: attempts
            });
        }
      }

      // Mettre à jour l'enregistrement
      await supabase
        .from('rate_limits')
        .update({
          attempts,
          blocked_until: blockedUntil?.toISOString() || null
        })
        .eq('id', existingLimit.id);
    } else {
      // Créer un nouvel enregistrement
      attempts = 1;
      await supabase
        .from('rate_limits')
        .insert({
          identifier,
          identifier_type: identifierType,
          action_type: actionType,
          attempts: 1,
          window_start: now.toISOString()
        });
    }

    return new Response(
      JSON.stringify({
        allowed: !blocked,
        blocked,
        attempts,
        maxAttempts: limit.maxAttempts,
        remaining: Math.max(0, limit.maxAttempts - attempts),
        blockedUntil,
        windowMinutes: limit.windowMinutes
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error checking rate limit:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
