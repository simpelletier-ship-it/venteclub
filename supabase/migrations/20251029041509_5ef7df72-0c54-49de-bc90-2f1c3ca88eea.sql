-- Update check_business_access function to use contact_access table
CREATE OR REPLACE FUNCTION public.check_business_access(business_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_seller BOOLEAN;
  has_access BOOLEAN;
BEGIN
  -- Check if user is the seller
  SELECT EXISTS(
    SELECT 1 FROM businesses
    WHERE id = business_uuid AND seller_id = auth.uid()
  ) INTO is_seller;
  
  IF is_seller THEN
    RETURN true;
  END IF;
  
  -- Check if user has valid contact access (one-time or active subscription)
  SELECT EXISTS(
    SELECT 1 FROM contact_access
    WHERE business_id = business_uuid 
      AND user_id = auth.uid()
      AND (
        access_type = 'one_time' 
        OR (access_type = 'subscription' AND expires_at > now())
      )
  ) INTO has_access;
  
  RETURN has_access;
END;
$function$;