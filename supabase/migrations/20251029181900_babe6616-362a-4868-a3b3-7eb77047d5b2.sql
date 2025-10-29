-- Indexes pour améliorer les performances des requêtes

-- Table businesses (table principale avec beaucoup de requêtes)
CREATE INDEX IF NOT EXISTS idx_businesses_status_approval 
  ON businesses(status, approval_status) 
  WHERE status IN ('active', 'sold') AND approval_status = 'approved';

CREATE INDEX IF NOT EXISTS idx_businesses_seller 
  ON businesses(seller_id);

CREATE INDEX IF NOT EXISTS idx_businesses_industry 
  ON businesses(industry);

CREATE INDEX IF NOT EXISTS idx_businesses_city 
  ON businesses(city);

CREATE INDEX IF NOT EXISTS idx_businesses_featured 
  ON businesses(featured) 
  WHERE featured = true;

CREATE INDEX IF NOT EXISTS idx_businesses_created_at 
  ON businesses(created_at DESC);

-- Index spatial pour les recherches géographiques
CREATE INDEX IF NOT EXISTS idx_businesses_location 
  ON businesses(latitude, longitude) 
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Table messages (pour les conversations)
CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread 
  ON messages(receiver_id, read, created_at DESC) 
  WHERE read = false;

CREATE INDEX IF NOT EXISTS idx_messages_business 
  ON messages(business_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation 
  ON messages(sender_id, receiver_id, business_id);

-- Table notifications (pour charger les notifications non lues rapidement)
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON notifications(user_id, read, created_at DESC) 
  WHERE read = false;

CREATE INDEX IF NOT EXISTS idx_notifications_user_all 
  ON notifications(user_id, created_at DESC);

-- Table contact_access (pour vérifier l'accès aux contacts rapidement)
CREATE INDEX IF NOT EXISTS idx_contact_access_user_business 
  ON contact_access(user_id, business_id);

CREATE INDEX IF NOT EXISTS idx_contact_access_business 
  ON contact_access(business_id);

-- Table premium_subscriptions (pour vérifier le statut premium)
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_user_status 
  ON premium_subscriptions(user_id, status, current_period_end) 
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_stripe_customer 
  ON premium_subscriptions(stripe_customer_id);

-- Table business_photos (pour charger les photos rapidement)
CREATE INDEX IF NOT EXISTS idx_business_photos_business_order 
  ON business_photos(business_id, display_order);

-- Table business_favorites (pour les favoris de l'utilisateur)
CREATE INDEX IF NOT EXISTS idx_business_favorites_user 
  ON business_favorites(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_business_favorites_business 
  ON business_favorites(business_id);

-- Table featured_payments (pour vérifier si une annonce est en vedette)
CREATE INDEX IF NOT EXISTS idx_featured_payments_business_active 
  ON featured_payments(business_id, featured_until, payment_status) 
  WHERE payment_status = 'completed';

-- Table business_reports (pour les administrateurs)
CREATE INDEX IF NOT EXISTS idx_business_reports_status 
  ON business_reports(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_business_reports_business 
  ON business_reports(business_id);

-- Table seller_contacts (pour récupérer les contacts rapidement)
CREATE INDEX IF NOT EXISTS idx_seller_contacts_seller 
  ON seller_contacts(seller_id);

-- Table user_alerts (pour envoyer les alertes)
CREATE INDEX IF NOT EXISTS idx_user_alerts_type 
  ON user_alerts(alert_type, email_enabled) 
  WHERE email_enabled = true;

CREATE INDEX IF NOT EXISTS idx_user_alerts_category 
  ON user_alerts(category) 
  WHERE category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_alerts_city 
  ON user_alerts(city) 
  WHERE city IS NOT NULL;

-- Commentaires pour expliquer l'utilité des indexes
COMMENT ON INDEX idx_businesses_status_approval IS 'Accélère la récupération des annonces actives et approuvées (page d''accueil)';
COMMENT ON INDEX idx_messages_receiver_unread IS 'Accélère le comptage des messages non lus';
COMMENT ON INDEX idx_notifications_user_unread IS 'Accélère le comptage des notifications non lus';
COMMENT ON INDEX idx_premium_subscriptions_user_status IS 'Accélère la vérification du statut premium';
COMMENT ON INDEX idx_businesses_location IS 'Accélère les recherches géographiques sur la carte';