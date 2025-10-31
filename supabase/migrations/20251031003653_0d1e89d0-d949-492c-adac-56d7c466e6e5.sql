-- Fix search_path for security function
CREATE OR REPLACE FUNCTION increment_business_views()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.event_type = 'view' THEN
    UPDATE public.businesses
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id = NEW.business_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';