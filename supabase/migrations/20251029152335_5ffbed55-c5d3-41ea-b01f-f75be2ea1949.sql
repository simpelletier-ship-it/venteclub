-- Mettre à jour la contrainte CHECK sur le statut des entreprises pour inclure 'archived'
ALTER TABLE public.businesses 
DROP CONSTRAINT IF EXISTS businesses_status_check;

ALTER TABLE public.businesses 
ADD CONSTRAINT businesses_status_check 
CHECK (status IN ('active', 'sold', 'pending', 'draft', 'archived'));