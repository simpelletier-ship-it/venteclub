-- Modifier la fonction use_token_for_access pour vérifier l'abonnement premium et calculer le temps restant
DROP FUNCTION IF EXISTS public.use_token_for_access(uuid);
DROP FUNCTION IF EXISTS public.get_next_access_time(uuid);

-- Fonction pour obtenir le temps restant avant le prochain accès
CREATE OR REPLACE FUNCTION public.get_next_access_time(user_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_access_time timestamp with time zone;
  next_access_time timestamp with time zone;
  seconds_remaining integer;
BEGIN
  -- Obtenir le dernier accès de l'utilisateur
  SELECT MAX(created_at) INTO last_access_time
  FROM contact_access
  WHERE user_id = user_uuid;

  IF last_access_time IS NULL THEN
    -- Aucun accès précédent, l'utilisateur peut accéder maintenant
    RETURN jsonb_build_object(
      'can_access', true,
      'seconds_remaining', 0
    );
  END IF;

  -- Calculer le prochain temps d'accès (7 jours après le dernier accès)
  next_access_time := last_access_time + interval '7 days';
  
  -- Si le temps actuel est après le prochain temps d'accès, l'utilisateur peut accéder
  IF now() >= next_access_time THEN
    RETURN jsonb_build_object(
      'can_access', true,
      'seconds_remaining', 0
    );
  END IF;

  -- Calculer les secondes restantes
  seconds_remaining := EXTRACT(EPOCH FROM (next_access_time - now()))::integer;

  RETURN jsonb_build_object(
    'can_access', false,
    'seconds_remaining', seconds_remaining,
    'next_access_time', next_access_time
  );
END;
$$;

-- Fonction modifiée pour vérifier l'accès (avec support premium)
CREATE OR REPLACE FUNCTION public.use_token_for_access(business_uuid uuid, has_premium boolean DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_access_count INTEGER;
  seller_contact_info RECORD;
  access_info jsonb;
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

  -- Si l'utilisateur a un abonnement premium, autoriser l'accès immédiatement
  IF has_premium THEN
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