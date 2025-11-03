-- Security Fix: Add rate limiting constraints and message length limits
-- This prevents analytics pollution and message abuse

-- Add constraint to limit message content length (prevents abuse)
ALTER TABLE messages 
ADD CONSTRAINT check_content_length CHECK (length(content) <= 5000);

-- Create rate limiting table for verification codes
CREATE TABLE IF NOT EXISTS verification_code_rate_limit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address text,
  attempts integer NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on rate limit table
ALTER TABLE verification_code_rate_limit ENABLE ROW LEVEL SECURITY;

-- Only service role can access rate limit table
CREATE POLICY "Service role only" ON verification_code_rate_limit
  FOR ALL USING (false);

-- Create cleanup function for old rate limit records
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM verification_code_rate_limit
  WHERE window_start < NOW() - INTERVAL '1 hour';
END;
$$;

-- Add index for rate limiting lookups
CREATE INDEX IF NOT EXISTS idx_rate_limit_email_window 
ON verification_code_rate_limit (email, window_start);

-- Add index for rate limiting by IP
CREATE INDEX IF NOT EXISTS idx_rate_limit_ip_window 
ON verification_code_rate_limit (ip_address, window_start) 
WHERE ip_address IS NOT NULL;
