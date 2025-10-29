-- Créer une fonction trigger pour notifier l'admin des modifications en attente
CREATE OR REPLACE FUNCTION notify_admin_pending_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Si des modifications en attente sont soumises
  IF NEW.has_pending_changes = true AND (OLD.has_pending_changes = false OR OLD.has_pending_changes IS NULL) THEN
    -- Notifier tous les admins
    INSERT INTO notifications (user_id, business_id, type, message)
    SELECT 
      ur.user_id,
      NEW.id,
      'new_listing',
      'Nouvelles modifications en attente pour l''annonce "' || NEW.title || '" - nécessite une approbation.'
    FROM user_roles ur
    WHERE ur.role = 'admin';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Créer le trigger sur la table businesses
DROP TRIGGER IF EXISTS trigger_notify_admin_pending_changes ON businesses;
CREATE TRIGGER trigger_notify_admin_pending_changes
  AFTER UPDATE ON businesses
  FOR EACH ROW
  WHEN (NEW.has_pending_changes IS DISTINCT FROM OLD.has_pending_changes)
  EXECUTE FUNCTION notify_admin_pending_changes();