-- Ajouter les nouveaux champs pour l'édition admin
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS seller_email text,
ADD COLUMN IF NOT EXISTS chat_disabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS source_url text,
ADD COLUMN IF NOT EXISTS updated_by_admin boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS admin_updated_at timestamp with time zone;

COMMENT ON COLUMN public.businesses.seller_email IS 'Email de contact du vendeur';
COMMENT ON COLUMN public.businesses.chat_disabled IS 'Désactiver le chat pour cette annonce';
COMMENT ON COLUMN public.businesses.source_url IS 'URL source de l annonce (visible uniquement pour les admins)';
COMMENT ON COLUMN public.businesses.updated_by_admin IS 'Indique si l annonce a été modifiée par un admin';
COMMENT ON COLUMN public.businesses.admin_updated_at IS 'Date de dernière modification par un admin';