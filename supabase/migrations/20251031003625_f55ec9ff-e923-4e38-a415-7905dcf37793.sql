-- Create business analytics table to track views and interactions
CREATE TABLE IF NOT EXISTS public.business_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'contact_unlock', 'favorite', 'click')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create index for better query performance
CREATE INDEX idx_business_analytics_business_id ON public.business_analytics(business_id);
CREATE INDEX idx_business_analytics_created_at ON public.business_analytics(created_at);
CREATE INDEX idx_business_analytics_event_type ON public.business_analytics(event_type);

-- Enable RLS
ALTER TABLE public.business_analytics ENABLE ROW LEVEL SECURITY;

-- Policy for sellers to view their own business analytics
CREATE POLICY "Sellers can view analytics for their businesses"
ON public.business_analytics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.businesses
    WHERE businesses.id = business_analytics.business_id
    AND businesses.seller_id = auth.uid()
  )
);

-- Policy for anyone to insert analytics (for tracking)
CREATE POLICY "Anyone can insert analytics"
ON public.business_analytics
FOR INSERT
WITH CHECK (true);

-- Function to increment views_count when analytics are tracked
CREATE OR REPLACE FUNCTION increment_business_views()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.event_type = 'view' THEN
    UPDATE public.businesses
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id = NEW.business_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update views_count
CREATE TRIGGER trigger_increment_business_views
AFTER INSERT ON public.business_analytics
FOR EACH ROW
EXECUTE FUNCTION increment_business_views();