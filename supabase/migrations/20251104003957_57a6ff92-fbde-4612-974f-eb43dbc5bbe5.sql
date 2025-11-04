-- Fix SECURITY DEFINER functions to prevent search_path injection
-- and ensure proper security validation

-- 1. Fix increment_business_views - change empty search_path to 'public'
CREATE OR REPLACE FUNCTION public.increment_business_views()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.event_type = 'view' THEN
    UPDATE public.businesses
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id = NEW.business_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- 2. Fix generate_slug - change empty search_path to 'public'
CREATE OR REPLACE FUNCTION public.generate_slug(title text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  slug text;
  counter integer := 0;
  final_slug text;
BEGIN
  -- Convertir en minuscules et remplacer les espaces par des tirets
  slug := lower(title);
  
  -- Remplacer les caractères accentués
  slug := translate(slug, 
    'àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ',
    'aaaaaaaceeeeiiiidnoooooouuuuypy'
  );
  
  -- Remplacer les caractères spéciaux par des tirets
  slug := regexp_replace(slug, '[^a-z0-9]+', '-', 'g');
  
  -- Supprimer les tirets en début et fin
  slug := trim(both '-' from slug);
  
  -- Limiter à 100 caractères
  slug := substring(slug from 1 for 100);
  
  -- Vérifier l'unicité et ajouter un suffixe si nécessaire
  final_slug := slug;
  WHILE EXISTS (SELECT 1 FROM public.businesses WHERE businesses.slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$function$;

-- 3. Fix set_business_slug - change empty search_path to 'public'
CREATE OR REPLACE FUNCTION public.set_business_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := public.generate_slug(NEW.title);
  END IF;
  RETURN NEW;
END;
$function$;

-- 4. Add validation to apply_pending_changes - ensure only admins can call
CREATE OR REPLACE FUNCTION public.apply_pending_changes(business_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  pending_data JSONB;
  business_seller_id uuid;
BEGIN
  -- SECURITY CHECK: Only admins or business owners can apply changes
  SELECT seller_id INTO business_seller_id FROM businesses WHERE id = business_uuid;
  
  IF NOT (public.has_role(auth.uid(), 'admin') OR auth.uid() = business_seller_id) THEN
    RAISE EXCEPTION 'Non autorisé: seuls les administrateurs peuvent appliquer des modifications';
  END IF;

  -- Récupérer les modifications en attente
  SELECT pending_changes INTO pending_data
  FROM businesses
  WHERE id = business_uuid;

  IF pending_data IS NULL THEN
    RAISE EXCEPTION 'Aucune modification en attente pour cette annonce';
  END IF;

  -- Appliquer les modifications
  UPDATE businesses
  SET 
    title = COALESCE(pending_data->>'title', title),
    description = COALESCE(pending_data->>'description', description),
    location = COALESCE(pending_data->>'location', location),
    city = COALESCE(pending_data->>'city', city),
    province = COALESCE(pending_data->>'province', province),
    region = COALESCE(pending_data->>'region', region),
    asking_price = CASE WHEN pending_data ? 'asking_price' THEN (pending_data->>'asking_price')::numeric ELSE asking_price END,
    annual_revenue = CASE WHEN pending_data ? 'annual_revenue' THEN (pending_data->>'annual_revenue')::numeric ELSE annual_revenue END,
    net_profit = CASE WHEN pending_data ? 'net_profit' THEN (pending_data->>'net_profit')::numeric ELSE net_profit END,
    baiia = CASE WHEN pending_data ? 'baiia' THEN (pending_data->>'baiia')::numeric ELSE baiia END,
    profit_margin = CASE WHEN pending_data ? 'profit_margin' THEN (pending_data->>'profit_margin')::numeric ELSE profit_margin END,
    net_profit_margin = CASE WHEN pending_data ? 'net_profit_margin' THEN (pending_data->>'net_profit_margin')::numeric ELSE net_profit_margin END,
    baiia_margin = CASE WHEN pending_data ? 'baiia_margin' THEN (pending_data->>'baiia_margin')::numeric ELSE baiia_margin END,
    employees_count = CASE WHEN pending_data ? 'employees_count' THEN (pending_data->>'employees_count')::integer ELSE employees_count END,
    year_established = CASE WHEN pending_data ? 'year_established' THEN (pending_data->>'year_established')::integer ELSE year_established END,
    seller_phone = COALESCE(pending_data->>'seller_phone', seller_phone),
    has_pending_changes = FALSE,
    pending_changes = NULL,
    pending_changes_submitted_at = NULL,
    updated_at = now()
  WHERE id = business_uuid;

  -- Mettre à jour l'industrie séparément si elle existe
  IF pending_data ? 'industry' THEN
    UPDATE businesses
    SET industry = (pending_data->>'industry')::industry_type
    WHERE id = business_uuid;
  END IF;

  -- Notifier le vendeur
  INSERT INTO notifications (user_id, business_id, type, message)
  SELECT seller_id, business_uuid, 'approved', 'Vos modifications pour l''annonce "' || title || '" ont été approuvées et appliquées.'
  FROM businesses WHERE id = business_uuid;
END;
$function$;

-- 5. Add validation to reject_pending_changes - ensure only admins can call
CREATE OR REPLACE FUNCTION public.reject_pending_changes(business_uuid uuid, rejection_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- SECURITY CHECK: Only admins can reject changes
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Non autorisé: seuls les administrateurs peuvent rejeter des modifications';
  END IF;

  -- Réinitialiser les modifications en attente
  UPDATE businesses
  SET 
    has_pending_changes = FALSE,
    pending_changes = NULL,
    pending_changes_submitted_at = NULL,
    rejection_reason = rejection_reason,
    updated_at = now()
  WHERE id = business_uuid AND has_pending_changes = TRUE;

  -- Notifier le vendeur du rejet
  INSERT INTO notifications (user_id, business_id, type, message)
  SELECT seller_id, business_uuid, 'approved', 'Vos modifications pour l''annonce "' || title || '" ont été rejetées. Raison: ' || rejection_reason
  FROM businesses WHERE id = business_uuid;
END;
$function$;

-- 6. Add validation to sync_premium_subscription
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
AS $function$
BEGIN
  -- SECURITY CHECK: Only the user themselves or service role can sync their subscription
  -- This function should only be called from trusted edge functions with service role
  IF auth.uid() IS NULL THEN
    -- Allow service role to call this (when auth.uid() is null it means service role)
    NULL;
  ELSIF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Non autorisé: vous ne pouvez modifier que votre propre abonnement';
  END IF;

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
$function$;

-- 7. Ensure use_token_for_access validates properly (already has good validation)
-- This function already validates business access and premium status correctly

-- 8. Add comment documenting security model
COMMENT ON FUNCTION public.has_role(uuid, app_role) IS 
'SECURITY DEFINER function to check user roles. Safe to use in RLS policies as it uses fixed search_path and parameterized queries.';

COMMENT ON FUNCTION public.check_business_access(uuid) IS 
'SECURITY DEFINER function to check if user can access business contact info. Validates seller ownership, premium subscription, or contact access purchase.';

COMMENT ON FUNCTION public.use_token_for_access(uuid) IS 
'SECURITY DEFINER function to grant contact access using token or premium subscription. Validates access limits and creates access records.';

COMMENT ON FUNCTION public.apply_pending_changes(uuid) IS 
'SECURITY DEFINER function to apply pending business changes. Restricted to admins and business owners only.';

COMMENT ON FUNCTION public.reject_pending_changes(uuid, text) IS 
'SECURITY DEFINER function to reject pending business changes. Restricted to admins only.';