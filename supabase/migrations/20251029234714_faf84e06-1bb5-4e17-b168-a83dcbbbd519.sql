-- Accorder les permissions d'exécution sur les fonctions de gestion des modifications en attente
GRANT EXECUTE ON FUNCTION apply_pending_changes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_pending_changes(UUID, TEXT) TO authenticated;