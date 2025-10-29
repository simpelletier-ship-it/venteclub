-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create trigger to auto-create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name')
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create businesses table
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  industry TEXT NOT NULL,
  location TEXT NOT NULL,
  annual_revenue DECIMAL(15,2),
  asking_price DECIMAL(15,2) NOT NULL,
  profit_margin DECIMAL(5,2),
  employees_count INTEGER,
  year_established INTEGER,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'pending', 'draft')),
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Businesses policies
CREATE POLICY "Anyone can view active businesses"
  ON public.businesses FOR SELECT
  USING (status = 'active');

CREATE POLICY "Sellers can view their own businesses"
  ON public.businesses FOR SELECT
  USING (auth.uid() = seller_id);

CREATE POLICY "Authenticated users can create businesses"
  ON public.businesses FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own businesses"
  ON public.businesses FOR UPDATE
  USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their own businesses"
  ON public.businesses FOR DELETE
  USING (auth.uid() = seller_id);

-- Create subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  credits INTEGER NOT NULL,
  duration_days INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans"
  ON public.subscription_plans FOR SELECT
  USING (is_active = true);

-- Insert default plans
INSERT INTO public.subscription_plans (name, description, price, credits, duration_days) VALUES
  ('Starter', 'Accédez aux informations de 3 entreprises', 29.99, 3, 30),
  ('Pro', 'Accédez aux informations de 10 entreprises', 79.99, 10, 30),
  ('Premium', 'Accédez aux informations de 50 entreprises', 299.99, 50, 90);

-- Create user subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  credits_remaining INTEGER NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Create business inquiries table (tracks who accessed seller info)
CREATE TABLE public.business_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, buyer_id)
);

ALTER TABLE public.business_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view their own inquiries"
  ON public.business_inquiries FOR SELECT
  USING (auth.uid() = buyer_id);

CREATE POLICY "Authenticated users can create inquiries"
  ON public.business_inquiries FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- Function to check if user can access seller info
CREATE OR REPLACE FUNCTION public.can_access_seller_info(business_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  is_seller BOOLEAN;
  has_inquiry BOOLEAN;
BEGIN
  -- Check if user is the seller
  SELECT EXISTS(
    SELECT 1 FROM businesses
    WHERE id = business_uuid AND seller_id = auth.uid()
  ) INTO is_seller;
  
  IF is_seller THEN
    RETURN true;
  END IF;
  
  -- Check if user has already paid for access
  SELECT EXISTS(
    SELECT 1 FROM business_inquiries
    WHERE business_id = business_uuid AND buyer_id = auth.uid()
  ) INTO has_inquiry;
  
  RETURN has_inquiry;
END;
$$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();