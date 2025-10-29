-- Fix the draft notification trigger to remove draft_saved notification type
-- which causes a constraint violation

DROP FUNCTION IF EXISTS notify_seller_new_listing() CASCADE;

CREATE OR REPLACE FUNCTION public.notify_seller_new_listing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  END IF;
  -- Removed draft notification since 'draft_saved' type is not in the allowed notification types
  RETURN NEW;
END;
$function$;

CREATE TRIGGER notify_seller_listing
AFTER INSERT OR UPDATE ON businesses
FOR EACH ROW
EXECUTE FUNCTION notify_seller_new_listing();