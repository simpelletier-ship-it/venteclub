-- Modifier les colonnes de profiles pour le suivi quotidien
ALTER TABLE profiles DROP COLUMN IF EXISTS monthly_conversations_count;
ALTER TABLE profiles DROP COLUMN IF EXISTS last_conversation_reset;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_conversations_count integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_conversation_date date DEFAULT CURRENT_DATE;

-- Fonction pour vérifier si l'utilisateur peut démarrer une nouvelle conversation (1 par jour)
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
  v_last_conversation_date date;
  v_current_date date;
BEGIN
  -- Vérifier si c'est un utilisateur Premium
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
  
  -- Obtenir la date actuelle
  v_current_date := CURRENT_DATE;
  
  -- Récupérer les informations de l'utilisateur
  SELECT daily_conversations_count, last_conversation_date
  INTO v_conversations_count, v_last_conversation_date
  FROM profiles
  WHERE id = p_user_id;
  
  -- Réinitialiser le compteur si on est dans un nouveau jour
  IF v_last_conversation_date IS NULL OR v_last_conversation_date < v_current_date THEN
    UPDATE profiles
    SET daily_conversations_count = 0,
        last_conversation_date = v_current_date
    WHERE id = p_user_id;
    v_conversations_count := 0;
  END IF;
  
  -- Vérifier si l'utilisateur a atteint la limite (1 par jour)
  IF v_conversations_count >= 1 THEN
    RETURN jsonb_build_object(
      'can_start', false,
      'reason', 'limit_reached',
      'conversations_remaining', 0,
      'message', 'Vous avez atteint votre limite de 1 conversation par jour. Abonnez-vous au Premium pour un accès illimité.'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'can_start', true,
    'reason', 'free_tier',
    'conversations_remaining', 1 - v_conversations_count
  );
END;
$$;

-- Fonction pour incrémenter le compteur de conversations quotidiennes
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
  v_current_date date;
  v_last_conversation_date date;
BEGIN
  -- Obtenir la date actuelle
  v_current_date := CURRENT_DATE;
  
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
    -- Récupérer la date de la dernière conversation
    SELECT last_conversation_date INTO v_last_conversation_date
    FROM profiles
    WHERE id = NEW.sender_id;
    
    -- Réinitialiser si nécessaire ou incrémenter
    IF v_last_conversation_date IS NULL OR v_last_conversation_date < v_current_date THEN
      UPDATE profiles
      SET daily_conversations_count = 1,
          last_conversation_date = v_current_date
      WHERE id = NEW.sender_id;
    ELSE
      UPDATE profiles
      SET daily_conversations_count = daily_conversations_count + 1
      WHERE id = NEW.sender_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recréer le trigger
DROP TRIGGER IF EXISTS increment_conversation_count_trigger ON messages;
CREATE TRIGGER increment_conversation_count_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION increment_conversation_count();