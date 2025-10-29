-- Modifier la fonction notify_user_alerts pour inclure l'envoi d'emails
CREATE OR REPLACE FUNCTION public.notify_user_alerts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  alert_record RECORD;
  user_email TEXT;
BEGIN
  IF NEW.approval_status = 'approved' AND NEW.status = 'active' AND 
     (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.approval_status != 'approved')) THEN
    
    -- Boucle sur les alertes actives
    FOR alert_record IN 
      SELECT ua.*, p.email
      FROM user_alerts ua
      LEFT JOIN profiles p ON p.id = ua.user_id
      WHERE ua.user_id != NEW.seller_id
      AND (
        (ua.alert_type = 'all')
        OR (ua.alert_type = 'category' AND ua.category = NEW.industry::text)
        OR (ua.alert_type = 'city' AND ua.city = NEW.city)
      )
    LOOP
      -- Créer la notification
      INSERT INTO notifications (user_id, business_id, type, message)
      VALUES (
        alert_record.user_id,
        NEW.id,
        'new_listing',
        CASE 
          WHEN alert_record.alert_type = 'all' THEN 'Nouvelle opportunité disponible : "' || NEW.title || '" dans la catégorie ' || NEW.industry::text || '.'
          WHEN alert_record.alert_type = 'category' THEN 'Nouvelle entreprise dans votre catégorie suivie : "' || NEW.title || '" - ' || NEW.industry::text || '.'
          WHEN alert_record.alert_type = 'city' THEN 'Nouvelle entreprise disponible à ' || NEW.city || ' : "' || NEW.title || '".'
        END
      );
      
      -- Si email_enabled = true et qu'on a un email, envoyer l'email via edge function
      IF alert_record.email_enabled AND alert_record.email IS NOT NULL THEN
        -- Appeler l'edge function send-alert-email de manière asynchrone
        PERFORM net.http_post(
          url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-alert-email',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
          ),
          body := jsonb_build_object(
            'userEmail', alert_record.email,
            'businessTitle', NEW.title,
            'businessId', NEW.id::text,
            'businessCity', NEW.city,
            'businessIndustry', NEW.industry::text,
            'businessPrice', NEW.asking_price,
            'alertType', alert_record.alert_type
          )
        );
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;