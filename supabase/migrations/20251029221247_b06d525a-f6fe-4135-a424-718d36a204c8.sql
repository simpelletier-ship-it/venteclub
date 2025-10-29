-- Table pour suivre les tentatives de connexion échouées
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success BOOLEAN DEFAULT FALSE,
  failure_reason TEXT,
  user_agent TEXT,
  CONSTRAINT login_attempts_check CHECK (attempted_at <= NOW())
);

-- Index pour améliorer les performances
CREATE INDEX idx_login_attempts_email_time ON public.login_attempts(email, attempted_at DESC);
CREATE INDEX idx_login_attempts_ip_time ON public.login_attempts(ip_address, attempted_at DESC);

-- Table pour l'historique des mots de passe (hash seulement)
CREATE TABLE IF NOT EXISTS public.password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_password_history_user ON public.password_history(user_id, created_at DESC);

-- Table pour les paramètres de sécurité utilisateur
CREATE TABLE IF NOT EXISTS public.security_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret TEXT,
  backup_codes TEXT[],
  last_password_change TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  force_password_reset BOOLEAN DEFAULT FALSE,
  account_locked_until TIMESTAMP WITH TIME ZONE,
  failed_login_attempts INTEGER DEFAULT 0,
  last_failed_login TIMESTAMP WITH TIME ZONE,
  session_timeout_minutes INTEGER DEFAULT 480,
  trusted_devices JSONB DEFAULT '[]'::jsonb,
  security_questions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les sessions actives (pour tracking et révocation)
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_user ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON public.user_sessions(expires_at);

-- Activer RLS sur toutes les tables
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour login_attempts (admin seulement pour consultation)
CREATE POLICY "Users can view their own login attempts"
  ON public.login_attempts FOR SELECT
  TO authenticated
  USING (email IN (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Politiques RLS pour password_history (lecture seule pour l'utilisateur)
CREATE POLICY "Users can view their own password history"
  ON public.password_history FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Politiques RLS pour security_settings
CREATE POLICY "Users can view their own security settings"
  ON public.security_settings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own security settings"
  ON public.security_settings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own security settings"
  ON public.security_settings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Politiques RLS pour user_sessions
CREATE POLICY "Users can view their own sessions"
  ON public.user_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own sessions"
  ON public.user_sessions FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Fonction pour nettoyer les anciennes tentatives de connexion (plus de 30 jours)
CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.login_attempts
  WHERE attempted_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Fonction pour nettoyer les sessions expirées
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.user_sessions
  WHERE expires_at < NOW();
END;
$$;

-- Fonction pour vérifier si un compte est verrouillé
CREATE OR REPLACE FUNCTION public.is_account_locked(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_record RECORD;
  recent_failed_attempts INTEGER;
BEGIN
  -- Obtenir les paramètres de sécurité
  SELECT ss.* INTO user_record
  FROM security_settings ss
  JOIN auth.users u ON u.id = ss.user_id
  WHERE u.email = user_email;
  
  -- Si l'utilisateur n'a pas de paramètres de sécurité, il n'est pas verrouillé
  IF user_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Vérifier si le compte est verrouillé jusqu'à une date future
  IF user_record.account_locked_until IS NOT NULL AND user_record.account_locked_until > NOW() THEN
    RETURN TRUE;
  END IF;
  
  -- Compter les tentatives échouées récentes (dernières 15 minutes)
  SELECT COUNT(*) INTO recent_failed_attempts
  FROM login_attempts
  WHERE email = user_email
    AND success = FALSE
    AND attempted_at > NOW() - INTERVAL '15 minutes';
  
  -- Verrouiller le compte si plus de 3 tentatives échouées
  IF recent_failed_attempts >= 3 THEN
    UPDATE security_settings
    SET account_locked_until = NOW() + INTERVAL '30 minutes',
        failed_login_attempts = recent_failed_attempts
    WHERE user_id = user_record.user_id;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Trigger pour mettre à jour updated_at sur security_settings
CREATE OR REPLACE FUNCTION public.update_security_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_security_settings_updated_at
  BEFORE UPDATE ON public.security_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_security_settings_updated_at();

-- Créer les paramètres de sécurité par défaut pour les utilisateurs existants
INSERT INTO public.security_settings (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;