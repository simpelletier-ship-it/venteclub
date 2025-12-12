-- Remove seller contact information columns from businesses table
ALTER TABLE public.businesses 
DROP COLUMN IF EXISTS seller_email,
DROP COLUMN IF EXISTS seller_phone,
DROP COLUMN IF EXISTS seller_name;