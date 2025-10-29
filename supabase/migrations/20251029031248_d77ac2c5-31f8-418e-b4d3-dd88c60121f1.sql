-- Delete all existing business-related data
DELETE FROM business_photos;
DELETE FROM business_favorites;
DELETE FROM business_inquiries;
DELETE FROM featured_payments;
DELETE FROM notifications;
DELETE FROM seller_contacts;
DELETE FROM businesses;

-- Create a function to insert sample data for the current user
CREATE OR REPLACE FUNCTION create_sample_businesses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert seller contact
  INSERT INTO seller_contacts (seller_id, email, phone) 
  VALUES (auth.uid(), 'vendeur@example.com', '514-555-0001')
  ON CONFLICT (seller_id) DO NOTHING;

  -- Insert sample businesses
  INSERT INTO businesses (
    id, seller_id, title, description, industry, location, city, province,
    asking_price, annual_revenue, profit_margin, employees_count, year_established,
    status, approval_status, views_count, latitude, longitude
  ) VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, auth.uid(),
    'Restaurant Italien Authentique',
    'Restaurant italien familial établi depuis 15 ans dans le quartier Plateau Mont-Royal. Clientèle fidèle, excellente réputation.',
    'restaurant', 'Montréal, QC', 'Montréal', 'Québec',
    450000, 650000, 22.5, 8, 2009, 'active', 'pending', 45, 45.5217, -73.5673
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, auth.uid(),
    'Salon de Coiffure Moderne',
    'Salon de coiffure tendance avec 6 stations. Équipement récent, bail avantageux.',
    'beaute_esthetique', 'Québec, QC', 'Québec', 'Québec',
    180000, 280000, 35.0, 5, 2018, 'active', 'pending', 23, 46.8139, -71.2080
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid, auth.uid(),
    'Garage Mécanique Certifié',
    'Garage mécanique bien établi avec clientèle corporative et particulière. CAA approuvé.',
    'garage_mecanique_concessionnaire', 'Laval, QC', 'Laval', 'Québec',
    550000, 820000, 28.0, 12, 2005, 'active', 'approved', 156, 45.6066, -73.7124
  ),
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid, auth.uid(),
    'Boutique de Vêtements Haut de Gamme',
    'Boutique de mode féminine dans un secteur premium. Marges élevées, inventaire inclus.',
    'boutique_commerce_detail', 'Montréal, QC', 'Montréal', 'Québec',
    320000, 480000, 42.0, 4, 2015, 'active', 'approved', 89, 45.5017, -73.5673
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid, auth.uid(),
    'Agence Marketing Digital',
    'Agence spécialisée en marketing digital et réseaux sociaux. Portfolio de clients établis.',
    'communications_informatique', 'Montréal, QC', 'Montréal', 'Québec',
    275000, 380000, 38.5, 6, 2019, 'active', 'approved', 67, 45.5017, -73.5673
  ),
  (
    'ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid, auth.uid(),
    'Café Bistro Centre-ville',
    'Petit café avec terrasse en plein coeur du centre-ville.',
    'bar_bistro_discotheque', 'Montréal, QC', 'Montréal', 'Québec',
    195000, 220000, 18.0, 3, 2020, 'active', 'rejected', 12, 45.5017, -73.5673
  );

  -- Add business photos
  INSERT INTO business_photos (business_id, photo_url, display_order) VALUES
    ('cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid, 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3', 1),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid, 'https://images.unsplash.com/photo-1441986300917-64674bd600d8', 1),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid, 'https://images.unsplash.com/photo-1557804506-669a67965ba0', 1);
END;
$$;