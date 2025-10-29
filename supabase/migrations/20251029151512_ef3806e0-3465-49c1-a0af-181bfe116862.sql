-- Enable realtime for message_attachments table only (messages is already enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_attachments;