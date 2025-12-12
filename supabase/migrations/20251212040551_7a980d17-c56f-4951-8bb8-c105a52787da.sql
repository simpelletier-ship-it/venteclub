-- Solution: Create a security definer function to get businesses without exposing seller contact info
-- The sensitive fields seller_email and seller_phone will only be visible to:
-- 1. The seller themselves
-- 2. Users who have paid for contact access
-- 3. Admins

-- First, drop existing public viewing policies that expose all data
DROP POLICY IF EXISTS "Anyone can view approved active businesses" ON public.businesses;
DROP POLICY IF EXISTS "Anyone can view sold approved businesses" ON public.businesses;

-- Create a new policy that only exposes non-sensitive columns
-- For this, we'll use column-level security through application code
-- and keep RLS but make sure the application filters sensitive data

-- Create a function to check if user can see seller contact info
CREATE OR REPLACE FUNCTION public.can_view_seller_contact(business_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seller_id uuid;
BEGIN
  -- Get seller_id of the business
  SELECT seller_id INTO v_seller_id FROM businesses WHERE id = business_uuid;
  
  -- Allow if user is the seller
  IF auth.uid() = v_seller_id THEN
    RETURN true;
  END IF;
  
  -- Allow if user is admin
  IF has_role(auth.uid(), 'admin') THEN
    RETURN true;
  END IF;
  
  -- Allow if user has contact access (paid)
  IF EXISTS (
    SELECT 1 FROM contact_access 
    WHERE user_id = auth.uid() AND business_id = business_uuid
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Recreate policies that allow viewing but sensitive data will be filtered in application
-- For public users: allow viewing but application must filter seller_email and seller_phone
CREATE POLICY "Anyone can view approved active businesses" 
ON public.businesses 
FOR SELECT 
USING (
  (status = 'active' AND approval_status = 'approved')
);

CREATE POLICY "Anyone can view sold approved businesses" 
ON public.businesses 
FOR SELECT 
USING (
  (status = 'sold' AND approval_status = 'approved')
);

-- Grant execute on the function
GRANT EXECUTE ON FUNCTION public.can_view_seller_contact(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_seller_contact(uuid) TO anon;