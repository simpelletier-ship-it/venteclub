-- Fix security issues from previous migration

-- 1. Drop and recreate extensions in proper schema
DROP EXTENSION IF EXISTS pg_cron CASCADE;
DROP EXTENSION IF EXISTS pg_net CASCADE;

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 2. Recreate the function with proper search_path
DROP FUNCTION IF EXISTS public.trigger_auto_blog_generation();

CREATE OR REPLACE FUNCTION public.trigger_auto_blog_generation()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  PERFORM extensions.http_post(
    url := 'https://xmwsrvaricrfxovimffm.supabase.co/functions/v1/auto-generate-blog',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhtd3NydmFyaWNyZnhvdmltZmZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NzM1MzIsImV4cCI6MjA3NzI0OTUzMn0.gPdff8LWEptfxiiNUrPnWjUPRGDSWLlki83FYtNsSAM'
    ),
    body := '{}'::jsonb
  );
END;
$$;

-- 3. Reschedule cron jobs (they were dropped with CASCADE)
SELECT cron.schedule(
  'auto-generate-blog-morning',
  '0 14 * * *',
  'SELECT public.trigger_auto_blog_generation();'
);

SELECT cron.schedule(
  'auto-generate-blog-evening',
  '0 22 * * *',
  'SELECT public.trigger_auto_blog_generation();'
);