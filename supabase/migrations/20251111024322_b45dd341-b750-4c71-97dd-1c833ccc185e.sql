-- Create budget categories table
CREATE TABLE public.budget_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT,
  color TEXT,
  is_custom BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create budget transactions table
CREATE TABLE public.budget_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category_id UUID REFERENCES public.budget_categories(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT CHECK (recurring_frequency IN ('weekly', 'biweekly', 'monthly', 'yearly')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create budget goals table
CREATE TABLE public.budget_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category_id UUID REFERENCES public.budget_categories(id) ON DELETE CASCADE,
  monthly_limit NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assets table
CREATE TABLE public.user_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('rrsp', 'tfsa', 'property', 'investment', 'savings', 'other')),
  value NUMERIC NOT NULL,
  currency TEXT DEFAULT 'CAD',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create debts table
CREATE TABLE public.user_debts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mortgage', 'car_loan', 'student_loan', 'credit_card', 'personal_loan', 'other')),
  balance NUMERIC NOT NULL,
  interest_rate NUMERIC NOT NULL,
  minimum_payment NUMERIC,
  payment_frequency TEXT CHECK (payment_frequency IN ('weekly', 'biweekly', 'monthly')),
  currency TEXT DEFAULT 'CAD',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create monthly summaries table
CREATE TABLE public.budget_monthly_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  month DATE NOT NULL,
  total_income NUMERIC DEFAULT 0,
  total_expenses NUMERIC DEFAULT 0,
  net_worth NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, month)
);

-- Enable RLS
ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_monthly_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for budget_categories
CREATE POLICY "Users can manage their own categories"
ON public.budget_categories FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for budget_transactions
CREATE POLICY "Users can manage their own transactions"
ON public.budget_transactions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for budget_goals
CREATE POLICY "Users can manage their own goals"
ON public.budget_goals FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_assets
CREATE POLICY "Users can manage their own assets"
ON public.user_assets FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_debts
CREATE POLICY "Users can manage their own debts"
ON public.user_debts FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for budget_monthly_summaries
CREATE POLICY "Users can manage their own summaries"
ON public.budget_monthly_summaries FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Insert default categories
INSERT INTO public.budget_categories (user_id, name, type, icon, color, is_custom) VALUES
  ('00000000-0000-0000-0000-000000000000', 'Salaire', 'income', '💰', '#10b981', false),
  ('00000000-0000-0000-0000-000000000000', 'Investissements', 'income', '📈', '#3b82f6', false),
  ('00000000-0000-0000-0000-000000000000', 'Alimentation', 'expense', '🍔', '#ef4444', false),
  ('00000000-0000-0000-0000-000000000000', 'Logement', 'expense', '🏠', '#f59e0b', false),
  ('00000000-0000-0000-0000-000000000000', 'Transport', 'expense', '🚗', '#8b5cf6', false),
  ('00000000-0000-0000-0000-000000000000', 'Divertissement', 'expense', '🎬', '#ec4899', false);

-- Create indexes for performance
CREATE INDEX idx_budget_transactions_user_date ON public.budget_transactions(user_id, transaction_date DESC);
CREATE INDEX idx_budget_transactions_category ON public.budget_transactions(category_id);
CREATE INDEX idx_budget_categories_user_type ON public.budget_categories(user_id, type);
CREATE INDEX idx_user_assets_user ON public.user_assets(user_id);
CREATE INDEX idx_user_debts_user ON public.user_debts(user_id);
CREATE INDEX idx_budget_monthly_summaries_user_month ON public.budget_monthly_summaries(user_id, month DESC);