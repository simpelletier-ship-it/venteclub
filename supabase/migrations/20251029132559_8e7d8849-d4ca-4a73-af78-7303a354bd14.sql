-- Ajouter une politique RLS pour permettre à tout le monde de voir les annonces vendues
CREATE POLICY "Anyone can view sold approved businesses"
ON public.businesses
FOR SELECT
USING (status = 'sold' AND approval_status = 'approved');