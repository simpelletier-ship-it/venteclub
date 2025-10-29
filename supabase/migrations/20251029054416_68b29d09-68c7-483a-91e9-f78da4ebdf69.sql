-- Ajouter le type 'contact_purchased' aux types autorisés pour les notifications
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
ADD CONSTRAINT notifications_type_check 
CHECK (type = ANY (ARRAY[
  'price_drop'::text,
  'sold'::text,
  'high_views'::text,
  'new_photos'::text,
  'approved'::text,
  'new_listing'::text,
  'contact_purchased'::text
]));