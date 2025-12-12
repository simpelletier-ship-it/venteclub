-- Fix device_fingerprints security: Remove direct client insert capability
-- Fingerprints should only be created through trusted backend functions

-- Drop the insecure insert policy
DROP POLICY IF EXISTS "System can insert fingerprints" ON public.device_fingerprints;

-- Create a secure function for fingerprint registration that validates the request
-- This ensures fingerprints can only be created for the authenticated user
CREATE OR REPLACE FUNCTION public.register_device_fingerprint(
  p_fingerprint_hash text,
  p_user_agent text DEFAULT NULL,
  p_platform text DEFAULT NULL,
  p_screen_resolution text DEFAULT NULL,
  p_timezone text DEFAULT NULL,
  p_language text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fingerprint_id uuid;
  v_user_id uuid;
BEGIN
  -- Get the authenticated user - MUST be authenticated
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to register device fingerprint';
  END IF;
  
  -- Insert or update the fingerprint for this user
  INSERT INTO device_fingerprints (
    fingerprint_hash,
    user_id,
    user_agent,
    platform,
    screen_resolution,
    timezone,
    language,
    last_seen_at,
    times_seen
  )
  VALUES (
    p_fingerprint_hash,
    v_user_id,
    p_user_agent,
    p_platform,
    p_screen_resolution,
    p_timezone,
    p_language,
    now(),
    1
  )
  ON CONFLICT (fingerprint_hash) DO UPDATE SET
    last_seen_at = now(),
    times_seen = device_fingerprints.times_seen + 1,
    user_id = COALESCE(device_fingerprints.user_id, v_user_id)
  RETURNING id INTO v_fingerprint_id;
  
  RETURN v_fingerprint_id;
END;
$$;

-- Only allow inserts through the secure function (service role or backend)
-- No direct client inserts allowed
CREATE POLICY "Only backend can insert fingerprints" 
ON public.device_fingerprints 
FOR INSERT 
WITH CHECK (false);

-- Users can only view their own fingerprints
CREATE POLICY "Users can view own fingerprints" 
ON public.device_fingerprints 
FOR SELECT 
USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Grant execute on the function
GRANT EXECUTE ON FUNCTION public.register_device_fingerprint(text, text, text, text, text, text) TO authenticated;