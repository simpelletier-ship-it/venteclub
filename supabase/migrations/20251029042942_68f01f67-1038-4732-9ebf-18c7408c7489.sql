-- Trigger pour notifier le vendeur quand son annonce est approuvée
CREATE OR REPLACE FUNCTION public.notify_business_approved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.approval_status = 'approved' AND OLD.approval_status != 'approved' THEN
    INSERT INTO notifications (user_id, business_id, type, message)
    VALUES (
      NEW.seller_id,
      NEW.id,
      'approved',
      'Votre annonce "' || NEW.title || '" a été approuvée et est maintenant visible publiquement!'
    );
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_business_approved
  AFTER UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION notify_business_approved();

-- Table pour les alertes utilisateur
CREATE TABLE public.user_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type text NOT NULL CHECK (alert_type IN ('category', 'city', 'all')),
  category text,
  city text,
  email_enabled boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own alerts"
ON public.user_alerts
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger pour notifier selon les alertes lors d'une nouvelle annonce approuvée
CREATE OR REPLACE FUNCTION public.notify_user_alerts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    
    -- Alertes par catégorie
    INSERT INTO notifications (user_id, business_id, type, message)
    SELECT 
      ua.user_id,
      NEW.id,
      'new_listing',
      'Nouvelle annonce dans votre catégorie suivie: "' || NEW.title || '"'
    FROM user_alerts ua
    WHERE ua.alert_type = 'category' 
      AND ua.category = NEW.industry
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
$function$;

CREATE TRIGGER on_new_business_alert
  AFTER INSERT OR UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_alerts();