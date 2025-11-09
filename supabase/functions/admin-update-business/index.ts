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
  location: z.string().trim().min(2, "Emplacement requis").max(100),
  city: z.string().trim().min(2, "Ville requise").max(100),
  province: z.string().trim().min(2, "Province requise").max(100),
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
    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header");
      return new Response(
        JSON.stringify({ error: "Non autorisé" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT token using service role (can verify any token)
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError?.message || "No user found");
      return new Response(
        JSON.stringify({ error: "Non autorisé - token invalide" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("User authenticated:", user.id);

    // Check admin role
    const { data: hasAdminRole, error: roleError } = await supabase
      .rpc('has_role', { 
        _user_id: user.id, 
        _role: 'admin' 
      });

    if (roleError || !hasAdminRole) {
      console.error("Role check error:", roleError);
      return new Response(
        JSON.stringify({ error: "Accès refusé - droits administrateur requis" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    
    let validated;
    try {
      validated = editBusinessSchema.parse(body);
    } catch (validationError: any) {
      console.error("Validation error:", validationError);
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
    
    const { error: updateError } = await supabase
      .from('businesses')
      .update({
        ...updateData,
        updated_by_admin: true,
        admin_updated_at: new Date().toISOString()
      })
      .eq('id', business_id);

    if (updateError) {
      console.error("Update error:", updateError);
      throw updateError;
    }

    // Handle photo update if provided
    if (photo_url) {
      // Get current photos to determine next display_order
      const { data: existingPhotos } = await supabase
        .from('business_photos')
        .select('display_order')
        .eq('business_id', business_id)
        .order('display_order', { ascending: false })
        .limit(1);

      const nextOrder = existingPhotos && existingPhotos.length > 0 
        ? (existingPhotos[0].display_order || 0) + 1 
        : 1;

      // Insert new photo
      const { error: photoError } = await supabase
        .from('business_photos')
        .insert({
          business_id: business_id,
          photo_url: photo_url,
          display_order: nextOrder
        });

      if (photoError) {
        console.error("Photo insert error:", photoError);
        // Don't fail the whole operation if photo fails
      }
    }

    console.log(`Admin ${user.id} updated business ${business_id}`);

    return new Response(
      JSON.stringify({ success: true, message: "Entreprise mise à jour avec succès" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in admin-update-business function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
