-- Drop the security definer view which is a security risk
DROP VIEW IF EXISTS public.businesses_public;

-- The businesses table already has proper RLS policies that handle:
-- 1. Anyone can view approved active businesses
-- 2. Anyone can view sold approved businesses  
-- 3. Sellers can view their own businesses
-- 4. Admins can view all businesses

-- No need for a separate view - the RLS policies on businesses table
-- provide the necessary security controls without the risks of SECURITY DEFINER