-- Enable realtime for profiles table so avatar updates appear instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;