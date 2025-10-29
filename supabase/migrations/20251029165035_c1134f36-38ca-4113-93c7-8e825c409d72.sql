-- Modifier le trigger pour ne notifier que lors de la publication (pas pour les brouillons)
DROP TRIGGER IF EXISTS on_business_created ON public.businesses;

CREATE OR REPLACE FUNCTION public.notify_seller_new_listing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notifier uniquement si l'annonce est active (pas un brouillon)
  IF NEW.status = 'active' AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status = 'archived')) THEN
    INSERT INTO notifications (user_id, business_id, type, message)
    VALUES (
      NEW.seller_id,
      NEW.id,
      'new_listing',
      'Votre annonce "' || NEW.title || '" a été soumise avec succès. Notre équipe procèdera à sa vérification sous 24 heures.'
    );
  ELSIF NEW.status = 'archived' AND TG_OP = 'INSERT' THEN
    -- Notification pour les brouillons
    INSERT INTO notifications (user_id, business_id, type, message)
    VALUES (
      NEW.seller_id,
      NEW.id,
      'draft_saved',
      'Votre brouillon "' || NEW.title || '" a été enregistré avec succès. Il n''est pas encore publié.'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_business_created
AFTER INSERT OR UPDATE OF status ON public.businesses
FOR EACH ROW
EXECUTE FUNCTION public.notify_seller_new_listing();