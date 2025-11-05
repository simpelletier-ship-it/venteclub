-- Drop and recreate the can_start_conversation function without subscription_end reference
DROP FUNCTION IF EXISTS can_start_conversation(uuid);

CREATE OR REPLACE FUNCTION can_start_conversation(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_premium boolean;
  v_daily_count integer;
  v_last_conversation_date date;
BEGIN
  -- Check if user has premium subscription
  SELECT EXISTS (
    SELECT 1 FROM premium_subscriptions
    WHERE user_id = p_user_id
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > now())
  ) INTO v_is_premium;

  -- Premium users have unlimited conversations
  IF v_is_premium THEN
    RETURN true;
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
    RETURN true;
  END IF;

  -- Check if under daily limit (3 conversations for free users)
  RETURN v_daily_count < 3;
END;
$$;