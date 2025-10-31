-- Add policy to allow users to view profiles of people they have messages with
CREATE POLICY "Users can view profiles of message contacts"
ON public.profiles
FOR SELECT
USING (
  -- Allow viewing profiles of users you have messaged with
  EXISTS (
    SELECT 1 FROM messages
    WHERE (
      (messages.sender_id = auth.uid() AND messages.receiver_id = profiles.id)
      OR
      (messages.receiver_id = auth.uid() AND messages.sender_id = profiles.id)
    )
  )
);