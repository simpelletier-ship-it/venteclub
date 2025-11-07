-- Ajouter les champs first_name et last_name à la table profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Mettre à jour les données existantes en divisant full_name
UPDATE public.profiles
SET 
  first_name = SPLIT_PART(full_name, ' ', 1),
  last_name = CASE 
    WHEN ARRAY_LENGTH(STRING_TO_ARRAY(full_name, ' '), 1) > 1 
    THEN SUBSTRING(full_name FROM LENGTH(SPLIT_PART(full_name, ' ', 1)) + 2)
    ELSE ''
  END
WHERE full_name IS NOT NULL AND full_name != '';

-- Créer un trigger pour mettre à jour full_name automatiquement
CREATE OR REPLACE FUNCTION public.update_full_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.full_name := TRIM(CONCAT(NEW.first_name, ' ', NEW.last_name));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Créer le trigger
DROP TRIGGER IF EXISTS update_full_name_trigger ON public.profiles;
CREATE TRIGGER update_full_name_trigger
BEFORE INSERT OR UPDATE OF first_name, last_name ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_full_name();