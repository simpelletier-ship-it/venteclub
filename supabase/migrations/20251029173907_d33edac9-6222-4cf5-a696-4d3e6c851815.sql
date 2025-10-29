-- Supprimer l'ancienne version de la fonction avec le paramètre has_premium
DROP FUNCTION IF EXISTS public.use_token_for_access(uuid, boolean);

-- La nouvelle version (sans has_premium) existe déjà, mais on la recrée pour être sûr
CREATE OR REPLACE FUNCTION public.use_token_for_access(business_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seller_contact_info RECORD;
  access_info jsonb;
  user_has_premium BOOLEAN;
BEGIN
  -- Vérifier si l'utilisateur a déjà accès à cette entreprise
  IF EXISTS (
    SELECT 1 FROM contact_access 
    WHERE user_id = auth.uid() AND business_id = business_uuid
  ) THEN
    -- Récupérer les informations du vendeur
    SELECT email, phone INTO seller_contact_info
    FROM seller_contacts sc
    JOIN businesses b ON b.seller_id = sc.seller_id
    WHERE b.id = business_uuid;

    RETURN jsonb_build_object(
      'success', true,
      'already_has_access', true,
      'seller_contact', jsonb_build_object(
        'email', seller_contact_info.email,
        'phone', seller_contact_info.phone
      )
    );
  END IF;

  -- VÉRIFICATION SERVEUR: Vérifier si l'utilisateur a un abonnement premium ACTIF
  SELECT EXISTS(
    SELECT 1 FROM premium_subscriptions
    WHERE user_id = auth.uid() 
      AND status = 'active'
      AND current_period_end > now()
  ) INTO user_has_premium;

  -- Si l'utilisateur a un abonnement premium, autoriser l'accès immédiatement
  IF user_has_premium THEN
    -- Créer l'accès
    INSERT INTO contact_access (user_id, business_id, used_token)
    VALUES (auth.uid(), business_uuid, false);

    -- Récupérer les informations du vendeur
    SELECT email, phone INTO seller_contact_info
    FROM seller_contacts sc
    JOIN businesses b ON b.seller_id = sc.seller_id
    WHERE b.id = business_uuid;

    RETURN jsonb_build_object(
      'success', true,
      'premium_access', true,
      'seller_contact', jsonb_build_object(
        'email', seller_contact_info.email,
        'phone', seller_contact_info.phone
      )
    );
  END IF;

  -- Vérifier le temps restant avant le prochain accès
  access_info := get_next_access_time(auth.uid());
  
  IF NOT (access_info->>'can_access')::boolean THEN
    RAISE EXCEPTION 'Vous devez attendre % secondes avant de pouvoir déverrouiller un autre vendeur. Souscrivez à l''abonnement Premium pour un accès illimité.', 
      access_info->>'seconds_remaining';
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