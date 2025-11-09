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
    
    const prompt = `You are a data extraction specialist. Extract ALL business listing information from this HTML page.

CRITICAL: This is a BUSINESS FOR SALE LISTING PAGE. Extract the business details being sold, NOT the website information.

IMPORTANT EXTRACTION STRATEGY:
1. Find the MAIN CONTENT area (usually <main>, <article>, div with class like "listing", "detail", "content", "business-info")
2. IGNORE: navigation menus, headers, footers, sidebars, search bars, other listings
3. Look for structured data in <script type="application/ld+json"> first
4. Extract from visible content in the main listing area

EXTRACTION CHECKLIST (return null if not found):

BASIC INFO:
- title: Business name from main heading (h1, h2 in listing area) - NOT website name
- description: Full business description (all paragraphs in description section)
- industry: Business category/type (restaurant, salon, garage, boutique, etc.)

LOCATION:
- address: Full street address if available
- city: City name
- province: Province/state
- region: Region name
- location: Combined "City, Province" format

FINANCIAL DATA (numbers only, no currency symbols):
- asking_price: Asking price / Prix demandé
- asking_price_max: Maximum price if range given
- annual_revenue: Annual revenue / Revenu annuel / Chiffre d'affaires
- net_profit: Net profit / Profit net
- baiia: EBITDA / BAIIA
- profit_margin: Profit margin % (number only, e.g., 25 not 25%)
- net_profit_margin: Net profit margin %
- baiia_margin: BAIIA margin %
- inventory_value: Inventory value / Valeur inventaire

BUSINESS DETAILS:
- employees_count: Number of employees / Nombre d'employés
- year_established: Year founded / Année de fondation (4-digit year)
- square_footage: Property size in sq ft or m²
- lease_details: Lease information / Détails du bail
- withdrawal_reason: Reason for selling / Raison de la vente
- financing_available: Financing options / Options de financement

IMAGES (VERY IMPORTANT):
- image_urls: Extract ALL images from:
  * Photo galleries (<div class="gallery">, <div class="photos">, etc.)
  * Image carousels (<div class="carousel">, <div class="slider">, etc.)
  * Main listing images (<img> tags within listing content)
  * Look for: data-src, data-lazy-src, src attributes
  * EXCLUDE: logos, icons, navigation images, profile pictures
  * INCLUDE FULL URLs (if relative, prepend the domain)

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
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 4000
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
      image_urls: Array.isArray(extractedData.image_urls) ? extractedData.image_urls.filter((url: string) => {
        if (!url || !url.startsWith('http')) return false;
        const lowerUrl = url.toLowerCase();
        // Exclude logos, icons, small images, navigation images
        if (lowerUrl.includes('logo') || lowerUrl.includes('icon') || 
            lowerUrl.includes('avatar') || lowerUrl.includes('profile') ||
            lowerUrl.includes('banner') || lowerUrl.includes('header') ||
            lowerUrl.includes('nav') || lowerUrl.includes('menu') ||
            lowerUrl.includes('button') || lowerUrl.includes('badge')) {
          return false;
        }
        return true;
      }).slice(0, 15) : [],
      source_url: url
    };

    console.log('[IMPORT-LISTING] Found', businessData.image_urls.length, 'valid images');
    console.log('[IMPORT-LISTING] Image URLs:', businessData.image_urls);
    console.log('[IMPORT-LISTING] Business data:', {
      title: businessData.title,
      asking_price: businessData.asking_price,
      city: businessData.city,
      industry: businessData.industry,
      employees_count: businessData.employees_count,
      year_established: businessData.year_established,
      description_length: businessData.description?.length || 0
    });

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