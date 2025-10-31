
-- Supprimer la politique incorrecte
DROP POLICY IF EXISTS "Users can send messages to business owners or with access" ON public.messages;

-- Créer une politique simple et correcte qui permet :
-- 1. À n'importe qui d'envoyer un message au vendeur de l'entreprise
-- 2. Au vendeur de répondre à n'importe qui
-- 3. Aux utilisateurs avec accès de communiquer avec le vendeur
CREATE POLICY "Allow authenticated users to send messages"
ON public.messages
FOR INSERT
WITH CHECK (
  -- L'utilisateur doit être authentifié et être le sender
  auth.uid() = sender_id
  AND
  (
    -- Cas 1: Le receiver est le vendeur de l'entreprise (n'importe qui peut contacter le vendeur)
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = messages.business_id
      AND businesses.seller_id = messages.receiver_id
    )
    OR
    -- Cas 2: Le sender est le vendeur de l'entreprise (le vendeur peut répondre à n'importe qui)
    EXISTS (
      SELECT 1 FROM businesses
      WHERE businesses.id = messages.business_id
      AND businesses.seller_id = messages.sender_id
    )
    OR
    -- Cas 3: Le sender a l'accès contact (peut communiquer avec le vendeur)
    EXISTS (
      SELECT 1 FROM contact_access
      WHERE contact_access.user_id = messages.sender_id
      AND contact_access.business_id = messages.business_id
    )
  )
);
