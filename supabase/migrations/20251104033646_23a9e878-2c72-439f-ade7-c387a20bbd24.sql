-- Ajouter un champ is_demo pour identifier les annonces fictives
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_businesses_is_demo ON businesses(is_demo) WHERE is_demo = true;