-- Corriger la fonction pour gérer le type industry_type correctement
CREATE OR REPLACE FUNCTION public.notify_edit_proposal_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_business RECORD;
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    -- Récupérer l'annonce actuelle
    SELECT * INTO current_business FROM businesses WHERE id = NEW.business_id;
    
    -- Appliquer les modifications à l'annonce
    UPDATE businesses
    SET 
      title = COALESCE(NEW.proposed_changes->>'title', title),
      description = COALESCE(NEW.proposed_changes->>'description', description),
      location = COALESCE(NEW.proposed_changes->>'location', location),
      city = COALESCE(NEW.proposed_changes->>'city', city),
      province = COALESCE(NEW.proposed_changes->>'province', province),
      asking_price = COALESCE((NEW.proposed_changes->>'asking_price')::numeric, asking_price),
      annual_revenue = COALESCE((NEW.proposed_changes->>'annual_revenue')::numeric, annual_revenue),
      profit_margin = COALESCE((NEW.proposed_changes->>'profit_margin')::numeric, profit_margin),
      employees_count = COALESCE((NEW.proposed_changes->>'employees_count')::integer, employees_count),
      year_established = COALESCE((NEW.proposed_changes->>'year_established')::integer, year_established),
      updated_at = now()
    WHERE id = NEW.business_id;
    
    -- Mettre à jour l'industrie séparément si elle existe dans les changements
    IF NEW.proposed_changes ? 'industry' THEN
      UPDATE businesses
      SET industry = (NEW.proposed_changes->>'industry')::industry_type
      WHERE id = NEW.business_id;
    END IF;
    
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