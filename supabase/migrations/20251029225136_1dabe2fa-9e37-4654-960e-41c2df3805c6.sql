-- Fix search path for security linter warnings

-- Fix generate_slug function
CREATE OR REPLACE FUNCTION generate_slug(title text) 
RETURNS text AS $$
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
  WHILE EXISTS (SELECT 1 FROM public.businesses WHERE businesses.slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix set_business_slug function
CREATE OR REPLACE FUNCTION set_business_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.generate_slug(NEW.title);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';