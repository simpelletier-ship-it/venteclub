-- Phase 4: Enrichir la table profiles pour les profils vendeurs
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS response_time_hours INTEGER DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_responses INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_seller BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS seller_since TIMESTAMP DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT '{}';

-- Créer table pour statistiques de temps de réponse
CREATE TABLE IF NOT EXISTS seller_response_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  response_time_minutes INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_seller_response_stats_seller ON seller_response_stats(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_response_stats_created ON seller_response_stats(created_at DESC);

-- Fonction pour calculer temps de réponse moyen
CREATE OR REPLACE FUNCTION calculate_average_response_time(seller_uuid UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(AVG(response_time_minutes)::INTEGER, 0)
  FROM seller_response_stats
  WHERE seller_id = seller_uuid
    AND created_at > NOW() - INTERVAL '30 days';
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public;

-- Fonction pour mettre à jour badge "Réponse rapide"
CREATE OR REPLACE FUNCTION update_fast_response_badge()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le vendeur répond en moins de 2 heures (120 minutes)
  IF NEW.response_time_minutes <= 120 THEN
    UPDATE profiles
    SET response_time_hours = 2
    WHERE id = NEW.seller_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger pour mettre à jour automatiquement
DROP TRIGGER IF EXISTS trigger_update_fast_response_badge ON seller_response_stats;
CREATE TRIGGER trigger_update_fast_response_badge
AFTER INSERT ON seller_response_stats
FOR EACH ROW
EXECUTE FUNCTION update_fast_response_badge();

-- Enable RLS
ALTER TABLE seller_response_stats ENABLE ROW LEVEL SECURITY;

-- Policies pour seller_response_stats
CREATE POLICY "Seller can view their own stats"
  ON seller_response_stats FOR SELECT
  USING (seller_id = auth.uid());

CREATE POLICY "Service role can insert stats"
  ON seller_response_stats FOR INSERT
  WITH CHECK (true);