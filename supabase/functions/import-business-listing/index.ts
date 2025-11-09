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

    // Fetch the webpage content with proper headers
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
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
    
    const prompt = `You are extracting business listing data from HTML of a business for sale listing page.

CRITICAL INSTRUCTIONS:
- IGNORE website navigation, headers, footers, sidebars, and other listings
- FOCUS ONLY on the main business listing content displayed on this specific page
- DO NOT extract site-wide metadata (site title, site description, etc.)
- Extract information from the LISTING CONTENT (article body, listing details section)

EXTRACTION RULES - Look in the MAIN CONTENT AREA only:
1. Title: The business name from the listing (NOT the website name). Look in <h1>, main article heading, listing title
2. Price/Asking Price: The specific asking price for THIS business - look for "$", "CAD", "USD", "price", "Prix demandé"
3. Description: The FULL business description from the listing content (NOT meta description or site description)
4. Revenue: Annual revenue from listing details - "Revenue", "Revenu", "Chiffre d'affaires", "Sales"
5. Location: City/address from listing - "Location", "Ville", "Emplacement", address fields
6. Industry: Business type/category from listing content
7. Employees: Employee count from listing details
8. Year Established: Foundation year from listing - "established", "fondé", "depuis", "opened"
9. Profit/BAIIA: Profit metrics from financial details - "profit", "EBITDA", "BAIIA"
10. Reason for Sale: Why selling from listing - "reason", "raison de vente"
11. Financing: Financing options from listing - "financing", "financement", "payment terms"
12. Images: Business photos from the LISTING GALLERY (not site logos/banners)
13. Square Footage: Property size from listing specs - "sq ft", "pi²", "superficie"
14. Inventory: Inventory value from listing - "inventory", "stock", "inventaire"
15. Lease: Lease terms from listing - "lease", "bail", "rent"

HTML TO ANALYZE:
${html}

Return this exact JSON structure (use null for missing data):
{
  "title": "exact business title or null",
  "description": "full detailed description or null",
  "asking_price": number_only_without_symbols_or_null,
  "asking_price_max": number_or_null,
  "annual_revenue": number_or_null,
  "city": "city_name_or_null",
  "province": "province_or_null",
  "region": "region_or_null",
  "address": "full_address_or_null",
  "industry": "best_match_or_autres",
  "employees_count": number_or_null,
  "year_established": 4_digit_year_or_null,
  "baiia": number_or_null,
  "net_profit": number_or_null,
  "profit_margin": percentage_number_or_null,
  "net_profit_margin": percentage_number_or_null,
  "baiia_margin": percentage_number_or_null,
  "location": "city, province_or_null",
  "withdrawal_reason": "reason_for_selling_or_null",
  "square_footage": number_or_null,
  "image_urls": ["array", "of", "image", "urls", "or", "empty_array"],
  "inventory_value": number_or_null,
  "lease_details": "lease_information_or_null",
  "financing_available": "financing_options_description_or_null"
}

Industries: restaurant, bar_bistro_discotheque, beaute_esthetique, boutique_commerce_detail, garage_mecanique_concessionnaire, education_garderie, sante_services_sociaux, communications_informatique, services_professionnels, tourisme_hotellerie, immobilier_location, agriculture, construction_renovation, fabrication_transformation, transport_logistique, divertissement_loisirs, services_personnels, autres

BE EXTREMELY THOROUGH - extract ALL available information including images. Return ONLY valid JSON.`;

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
      asking_price_max: extractedData.asking_price_max || null,
      annual_revenue: extractedData.annual_revenue || null,
      city: extractedData.city || '',
      province: extractedData.province || 'Québec',
      region: extractedData.region || null,
      address: extractedData.address || null,
      location: extractedData.location || `${extractedData.city}, ${extractedData.province}`,
      industry: extractedData.industry || 'autres',
      employees_count: extractedData.employees_count || null,
      year_established: extractedData.year_established || null,
      baiia: extractedData.baiia || null,
      net_profit: extractedData.net_profit || null,
      profit_margin: extractedData.profit_margin || null,
      net_profit_margin: extractedData.net_profit_margin || null,
      baiia_margin: extractedData.baiia_margin || null,
      withdrawal_reason: extractedData.withdrawal_reason || null,
      square_footage: extractedData.square_footage || null,
      financing_available: extractedData.financing_available || null,
      lease_details: extractedData.lease_details || null,
      inventory_value: extractedData.inventory_value || null,
      image_urls: Array.isArray(extractedData.image_urls) ? extractedData.image_urls.filter((url: string) => 
        url && url.startsWith('http') && !url.includes('logo') && !url.includes('icon')
      ).slice(0, 10) : [],
      source_url: url
    };

    console.log('[IMPORT-LISTING] Found', businessData.image_urls.length, 'valid images');

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