-- Table pour stocker les codes de vérification temporaires
CREATE TABLE IF NOT EXISTS public.email_verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  verified BOOLEAN DEFAULT FALSE
);

-- Index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON public.email_verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON public.email_verification_codes(expires_at);

-- Fonction pour nettoyer les codes expirés
CREATE OR REPLACE FUNCTION public.cleanup_expired_verification_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.email_verification_codes
  WHERE expires_at < now() OR verified = TRUE;
END;
$$;

-- RLS pour la table (personne ne peut lire directement, tout passe par les fonctions)
ALTER TABLE public.email_verification_codes ENABLE ROW LEVEL SECURITY;

-- Pas de policies publiques, tout est géré par les fonctions SECURITY DEFINER