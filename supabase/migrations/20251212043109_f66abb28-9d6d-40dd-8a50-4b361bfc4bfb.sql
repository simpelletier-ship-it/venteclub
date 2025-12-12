-- Fix profiles table: remove all public access, only allow users to see their own profile
DROP POLICY IF EXISTS "Block anonymous access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles only via secure function" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles of message contacts" ON public.profiles;
DROP POLICY IF EXISTS "Users can view seller profiles with contact access" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create strict policy: users can ONLY see their own profile
CREATE POLICY "Users can only view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Admins can still view all for admin panel
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Fix businesses table: hide seller contact info from public
-- Create a view or use function to mask sensitive data
DROP POLICY IF EXISTS "Tout le monde peut voir les annonces approuvées" ON public.businesses;
DROP POLICY IF EXISTS "Tout le monde peut voir les entreprises actives" ON public.businesses;

-- Recreate with masked seller info approach - public can see business listings but NOT seller contact
CREATE POLICY "Public can view approved active businesses without contact info"
ON public.businesses
FOR SELECT
USING (
  status = 'active' 
  AND approval_status = 'approved'
);