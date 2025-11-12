-- Add display_order column to budget_categories
ALTER TABLE budget_categories 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Update existing records with sequential order based on creation date
WITH ordered_categories AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY user_id, type ORDER BY created_at) - 1 as new_order
  FROM budget_categories
)
UPDATE budget_categories
SET display_order = ordered_categories.new_order
FROM ordered_categories
WHERE budget_categories.id = ordered_categories.id;