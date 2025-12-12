-- Supprimer puis recréer la fonction avec la nouvelle signature
DROP FUNCTION IF EXISTS public.get_business_with_secure_contact(uuid);

CREATE OR REPLACE FUNCTION public.get_business_with_secure_contact(business_uuid uuid)
RETURNS TABLE(
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
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  sold_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
    b.sold_at
  FROM businesses b
  WHERE b.id = business_uuid;
END;
$$;