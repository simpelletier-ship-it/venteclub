-- Créer une table pour les propositions de modification d'annonces
CREATE TABLE business_edit_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  proposed_changes JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID
);

-- Activer RLS
ALTER TABLE business_edit_proposals ENABLE ROW LEVEL SECURITY;

-- Politique pour que les utilisateurs voient leurs propres propositions
CREATE POLICY "Users can view their own proposals"
  ON business_edit_proposals FOR SELECT
  USING (auth.uid() = user_id);

-- Politique pour que les utilisateurs créent des propositions pour leurs annonces
CREATE POLICY "Users can create proposals for their businesses"
  ON business_edit_proposals FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM businesses 
      WHERE id = business_id AND seller_id = auth.uid()
    )
  );

-- Politique pour que les admins voient toutes les propositions
CREATE POLICY "Admins can view all proposals"
  ON business_edit_proposals FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Politique pour que les admins mettent à jour les propositions
CREATE POLICY "Admins can update proposals"
  ON business_edit_proposals FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Fonction pour notifier l'utilisateur de l'approbation de sa modification
CREATE OR REPLACE FUNCTION notify_edit_proposal_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    -- Appliquer les modifications à l'annonce
    UPDATE businesses
    SET 
      title = COALESCE((NEW.proposed_changes->>'title')::text, title),
      description = COALESCE((NEW.proposed_changes->>'description')::text, description),
      industry = COALESCE((NEW.proposed_changes->>'industry')::text::industry_type, industry),
      location = COALESCE((NEW.proposed_changes->>'location')::text, location),
      city = COALESCE((NEW.proposed_changes->>'city')::text, city),
      province = COALESCE((NEW.proposed_changes->>'province')::text, province),
      asking_price = COALESCE((NEW.proposed_changes->>'asking_price')::numeric, asking_price),
      annual_revenue = COALESCE((NEW.proposed_changes->>'annual_revenue')::numeric, annual_revenue),
      profit_margin = COALESCE((NEW.proposed_changes->>'profit_margin')::numeric, profit_margin),
      employees_count = COALESCE((NEW.proposed_changes->>'employees_count')::integer, employees_count),
      year_established = COALESCE((NEW.proposed_changes->>'year_established')::integer, year_established),
      updated_at = now()
    WHERE id = NEW.business_id;
    
    -- Notifier l'utilisateur de l'approbation
    INSERT INTO notifications (user_id, business_id, type, message)
    VALUES (
      NEW.user_id,
      NEW.business_id,
      'approved',
      'Vos modifications pour l''annonce ont été approuvées et appliquées.'
    );
  ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    -- Notifier l'utilisateur du rejet
    INSERT INTO notifications (user_id, business_id, type, message)
    VALUES (
      NEW.user_id,
      NEW.business_id,
      'approved',
      'Vos modifications pour l''annonce ont été rejetées. Raison: ' || COALESCE(NEW.rejection_reason, 'Non spécifiée')
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger pour notifier l'utilisateur
CREATE TRIGGER trigger_notify_edit_proposal_status
  AFTER UPDATE ON business_edit_proposals
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_edit_proposal_status();

-- Index pour améliorer les performances
CREATE INDEX idx_edit_proposals_business ON business_edit_proposals(business_id);
CREATE INDEX idx_edit_proposals_user ON business_edit_proposals(user_id);
CREATE INDEX idx_edit_proposals_status ON business_edit_proposals(status);