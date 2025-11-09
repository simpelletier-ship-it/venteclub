-- Fix search_path for security functions
CREATE OR REPLACE FUNCTION public.is_device_trusted(
  p_user_id UUID,
  p_device_fingerprint TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.cleanup_expired_trusted_devices()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.trusted_devices
  WHERE trusted_until < now();
END;
$$;