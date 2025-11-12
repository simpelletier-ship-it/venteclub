-- Create transaction_tags table for custom user tags
CREATE TABLE IF NOT EXISTS public.transaction_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT '🏷️',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Create junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.transaction_tag_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.budget_transactions(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.transaction_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(transaction_id, tag_id)
);

-- Enable RLS
ALTER TABLE public.transaction_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_tag_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transaction_tags
CREATE POLICY "Users can manage their own tags"
  ON public.transaction_tags
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for transaction_tag_links
CREATE POLICY "Users can manage their own tag links"
  ON public.transaction_tag_links
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.budget_transactions
      WHERE budget_transactions.id = transaction_tag_links.transaction_id
      AND budget_transactions.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.budget_transactions
      WHERE budget_transactions.id = transaction_tag_links.transaction_id
      AND budget_transactions.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transaction_tags_user_id ON public.transaction_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_tag_links_transaction_id ON public.transaction_tag_links(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_tag_links_tag_id ON public.transaction_tag_links(tag_id);