-- Add policy to allow viewing seller profiles if you have contact access to their business
CREATE POLICY "Users can view seller profiles with contact access"
ON public.profiles
FOR SELECT
USING (
  -- Allow viewing seller profiles if you have access to any of their businesses
  EXISTS (
    SELECT 1 FROM businesses b
    JOIN contact_access ca ON ca.business_id = b.id
    WHERE b.seller_id = profiles.id
      AND ca.user_id = auth.uid()
  )
);