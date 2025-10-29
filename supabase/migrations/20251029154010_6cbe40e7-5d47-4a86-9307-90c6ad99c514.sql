-- Add BAIIA (EBITDA) column to businesses table
ALTER TABLE public.businesses 
ADD COLUMN baiia numeric;

COMMENT ON COLUMN public.businesses.baiia IS 'BAIIA (Bénéfice Avant Intérêts, Impôts et Amortissements) / EBITDA';