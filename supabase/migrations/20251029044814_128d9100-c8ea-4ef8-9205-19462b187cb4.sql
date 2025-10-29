-- Supprimer l'ancienne contrainte
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Ajouter la nouvelle contrainte avec tous les types nécessaires
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'price_drop',
  'sold',
  'high_views',
  'new_photos',
  'approved',
  'new_listing'
));