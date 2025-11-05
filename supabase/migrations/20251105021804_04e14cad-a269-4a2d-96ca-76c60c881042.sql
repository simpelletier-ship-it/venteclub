-- Ajouter une colonne pour suivre le nombre de conversations mensuelles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS monthly_conversations_count integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_conversation_reset timestamp with time zone DEFAULT now();

-- Fonction pour vérifier si l'utilisateur peut démarrer une nouvelle conversation
CREATE OR REPLACE FUNCTION can_start_conversation(p_user_id uuid, p_business_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_is_premium boolean;
  v_is_seller boolean;
  v_conversations_count integer;
  v_last_reset timestamp with time zone;
  v_current_month_start timestamp with time zone;
BEGIN
  -- Vérifier si c'est un nouvel utilisateur Premium
  SELECT EXISTS(
    SELECT 1 FROM premium_subscriptions
    WHERE user_id = p_user_id 
      AND status = 'active'
      AND current_period_end > now()
  ) INTO v_is_premium;
  
  -- Les utilisateurs Premium ont accès illimité
  IF v_is_premium THEN
    RETURN jsonb_build_object(
      'can_start', true,
      'reason', 'premium',
      'conversations_remaining', -1
    );
  END IF;
  
  -- Vérifier si l'utilisateur est le vendeur
  SELECT EXISTS(
    SELECT 1 FROM businesses
    WHERE id = p_business_id AND seller_id = p_user_id
  ) INTO v_is_seller;
  
  -- Les vendeurs peuvent toujours répondre
  IF v_is_seller THEN
    RETURN jsonb_build_object(
      'can_start', true,
      'reason', 'seller',
      'conversations_remaining', -1
    );
  END IF;
  
  -- Vérifier si une conversation existe déjà
  IF EXISTS(
    SELECT 1 FROM messages
    WHERE (sender_id = p_user_id OR receiver_id = p_user_id)
      AND business_id = p_business_id
  ) THEN
    RETURN jsonb_build_object(
      'can_start', true,
      'reason', 'existing_conversation',
      'conversations_remaining', -1
    );
  END IF;
  
  -- Calculer le début du mois actuel
  v_current_month_start := date_trunc('month', now());
  
  -- Récupérer les informations de l'utilisateur
  SELECT monthly_conversations_count, last_conversation_reset
  INTO v_conversations_count, v_last_reset
  FROM profiles
  WHERE id = p_user_id;
  
  -- Réinitialiser le compteur si on est dans un nouveau mois
  IF v_last_reset IS NULL OR v_last_reset < v_current_month_start THEN
    UPDATE profiles
    SET monthly_conversations_count = 0,
        last_conversation_reset = now()
    WHERE id = p_user_id;
    v_conversations_count := 0;
  END IF;
  
  -- Vérifier si l'utilisateur a atteint la limite
  IF v_conversations_count >= 3 THEN
    RETURN jsonb_build_object(
      'can_start', false,
      'reason', 'limit_reached',
      'conversations_remaining', 0,
      'message', 'Vous avez atteint votre limite de 3 conversations mensuelles. Abonnez-vous au Premium pour un accès illimité.'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'can_start', true,
    'reason', 'free_tier',
    'conversations_remaining', 3 - v_conversations_count
  );
END;
$$;

-- Fonction pour incrémenter le compteur de conversations
CREATE OR REPLACE FUNCTION increment_conversation_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_is_premium boolean;
  v_is_seller boolean;
  v_existing_conversation boolean;
  v_current_month_start timestamp with time zone;
  v_last_reset timestamp with time zone;
BEGIN
  -- Calculer le début du mois actuel
  v_current_month_start := date_trunc('month', now());
  
  -- Vérifier si l'utilisateur est Premium
  SELECT EXISTS(
    SELECT 1 FROM premium_subscriptions
    WHERE user_id = NEW.sender_id 
      AND status = 'active'
      AND current_period_end > now()
  ) INTO v_is_premium;
  
  -- Ne pas compter pour les utilisateurs Premium
  IF v_is_premium THEN
    RETURN NEW;
  END IF;
  
  -- Vérifier si l'utilisateur est le vendeur
  SELECT EXISTS(
    SELECT 1 FROM businesses
    WHERE id = NEW.business_id AND seller_id = NEW.sender_id
  ) INTO v_is_seller;
  
  -- Ne pas compter pour les vendeurs
  IF v_is_seller THEN
    RETURN NEW;
  END IF;
  
  -- Vérifier s'il existe déjà une conversation pour ce business
  SELECT EXISTS(
    SELECT 1 FROM messages
    WHERE (sender_id = NEW.sender_id OR receiver_id = NEW.sender_id)
      AND business_id = NEW.business_id
      AND id != NEW.id
  ) INTO v_existing_conversation;
  
  -- Si c'est une nouvelle conversation, incrémenter le compteur
  IF NOT v_existing_conversation THEN
    -- Récupérer la date du dernier reset
    SELECT last_conversation_reset INTO v_last_reset
    FROM profiles
    WHERE id = NEW.sender_id;
    
    -- Réinitialiser si nécessaire
    IF v_last_reset IS NULL OR v_last_reset < v_current_month_start THEN
      UPDATE profiles
      SET monthly_conversations_count = 1,
          last_conversation_reset = now()
      WHERE id = NEW.sender_id;
    ELSE
      UPDATE profiles
      SET monthly_conversations_count = monthly_conversations_count + 1
      WHERE id = NEW.sender_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS increment_conversation_count_trigger ON messages;
CREATE TRIGGER increment_conversation_count_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION increment_conversation_count();