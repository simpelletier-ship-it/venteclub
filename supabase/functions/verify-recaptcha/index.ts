import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RECAPTCHA_SECRET_KEY = Deno.env.get('RECAPTCHA_SECRET_KEY');
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

interface RecaptchaRequest {
  token: string;
  action?: string;
}

interface RecaptchaResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
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

    // Verify the reCAPTCHA token with Google
    const verifyResponse = await fetch(RECAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${RECAPTCHA_SECRET_KEY}&response=${token}`,
    });

    const result = await verifyResponse.json() as RecaptchaResponse;

    // Check if verification was successful
    if (!result.success) {
      console.error('reCAPTCHA verification failed:', result['error-codes']);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'reCAPTCHA verification failed',
          errorCodes: result['error-codes']
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check the score (for reCAPTCHA v3/Enterprise)
    // Score ranges from 0.0 (likely bot) to 1.0 (likely human)
    const minimumScore = 0.5;
    if (result.score !== undefined && result.score < minimumScore) {
      console.warn('reCAPTCHA score too low:', result.score);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Score too low',
          score: result.score
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verify the action matches (if provided)
    if (action && result.action !== action) {
      console.warn('Action mismatch. Expected:', action, 'Got:', result.action);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Action mismatch'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Success!
    return new Response(
      JSON.stringify({ 
        success: true,
        score: result.score,
        action: result.action,
        hostname: result.hostname
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
