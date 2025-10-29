-- Modifier la fonction de notification pour changer le message
CREATE OR REPLACE FUNCTION public.notify_seller_contact_purchased()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
  SELECT COALESCE(p.full_name, p.email, 'Un utilisateur')
  INTO buyer_name
  FROM profiles p
  WHERE p.id = NEW.user_id;
  
  -- Créer une notification pour le vendeur
  INSERT INTO notifications (user_id, business_id, type, message)
  VALUES (
    seller_user_id,
    NEW.business_id,
    'contact_purchased',
    buyer_name || ' a déverrouillé vos informations concernant "' || business_title || '". Vous pouvez maintenant communiquer directement avec cet utilisateur.'
  );
  
  RETURN NEW;
END;
$$;