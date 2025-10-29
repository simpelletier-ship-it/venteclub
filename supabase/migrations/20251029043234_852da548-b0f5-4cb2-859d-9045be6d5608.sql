-- Ajouter colonne pour la raison de retrait
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS withdrawal_reason text;

-- Fonction pour archiver automatiquement les annonces vendues après 3 mois
CREATE OR REPLACE FUNCTION archive_old_sold_businesses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE businesses
  SET status = 'archived'
  WHERE status = 'sold' 
    AND sold_at IS NOT NULL 
    AND sold_at < NOW() - INTERVAL '3 months';
END;
$function$;