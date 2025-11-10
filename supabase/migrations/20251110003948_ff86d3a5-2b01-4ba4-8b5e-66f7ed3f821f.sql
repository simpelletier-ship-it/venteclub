-- Mise à jour de la configuration CORS pour le bucket business-photos
UPDATE storage.buckets
SET 
  public = true,
  file_size_limit = 10485760, -- 10MB
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']::text[]
WHERE id = 'business-photos';

-- S'assurer que la politique de lecture publique existe
DROP POLICY IF EXISTS "Anyone can view business photos" ON storage.objects;

CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'business-photos');