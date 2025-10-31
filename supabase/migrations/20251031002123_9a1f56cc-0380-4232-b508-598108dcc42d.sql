-- Drop existing policy
DROP POLICY IF EXISTS "Users with access can send messages" ON public.messages;

-- Create improved policy that allows both buyers and sellers to send messages
CREATE POLICY "Users with access can send messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND (
    -- User is the seller of the business (can reply to anyone with access)
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = messages.business_id 
        AND businesses.seller_id = auth.uid()
    )
    OR
    -- User has contact access (buyer can send to seller)
    EXISTS (
      SELECT 1 FROM contact_access
      WHERE contact_access.user_id = auth.uid() 
        AND contact_access.business_id = messages.business_id
    )
  )
);