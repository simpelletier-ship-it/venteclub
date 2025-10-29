-- Ajouter une politique pour permettre aux admins d'insérer des paiements vedette
CREATE POLICY "Admins can create featured payments for any user"
ON featured_payments
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Ajouter une politique pour permettre aux admins de voir tous les paiements vedette
CREATE POLICY "Admins can view all featured payments"
ON featured_payments
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Ajouter une politique pour permettre aux admins de supprimer n'importe quel paiement vedette
CREATE POLICY "Admins can delete any featured payment"
ON featured_payments
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));