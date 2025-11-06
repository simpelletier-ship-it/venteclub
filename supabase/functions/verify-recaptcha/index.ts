import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();
    
    if (!token) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token manquant' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const recaptchaSecret = Deno.env.get('RECAPTCHA_SECRET_KEY');
    if (!recaptchaSecret) {
      throw new Error('RECAPTCHA_SECRET_KEY not configured');
    }

    // Vérifier le token avec Google reCAPTCHA
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${token}`;
    const recaptchaResponse = await fetch(verifyUrl, { method: 'POST' });
    const recaptchaData = await recaptchaResponse.json();

    console.log('[RECAPTCHA] Verification result:', {
      success: recaptchaData.success,
      score: recaptchaData.score,
      action: recaptchaData.action
    });

    // Pour reCAPTCHA v3, vérifier le score (0.0 = bot, 1.0 = humain)
    if (recaptchaData.success && recaptchaData.score) {
      if (recaptchaData.score < 0.5) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Score de sécurité trop bas. Activité suspecte détectée.',
            score: recaptchaData.score
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        success: recaptchaData.success,
        score: recaptchaData.score || null,
        'challenge_ts': recaptchaData.challenge_ts,
        hostname: recaptchaData.hostname
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error verifying reCAPTCHA:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
