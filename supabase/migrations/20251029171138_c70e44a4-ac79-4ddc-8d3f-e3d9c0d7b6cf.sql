-- Créer une table pour stocker les abonnements Premium
CREATE TABLE IF NOT EXISTS public.premium_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL,
  stripe_subscription_id text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  current_period_end timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Index pour les requêtes rapides
CREATE INDEX idx_premium_subscriptions_user_id ON public.premium_subscriptions(user_id);
CREATE INDEX idx_premium_subscriptions_status ON public.premium_subscriptions(status);

-- Enable RLS
ALTER TABLE public.premium_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir leur propre abonnement
CREATE POLICY "Users can view their own subscription"
  ON public.premium_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Modifier check_business_access pour vérifier les abonnements Premium
CREATE OR REPLACE FUNCTION public.check_business_access(business_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_seller BOOLEAN;
  has_access BOOLEAN;
  has_premium BOOLEAN;
BEGIN
  -- Check if user is the seller
  SELECT EXISTS(
    SELECT 1 FROM businesses
    WHERE id = business_uuid AND seller_id = auth.uid()
  ) INTO is_seller;
  
  IF is_seller THEN
    RETURN true;
  END IF;
  
  -- Check if user has an active Premium subscription
  SELECT EXISTS(
    SELECT 1 FROM premium_subscriptions
    WHERE user_id = auth.uid() 
      AND status = 'active'
      AND current_period_end > now()
  ) INTO has_premium;
  
  IF has_premium THEN
    RETURN true;
  END IF;
  
  -- Check if user has valid contact access (one-time or active subscription)
  SELECT EXISTS(
    SELECT 1 FROM contact_access
    WHERE business_id = business_uuid 
      AND user_id = auth.uid()
  ) INTO has_access;
  
  RETURN has_access;
END;
$$;

-- Fonction pour synchroniser l'abonnement Premium depuis Stripe
CREATE OR REPLACE FUNCTION public.sync_premium_subscription(
  p_user_id uuid,
  p_stripe_customer_id text,
  p_stripe_subscription_id text,
  p_status text,
  p_current_period_end timestamp with time zone
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO premium_subscriptions (
    user_id,
    stripe_customer_id,
    stripe_subscription_id,
    status,
    current_period_end,
    updated_at
  )
  VALUES (
    p_user_id,
    p_stripe_customer_id,
    p_stripe_subscription_id,
    p_status,
    p_current_period_end,
    now()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    stripe_customer_id = EXCLUDED.stripe_customer_id,
    stripe_subscription_id = EXCLUDED.stripe_subscription_id,
    status = EXCLUDED.status,
    current_period_end = EXCLUDED.current_period_end,
    updated_at = now();
END;
$$;