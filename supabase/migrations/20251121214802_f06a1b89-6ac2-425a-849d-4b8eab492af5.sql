-- Add is_hidden column to budget_categories
ALTER TABLE budget_categories 
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false;