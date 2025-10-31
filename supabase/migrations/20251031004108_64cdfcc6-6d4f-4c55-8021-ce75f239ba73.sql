-- Update business_analytics event_type constraint to include 'lead'
ALTER TABLE public.business_analytics DROP CONSTRAINT IF EXISTS business_analytics_event_type_check;

ALTER TABLE public.business_analytics 
ADD CONSTRAINT business_analytics_event_type_check 
CHECK (event_type IN ('view', 'contact_unlock', 'favorite', 'click', 'lead'));