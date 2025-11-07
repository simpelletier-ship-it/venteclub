-- Add asking_price_max column to businesses table to support price ranges
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS asking_price_max NUMERIC;

-- Add comment to explain the columns
COMMENT ON COLUMN businesses.asking_price IS 'Minimum price or single price if asking_price_max is NULL';
COMMENT ON COLUMN businesses.asking_price_max IS 'Maximum price for price range, NULL if single price';