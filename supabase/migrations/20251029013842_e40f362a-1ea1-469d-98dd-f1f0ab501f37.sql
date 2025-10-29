-- Create table for featured listing payments
CREATE TABLE IF NOT EXISTS public.featured_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 20.00,
  currency TEXT NOT NULL DEFAULT 'CAD',
  payment_status TEXT NOT NULL DEFAULT 'completed',
  featured_until TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on featured_payments
ALTER TABLE public.featured_payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "Users can view their own featured payments"
ON public.featured_payments
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own payments
CREATE POLICY "Users can create their own featured payments"
ON public.featured_payments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add index for faster queries
CREATE INDEX idx_featured_payments_business ON public.featured_payments(business_id);
CREATE INDEX idx_featured_payments_featured_until ON public.featured_payments(featured_until);

-- Function to check if business is currently featured
CREATE OR REPLACE FUNCTION public.is_business_featured(business_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM featured_payments
    WHERE business_id = business_uuid
    AND featured_until > now()
    AND payment_status = 'completed'
  );
END;
$$;