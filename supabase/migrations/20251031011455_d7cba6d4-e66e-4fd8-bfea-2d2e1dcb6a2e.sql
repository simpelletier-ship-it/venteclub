
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users with access can send messages" ON public.messages;

-- Create a new, more flexible policy for sending messages
-- Allows:
-- 1. Sellers of the business to send messages
-- 2. Users with contact access to send messages  
-- 3. Any authenticated user to send a message to the seller (first contact)
CREATE POLICY "Users can send messages to business owners or with access"
ON public.messages
FOR INSERT
WITH CHECK (
  -- Sender must be authenticated
  auth.uid() = sender_id
  AND
  -- Receiver must be either:
  -- 1. The seller of the business
  -- 2. Someone with contact access to the business
  (
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = messages.business_id
      AND businesses.seller_id = messages.receiver_id
    )
    OR
    EXISTS (
      SELECT 1 FROM contact_access
      WHERE contact_access.user_id = messages.receiver_id
      AND contact_access.business_id = messages.business_id
    )
  )
);
