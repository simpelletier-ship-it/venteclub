-- Drop existing SELECT policy on profiles
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;

-- Create stricter SELECT policy that explicitly requires authentication
CREATE POLICY "profiles_select_authenticated_own_or_admin" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND (
    auth.uid() = id 
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Also ensure INSERT policy is explicit
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;

CREATE POLICY "profiles_insert_authenticated_own" 
ON public.profiles 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = id
);

-- Also ensure UPDATE policy is explicit
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_update_authenticated_own" 
ON public.profiles 
FOR UPDATE 
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = id
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = id
);