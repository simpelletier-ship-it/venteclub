-- Ajouter uniquement la colonne is_franchise
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS is_franchise boolean DEFAULT false;