-- Create financial goals table
CREATE TABLE financial_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('savings', 'debt_payoff', 'investment', 'emergency_fund', 'purchase', 'other')),
  target_amount numeric NOT NULL,
  current_amount numeric DEFAULT 0,
  deadline date,
  icon text DEFAULT '🎯',
  color text DEFAULT '#6366f1',
  notes text,
  completed boolean DEFAULT false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create challenges table
CREATE TABLE user_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  category_id uuid REFERENCES budget_categories(id) ON DELETE SET NULL,
  challenge_type text NOT NULL CHECK (challenge_type IN ('no_spend', 'spend_limit', 'save_amount', 'custom')),
  target_value numeric,
  duration_days integer NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'abandoned')),
  progress numeric DEFAULT 0,
  icon text DEFAULT '🎯',
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Create achievements/badges table
CREATE TABLE user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_type text NOT NULL,
  badge_name text NOT NULL,
  badge_description text,
  icon text NOT NULL,
  color text DEFAULT '#fbbf24',
  earned_at timestamp with time zone DEFAULT now(),
  viewed boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE financial_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for financial_goals
CREATE POLICY "Users can manage their own goals"
  ON financial_goals FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_challenges
CREATE POLICY "Users can manage their own challenges"
  ON user_challenges FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own achievements"
  ON user_achievements FOR UPDATE
  USING (auth.uid() = user_id);