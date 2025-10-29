-- Corriger le trigger notify_user_alerts pour gérer le type ENUM
DROP TRIGGER IF EXISTS on_new_business_alert ON businesses;

CREATE OR REPLACE FUNCTION public.notify_user_alerts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si l'annonce vient d'être approuvée
  IF NEW.approval_status = 'approved' AND NEW.status = 'active' AND 
     (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.approval_status != 'approved')) THEN
    
    -- Alertes pour toutes les nouvelles annonces
    INSERT INTO notifications (user_id, business_id, type, message)
    SELECT 
      ua.user_id,
      NEW.id,
      'new_listing',
      'Nouvelle annonce: "' || NEW.title || '" à ' || NEW.city
    FROM user_alerts ua
    WHERE ua.alert_type = 'all' 
      AND ua.user_id != NEW.seller_id;
    
    -- Alertes par catégorie (avec cast explicite pour le type ENUM)
    INSERT INTO notifications (user_id, business_id, type, message)
    SELECT 
      ua.user_id,
      NEW.id,
      'new_listing',
      'Nouvelle annonce dans votre catégorie suivie: "' || NEW.title || '"'
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
      'Nouvelle annonce à ' || NEW.city || ': "' || NEW.title || '"'
    FROM user_alerts ua
    WHERE ua.alert_type = 'city' 
      AND ua.city = NEW.city
      AND ua.user_id != NEW.seller_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Recréer le trigger
CREATE TRIGGER on_new_business_alert
  AFTER INSERT OR UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_alerts();