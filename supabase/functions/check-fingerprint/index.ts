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
    const { 
      fingerprintHash, 
      ipAddress, 
      userAgent,
      screenResolution,
      timezone,
      language,
      platform,
      email 
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

    // Vérifier si cette empreinte est déjà associée à un compte
    const { data: existingFingerprints, error: fpError } = await supabase
      .from('device_fingerprints')
      .select('*, profiles!inner(email)')
      .eq('fingerprint_hash', fingerprintHash);

    if (fpError) {
      console.error('Error checking fingerprint:', fpError);
    }

    let suspicious = false;
    let suspicionReasons: string[] = [];
    let existingAccounts: Array<{
      userId: string | null;
      email: string | null;
      lastSeen: string;
      timesSeen: number;
    }> = [];

    if (existingFingerprints && existingFingerprints.length > 0) {
      // Compter les comptes uniques avec cette empreinte
      const uniqueUserIds = new Set(existingFingerprints.map(fp => fp.user_id));
      
      if (uniqueUserIds.size > 1) {
        suspicious = true;
        suspicionReasons.push(`Empreinte utilisée par ${uniqueUserIds.size} comptes différents`);
      }

      existingAccounts = existingFingerprints.map(fp => ({
        userId: fp.user_id,
        email: fp.profiles?.email,
        lastSeen: fp.last_seen_at,
        timesSeen: fp.times_seen
      }));
    }

    // Vérifier les comptes créés récemment depuis la même IP
    if (ipAddress) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const { data: recentFromIp, error: ipError } = await supabase
        .from('device_fingerprints')
        .select('user_id')
        .eq('ip_address', ipAddress)
        .gte('created_at', oneHourAgo.toISOString());

      if (!ipError && recentFromIp && recentFromIp.length > 2) {
        suspicious = true;
        suspicionReasons.push(`${recentFromIp.length} comptes créés depuis cette IP dans la dernière heure`);
      }
    }

    // Vérifier si on essaie de créer un compte avec un email déjà existant
    if (email) {
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        return new Response(
          JSON.stringify({
            allowed: false,
            suspicious: true,
            reason: 'Un compte existe déjà avec cet email',
            suspicionReasons: ['Email déjà utilisé']
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        allowed: !suspicious || suspicionReasons.length === 0,
        suspicious,
        suspicionReasons,
        existingAccounts: existingAccounts.length > 0 ? existingAccounts : undefined,
        requiresVerification: suspicious
      }),
      { 
        status: suspicious ? 403 : 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: unknown) {
    console.error('Error checking fingerprint:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
