import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Server-side validation schema matching client-side
const editBusinessSchema = z.object({
  title: z.string().trim().min(5, "Le titre doit contenir au moins 5 caractères").max(200, "Le titre doit contenir maximum 200 caractères"),
  description: z.string().trim().min(20, "La description doit contenir au moins 20 caractères").max(5000, "La description doit contenir maximum 5000 caractères"),
  asking_price: z.number().min(0, "Le prix doit être positif").max(999999999, "Prix invalide"),
  annual_revenue: z.number().min(0).max(999999999).nullable().optional(),
  profit_margin: z.number().min(0).max(100).nullable().optional(),
  employees_count: z.number().int().min(0).max(1000000).nullable().optional(),
  year_established: z.number().int().min(1800).max(new Date().getFullYear()).nullable().optional(),
  location: z.string().trim().max(100).optional().nullable().transform(val => val === "" ? null : val),
  city: z.string().trim().max(100).optional().nullable().transform(val => val === "" ? null : val),
  province: z.string().trim().max(100).optional().nullable().transform(val => val === "" ? null : val),
  industry: z.string().min(1, "Secteur requis"),
  business_id: z.string().uuid("ID d'entreprise invalide"),
  photo_url: z.string().url().nullable().optional(),
  seller_name: z.string().trim().max(200).nullable().optional(),
  seller_phone: z.string().trim().max(20).nullable().optional(),
  seller_email: z.string().email("Email invalide").nullable().optional(),
  chat_disabled: z.boolean().optional(),
  source_url: z.string().url("URL invalide").nullable().optional(),
});

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== REQUEST START ===");
    console.log("Method:", req.method);
    console.log("Headers:", Object.fromEntries(req.headers.entries()));
    
    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("❌ No authorization header found");
      return new Response(
        JSON.stringify({ error: "Non autorisé - header manquant" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Auth header present:", authHeader.substring(0, 20) + "...");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    console.log("✅ Environment variables loaded");
    
    // Extract token and verify with service role
    const token = authHeader.replace("Bearer ", "");
    console.log("Token extracted, length:", token.length);
    
    // Use service role to verify the JWT token
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    console.log("🔍 Verifying token with service role...");
    
    const { data: userData, error: userError } = await supabaseService.auth.getUser(token);
    
    if (userError) {
      console.error("❌ Auth verification failed:", userError);
      return new Response(
        JSON.stringify({ error: "Token invalide", details: userError.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (!userData.user) {
      console.error("❌ No user found in token");
      return new Response(
        JSON.stringify({ error: "Utilisateur non trouvé" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("✅ User verified:", userData.user.id);

    // Check admin role
    console.log("🔍 Checking admin role for user:", userData.user.id);
    const { data: hasAdminRole, error: roleError } = await supabaseService
      .rpc('has_role', { 
        _user_id: userData.user.id, 
        _role: 'admin' 
      });

    if (roleError) {
      console.error("❌ Role check error:", roleError);
      return new Response(
        JSON.stringify({ error: "Erreur vérification rôle", details: roleError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!hasAdminRole) {
      console.error("❌ User is not admin");
      return new Response(
        JSON.stringify({ error: "Accès refusé - droits administrateur requis" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Admin role verified");

    // Parse and validate request body
    console.log("📝 Parsing request body...");
    const body = await req.json();
    console.log("Body keys:", Object.keys(body));
    
    let validated;
    try {
      validated = editBusinessSchema.parse(body);
      console.log("✅ Validation successful for business:", validated.business_id);
    } catch (validationError: any) {
      console.error("❌ Validation error:", validationError.errors);
      return new Response(
        JSON.stringify({ 
          error: "Données invalides", 
          details: validationError.errors 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update business with validated data
    const { business_id, photo_url, ...updateData } = validated;
    
    console.log("💾 Updating business:", business_id);
    const { error: updateError } = await supabaseService
      .from('businesses')
      .update({
        ...updateData,
        updated_by_admin: true,
        admin_updated_at: new Date().toISOString()
      })
      .eq('id', business_id);

    if (updateError) {
      console.error("❌ Update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Erreur mise à jour", details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("✅ Business updated successfully");

    // Handle photo update if provided
    if (photo_url) {
      console.log("📸 Adding photo...");
      const { data: existingPhotos } = await supabaseService
        .from('business_photos')
        .select('display_order')
        .eq('business_id', business_id)
        .order('display_order', { ascending: false })
        .limit(1);

      const nextOrder = existingPhotos && existingPhotos.length > 0 
        ? (existingPhotos[0].display_order || 0) + 1 
        : 1;

      const { error: photoError } = await supabaseService
        .from('business_photos')
        .insert({
          business_id: business_id,
          photo_url: photo_url,
          display_order: nextOrder
        });

      if (photoError) {
        console.error("⚠️ Photo insert error:", photoError.message);
      } else {
        console.log("✅ Photo added successfully");
      }
    }

    console.log(`✅ SUCCESS - Admin ${userData.user.id} updated business ${business_id}`);

    return new Response(
      JSON.stringify({ success: true, message: "Entreprise mise à jour avec succès" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("💥 UNEXPECTED ERROR:", error);
    console.error("Error stack:", error.stack);
    return new Response(
      JSON.stringify({ error: "Erreur serveur", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
