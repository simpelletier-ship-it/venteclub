-- Add region column to businesses table
ALTER TABLE public.businesses 
ADD COLUMN region text;

COMMENT ON COLUMN public.businesses.region IS 'Région administrative du Québec';