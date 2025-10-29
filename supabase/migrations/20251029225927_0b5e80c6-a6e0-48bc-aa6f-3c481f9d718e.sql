-- Ajouter les nouveaux champs financiers à la table businesses
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS net_profit numeric,
ADD COLUMN IF NOT EXISTS net_profit_margin numeric,
ADD COLUMN IF NOT EXISTS baiia_margin numeric,
ADD COLUMN IF NOT EXISTS equipment_lease text,
ADD COLUMN IF NOT EXISTS equipment_lease_cost numeric;

COMMENT ON COLUMN businesses.net_profit IS 'Bénéfice net de l''entreprise';
COMMENT ON COLUMN businesses.net_profit_margin IS 'Marge bénéficiaire nette en pourcentage';
COMMENT ON COLUMN businesses.baiia_margin IS 'Marge BAIIA en pourcentage (calculée automatiquement)';
COMMENT ON COLUMN businesses.equipment_lease IS 'Description de la location d''équipement ou de biens immobiliers';
COMMENT ON COLUMN businesses.equipment_lease_cost IS 'Coût mensuel de location d''équipement/immobilier';