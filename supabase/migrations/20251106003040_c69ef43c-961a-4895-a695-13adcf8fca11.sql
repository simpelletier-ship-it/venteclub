-- Table pour stocker les empreintes digitales et détecter les comptes multiples
CREATE TABLE IF NOT EXISTS public.device_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fingerprint_hash TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  screen_resolution TEXT,
  timezone TEXT,
  language TEXT,
  platform TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  times_seen INTEGER DEFAULT 1
);

CREATE INDEX idx_fingerprints_hash ON public.device_fingerprints(fingerprint_hash);
CREATE INDEX idx_fingerprints_user ON public.device_fingerprints(user_id);
CREATE INDEX idx_fingerprints_ip ON public.device_fingerprints(ip_address);

-- Table améliorée pour les tentatives de connexion avec rate limiting
ALTER TABLE public.login_attempts ADD COLUMN IF NOT EXISTS fingerprint_hash TEXT;
ALTER TABLE public.login_attempts ADD COLUMN IF NOT EXISTS captcha_verified BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_login_attempts_fingerprint ON public.login_attempts(fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time ON public.login_attempts(email, attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time ON public.login_attempts(ip_address, attempted_at DESC);

-- Table pour bloquer les IPs suspectes
CREATE TABLE IF NOT EXISTS public.blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  blocked_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  permanent BOOLEAN DEFAULT FALSE,
  failed_attempts INTEGER DEFAULT 0
);

CREATE INDEX idx_blocked_ips_address ON public.blocked_ips(ip_address);

-- Table pour les limitations de taux (rate limiting)
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL, -- email, IP, ou fingerprint
  identifier_type TEXT NOT NULL, -- 'email', 'ip', 'fingerprint'
  action_type TEXT NOT NULL, -- 'login', 'signup', 'password_reset'
  attempts INTEGER DEFAULT 0,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_rate_limits_identifier ON public.rate_limits(identifier, identifier_type, action_type);
CREATE INDEX idx_rate_limits_window ON public.rate_limits(window_start);

-- Fonction pour nettoyer les anciens rate limits
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.rate_limits
  WHERE window_start < NOW() - INTERVAL '24 hours'
  AND (blocked_until IS NULL OR blocked_until < NOW());
END;
$$;

-- Activer RLS
ALTER TABLE public.device_fingerprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Policies (seulement les admins peuvent voir ces données)
CREATE POLICY "Admins can view all fingerprints" ON public.device_fingerprints
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all blocked IPs" ON public.blocked_ips
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage blocked IPs" ON public.blocked_ips
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view rate limits" ON public.rate_limits
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));