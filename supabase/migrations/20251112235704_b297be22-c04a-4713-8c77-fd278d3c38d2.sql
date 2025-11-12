-- Create transaction templates table
CREATE TABLE IF NOT EXISTS public.transaction_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category_id UUID REFERENCES public.budget_categories(id) ON DELETE SET NULL,
  tag_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transaction_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own templates"
  ON public.transaction_templates
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_transaction_templates_user_id ON public.transaction_templates(user_id);

-- Add updated_at trigger
CREATE TRIGGER update_transaction_templates_updated_at
  BEFORE UPDATE ON public.transaction_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();