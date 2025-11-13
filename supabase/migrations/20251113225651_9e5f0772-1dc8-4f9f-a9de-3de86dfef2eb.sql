-- Table pour stocker le sitemap généré avec cache
CREATE TABLE IF NOT EXISTS public.sitemap_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  xml_content TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  entry_count INTEGER NOT NULL DEFAULT 0
);

-- Table pour tracker les régénérations
CREATE TABLE IF NOT EXISTS public.sitemap_generation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_source TEXT NOT NULL, -- 'manual', 'business_update', 'blog_update', 'scheduled'
  entry_count INTEGER NOT NULL,
  generation_time_ms INTEGER NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_sitemap_cache_generated_at ON public.sitemap_cache(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_sitemap_log_generated_at ON public.sitemap_generation_log(generated_at DESC);

-- RLS policies (public read, admin write)
ALTER TABLE public.sitemap_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sitemap_generation_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read sitemap cache"
ON public.sitemap_cache FOR SELECT
USING (true);

CREATE POLICY "Service role can insert sitemap cache"
ON public.sitemap_cache FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service role can update sitemap cache"
ON public.sitemap_cache FOR UPDATE
USING (true);

CREATE POLICY "Admins can read generation log"
ON public.sitemap_generation_log FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR auth.uid() IS NULL);

CREATE POLICY "Service role can insert generation log"
ON public.sitemap_generation_log FOR INSERT
WITH CHECK (true);

-- Fonction pour déclencher la régénération du sitemap (avec rate limiting)
CREATE OR REPLACE FUNCTION public.trigger_sitemap_regeneration(p_source TEXT DEFAULT 'manual')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_last_generation TIMESTAMP WITH TIME ZONE;
  v_time_since_last INTEGER;
BEGIN
  -- Vérifier la dernière génération
  SELECT generated_at INTO v_last_generation
  FROM sitemap_cache
  ORDER BY generated_at DESC
  LIMIT 1;

  -- Calculer le temps écoulé en secondes
  IF v_last_generation IS NOT NULL THEN
    v_time_since_last := EXTRACT(EPOCH FROM (now() - v_last_generation))::INTEGER;
    
    -- Rate limiting: ne régénérer que si plus de 5 minutes se sont écoulées
    -- (sauf si c'est une régénération manuelle)
    IF v_time_since_last < 300 AND p_source != 'manual' THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Sitemap récemment régénéré',
        'seconds_until_next', 300 - v_time_since_last,
        'last_generation', v_last_generation
      );
    END IF;
  END IF;

  -- Appeler l'edge function pour régénérer le sitemap
  PERFORM extensions.http_post(
    url := 'https://xmwsrvaricrfxovimffm.supabase.co/functions/v1/generate-sitemap',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhtd3NydmFyaWNyZnhvdmltZmZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NzM1MzIsImV4cCI6MjA3NzI0OTUzMn0.gPdff8LWEptfxiiNUrPnWjUPRGDSWLlki83FYtNsSAM'
    ),
    body := jsonb_build_object('source', p_source)
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Sitemap regeneration triggered',
    'source', p_source
  );
END;
$$;

-- Trigger pour régénérer automatiquement lors de changements sur businesses
CREATE OR REPLACE FUNCTION public.auto_regenerate_sitemap_on_business()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Régénérer uniquement si le business est approuvé et actif
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    IF NEW.approval_status = 'approved' AND NEW.status = 'active' THEN
      PERFORM trigger_sitemap_regeneration('business_update');
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.approval_status = 'approved' AND OLD.status = 'active' THEN
      PERFORM trigger_sitemap_regeneration('business_update');
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger pour régénérer automatiquement lors de changements sur blog posts
CREATE OR REPLACE FUNCTION public.auto_regenerate_sitemap_on_blog()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Régénérer uniquement si le post est publié
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    IF NEW.published = true THEN
      PERFORM trigger_sitemap_regeneration('blog_update');
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.published = true THEN
      PERFORM trigger_sitemap_regeneration('blog_update');
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Créer les triggers
DROP TRIGGER IF EXISTS trigger_sitemap_on_business ON public.businesses;
CREATE TRIGGER trigger_sitemap_on_business
AFTER INSERT OR UPDATE OR DELETE ON public.businesses
FOR EACH ROW
EXECUTE FUNCTION auto_regenerate_sitemap_on_business();

DROP TRIGGER IF EXISTS trigger_sitemap_on_blog ON public.blog_posts;
CREATE TRIGGER trigger_sitemap_on_blog
AFTER INSERT OR UPDATE OR DELETE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION auto_regenerate_sitemap_on_blog();