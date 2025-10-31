-- Drop existing policy
DROP POLICY IF EXISTS "Users with access can send messages" ON public.messages;

-- Create comprehensive policy that handles BOTH seller and buyer scenarios
CREATE POLICY "Users with access can send messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = sender_id AND (
    -- Scenario 1: Sender is the SELLER, receiver must have contact access
    (
      EXISTS (
        SELECT 1 FROM businesses
        WHERE businesses.id = messages.business_id 
          AND businesses.seller_id = auth.uid()
      )
      AND EXISTS (
        SELECT 1 FROM contact_access
        WHERE contact_access.user_id = messages.receiver_id 
          AND contact_access.business_id = messages.business_id
      )
    )
    OR
    -- Scenario 2: Sender has contact access (buyer), receiver must be the seller
    (
      EXISTS (
        SELECT 1 FROM contact_access
        WHERE contact_access.user_id = auth.uid() 
          AND contact_access.business_id = messages.business_id
      )
      AND EXISTS (
        SELECT 1 FROM businesses
        WHERE businesses.id = messages.business_id 
          AND businesses.seller_id = messages.receiver_id
      )
    )
  )
);