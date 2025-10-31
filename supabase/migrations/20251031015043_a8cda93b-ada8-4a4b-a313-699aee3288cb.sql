-- Créer une fonction pour mettre à jour le statut featured des businesses
CREATE OR REPLACE FUNCTION public.update_business_featured_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Mettre à jour featured = true pour les businesses qui ont un paiement valide
  UPDATE businesses
  SET featured = true
  WHERE id IN (
    SELECT DISTINCT business_id
    FROM featured_payments
    WHERE featured_until > now()
    AND payment_status = 'completed'
  );
  
  -- Mettre à jour featured = false pour les businesses dont le paiement a expiré
  UPDATE businesses
  SET featured = false
  WHERE id NOT IN (
    SELECT DISTINCT business_id
    FROM featured_payments
    WHERE featured_until > now()
    AND payment_status = 'completed'
  );
END;
$$;

-- Créer un trigger pour mettre à jour automatiquement le statut featured après insertion/mise à jour d'un featured_payment
CREATE OR REPLACE FUNCTION public.sync_featured_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Si le paiement est complété et la date d'expiration est dans le futur
  IF NEW.payment_status = 'completed' AND NEW.featured_until > now() THEN
    UPDATE businesses
    SET featured = true
    WHERE id = NEW.business_id;
  -- Si le paiement a expiré ou est annulé
  ELSIF NEW.featured_until <= now() OR NEW.payment_status != 'completed' THEN
    -- Vérifier s'il n'y a pas d'autres paiements valides pour ce business
    IF NOT EXISTS (
      SELECT 1 FROM featured_payments
      WHERE business_id = NEW.business_id
      AND id != NEW.id
      AND featured_until > now()
      AND payment_status = 'completed'
    ) THEN
      UPDATE businesses
      SET featured = false
      WHERE id = NEW.business_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Attacher le trigger à la table featured_payments
DROP TRIGGER IF EXISTS trigger_sync_featured_status ON featured_payments;
CREATE TRIGGER trigger_sync_featured_status
AFTER INSERT OR UPDATE ON featured_payments
FOR EACH ROW
EXECUTE FUNCTION sync_featured_status();

-- Synchroniser immédiatement tous les statuts featured existants
SELECT update_business_featured_status();