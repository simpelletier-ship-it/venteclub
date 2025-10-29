-- Modifier la fonction use_token_for_access pour vérifier 1 accès par 7 jours
DROP FUNCTION IF EXISTS public.use_token_for_access(uuid);

CREATE OR REPLACE FUNCTION public.use_token_for_access(business_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_access_count INTEGER;
  seller_contact_info RECORD;
BEGIN
  -- Vérifier si l'utilisateur a déjà accès à cette entreprise
  IF EXISTS (
    SELECT 1 FROM contact_access 
    WHERE user_id = auth.uid() AND business_id = business_uuid
  ) THEN
    RAISE EXCEPTION 'Vous avez déjà accès à ce vendeur';
  END IF;

  -- Compter combien d'accès différents l'utilisateur a créés dans les 7 derniers jours
  SELECT COUNT(DISTINCT business_id) INTO recent_access_count
  FROM contact_access
  WHERE user_id = auth.uid() 
    AND created_at > now() - interval '7 days';

  -- Si l'utilisateur a déjà utilisé son accès dans les 7 derniers jours
  IF recent_access_count >= 1 THEN
    RAISE EXCEPTION 'Vous avez déjà déverrouillé un vendeur cette semaine. Vous pourrez accéder à un nouveau vendeur dans 7 jours.';
  END IF;

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

-- Supprimer la fonction refresh_daily_tokens car on n'en a plus besoin
DROP FUNCTION IF EXISTS public.refresh_daily_tokens();