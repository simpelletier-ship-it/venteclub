-- Drop the old function that checks conversation limits per user globally
DROP FUNCTION IF EXISTS public.can_start_conversation(uuid);
DROP FUNCTION IF EXISTS public.can_start_conversation(uuid, uuid);

-- Create new function that checks conversation limits PER BUSINESS (per announcement)
CREATE OR REPLACE FUNCTION public.can_start_conversation(p_user_id uuid, p_business_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_is_premium boolean;
  v_is_seller boolean;
  v_has_unlocked_this_business boolean;
  v_total_unlocked_today integer;
  v_current_date date;
  v_next_reset timestamp with time zone;
  v_hours_until_reset integer;
  v_minutes_until_reset integer;
BEGIN
  v_current_date := CURRENT_DATE;
  
  -- Check if user has premium subscription
  SELECT EXISTS (
    SELECT 1 FROM premium_subscriptions
    WHERE user_id = p_user_id
    AND status = 'active'
    AND current_period_end > now()
  ) INTO v_is_premium;

  -- Premium users have unlimited access
  IF v_is_premium THEN
    RETURN jsonb_build_object(
      'can_start', true,
      'reason', 'premium',
      'conversations_remaining', -1
    );
  END IF;

  -- Check if user is the seller of this business
  SELECT EXISTS (
    SELECT 1 FROM businesses
    WHERE id = p_business_id AND seller_id = p_user_id
  ) INTO v_is_seller;

  -- Sellers can always access their own business chats
  IF v_is_seller THEN
    RETURN jsonb_build_object(
      'can_start', true,
      'reason', 'seller',
      'conversations_remaining', -1
    );
  END IF;

  -- Check if user has already unlocked THIS specific business
  SELECT EXISTS (
    SELECT 1 FROM contact_access
    WHERE user_id = p_user_id AND business_id = p_business_id
  ) INTO v_has_unlocked_this_business;

  -- If already unlocked this business, allow access
  IF v_has_unlocked_this_business THEN
    RETURN jsonb_build_object(
      'can_start', true,
      'reason', 'already_unlocked',
      'conversations_remaining', -1
    );
  END IF;

  -- Count how many DIFFERENT businesses the user has unlocked TODAY
  SELECT COUNT(DISTINCT business_id) INTO v_total_unlocked_today
  FROM contact_access
  WHERE user_id = p_user_id
    AND DATE(created_at) = v_current_date;

  -- Calculate time until next reset (midnight)
  v_next_reset := (CURRENT_DATE + INTERVAL '1 day')::timestamp with time zone;
  v_hours_until_reset := EXTRACT(EPOCH FROM (v_next_reset - now()))::integer / 3600;
  v_minutes_until_reset := (EXTRACT(EPOCH FROM (v_next_reset - now()))::integer % 3600) / 60;

  -- Free users can unlock 1 business per day
  IF v_total_unlocked_today >= 1 THEN
    RETURN jsonb_build_object(
      'can_start', false,
      'reason', 'daily_limit_reached',
      'conversations_remaining', 0,
      'hours_until_reset', v_hours_until_reset,
      'minutes_until_reset', v_minutes_until_reset,
      'message', 'Vous avez épuisé votre accès gratuit de la journée. Il reste ' || v_hours_until_reset || 'h ' || v_minutes_until_reset || 'min avant de pouvoir déverrouiller un autre tchat. Abonnez-vous au Club Select (19,99$/mois) pour un accès illimité à toutes les annonces et aux contacts des vendeurs.'
    );
  END IF;

  -- User can unlock this business
  RETURN jsonb_build_object(
    'can_start', true,
    'reason', 'free_daily_access',
    'conversations_remaining', 1 - v_total_unlocked_today
  );
END;
$function$;