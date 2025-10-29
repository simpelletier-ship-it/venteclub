-- Create messages table for buyer-seller communication
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages where they are sender or receiver
CREATE POLICY "Users can view their messages"
ON public.messages
FOR SELECT
USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

-- Policy: Users with contact access can send messages
CREATE POLICY "Users with access can send messages"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND (
    -- User is the seller
    EXISTS (
      SELECT 1 FROM businesses
      WHERE id = business_id AND seller_id = auth.uid()
    )
    OR
    -- User has purchased contact access
    EXISTS (
      SELECT 1 FROM contact_access
      WHERE user_id = auth.uid() 
        AND business_id = messages.business_id
        AND (
          access_type = 'one_time' 
          OR (access_type = 'subscription' AND expires_at > now())
        )
    )
  )
);

-- Policy: Users can update their own messages (mark as read)
CREATE POLICY "Users can update messages they received"
ON public.messages
FOR UPDATE
USING (auth.uid() = receiver_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_messages_business_id ON public.messages(business_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;