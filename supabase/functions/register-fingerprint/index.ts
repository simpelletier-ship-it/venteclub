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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization requise' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { 
      fingerprintHash, 
      ipAddress, 
      userAgent,
      screenResolution,
      timezone,
      language,
      platform 
    } = await req.json();
    
    if (!fingerprintHash) {
      return new Response(
        JSON.stringify({ error: 'Empreinte digitale requise' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Obtenir l'utilisateur authentifié
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Utilisateur non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier si cette empreinte existe déjà pour cet utilisateur
    const { data: existing } = await supabase
      .from('device_fingerprints')
      .select('*')
      .eq('user_id', user.id)
      .eq('fingerprint_hash', fingerprintHash)
      .single();

    if (existing) {
      // Mettre à jour le compteur et last_seen
      await supabase
        .from('device_fingerprints')
        .update({
          last_seen_at: new Date().toISOString(),
          times_seen: existing.times_seen + 1,
          ip_address: ipAddress,
          user_agent: userAgent
        })
        .eq('id', existing.id);

      return new Response(
        JSON.stringify({ success: true, action: 'updated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Créer un nouvel enregistrement
    const { error: insertError } = await supabase
      .from('device_fingerprints')
      .insert({
        user_id: user.id,
        fingerprint_hash: fingerprintHash,
        ip_address: ipAddress,
        user_agent: userAgent,
        screen_resolution: screenResolution,
        timezone,
        language,
        platform
      });

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({ success: true, action: 'created' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error registering fingerprint:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
