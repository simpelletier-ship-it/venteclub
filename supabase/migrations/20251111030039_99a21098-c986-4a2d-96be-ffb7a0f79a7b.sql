-- Add frequency column to budget_goals table
ALTER TABLE budget_goals 
ADD COLUMN IF NOT EXISTS frequency text DEFAULT 'monthly';

-- Add comment to explain the column
COMMENT ON COLUMN budget_goals.frequency IS 'Frequency of the budget: weekly, biweekly, monthly, yearly';