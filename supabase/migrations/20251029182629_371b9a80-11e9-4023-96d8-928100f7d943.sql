-- Mettre à jour les coordonnées des annonces existantes sans coordonnées
-- Utilisation des coordonnées des principales villes du Québec

UPDATE businesses
SET latitude = 45.5017, longitude = -73.5673
WHERE city = 'Montréal' AND (latitude IS NULL OR longitude IS NULL);

UPDATE businesses
SET latitude = 46.8139, longitude = -71.2080
WHERE city = 'Québec' AND (latitude IS NULL OR longitude IS NULL);

UPDATE businesses
SET latitude = 45.6066, longitude = -73.7124
WHERE city = 'Laval' AND (latitude IS NULL OR longitude IS NULL);

UPDATE businesses
SET latitude = 45.4765, longitude = -75.7013
WHERE city = 'Gatineau' AND (latitude IS NULL OR longitude IS NULL);

UPDATE businesses
SET latitude = 45.5372, longitude = -73.5184
WHERE city = 'Longueuil' AND (latitude IS NULL OR longitude IS NULL);

UPDATE businesses
SET latitude = 45.4042, longitude = -71.8929
WHERE city = 'Sherbrooke' AND (latitude IS NULL OR longitude IS NULL);

UPDATE businesses
SET latitude = 48.4167, longitude = -71.0667
WHERE city = 'Saguenay' AND (latitude IS NULL OR longitude IS NULL);

UPDATE businesses
SET latitude = 46.8027, longitude = -71.1852
WHERE city = 'Lévis' AND (latitude IS NULL OR longitude IS NULL);

UPDATE businesses
SET latitude = 46.3333, longitude = -72.5333
WHERE city = 'Trois-Rivières' AND (latitude IS NULL OR longitude IS NULL);

UPDATE businesses
SET latitude = 45.6995, longitude = -73.8205
WHERE city = 'Terrebonne' AND (latitude IS NULL OR longitude IS NULL);

UPDATE businesses
SET latitude = 45.3167, longitude = -73.2667
WHERE city = 'Saint-Jean-sur-Richelieu' AND (latitude IS NULL OR longitude IS NULL);

UPDATE businesses
SET latitude = 45.7420, longitude = -73.4820
WHERE city = 'Repentigny' AND (latitude IS NULL OR longitude IS NULL);

UPDATE businesses
SET latitude = 45.5931, longitude = -73.4486
WHERE city = 'Boucherville' AND (latitude IS NULL OR longitude IS NULL);

UPDATE businesses
SET latitude = 45.8833, longitude = -72.4833
WHERE city = 'Drummondville' AND (latitude IS NULL OR longitude IS NULL);

UPDATE businesses
SET latitude = 45.7808, longitude = -74.0010
WHERE city = 'Saint-Jérôme' AND (latitude IS NULL OR longitude IS NULL);

UPDATE businesses
SET latitude = 45.4, longitude = -72.7333
WHERE city = 'Granby' AND (latitude IS NULL OR longitude IS NULL);

UPDATE businesses
SET latitude = 45.6697, longitude = -73.8760
WHERE city = 'Blainville' AND (latitude IS NULL OR longitude IS NULL);

UPDATE businesses
SET latitude = 45.6306, longitude = -72.9569
WHERE city = 'Saint-Hyacinthe' AND (latitude IS NULL OR longitude IS NULL);

UPDATE businesses
SET latitude = 48.5486, longitude = -68.5225
WHERE city = 'Baie-Comeau' AND (latitude IS NULL OR longitude IS NULL);

UPDATE businesses
SET latitude = 45.4414, longitude = -73.8669
WHERE city = 'Beaconsfield' AND (latitude IS NULL OR longitude IS NULL);