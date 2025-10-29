-- Ajouter la colonne slug à la table businesses
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS slug text;

-- Fonction pour créer un slug à partir d'un titre
CREATE OR REPLACE FUNCTION generate_slug(title text) RETURNS text AS $$
DECLARE
  slug text;
  counter integer := 0;
  final_slug text;
BEGIN
  -- Convertir en minuscules et remplacer les espaces par des tirets
  slug := lower(title);
  
  -- Remplacer les caractères accentués
  slug := translate(slug, 
    'àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ',
    'aaaaaaaceeeeiiiidnoooooouuuuypy'
  );
  
  -- Remplacer les caractères spéciaux par des tirets
  slug := regexp_replace(slug, '[^a-z0-9]+', '-', 'g');
  
  -- Supprimer les tirets en début et fin
  slug := trim(both '-' from slug);
  
  -- Limiter à 100 caractères
  slug := substring(slug from 1 for 100);
  
  -- Vérifier l'unicité et ajouter un suffixe si nécessaire
  final_slug := slug;
  WHILE EXISTS (SELECT 1 FROM businesses WHERE businesses.slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Générer les slugs pour toutes les annonces existantes
UPDATE businesses 
SET slug = generate_slug(title)
WHERE slug IS NULL;

-- Rendre la colonne slug obligatoire et unique
ALTER TABLE businesses 
ALTER COLUMN slug SET NOT NULL,
ADD CONSTRAINT businesses_slug_unique UNIQUE (slug);

-- Trigger pour générer automatiquement le slug lors de l'insertion
CREATE OR REPLACE FUNCTION set_business_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.title);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER business_slug_trigger
BEFORE INSERT OR UPDATE OF title ON businesses
FOR EACH ROW
EXECUTE FUNCTION set_business_slug();