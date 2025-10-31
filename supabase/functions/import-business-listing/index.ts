import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[IMPORT-LISTING] Starting business listing import');

    const { url } = await req.json();
    
    if (!url) {
      throw new Error('URL is required');
    }

    console.log('[IMPORT-LISTING] Fetching URL:', url);

    // Fetch the webpage content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();
    console.log('[IMPORT-LISTING] HTML content fetched, length:', html.length);

    // Initialize Supabase client for AI
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Use Lovable AI to extract structured data from the HTML
    console.log('[IMPORT-LISTING] Using AI to extract business data');
    
    const prompt = `Analyze this HTML content from a business listing website and extract the following information in JSON format:

{
  "title": "Business title",
  "description": "Full business description",
  "asking_price": number (in dollars, no currency symbol),
  "annual_revenue": number (in dollars, if available),
  "city": "City name",
  "province": "Province/State",
  "region": "Region if specified",
  "industry": "Industry category (choose from: restaurant, bar_bistro_discotheque, beaute_esthetique, boutique_commerce_detail, garage_mecanique_concessionnaire, education_garderie, sante_services_sociaux, communications_informatique, services_professionnels, tourisme_hotellerie, immobilier_location, agriculture, construction_renovation, fabrication_transformation, transport_logistique, divertissement_loisirs, services_personnels, autres)",
  "employees_count": number (if available),
  "year_established": number (4-digit year if available),
  "baiia": number (EBITDA in dollars if available),
  "net_profit": number (in dollars if available),
  "profit_margin": number (percentage if available),
  "location": "Full location string (city, province)"
}

IMPORTANT RULES:
1. Extract ONLY the information that is clearly present in the HTML
2. For missing fields, use null
3. Convert all monetary amounts to numbers without currency symbols
4. Make sure asking_price is always extracted if present
5. Choose the most appropriate industry category
6. Be precise and accurate

HTML Content (first 8000 characters):
${html.substring(0, 8000)}

Return ONLY valid JSON, no additional text.`;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[IMPORT-LISTING] AI Gateway Error:', aiResponse.status, errorText);
      throw new Error(`AI Gateway returned ${aiResponse.status}: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    console.log('[IMPORT-LISTING] AI Response:', JSON.stringify(aiData, null, 2));

    // Extract the JSON from AI response
    let extractedData;
    try {
      const aiContent = aiData.choices[0].message.content;
      // Remove markdown code blocks if present
      const jsonMatch = aiContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                       aiContent.match(/```\s*([\s\S]*?)\s*```/) ||
                       [null, aiContent];
      const jsonString = jsonMatch[1].trim();
      extractedData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('[IMPORT-LISTING] JSON Parse Error:', parseError);
      throw new Error('Failed to parse AI response as JSON');
    }

    console.log('[IMPORT-LISTING] Extracted data:', JSON.stringify(extractedData, null, 2));

    // Validate and clean the extracted data
    const businessData = {
      title: extractedData.title || 'Entreprise importée',
      description: extractedData.description || '',
      asking_price: extractedData.asking_price || 0,
      annual_revenue: extractedData.annual_revenue || null,
      city: extractedData.city || '',
      province: extractedData.province || 'Québec',
      region: extractedData.region || null,
      location: extractedData.location || `${extractedData.city}, ${extractedData.province}`,
      industry: extractedData.industry || 'autres',
      employees_count: extractedData.employees_count || null,
      year_established: extractedData.year_established || null,
      baiia: extractedData.baiia || null,
      net_profit: extractedData.net_profit || null,
      profit_margin: extractedData.profit_margin || null,
      source_url: url
    };

    console.log('[IMPORT-LISTING] Import successful:', businessData.title);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: businessData 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('[IMPORT-LISTING] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});