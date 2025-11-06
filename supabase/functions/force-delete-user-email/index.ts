import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Force delete a user by email - Admin only
 * This function attempts to completely remove all traces of a user
 * including cleaning up any soft-deleted records
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify admin role
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin role
    const { data: isAdmin } = await supabaseAdmin
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[FORCE DELETE] Starting cleanup for email: ${email}`);

    // Step 1: Find all users with this email (including soft-deleted)
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('[FORCE DELETE] Error listing users:', listError);
      throw listError;
    }

    const matchingUsers = users.users.filter(u => u.email?.toLowerCase() === email.toLowerCase());
    console.log(`[FORCE DELETE] Found ${matchingUsers.length} users with email ${email}`);

    // Step 2: Delete each user found
    for (const userToDelete of matchingUsers) {
      console.log(`[FORCE DELETE] Deleting user ${userToDelete.id}`);
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userToDelete.id);
      if (deleteError) {
        console.error(`[FORCE DELETE] Error deleting user ${userToDelete.id}:`, deleteError);
      } else {
        console.log(`[FORCE DELETE] Successfully deleted user ${userToDelete.id}`);
      }
    }

    // Step 3: Clean up any residual data in our tables
    const tables = [
      'email_verification_codes',
      'login_attempts', 
      'verification_code_rate_limit',
      'device_fingerprints',
      'profiles'
    ];

    for (const table of tables) {
      try {
        console.log(`[FORCE DELETE] Cleaning table: ${table}`);
        const { error } = await supabaseAdmin
          .from(table)
          .delete()
          .eq('email', email);
        
        if (error) {
          console.error(`[FORCE DELETE] Error cleaning ${table}:`, error);
        }
      } catch (e) {
        console.error(`[FORCE DELETE] Exception cleaning ${table}:`, e);
      }
    }

    console.log(`[FORCE DELETE] Cleanup completed for ${email}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Nettoyage complet effectué pour ${email}. ${matchingUsers.length} utilisateur(s) supprimé(s). Note: Il peut y avoir un délai de 24-48h avant que l'email soit complètement disponible dans Supabase Auth.`,
        usersDeleted: matchingUsers.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[FORCE DELETE] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
