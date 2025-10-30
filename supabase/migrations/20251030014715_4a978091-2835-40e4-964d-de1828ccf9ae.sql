-- Enable pg_cron and pg_net extensions for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Create a function to invoke the edge function
CREATE OR REPLACE FUNCTION public.trigger_auto_blog_generation()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://xmwsrvaricrfxovimffm.supabase.co/functions/v1/auto-generate-blog',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhtd3NydmFyaWNyZnhvdmltZmZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NzM1MzIsImV4cCI6MjA3NzI0OTUzMn0.gPdff8LWEptfxiiNUrPnWjUPRGDSWLlki83FYtNsSAM'
    ),
    body := '{}'::jsonb
  );
END;
$$;

-- Schedule the function to run twice a day (9 AM and 5 PM Eastern Time)
-- 9 AM ET = 14:00 UTC (adjust for daylight saving if needed)
-- 5 PM ET = 22:00 UTC
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