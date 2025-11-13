-- Table pour les rappels budgétaires personnalisés
CREATE TABLE IF NOT EXISTS budget_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('goal_deadline', 'subscription_renewal', 'budget_overrun', 'tax_optimization', 'custom')),
  title TEXT NOT NULL,
  description TEXT,
  reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_frequency TEXT CHECK (recurrence_frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  related_goal_id UUID,
  related_transaction_id UUID,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  email_sent BOOLEAN DEFAULT FALSE,
  push_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (related_goal_id) REFERENCES financial_goals(id) ON DELETE SET NULL,
  FOREIGN KEY (related_transaction_id) REFERENCES budget_transactions(id) ON DELETE SET NULL
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_budget_reminders_user_date ON budget_reminders(user_id, reminder_date);
CREATE INDEX idx_budget_reminders_type ON budget_reminders(reminder_type);
CREATE INDEX idx_budget_reminders_pending ON budget_reminders(user_id, is_completed, reminder_date) WHERE is_completed = FALSE;

-- Table pour les benchmarks anonymisés (statistiques agrégées)
CREATE TABLE IF NOT EXISTS user_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  income_bracket TEXT NOT NULL CHECK (income_bracket IN ('0-30k', '30k-50k', '50k-75k', '75k-100k', '100k-150k', '150k+')),
  category_name TEXT NOT NULL,
  avg_monthly_amount NUMERIC(10,2) NOT NULL,
  median_monthly_amount NUMERIC(10,2) NOT NULL,
  percentile_25 NUMERIC(10,2) NOT NULL,
  percentile_75 NUMERIC(10,2) NOT NULL,
  sample_size INTEGER NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(income_bracket, category_name)
);

-- Table pour tracker les insights générés
CREATE TABLE IF NOT EXISTS budget_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('spending_spike', 'savings_opportunity', 'budget_trend', 'tax_tip', 'subscription_alert')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  is_read BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  related_category_id UUID,
  action_taken BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (related_category_id) REFERENCES budget_categories(id) ON DELETE SET NULL
);

CREATE INDEX idx_budget_insights_user ON budget_insights(user_id, is_dismissed, created_at);
CREATE INDEX idx_budget_insights_unread ON budget_insights(user_id, is_read) WHERE is_read = FALSE;

-- Enable RLS
ALTER TABLE budget_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour budget_reminders
CREATE POLICY "Users can view their own reminders"
  ON budget_reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reminders"
  ON budget_reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
  ON budget_reminders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
  ON budget_reminders FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies pour user_benchmarks (lecture seule pour tous les utilisateurs authentifiés)
CREATE POLICY "Authenticated users can view benchmarks"
  ON user_benchmarks FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- RLS Policies pour budget_insights
CREATE POLICY "Users can view their own insights"
  ON budget_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own insights"
  ON budget_insights FOR UPDATE
  USING (auth.uid() = user_id);

-- Fonction pour calculer la tranche de revenu d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_income_bracket(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_monthly_income NUMERIC;
  v_annual_income NUMERIC;
BEGIN
  -- Calculer le revenu mensuel moyen des 3 derniers mois
  SELECT AVG(amount) INTO v_monthly_income
  FROM budget_transactions
  WHERE user_id = p_user_id
    AND type = 'income'
    AND transaction_date >= CURRENT_DATE - INTERVAL '3 months';
  
  IF v_monthly_income IS NULL THEN
    RETURN '0-30k';
  END IF;
  
  v_annual_income := v_monthly_income * 12;
  
  IF v_annual_income < 30000 THEN
    RETURN '0-30k';
  ELSIF v_annual_income < 50000 THEN
    RETURN '30k-50k';
  ELSIF v_annual_income < 75000 THEN
    RETURN '50k-75k';
  ELSIF v_annual_income < 100000 THEN
    RETURN '75k-100k';
  ELSIF v_annual_income < 150000 THEN
    RETURN '100k-150k';
  ELSE
    RETURN '150k+';
  END IF;
END;
$$;

-- Fonction pour générer automatiquement des rappels pour les objectifs
CREATE OR REPLACE FUNCTION generate_goal_deadline_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  goal_record RECORD;
  days_until_deadline INTEGER;
BEGIN
  -- Parcourir tous les objectifs avec deadlines futurs
  FOR goal_record IN
    SELECT * FROM financial_goals
    WHERE deadline IS NOT NULL
      AND deadline > CURRENT_DATE
      AND completed = FALSE
  LOOP
    days_until_deadline := (goal_record.deadline - CURRENT_DATE);
    
    -- Créer un rappel 30 jours avant
    IF days_until_deadline = 30 THEN
      INSERT INTO budget_reminders (user_id, reminder_type, title, description, reminder_date, related_goal_id)
      VALUES (
        goal_record.user_id,
        'goal_deadline',
        'Objectif bientôt échu : ' || goal_record.name,
        'Il vous reste 30 jours pour atteindre votre objectif de ' || goal_record.target_amount || '$',
        CURRENT_DATE + INTERVAL '30 days',
        goal_record.id
      )
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Créer un rappel 7 jours avant
    IF days_until_deadline = 7 THEN
      INSERT INTO budget_reminders (user_id, reminder_type, title, description, reminder_date, related_goal_id)
      VALUES (
        goal_record.user_id,
        'goal_deadline',
        'Dernière semaine : ' || goal_record.name,
        'Plus que 7 jours ! Vous êtes à ' || ROUND((goal_record.current_amount / goal_record.target_amount) * 100) || '% de votre objectif',
        CURRENT_DATE + INTERVAL '7 days',
        goal_record.id
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_budget_reminders_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER budget_reminders_updated_at
  BEFORE UPDATE ON budget_reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_budget_reminders_updated_at();