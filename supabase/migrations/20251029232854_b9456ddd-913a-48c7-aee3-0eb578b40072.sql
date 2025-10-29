-- Ajouter un enum pour les types de vente
CREATE TYPE sale_type AS ENUM ('assets', 'shares', 'both');

-- Ajouter la colonne sale_type dans la table businesses
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS sale_type sale_type DEFAULT NULL;

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN businesses.sale_type IS 'Type de vente: assets (actifs), shares (actions), both (les deux)';