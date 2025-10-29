-- Corriger la fonction pour gérer le type industry_type correctement
CREATE OR REPLACE FUNCTION public.notify_edit_proposal_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    -- Appliquer les modifications à l'annonce
    UPDATE businesses
    SET 
      title = COALESCE((NEW.proposed_changes->>'title')::text, title),
      description = COALESCE((NEW.proposed_changes->>'description')::text, description),
      industry = COALESCE((NEW.proposed_changes->>'industry')::industry_type, industry),
      location = COALESCE((NEW.proposed_changes->>'location')::text, location),
      city = COALESCE((NEW.proposed_changes->>'city')::text, city),
      province = COALESCE((NEW.proposed_changes->>'province')::text, province),
      asking_price = COALESCE((NEW.proposed_changes->>'asking_price')::numeric, asking_price),
      annual_revenue = COALESCE((NEW.proposed_changes->>'annual_revenue')::numeric, annual_revenue),
      profit_margin = COALESCE((NEW.proposed_changes->>'profit_margin')::numeric, profit_margin),
      employees_count = COALESCE((NEW.proposed_changes->>'employees_count')::integer, employees_count),
      year_established = COALESCE((NEW.proposed_changes->>'year_established')::integer, year_established),
      updated_at = now()
    WHERE id = NEW.business_id;
    
    -- Notifier l'utilisateur de l'approbation
    INSERT INTO notifications (user_id, business_id, type, message)
    VALUES (
      NEW.user_id,
      NEW.business_id,
      'approved',
      'Vos modifications pour l''annonce ont été approuvées et appliquées.'
    );
  ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    -- Notifier l'utilisateur du rejet
    INSERT INTO notifications (user_id, business_id, type, message)
    VALUES (
      NEW.user_id,
      NEW.business_id,
      'approved',
      'Vos modifications pour l''annonce ont été rejetées. Raison: ' || COALESCE(NEW.rejection_reason, 'Non spécifiée')
    );
  END IF;
  
  RETURN NEW;
END;
$function$;