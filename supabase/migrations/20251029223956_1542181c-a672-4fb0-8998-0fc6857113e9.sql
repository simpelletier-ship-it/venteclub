-- Rétablir la fonction notify_user_alerts sans l'appel HTTP
-- (l'envoi d'email sera géré depuis le frontend après l'approbation)
CREATE OR REPLACE FUNCTION public.notify_user_alerts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.approval_status = 'approved' AND NEW.status = 'active' AND 
     (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.approval_status != 'approved')) THEN
    
    -- Alertes pour toutes les nouvelles annonces
    INSERT INTO notifications (user_id, business_id, type, message)
    SELECT 
      ua.user_id,
      NEW.id,
      'new_listing',
      'Nouvelle opportunité disponible : "' || NEW.title || '" dans la catégorie ' || NEW.industry::text || '.'
    FROM user_alerts ua
    WHERE ua.alert_type = 'all' 
      AND ua.user_id != NEW.seller_id;
    
    -- Alertes par catégorie
    INSERT INTO notifications (user_id, business_id, type, message)
    SELECT 
      ua.user_id,
      NEW.id,
      'new_listing',
      'Nouvelle entreprise dans votre catégorie suivie : "' || NEW.title || '" - ' || NEW.industry::text || '.'
    FROM user_alerts ua
    WHERE ua.alert_type = 'category' 
      AND ua.category = NEW.industry::text
      AND ua.user_id != NEW.seller_id;
    
    -- Alertes par ville
    INSERT INTO notifications (user_id, business_id, type, message)
    SELECT 
      ua.user_id,
      NEW.id,
      'new_listing',
      'Nouvelle entreprise disponible à ' || NEW.city || ' : "' || NEW.title || '".'
    FROM user_alerts ua
    WHERE ua.alert_type = 'city' 
      AND ua.city = NEW.city
      AND ua.user_id != NEW.seller_id;
  END IF;
  
  RETURN NEW;
END;
$$;