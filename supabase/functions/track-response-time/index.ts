import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messageId, sellerId, originalMessageTimestamp } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    // Calculer le temps de réponse en minutes
    const now = new Date();
    const originalTime = new Date(originalMessageTimestamp);
    const responseTimeMinutes = Math.floor((now.getTime() - originalTime.getTime()) / 60000);
    
    // Enregistrer la statistique
    const { error: insertError } = await supabaseClient
      .from('seller_response_stats')
      .insert({
        seller_id: sellerId,
        message_id: messageId,
        response_time_minutes: responseTimeMinutes
      });
    
    if (insertError) {
      console.error('Error inserting response stat:', insertError);
      throw insertError;
    }
    
    // Incrémenter le compteur total de réponses
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ 
        total_responses: supabaseClient.rpc('profiles.total_responses + 1')
      })
      .eq('id', sellerId);
    
    if (updateError) {
      console.error('Error updating total responses:', updateError);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        responseTimeMinutes 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error: any) {
    console.error("Error in track-response-time:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
