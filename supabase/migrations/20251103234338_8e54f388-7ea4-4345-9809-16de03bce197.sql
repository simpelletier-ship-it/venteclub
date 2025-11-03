-- Remove the check constraint that prevents asking_price from being 0
-- This allows "à discuter" (to be discussed) pricing where asking_price = 0
ALTER TABLE public.businesses 
DROP CONSTRAINT IF EXISTS check_asking_price_positive;