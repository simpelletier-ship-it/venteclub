-- Modifier la fonction de notification pour différencier brouillons et annonces publiées
CREATE OR REPLACE FUNCTION public.notify_seller_new_listing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Ne notifier que si l'annonce n'est pas un brouillon (archived)
  IF NEW.status != 'archived' THEN
    INSERT INTO notifications (user_id, business_id, type, message)
    VALUES (
      NEW.seller_id,
      NEW.id,
      'new_listing',
      'Votre annonce "' || NEW.title || '" a été soumise avec succès. Notre équipe procèdera à sa vérification sous 24 heures.'
    );
  ELSE
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
$function$;