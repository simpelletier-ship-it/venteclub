
-- Remplacer la fonction apply_pending_changes pour gérer les images
CREATE OR REPLACE FUNCTION public.apply_pending_changes(business_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  pending_data JSONB;
  business_seller_id uuid;
  photo_item JSONB;
BEGIN
  -- SECURITY CHECK: Only admins or business owners can apply changes
  SELECT seller_id INTO business_seller_id FROM businesses WHERE id = business_uuid;
  
  IF NOT (public.has_role(auth.uid(), 'admin') OR auth.uid() = business_seller_id) THEN
    RAISE EXCEPTION 'Non autorisé: seuls les administrateurs peuvent appliquer des modifications';
  END IF;

  -- Récupérer les modifications en attente
  SELECT pending_changes INTO pending_data
  FROM businesses
  WHERE id = business_uuid;

  IF pending_data IS NULL THEN
    RAISE EXCEPTION 'Aucune modification en attente pour cette annonce';
  END IF;

  -- Appliquer les modifications aux champs de l'entreprise
  UPDATE businesses
  SET 
    title = COALESCE(pending_data->>'title', title),
    description = COALESCE(pending_data->>'description', description),
    location = COALESCE(pending_data->>'location', location),
    city = COALESCE(pending_data->>'city', city),
    province = COALESCE(pending_data->>'province', province),
    region = COALESCE(pending_data->>'region', region),
    asking_price = CASE WHEN pending_data ? 'asking_price' THEN (pending_data->>'asking_price')::numeric ELSE asking_price END,
    annual_revenue = CASE WHEN pending_data ? 'annual_revenue' THEN (pending_data->>'annual_revenue')::numeric ELSE annual_revenue END,
    net_profit = CASE WHEN pending_data ? 'net_profit' THEN (pending_data->>'net_profit')::numeric ELSE net_profit END,
    baiia = CASE WHEN pending_data ? 'baiia' THEN (pending_data->>'baiia')::numeric ELSE baiia END,
    profit_margin = CASE WHEN pending_data ? 'profit_margin' THEN (pending_data->>'profit_margin')::numeric ELSE profit_margin END,
    net_profit_margin = CASE WHEN pending_data ? 'net_profit_margin' THEN (pending_data->>'net_profit_margin')::numeric ELSE net_profit_margin END,
    baiia_margin = CASE WHEN pending_data ? 'baiia_margin' THEN (pending_data->>'baiia_margin')::numeric ELSE baiia_margin END,
    employees_count = CASE WHEN pending_data ? 'employees_count' THEN (pending_data->>'employees_count')::integer ELSE employees_count END,
    year_established = CASE WHEN pending_data ? 'year_established' THEN (pending_data->>'year_established')::integer ELSE year_established END,
    seller_phone = COALESCE(pending_data->>'seller_phone', seller_phone),
    has_pending_changes = FALSE,
    pending_changes = NULL,
    pending_changes_submitted_at = NULL,
    updated_at = now()
  WHERE id = business_uuid;

  -- Mettre à jour l'industrie séparément si elle existe
  IF pending_data ? 'industry' THEN
    UPDATE businesses
    SET industry = (pending_data->>'industry')::industry_type
    WHERE id = business_uuid;
  END IF;

  -- Gérer les photos si elles sont dans pending_changes
  IF pending_data ? 'photos' THEN
    -- Supprimer toutes les photos existantes
    DELETE FROM business_photos WHERE business_id = business_uuid;
    
    -- Ajouter les nouvelles photos
    FOR photo_item IN SELECT * FROM jsonb_array_elements(pending_data->'photos')
    LOOP
      INSERT INTO business_photos (business_id, photo_url, display_order)
      VALUES (
        business_uuid,
        photo_item->>'photo_url',
        (photo_item->>'display_order')::integer
      );
    END LOOP;
  END IF;

  -- Notifier le vendeur
  INSERT INTO notifications (user_id, business_id, type, message)
  SELECT seller_id, business_uuid, 'approved', 'Vos modifications pour l''annonce "' || title || '" ont été approuvées et appliquées.'
  FROM businesses WHERE id = business_uuid;
END;
$$;
