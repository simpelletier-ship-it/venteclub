
-- Créer une table pour tracker les accès aux contacts vendeurs
CREATE TABLE IF NOT EXISTS public.contact_access (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  access_type text NOT NULL CHECK (access_type IN ('one_time', 'subscription')),
  stripe_payment_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  UNIQUE(user_id, business_id)
);

-- Enable RLS
ALTER TABLE public.contact_access ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own access"
  ON public.contact_access
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own access"
  ON public.contact_access
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index pour améliorer les performances
CREATE INDEX idx_contact_access_user_business ON public.contact_access(user_id, business_id);
CREATE INDEX idx_contact_access_expires ON public.contact_access(expires_at);

-- Fonction pour vérifier l'accès aux contacts
CREATE OR REPLACE FUNCTION public.has_contact_access(business_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_access BOOLEAN;
BEGIN
  -- Vérifier si l'utilisateur est le vendeur
  SELECT EXISTS(
    SELECT 1 FROM businesses
    WHERE id = business_uuid AND seller_id = auth.uid()
  ) INTO has_access;
  
  IF has_access THEN
    RETURN true;
  END IF;
  
  -- Vérifier l'accès unique ou abonnement actif
  SELECT EXISTS(
    SELECT 1 FROM contact_access
    WHERE user_id = auth.uid() 
      AND business_id = business_uuid
      AND (
        access_type = 'one_time' 
        OR (access_type = 'subscription' AND expires_at > now())
      )
  ) INTO has_access;
  
  RETURN has_access;
END;
$$;
