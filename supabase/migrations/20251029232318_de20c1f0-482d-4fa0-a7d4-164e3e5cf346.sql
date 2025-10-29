-- Ajouter des colonnes pour gérer les modifications en attente d'approbation
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS has_pending_changes BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pending_changes JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pending_changes_submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Créer un index pour faciliter les requêtes des annonces avec modifications en attente
CREATE INDEX IF NOT EXISTS idx_businesses_pending_changes ON businesses(has_pending_changes) WHERE has_pending_changes = TRUE;

-- Fonction pour appliquer les modifications en attente
CREATE OR REPLACE FUNCTION apply_pending_changes(business_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  pending_data JSONB;
BEGIN
  -- Récupérer les modifications en attente
  SELECT pending_changes INTO pending_data
  FROM businesses
  WHERE id = business_uuid AND has_pending_changes = TRUE;

  IF pending_data IS NULL THEN
    RAISE EXCEPTION 'Aucune modification en attente pour cette annonce';
  END IF;

  -- Appliquer les modifications
  UPDATE businesses
  SET 
    title = COALESCE(pending_data->>'title', title),
    description = COALESCE(pending_data->>'description', description),
    location = COALESCE(pending_data->>'location', location),
    city = COALESCE(pending_data->>'city', city),
    province = COALESCE(pending_data->>'province', province),
    region = COALESCE(pending_data->>'region', region),
    asking_price = COALESCE((pending_data->>'asking_price')::numeric, asking_price),
    annual_revenue = CASE WHEN pending_data ? 'annual_revenue' THEN (pending_data->>'annual_revenue')::numeric ELSE annual_revenue END,
    profit_margin = CASE WHEN pending_data ? 'profit_margin' THEN (pending_data->>'profit_margin')::numeric ELSE profit_margin END,
    baiia = CASE WHEN pending_data ? 'baiia' THEN (pending_data->>'baiia')::numeric ELSE baiia END,
    net_profit = CASE WHEN pending_data ? 'net_profit' THEN (pending_data->>'net_profit')::numeric ELSE net_profit END,
    net_profit_margin = CASE WHEN pending_data ? 'net_profit_margin' THEN (pending_data->>'net_profit_margin')::numeric ELSE net_profit_margin END,
    employees_count = CASE WHEN pending_data ? 'employees_count' THEN (pending_data->>'employees_count')::integer ELSE employees_count END,
    year_established = CASE WHEN pending_data ? 'year_established' THEN (pending_data->>'year_established')::integer ELSE year_established END,
    seller_phone = COALESCE(pending_data->>'seller_phone', seller_phone),
    has_pending_changes = FALSE,
    pending_changes = NULL,
    pending_changes_submitted_at = NULL,
    updated_at = now()
  WHERE id = business_uuid;

  -- Mettre à jour l'industrie séparément si elle existe dans les changements
  IF pending_data ? 'industry' THEN
    UPDATE businesses
    SET industry = (pending_data->>'industry')::industry_type
    WHERE id = business_uuid;
  END IF;

  -- Notifier le vendeur de l'approbation
  INSERT INTO notifications (user_id, business_id, type, message)
  SELECT seller_id, business_uuid, 'approved', 'Vos modifications pour l''annonce "' || title || '" ont été approuvées et appliquées.'
  FROM businesses WHERE id = business_uuid;
END;
$$;

-- Fonction pour rejeter les modifications en attente
CREATE OR REPLACE FUNCTION reject_pending_changes(business_uuid UUID, rejection_reason TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Réinitialiser les modifications en attente
  UPDATE businesses
  SET 
    has_pending_changes = FALSE,
    pending_changes = NULL,
    pending_changes_submitted_at = NULL,
    rejection_reason = rejection_reason,
    updated_at = now()
  WHERE id = business_uuid AND has_pending_changes = TRUE;

  -- Notifier le vendeur du rejet
  INSERT INTO notifications (user_id, business_id, type, message)
  SELECT seller_id, business_uuid, 'approved', 'Vos modifications pour l''annonce "' || title || '" ont été rejetées. Raison: ' || rejection_reason
  FROM businesses WHERE id = business_uuid;
END;
$$;