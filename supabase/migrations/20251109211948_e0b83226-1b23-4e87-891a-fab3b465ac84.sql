-- Rendre la colonne location nullable
ALTER TABLE businesses 
ALTER COLUMN location DROP NOT NULL;

-- Supprimer l'ancienne contrainte de longueur si elle existe
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_location_length' 
    AND conrelid = 'businesses'::regclass
  ) THEN
    ALTER TABLE businesses DROP CONSTRAINT check_location_length;
  END IF;
END $$;

-- Ajouter une nouvelle contrainte qui permet les valeurs vides ou null
ALTER TABLE businesses 
ADD CONSTRAINT check_location_length 
CHECK (location IS NULL OR length(trim(location)) = 0 OR length(trim(location)) >= 2);