-- Add columns for rental property details
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS property_type TEXT,
ADD COLUMN IF NOT EXISTS year_built INTEGER,
ADD COLUMN IF NOT EXISTS square_footage NUMERIC,
ADD COLUMN IF NOT EXISTS is_rental_property BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS rental_units JSONB;

-- Add comment to explain rental_units structure
COMMENT ON COLUMN public.businesses.rental_units IS 'Array of rental units with structure: [{unit_type: "4-1/2", monthly_rent: 1200, count: 3}]';