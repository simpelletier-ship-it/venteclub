-- Ajouter une policy pour que les admins puissent voir tous les abonnements Premium
CREATE POLICY "Admins can view all premium subscriptions"
  ON public.premium_subscriptions FOR SELECT
  USING (has_role(auth.uid(), 'admin'));