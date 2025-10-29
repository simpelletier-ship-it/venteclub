-- Ajouter le type 'new_message' aux notifications
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check 
CHECK (type = ANY (ARRAY[
  'price_drop'::text,
  'sold'::text,
  'high_views'::text,
  'new_photos'::text,
  'approved'::text,
  'new_listing'::text,
  'contact_purchased'::text,
  'new_message'::text
]));

-- Créer une fonction pour notifier les nouveaux messages
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  business_owner_id UUID;
  sender_name TEXT;
BEGIN
  -- Récupérer l'ID du propriétaire de l'entreprise
  SELECT seller_id INTO business_owner_id
  FROM businesses
  WHERE id = NEW.business_id;

  -- Récupérer le nom de l'expéditeur
  SELECT COALESCE(email, id::text) INTO sender_name
  FROM auth.users
  WHERE id = NEW.sender_id;

  -- Si le message est envoyé à quelqu'un d'autre que soi-même
  IF NEW.sender_id != NEW.receiver_id THEN
    -- Créer une notification pour le destinataire
    INSERT INTO notifications (user_id, business_id, type, message)
    VALUES (
      NEW.receiver_id,
      NEW.business_id,
      'new_message',
      'Nouveau message de ' || sender_name
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger pour les nouveaux messages
DROP TRIGGER IF EXISTS trigger_notify_new_message ON messages;
CREATE TRIGGER trigger_notify_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- RLS pour les notifications de messages
DROP POLICY IF EXISTS "Users can view their own message notifications" ON notifications;
CREATE POLICY "Users can view their own message notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);