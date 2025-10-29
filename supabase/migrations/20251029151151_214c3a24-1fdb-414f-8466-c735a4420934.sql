-- Create table for message attachments
CREATE TABLE IF NOT EXISTS public.message_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on message_attachments
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

-- Users can view attachments from their conversations
CREATE POLICY "Users can view attachments from their messages"
ON public.message_attachments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.messages
    WHERE messages.id = message_attachments.message_id
    AND (messages.sender_id = auth.uid() OR messages.receiver_id = auth.uid())
  )
);

-- Users can insert attachments to their own messages
CREATE POLICY "Users can insert attachments to their messages"
ON public.message_attachments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.messages
    WHERE messages.id = message_attachments.message_id
    AND messages.sender_id = auth.uid()
  )
);

-- Create index for better query performance
CREATE INDEX idx_message_attachments_message_id ON public.message_attachments(message_id);

-- Create storage bucket for message attachments if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for message-attachments bucket
CREATE POLICY "Users can upload their message attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'message-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view message attachments"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'message-attachments'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM public.message_attachments ma
      JOIN public.messages m ON m.id = ma.message_id
      WHERE ma.file_url = storage.objects.name
      AND (m.sender_id = auth.uid() OR m.receiver_id = auth.uid())
    )
  )
);