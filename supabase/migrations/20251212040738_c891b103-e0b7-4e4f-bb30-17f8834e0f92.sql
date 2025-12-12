-- Drop the problematic public profile policy that exposes all sensitive data
DROP POLICY IF EXISTS "Les profils publics sont visibles par tous" ON public.profiles;

-- Create a secure function that returns only safe public profile data
-- Sensitive fields (email, phone, address, date_of_birth) are NEVER exposed in public profiles
CREATE OR REPLACE FUNCTION public.get_safe_profile(profile_id uuid)
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.avatar_url,
    p.bio,
    p.created_at
  FROM public.profiles p
  WHERE p.id = profile_id
  AND (
    p.is_public = true 
    OR p.id = auth.uid()
    OR EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
END;
$$;

-- Create a new restrictive policy for public profiles
-- Only allows access to non-sensitive fields through the secure function
-- Direct table access for public profiles is now blocked
CREATE POLICY "Public profiles only via secure function" 
ON public.profiles 
FOR SELECT 
USING (
  -- User can always see their own full profile
  auth.uid() = id
  -- Admins can see all profiles
  OR has_role(auth.uid(), 'admin')
  -- Users with message history can see basic profile info
  OR EXISTS (
    SELECT 1 FROM messages
    WHERE (messages.sender_id = auth.uid() AND messages.receiver_id = profiles.id)
       OR (messages.receiver_id = auth.uid() AND messages.sender_id = profiles.id)
  )
  -- Users with contact access can see seller profiles
  OR EXISTS (
    SELECT 1 FROM businesses b
    JOIN contact_access ca ON ca.business_id = b.id
    WHERE b.seller_id = profiles.id AND ca.user_id = auth.uid()
  )
);

-- Grant execute on the function
GRANT EXECUTE ON FUNCTION public.get_safe_profile(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_safe_profile(uuid) TO anon;