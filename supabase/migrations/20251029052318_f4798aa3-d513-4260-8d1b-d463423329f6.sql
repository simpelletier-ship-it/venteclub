-- Créer un trigger pour notifier le vendeur quand quelqu'un achète l'accès à ses coordonnées
CREATE OR REPLACE FUNCTION notify_seller_contact_purchased()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  seller_user_id uuid;
  buyer_name text;
  business_title text;
BEGIN
  -- Récupérer les informations du business et du vendeur
  SELECT b.seller_id, b.title
  INTO seller_user_id, business_title
  FROM businesses b
  WHERE b.id = NEW.business_id;
  
  -- Récupérer le nom de l'acheteur
  SELECT COALESCE(p.full_name, p.email, 'Un acheteur')
  INTO buyer_name
  FROM profiles p
  WHERE p.id = NEW.user_id;
  
  -- Créer une notification pour le vendeur
  INSERT INTO notifications (user_id, business_id, type, message)
  VALUES (
    seller_user_id,
    NEW.business_id,
    'contact_purchased',
    buyer_name || ' a acheté l''accès à vos coordonnées pour "' || business_title || '". Vous pouvez maintenant communiquer directement avec cet acheteur.'
  );
  
  RETURN NEW;
END;
$$;

-- Créer le trigger sur la table contact_access
DROP TRIGGER IF EXISTS on_contact_purchased ON contact_access;
CREATE TRIGGER on_contact_purchased
  AFTER INSERT ON contact_access
  FOR EACH ROW
  EXECUTE FUNCTION notify_seller_contact_purchased();

-- S'assurer que les vendeurs peuvent voir les messages des acheteurs
-- (la politique existe déjà mais on vérifie qu'elle est correcte)