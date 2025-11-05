-- Modifier le système de conversations pour utiliser un délai de 24h glissantes
-- au lieu d'un reset quotidien à minuit

-- Recréer la fonction can_start_conversation avec logique 24h glissantes
CREATE OR REPLACE FUNCTION can_start_conversation(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_premium boolean;
  v_last_conversation_date timestamptz;
  v_conversations_count integer;
  v_can_start boolean;
  v_hours_until_reset integer;
  v_minutes_until_reset integer;
  v_time_until_reset interval;
BEGIN
  -- Vérifier si l'utilisateur a un abonnement premium actif
  SELECT EXISTS (
    SELECT 1 FROM premium_subscriptions
    WHERE user_id = p_user_id
    AND status = 'active'
    AND subscription_end > NOW()
  ) INTO v_is_premium;

  -- Si premium, pas de limite
  IF v_is_premium THEN
    RETURN jsonb_build_object(
      'can_start', true,
      'conversations_remaining', -1,
      'is_premium', true
    );
  END IF;

  -- Récupérer les données du profil
  SELECT 
    last_conversation_date,
    daily_conversations_count
  INTO 
    v_last_conversation_date,
    v_conversations_count
  FROM profiles
  WHERE id = p_user_id;

  -- Si pas de conversation précédente, l'utilisateur peut commencer
  IF v_last_conversation_date IS NULL THEN
    RETURN jsonb_build_object(
      'can_start', true,
      'conversations_remaining', 1,
      'is_premium', false
    );
  END IF;

  -- Calculer si 24h se sont écoulées depuis la dernière conversation
  v_time_until_reset := (v_last_conversation_date + INTERVAL '24 hours') - NOW();
  
  -- Si 24h se sont écoulées, reset le compteur
  IF v_time_until_reset <= INTERVAL '0' THEN
    -- Reset automatique
    UPDATE profiles
    SET daily_conversations_count = 0
    WHERE id = p_user_id;
    
    v_can_start := true;
    v_hours_until_reset := 0;
    v_minutes_until_reset := 0;
  ELSE
    -- 24h non écoulées, vérifier si l'utilisateur a déjà utilisé sa conversation
    v_can_start := (v_conversations_count = 0);
    v_hours_until_reset := EXTRACT(HOUR FROM v_time_until_reset)::integer;
    v_minutes_until_reset := EXTRACT(MINUTE FROM v_time_until_reset)::integer;
  END IF;

  RETURN jsonb_build_object(
    'can_start', v_can_start,
    'conversations_remaining', CASE WHEN v_can_start THEN 1 ELSE 0 END,
    'is_premium', false,
    'hours_until_reset', v_hours_until_reset,
    'minutes_until_reset', v_minutes_until_reset
  );
END;
$$;