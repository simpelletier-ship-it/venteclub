-- Create a secure function that returns businesses with sensitive fields masked for unauthorized users
-- This function will be used by the application to safely fetch business data

CREATE OR REPLACE FUNCTION public.get_business_with_secure_contact(business_uuid uuid)
RETURNS TABLE (
  id uuid,
  seller_id uuid,
  title text,
  description text,
  industry text,
  location text,
  city text,
  province text,
  region text,
  address text,
  asking_price numeric,
  asking_price_max numeric,
  annual_revenue numeric,
  net_profit numeric,
  baiia numeric,
  profit_margin numeric,
  net_profit_margin numeric,
  baiia_margin numeric,
  employees_count integer,
  year_established integer,
  status text,
  approval_status text,
  views_count integer,
  latitude double precision,
  longitude double precision,
  slug text,
  featured boolean,
  is_premium boolean,
  is_franchise boolean,
  is_demo boolean,
  currency text,
  sale_type text,
  created_at timestamptz,
  updated_at timestamptz,
  sold_at timestamptz,
  -- Sensitive fields - only returned if authorized
  seller_email text,
  seller_phone text,
  seller_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seller_id uuid;
  v_can_view_contact boolean := false;
BEGIN
  -- Get seller_id
  SELECT b.seller_id INTO v_seller_id FROM businesses b WHERE b.id = business_uuid;
  
  -- Check if current user can view contact info
  IF auth.uid() IS NOT NULL THEN
    -- Allow if user is the seller
    IF auth.uid() = v_seller_id THEN
      v_can_view_contact := true;
    -- Allow if user is admin
    ELSIF has_role(auth.uid(), 'admin') THEN
      v_can_view_contact := true;
    -- Allow if user has contact access
    ELSIF EXISTS (SELECT 1 FROM contact_access WHERE user_id = auth.uid() AND business_id = business_uuid) THEN
      v_can_view_contact := true;
    END IF;
  END IF;
  
  RETURN QUERY
  SELECT 
    b.id,
    b.seller_id,
    b.title,
    b.description,
    b.industry::text,
    b.location,
    b.city,
    b.province,
    b.region,
    b.address,
    b.asking_price,
    b.asking_price_max,
    b.annual_revenue,
    b.net_profit,
    b.baiia,
    b.profit_margin,
    b.net_profit_margin,
    b.baiia_margin,
    b.employees_count,
    b.year_established,
    b.status,
    b.approval_status,
    b.views_count,
    b.latitude,
    b.longitude,
    b.slug,
    b.featured,
    b.is_premium,
    b.is_franchise,
    b.is_demo,
    b.currency,
    b.sale_type::text,
    b.created_at,
    b.updated_at,
    b.sold_at,
    -- Mask sensitive fields if not authorized
    CASE WHEN v_can_view_contact THEN b.seller_email ELSE NULL END,
    CASE WHEN v_can_view_contact THEN b.seller_phone ELSE NULL END,
    CASE WHEN v_can_view_contact THEN b.seller_name ELSE NULL END
  FROM businesses b
  WHERE b.id = business_uuid;
END;
$$;

-- Create a function for listing businesses (for public listings) with masked contact info
CREATE OR REPLACE FUNCTION public.get_businesses_public()
RETURNS TABLE (
  id uuid,
  seller_id uuid,
  title text,
  description text,
  industry text,
  location text,
  city text,
  province text,
  region text,
  asking_price numeric,
  asking_price_max numeric,
  annual_revenue numeric,
  net_profit numeric,
  baiia numeric,
  profit_margin numeric,
  employees_count integer,
  year_established integer,
  status text,
  approval_status text,
  views_count integer,
  latitude double precision,
  longitude double precision,
  slug text,
  featured boolean,
  is_premium boolean,
  is_franchise boolean,
  currency text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    b.id,
    b.seller_id,
    b.title,
    b.description,
    b.industry::text,
    b.location,
    b.city,
    b.province,
    b.region,
    b.asking_price,
    b.asking_price_max,
    b.annual_revenue,
    b.net_profit,
    b.baiia,
    b.profit_margin,
    b.employees_count,
    b.year_established,
    b.status,
    b.approval_status,
    b.views_count,
    b.latitude,
    b.longitude,
    b.slug,
    b.featured,
    b.is_premium,
    b.is_franchise,
    b.currency,
    b.created_at
  FROM businesses b
  WHERE b.status = 'active' AND b.approval_status = 'approved';
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_business_with_secure_contact(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_business_with_secure_contact(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_businesses_public() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_businesses_public() TO anon;