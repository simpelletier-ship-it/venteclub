-- Drop the problematic policy
DROP POLICY IF EXISTS "Users with access can send messages" ON public.messages;

-- Create a MUCH simpler and more permissive policy
-- Allow message if sender is authenticated AND both parties are either seller or have access
CREATE POLICY "Users with access can send messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  -- User must be the sender
  auth.uid() = sender_id 
  AND
  -- Both sender and receiver must be authorized for this business
  -- Sender is authorized if they are the seller OR have contact access
  (
    EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND seller_id = sender_id)
    OR
    EXISTS (SELECT 1 FROM contact_access WHERE user_id = sender_id AND business_id = messages.business_id)
  )
  AND
  -- Receiver is authorized if they are the seller OR have contact access  
  (
    EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND seller_id = receiver_id)
    OR
    EXISTS (SELECT 1 FROM contact_access WHERE user_id = receiver_id AND business_id = messages.business_id)
  )
);