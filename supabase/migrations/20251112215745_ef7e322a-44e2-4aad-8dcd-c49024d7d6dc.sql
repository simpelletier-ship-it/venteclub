-- Add is_pinned column to budget_categories for quick access customization
ALTER TABLE budget_categories 
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- Pin first 6 expense categories for each user by default
WITH ranked_categories AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY display_order, created_at) as rn
  FROM budget_categories
  WHERE type = 'expense'
)
UPDATE budget_categories
SET is_pinned = true
FROM ranked_categories
WHERE budget_categories.id = ranked_categories.id 
  AND ranked_categories.rn <= 6;