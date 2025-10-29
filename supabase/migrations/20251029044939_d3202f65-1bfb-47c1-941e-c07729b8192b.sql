-- Créer un trigger pour notifier le vendeur lors de la création d'une annonce
CREATE OR REPLACE FUNCTION public.notify_new_listing()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notifier le vendeur que son annonce est en attente d'approbation
  INSERT INTO notifications (user_id, business_id, type, message)
  VALUES (
    NEW.seller_id,
    NEW.id,
    'new_listing',
    'Votre annonce "' || NEW.title || '" a été soumise avec succès. Elle est en cours de vérification. Approbation sous 24 heures.'
  );
  
  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_notify_new_listing ON businesses;
CREATE TRIGGER trigger_notify_new_listing
  AFTER INSERT ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_listing();