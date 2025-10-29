-- Create favorites table
CREATE TABLE IF NOT EXISTS public.business_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, business_id)
);

-- Enable RLS
ALTER TABLE public.business_favorites ENABLE ROW LEVEL SECURITY;

-- RLS policies for favorites
CREATE POLICY "Users can view their own favorites"
  ON public.business_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON public.business_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their favorites"
  ON public.business_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('price_drop', 'sold', 'high_views', 'new_photos')),
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to create notification for price drops
CREATE OR REPLACE FUNCTION notify_price_drop()
RETURNS TRIGGER AS $$
BEGIN
  -- Only if price decreased
  IF NEW.asking_price < OLD.asking_price THEN
    INSERT INTO notifications (user_id, business_id, type, message)
    SELECT 
      bf.user_id,
      NEW.id,
      'price_drop',
      'Le prix de "' || NEW.title || '" a diminué de ' || 
      ROUND((OLD.asking_price - NEW.asking_price)::numeric, 2) || ' $'
    FROM business_favorites bf
    WHERE bf.business_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to notify when business is sold
CREATE OR REPLACE FUNCTION notify_business_sold()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'sold' AND OLD.status != 'sold' THEN
    INSERT INTO notifications (user_id, business_id, type, message)
    SELECT 
      bf.user_id,
      NEW.id,
      'sold',
      'L''entreprise "' || NEW.title || '" a été vendue'
    FROM business_favorites bf
    WHERE bf.business_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to notify for high views
CREATE OR REPLACE FUNCTION notify_high_views()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify at milestones: 100, 500, 1000 views
  IF (NEW.views_count >= 100 AND OLD.views_count < 100) OR
     (NEW.views_count >= 500 AND OLD.views_count < 500) OR
     (NEW.views_count >= 1000 AND OLD.views_count < 1000) THEN
    INSERT INTO notifications (user_id, business_id, type, message)
    SELECT 
      bf.user_id,
      NEW.id,
      'high_views',
      'L''annonce "' || NEW.title || '" a atteint ' || NEW.views_count || ' vues!'
    FROM business_favorites bf
    WHERE bf.business_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create triggers
CREATE TRIGGER trigger_price_drop
  AFTER UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION notify_price_drop();

CREATE TRIGGER trigger_business_sold
  AFTER UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION notify_business_sold();

CREATE TRIGGER trigger_high_views
  AFTER UPDATE ON businesses
  FOR EACH ROW
  EXECUTE FUNCTION notify_high_views();