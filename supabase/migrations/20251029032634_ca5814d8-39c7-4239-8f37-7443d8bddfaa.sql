
-- Créer une fonction pour créer des annonces de démonstration sans nécessiter auth.uid()
CREATE OR REPLACE FUNCTION public.create_demo_businesses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  demo_user_id uuid;
BEGIN
  -- Créer ou obtenir un utilisateur de démonstration
  SELECT id INTO demo_user_id FROM auth.users LIMIT 1;
  
  IF demo_user_id IS NULL THEN
    RAISE EXCEPTION 'Aucun utilisateur trouvé dans le système';
  END IF;

  -- Supprimer toutes les données existantes
  DELETE FROM business_photos;
  DELETE FROM business_favorites;
  DELETE FROM business_inquiries;
  DELETE FROM featured_payments;
  DELETE FROM notifications;
  DELETE FROM businesses;
  DELETE FROM seller_contacts;

  -- Insérer les contacts vendeur
  INSERT INTO seller_contacts (seller_id, email, phone) 
  VALUES (demo_user_id, 'vendeur@example.com', '514-555-0001');

  -- Insérer les annonces de démonstration
  INSERT INTO businesses (
    id, seller_id, title, description, industry, location, city, province,
    asking_price, annual_revenue, profit_margin, employees_count, year_established,
    status, approval_status, views_count, latitude, longitude
  ) VALUES
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, demo_user_id,
    'Restaurant Italien Authentique',
    'Restaurant italien familial établi depuis 15 ans dans le quartier Plateau Mont-Royal. Clientèle fidèle, excellente réputation.',
    'restaurant', 'Montréal, QC', 'Montréal', 'Québec',
    450000, 650000, 22.5, 8, 2009, 'active', 'approved', 45, 45.5217, -73.5673
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid, demo_user_id,
    'Salon de Coiffure Moderne',
    'Salon de coiffure tendance avec 6 stations. Équipement récent, bail avantageux.',
    'beaute_esthetique', 'Québec, QC', 'Québec', 'Québec',
    180000, 280000, 35.0, 5, 2018, 'active', 'approved', 23, 46.8139, -71.2080
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid, demo_user_id,
    'Garage Mécanique Certifié',
    'Garage mécanique bien établi avec clientèle corporative et particulière. CAA approuvé.',
    'garage_mecanique_concessionnaire', 'Laval, QC', 'Laval', 'Québec',
    550000, 820000, 28.0, 12, 2005, 'active', 'approved', 156, 45.6066, -73.7124
  ),
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid, demo_user_id,
    'Boutique de Vêtements Haut de Gamme',
    'Boutique de mode féminine dans un secteur premium. Marges élevées, inventaire inclus.',
    'boutique_commerce_detail', 'Montréal, QC', 'Montréal', 'Québec',
    320000, 480000, 42.0, 4, 2015, 'active', 'approved', 89, 45.5017, -73.5673
  ),
  (
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid, demo_user_id,
    'Agence Marketing Digital',
    'Agence spécialisée en marketing digital et réseaux sociaux. Portfolio de clients établis.',
    'communications_informatique', 'Montréal, QC', 'Montréal', 'Québec',
    275000, 380000, 38.5, 6, 2019, 'active', 'approved', 67, 45.5017, -73.5673
  );

  -- Ajouter des photos pour certaines annonces
  INSERT INTO business_photos (business_id, photo_url, display_order) VALUES
    ('cccccccc-cccc-cccc-cccc-cccccccccccc'::uuid, 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3', 1),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd'::uuid, 'https://images.unsplash.com/photo-1441986300917-64674bd600d8', 1),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'::uuid, 'https://images.unsplash.com/photo-1557804506-669a67965ba0', 1);
END;
$$;
