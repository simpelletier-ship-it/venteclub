-- Add RLS policy to allow users to insert their own inquiries after payment
CREATE POLICY "Users can create inquiries after payment"
ON business_inquiries
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = buyer_id);