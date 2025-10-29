-- Add storage bucket for business photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('business-photos', 'business-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for business photos
CREATE POLICY "Anyone can view business photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'business-photos');

CREATE POLICY "Authenticated users can upload business photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'business-photos' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their own business photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'business-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own business photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'business-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create new industry enum with Quebec categories
CREATE TYPE public.industry_type_new AS ENUM (
  'activite_sport_loisir',
  'art_spectacle_cinema',
  'hebergement',
  'bar_bistro_discotheque',
  'batiment_immeuble',
  'beaute_esthetique',
  'boutique_commerce_detail',
  'camping',
  'centre_equestre_erabliere',
  'transport_entreposage',
  'construction_excavation_renovation',
  'developpement_domaine',
  'distribution_commerce_gros',
  'domaine_alimentaire',
  'communications_informatique',
  'education_garderie',
  'entreprise_service',
  'entreprise_saisonniere',
  'epicerie_depanneur',
  'franchise',
  'garage_mecanique_concessionnaire',
  'immeuble_revenus',
  'industrie_manufacturier_transformation',
  'jardin_pepiniere_verger_vignoble',
  'pourvoirie_centre_plein_air',
  'residence_sante',
  'residentiel',
  'restaurant'
);

-- Add new columns to businesses table
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'CAD',
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS province TEXT DEFAULT 'Québec',
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS seller_name TEXT,
ADD COLUMN IF NOT EXISTS seller_phone TEXT,
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sold_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS industry_new industry_type_new;

-- Migrate existing data (default to a valid category)
UPDATE businesses 
SET industry_new = 'entreprise_service'::industry_type_new
WHERE industry_new IS NULL;

-- Drop old industry column and rename new one
ALTER TABLE businesses DROP COLUMN industry;
ALTER TABLE businesses RENAME COLUMN industry_new TO industry;
ALTER TABLE businesses ALTER COLUMN industry SET NOT NULL;

-- Create business_photos table
CREATE TABLE IF NOT EXISTS public.business_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on business_photos
ALTER TABLE public.business_photos ENABLE ROW LEVEL SECURITY;

-- Create policies for business_photos
CREATE POLICY "Anyone can view business photos"
ON public.business_photos FOR SELECT
USING (true);

CREATE POLICY "Sellers can manage their business photos"
ON public.business_photos FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = business_photos.business_id
    AND businesses.seller_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM businesses
    WHERE businesses.id = business_photos.business_id
    AND businesses.seller_id = auth.uid()
  )
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_business_photos_business_id ON business_photos(business_id);
CREATE INDEX IF NOT EXISTS idx_businesses_featured ON businesses(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_businesses_city ON businesses(city);
CREATE INDEX IF NOT EXISTS idx_businesses_location ON businesses(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;