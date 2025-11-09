-- Add columns for reactions, replies, and images to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add index for reply relationships
CREATE INDEX IF NOT EXISTS idx_messages_reply_to_id ON public.messages(reply_to_id);

-- Add index for image messages
CREATE INDEX IF NOT EXISTS idx_messages_image_url ON public.messages(image_url) WHERE image_url IS NOT NULL;