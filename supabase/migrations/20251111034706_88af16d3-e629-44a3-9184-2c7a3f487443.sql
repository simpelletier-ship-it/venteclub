-- Create asset history table
CREATE TABLE IF NOT EXISTS public.asset_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  asset_id UUID NOT NULL REFERENCES public.user_assets(id) ON DELETE CASCADE,
  value NUMERIC NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create debt history table
CREATE TABLE IF NOT EXISTS public.debt_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  debt_id UUID NOT NULL REFERENCES public.user_debts(id) ON DELETE CASCADE,
  balance NUMERIC NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.asset_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for asset_history
CREATE POLICY "Users can manage their own asset history"
  ON public.asset_history
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS policies for debt_history
CREATE POLICY "Users can manage their own debt history"
  ON public.debt_history
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_asset_history_user_id ON public.asset_history(user_id);
CREATE INDEX idx_asset_history_asset_id ON public.asset_history(asset_id);
CREATE INDEX idx_asset_history_recorded_at ON public.asset_history(recorded_at);

CREATE INDEX idx_debt_history_user_id ON public.debt_history(user_id);
CREATE INDEX idx_debt_history_debt_id ON public.debt_history(debt_id);
CREATE INDEX idx_debt_history_recorded_at ON public.debt_history(recorded_at);