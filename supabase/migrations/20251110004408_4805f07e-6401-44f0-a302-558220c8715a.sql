-- Forcer la configuration publique du bucket business-photos
UPDATE storage.buckets
SET 
  public = true,
  avif_autodetection = false
WHERE id = 'business-photos';

-- S'assurer qu'il n'y a pas de politiques conflictuelles
DROP POLICY IF EXISTS "Authenticated users can upload business photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own business photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own business photos" ON storage.objects;

-- Recréer une politique de lecture VRAIMENT publique (anonyme + authentifié)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public read access for business photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'business-photos');

-- Politique pour upload (authentifiés seulement)
CREATE POLICY "Authenticated users can upload business photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'business-photos' AND
  auth.uid() IS NOT NULL
);

-- Politique pour update (propriétaires seulement)
CREATE POLICY "Users can update their own business photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'business-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Politique pour delete (propriétaires seulement)
CREATE POLICY "Users can delete their own business photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'business-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);