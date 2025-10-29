-- Fix 1: Add explicit deny policies for anonymous users on sensitive tables
CREATE POLICY "Block anonymous access to profiles"
  ON public.profiles FOR SELECT
  TO anon
  USING (false);

CREATE POLICY "Block anonymous access to subscriptions"
  ON public.user_subscriptions FOR SELECT
  TO anon
  USING (false);

-- Fix 2: Allow sellers to view inquiries for their businesses
CREATE POLICY "Sellers can view inquiries for their businesses"
  ON public.business_inquiries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.businesses
      WHERE businesses.id = business_inquiries.business_id
      AND businesses.seller_id = auth.uid()
    )
  );

-- Fix 3: Create seller_contacts table with strict RLS
CREATE TABLE public.seller_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(seller_id)
);

ALTER TABLE public.seller_contacts ENABLE ROW LEVEL SECURITY;

-- Only sellers can insert/update their own contact info
CREATE POLICY "Sellers can manage their own contacts"
  ON public.seller_contacts FOR ALL
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

-- Fix 4: Remove public INSERT policy on business_inquiries (only service role can insert)
DROP POLICY IF EXISTS "Authenticated users can create inquiries" ON public.business_inquiries;

-- Fix 5: Add database constraints for validation
ALTER TABLE public.businesses
  ADD CONSTRAINT check_title_length CHECK (length(title) BETWEEN 5 AND 200),
  ADD CONSTRAINT check_description_length CHECK (length(description) BETWEEN 20 AND 5000),
  ADD CONSTRAINT check_location_length CHECK (length(location) BETWEEN 2 AND 100),
  ADD CONSTRAINT check_asking_price_positive CHECK (asking_price > 0),
  ADD CONSTRAINT check_annual_revenue_positive CHECK (annual_revenue IS NULL OR annual_revenue > 0),
  ADD CONSTRAINT check_profit_margin_range CHECK (profit_margin IS NULL OR (profit_margin >= 0 AND profit_margin <= 100)),
  ADD CONSTRAINT check_employees_positive CHECK (employees_count IS NULL OR employees_count > 0),
  ADD CONSTRAINT check_year_established_valid CHECK (year_established IS NULL OR (year_established >= 1800 AND year_established <= EXTRACT(YEAR FROM CURRENT_DATE)));

-- Fix 6: Update trigger function with search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix 7: Drop and recreate can_access_seller_info to check seller contacts access
DROP FUNCTION IF EXISTS public.can_access_seller_info(uuid);

CREATE FUNCTION public.check_business_access(business_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_seller BOOLEAN;
  has_inquiry BOOLEAN;
BEGIN
  -- Check if user is the seller
  SELECT EXISTS(
    SELECT 1 FROM businesses
    WHERE id = business_uuid AND seller_id = auth.uid()
  ) INTO is_seller;
  
  IF is_seller THEN
    RETURN true;
  END IF;
  
  -- Check if user has already paid for access
  SELECT EXISTS(
    SELECT 1 FROM business_inquiries
    WHERE business_id = business_uuid AND buyer_id = auth.uid()
  ) INTO has_inquiry;
  
  RETURN has_inquiry;
END;
$$;

-- Policy for seller_contacts using the new function
CREATE POLICY "Only authorized users can view seller contacts"
  ON public.seller_contacts FOR SELECT
  USING (
    auth.uid() = seller_id OR
    EXISTS (
      SELECT 1 FROM businesses b
      WHERE b.seller_id = seller_contacts.seller_id
      AND public.check_business_access(b.id)
    )
  );