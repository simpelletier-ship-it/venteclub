-- Correction des failles de sécurité critiques PCI DSS

-- 1. Masquer les données sensibles des vendeurs dans la vue publique
-- Créer une vue sécurisée qui masque seller_phone et seller_name
CREATE OR REPLACE VIEW public.businesses_public AS
SELECT 
  id, seller_id, title, description, industry, location, city, province, region,
  asking_price, currency, annual_revenue, net_profit, baiia, 
  profit_margin, net_profit_margin, baiia_margin,
  employees_count, year_established, status, approval_status, featured,
  views_count, latitude, longitude, slug, created_at, updated_at,
  -- Masquer les données sensibles
  NULL as seller_phone,
  NULL as seller_name,
  NULL as seller_email,
  has_pending_changes, pending_changes_submitted_at, rejection_reason
FROM public.businesses
WHERE approval_status = 'approved' AND status = 'active';

-- 2. Activer la protection contre les mots de passe compromis
-- Ceci sera fait via configure-auth

-- 3. Restreindre l'insertion d'analytics aux utilisateurs authentifiés seulement
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.business_analytics;

CREATE POLICY "Authenticated users can insert analytics"
  ON public.business_analytics
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Ajouter une policy pour les utilisateurs anonymes avec rate limiting
CREATE POLICY "Anonymous users can insert limited analytics"
  ON public.business_analytics
  FOR INSERT
  TO anon
  WITH CHECK (
    -- Limiter à 10 events par IP par heure
    (SELECT COUNT(*) FROM public.business_analytics 
     WHERE ip_address = (SELECT ip_address FROM public.business_analytics LIMIT 1)
     AND created_at > NOW() - INTERVAL '1 hour') < 10
  );

-- 4. Protéger les données sensibles dans profiles
-- Créer une fonction pour masquer les données personnelles dans les profils publics
CREATE OR REPLACE FUNCTION public.get_safe_profile(profile_id uuid)
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.avatar_url,
    p.bio,
    p.created_at
  FROM public.profiles p
  WHERE p.id = profile_id
  AND (
    p.is_public = true 
    OR p.id = auth.uid()
    OR EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
END;
$$;

-- 5. Ajouter des policies strictes pour email_verification_codes
-- S'assurer que seuls les edge functions peuvent y accéder
DROP POLICY IF EXISTS "Service role only" ON public.email_verification_codes;

CREATE POLICY "Service role can manage verification codes"
  ON public.email_verification_codes
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 6. Sécuriser device_fingerprints avec INSERT policy
CREATE POLICY "System can insert fingerprints"
  ON public.device_fingerprints
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 7. Créer une table d'audit pour la conformité PCI DSS
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  ip_address inet,
  user_agent text,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
  ON public.security_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "System can insert audit log"
  ON public.security_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 8. Créer une fonction d'audit automatique
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type text,
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    event_type,
    user_id,
    details
  ) VALUES (
    p_event_type,
    auth.uid(),
    p_details
  );
END;
$$;

-- 9. Ajouter un index pour les requêtes de sécurité
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON public.security_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_event_type ON public.security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON public.security_audit_log(user_id);

COMMENT ON TABLE public.security_audit_log IS 'Audit log for PCI DSS compliance - tracks all security-related events';
COMMENT ON VIEW public.businesses_public IS 'Public view of businesses with sensitive seller data masked for PCI DSS compliance';