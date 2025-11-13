-- Add is_pinned column to budget_categories table
ALTER TABLE budget_categories
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- Add index for better performance when filtering pinned categories
CREATE INDEX IF NOT EXISTS idx_budget_categories_pinned ON budget_categories(user_id, type, is_pinned, display_order);