-- Remove the description length check constraint
ALTER TABLE public.businesses 
DROP CONSTRAINT IF EXISTS check_description_length;