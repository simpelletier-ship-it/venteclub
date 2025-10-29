-- Add franchise-specific fields to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS franchise_fee NUMERIC,
ADD COLUMN IF NOT EXISTS royalty_percentage NUMERIC,
ADD COLUMN IF NOT EXISTS marketing_fee NUMERIC,
ADD COLUMN IF NOT EXISTS initial_investment_min NUMERIC,
ADD COLUMN IF NOT EXISTS initial_investment_max NUMERIC,
ADD COLUMN IF NOT EXISTS training_provided BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS franchise_term_years INTEGER,
ADD COLUMN IF NOT EXISTS territory_available TEXT;