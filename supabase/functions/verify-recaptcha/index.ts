import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RECAPTCHA_SECRET_KEY = Deno.env.get('RECAPTCHA_SECRET_KEY');
const RECAPTCHA_PROJECT_ID = 'vente-club';
const RECAPTCHA_VERIFY_URL = `https://recaptchaenterprise.googleapis.com/v1/projects/${RECAPTCHA_PROJECT_ID}/assessments?key=${RECAPTCHA_SECRET_KEY}`;

interface RecaptchaRequest {
  token: string;
  action?: string;
}

interface RecaptchaEnterpriseResponse {
  tokenProperties?: {
    valid: boolean;
    invalidReason?: string;
    hostname?: string;
    action?: string;
    createTime?: string;
  };
  riskAnalysis?: {
    score: number;
    reasons?: string[];
  };
  event?: {
    token: string;
    siteKey: string;
    userAgent?: string;
    userIpAddress?: string;
    expectedAction?: string;
  };
  name?: string;
}

serve(async (req: Request) => {
  // Set CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!RECAPTCHA_SECRET_KEY) {
      throw new Error('RECAPTCHA_SECRET_KEY not configured');
    }

    const { token, action } = await req.json() as RecaptchaRequest;

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('[RECAPTCHA] Verifying token for action:', action);

    // Verify the reCAPTCHA token with Google Enterprise API
    const requestBody = {
      event: {
        token: token,
        expectedAction: action || 'USER_ACTION',
        siteKey: '6Lf93wMsAAAAAKIX6GeEsPfLuM7fTmgbBRlh4HcT'
      }
    };

    console.log('[RECAPTCHA] Sending request to:', RECAPTCHA_VERIFY_URL);

    const verifyResponse = await fetch(RECAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!verifyResponse.ok) {
      const errorText = await verifyResponse.text();
      console.error('[RECAPTCHA] API error:', verifyResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'reCAPTCHA API error',
          details: errorText
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const result = await verifyResponse.json() as RecaptchaEnterpriseResponse;
    console.log('[RECAPTCHA] Response:', JSON.stringify(result, null, 2));

    // Check if token is valid
    if (!result.tokenProperties?.valid) {
      console.error('[RECAPTCHA] Token invalid:', result.tokenProperties?.invalidReason);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid token',
          reason: result.tokenProperties?.invalidReason
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check the risk score (0.0 = likely bot, 1.0 = likely human)
    const minimumScore = 0.5;
    const score = result.riskAnalysis?.score ?? 0;
    
    if (score < minimumScore) {
      console.warn('[RECAPTCHA] Score too low:', score);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Score too low',
          score: score,
          reasons: result.riskAnalysis?.reasons
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify the action matches (if provided)
    if (action && result.tokenProperties?.action !== action) {
      console.warn('[RECAPTCHA] Action mismatch. Expected:', action, 'Got:', result.tokenProperties?.action);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Action mismatch',
          expected: action,
          received: result.tokenProperties?.action
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Success!
    console.log('[RECAPTCHA] Verification successful. Score:', score);
    return new Response(
      JSON.stringify({ 
        success: true,
        score: score,
        action: result.tokenProperties?.action,
        hostname: result.tokenProperties?.hostname,
        reasons: result.riskAnalysis?.reasons
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in verify-recaptcha function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
