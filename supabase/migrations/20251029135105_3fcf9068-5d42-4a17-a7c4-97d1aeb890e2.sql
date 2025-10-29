-- Corriger les fonctions sans search_path défini

-- 1. update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- 2. notify_price_drop
CREATE OR REPLACE FUNCTION public.notify_price_drop()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.asking_price < OLD.asking_price THEN
    INSERT INTO notifications (user_id, business_id, type, message)
    SELECT 
      bf.user_id,
      NEW.id,
      'price_drop',
      'Réduction de prix sur "' || NEW.title || '" : ' || 
      CASE 
        WHEN NEW.currency = 'CAD' THEN '$' 
        WHEN NEW.currency = 'USD' THEN '$' 
        ELSE NEW.currency || ' '
      END || 
      NEW.asking_price::text || '. Ne manquez pas cette opportunité !'
    FROM business_favorites bf
    WHERE bf.business_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;

-- 3. notify_business_sold
CREATE OR REPLACE FUNCTION public.notify_business_sold()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF NEW.status = 'sold' AND OLD.status != 'sold' THEN
    INSERT INTO notifications (user_id, business_id, type, message)
    SELECT 
      bf.user_id,
      NEW.id,
      'sold',
      'L''entreprise "' || NEW.title || '" que vous suiviez a été vendue. Découvrez d''autres opportunités similaires.'
    FROM business_favorites bf
    WHERE bf.business_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;

-- 4. notify_high_views
CREATE OR REPLACE FUNCTION public.notify_high_views()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF (NEW.views_count >= 100 AND OLD.views_count < 100) OR
     (NEW.views_count >= 500 AND OLD.views_count < 500) OR
     (NEW.views_count >= 1000 AND OLD.views_count < 1000) THEN
    INSERT INTO notifications (user_id, business_id, type, message)
    SELECT 
      bf.user_id,
      NEW.id,
      'high_views',
      'L''entreprise "' || NEW.title || '" génère un fort intérêt avec ' || NEW.views_count::text || ' vues. Agissez rapidement !'
    FROM business_favorites bf
    WHERE bf.business_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;