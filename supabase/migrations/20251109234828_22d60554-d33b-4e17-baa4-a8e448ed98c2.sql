-- Create trusted_devices table
CREATE TABLE IF NOT EXISTS public.trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  trusted_until TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, device_fingerprint)
);

-- Enable RLS
ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;

-- Users can view their own trusted devices
CREATE POLICY "Users can view their own trusted devices"
  ON public.trusted_devices
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own trusted devices
CREATE POLICY "Users can insert their own trusted devices"
  ON public.trusted_devices
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own trusted devices
CREATE POLICY "Users can delete their own trusted devices"
  ON public.trusted_devices
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_trusted_devices_user_id ON public.trusted_devices(user_id);
CREATE INDEX idx_trusted_devices_fingerprint ON public.trusted_devices(device_fingerprint);

-- Function to check if device is trusted
CREATE OR REPLACE FUNCTION public.is_device_trusted(
  p_user_id UUID,
  p_device_fingerprint TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.trusted_devices
    WHERE user_id = p_user_id
      AND device_fingerprint = p_device_fingerprint
      AND trusted_until > now()
  );
END;
$$;

-- Function to clean up expired trusted devices (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_trusted_devices()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.trusted_devices
  WHERE trusted_until < now();
END;
$$;