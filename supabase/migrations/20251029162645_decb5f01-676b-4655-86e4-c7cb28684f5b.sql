-- Créer la table des tokens utilisateurs
CREATE TABLE IF NOT EXISTS public.user_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tokens_available INTEGER NOT NULL DEFAULT 1,
  last_token_refresh TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir leurs propres tokens
CREATE POLICY "Users can view their own tokens"
ON public.user_tokens
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent mettre à jour leurs propres tokens
CREATE POLICY "Users can update their own tokens"
ON public.user_tokens
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent créer leur propre enregistrement de tokens
CREATE POLICY "Users can insert their own tokens"
ON public.user_tokens
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Supprimer l'ancienne politique messages qui dépend de access_type
DROP POLICY IF EXISTS "Users with access can send messages" ON public.messages;

-- Créer nouvelle politique messages sans référence à access_type
CREATE POLICY "Users with access can send messages"
ON public.messages
FOR INSERT
WITH CHECK (
  (auth.uid() = sender_id) AND (
    -- Soit c'est le vendeur
    EXISTS (
      SELECT 1 FROM businesses
      WHERE id = messages.business_id AND seller_id = auth.uid()
    )
    OR
    -- Soit l'utilisateur a l'accès via token
    EXISTS (
      SELECT 1 FROM contact_access
      WHERE user_id = auth.uid() AND business_id = messages.business_id
    )
  )
);

-- Maintenant on peut supprimer les colonnes
ALTER TABLE public.contact_access 
  DROP COLUMN IF EXISTS stripe_payment_id CASCADE,
  DROP COLUMN IF EXISTS access_type CASCADE,
  DROP COLUMN IF EXISTS expires_at CASCADE,
  ADD COLUMN IF NOT EXISTS used_token BOOLEAN NOT NULL DEFAULT true;

-- Fonction pour rafraîchir les tokens quotidiens
CREATE OR REPLACE FUNCTION public.refresh_daily_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Donner 1 token aux utilisateurs dont le dernier refresh date de plus de 24h
  UPDATE user_tokens
  SET tokens_available = LEAST(tokens_available + 1, 1),
      last_token_refresh = now()
  WHERE last_token_refresh < now() - interval '24 hours';
END;
$$;

-- Fonction pour utiliser un token
CREATE OR REPLACE FUNCTION public.use_token_for_access(business_uuid UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_tokens INTEGER;
  seller_contact_info RECORD;
BEGIN
  -- Vérifier si l'utilisateur a déjà accès
  IF EXISTS (
    SELECT 1 FROM contact_access 
    WHERE user_id = auth.uid() AND business_id = business_uuid
  ) THEN
    RAISE EXCEPTION 'Vous avez déjà accès à ce vendeur';
  END IF;

  -- Rafraîchir les tokens si nécessaire
  PERFORM refresh_daily_tokens();

  -- Obtenir les tokens disponibles
  SELECT tokens_available INTO current_tokens
  FROM user_tokens
  WHERE user_id = auth.uid();

  -- Créer l'enregistrement si il n'existe pas
  IF current_tokens IS NULL THEN
    INSERT INTO user_tokens (user_id, tokens_available, last_token_refresh)
    VALUES (auth.uid(), 1, now());
    current_tokens := 1;
  END IF;

  -- Vérifier si l'utilisateur a des tokens
  IF current_tokens < 1 THEN
    RAISE EXCEPTION 'Vous n''avez plus de tokens disponibles. Revenez demain pour obtenir un nouveau token gratuit.';
  END IF;

  -- Utiliser un token
  UPDATE user_tokens
  SET tokens_available = tokens_available - 1
  WHERE user_id = auth.uid();

  -- Créer l'accès
  INSERT INTO contact_access (user_id, business_id, used_token)
  VALUES (auth.uid(), business_uuid, true);

  -- Récupérer les informations du vendeur
  SELECT email, phone INTO seller_contact_info
  FROM seller_contacts sc
  JOIN businesses b ON b.seller_id = sc.seller_id
  WHERE b.id = business_uuid;

  RETURN jsonb_build_object(
    'success', true,
    'seller_contact', jsonb_build_object(
      'email', seller_contact_info.email,
      'phone', seller_contact_info.phone
    )
  );
END;
$$;