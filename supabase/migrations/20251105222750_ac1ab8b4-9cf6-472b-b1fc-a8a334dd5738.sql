-- Modifier la fonction can_start_conversation pour limiter à 1 conversation par jour au lieu de 3
CREATE OR REPLACE FUNCTION public.can_start_conversation(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_premium boolean;
  v_daily_count integer;
  v_last_conversation_date date;
  v_now timestamp with time zone;
  v_next_reset timestamp with time zone;
  v_hours_until_reset integer;
  v_minutes_until_reset integer;
BEGIN
  v_now := now();
  
  -- Check if user has premium subscription using CORRECT column name
  SELECT EXISTS (
    SELECT 1 FROM premium_subscriptions
    WHERE user_id = p_user_id
    AND status = 'active'
    AND current_period_end > v_now
  ) INTO v_is_premium;

  -- Premium users have unlimited conversations
  IF v_is_premium THEN
    RETURN jsonb_build_object(
      'can_start', true,
      'conversations_remaining', -1,
      'hours_until_reset', 0,
      'minutes_until_reset', 0
    );
  END IF;

  -- Get user's conversation data
  SELECT 
    COALESCE(daily_conversations_count, 0),
    last_conversation_date
  INTO v_daily_count, v_last_conversation_date
  FROM profiles
  WHERE id = p_user_id;

  -- Reset counter if it's a new day
  IF v_last_conversation_date IS NULL OR v_last_conversation_date < CURRENT_DATE THEN
    UPDATE profiles 
    SET daily_conversations_count = 0,
        last_conversation_date = CURRENT_DATE
    WHERE id = p_user_id;
    
    RETURN jsonb_build_object(
      'can_start', true,
      'conversations_remaining', 1,
      'hours_until_reset', 24,
      'minutes_until_reset', 0
    );
  END IF;

  -- Calculate time until next reset (midnight)
  v_next_reset := (CURRENT_DATE + INTERVAL '1 day')::timestamp with time zone;
  v_hours_until_reset := EXTRACT(EPOCH FROM (v_next_reset - v_now))::integer / 3600;
  v_minutes_until_reset := (EXTRACT(EPOCH FROM (v_next_reset - v_now))::integer % 3600) / 60;

  -- Check if under daily limit (1 conversation for free users instead of 3)
  RETURN jsonb_build_object(
    'can_start', v_daily_count < 1,
    'conversations_remaining', GREATEST(0, 1 - v_daily_count),
    'hours_until_reset', v_hours_until_reset,
    'minutes_until_reset', v_minutes_until_reset
  );
END;
$function$;