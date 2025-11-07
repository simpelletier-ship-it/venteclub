-- Fonction publique pour obtenir le nombre total de profils
CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS TABLE(
  total_users bigint,
  total_businesses bigint,
  total_views bigint,
  total_value numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM profiles)::bigint as total_users,
    (SELECT COUNT(*) FROM businesses WHERE status = 'active' AND approval_status = 'approved')::bigint as total_businesses,
    (SELECT COALESCE(SUM(views_count), 0) FROM businesses WHERE status = 'active' AND approval_status = 'approved')::bigint as total_views,
    (SELECT COALESCE(SUM(asking_price), 0) FROM businesses WHERE status = 'active' AND approval_status = 'approved')::numeric as total_value;
END;
$$;