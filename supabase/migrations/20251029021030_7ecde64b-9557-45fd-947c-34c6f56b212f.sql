-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Update businesses table to add approval status
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Update existing businesses to be approved
UPDATE public.businesses SET approval_status = 'approved' WHERE approval_status IS NULL;

-- Update RLS policy for viewing businesses
DROP POLICY IF EXISTS "Anyone can view active businesses" ON public.businesses;

CREATE POLICY "Anyone can view approved active businesses"
ON public.businesses
FOR SELECT
USING (status = 'active' AND approval_status = 'approved');

CREATE POLICY "Admins can view all businesses"
ON public.businesses
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update any business
CREATE POLICY "Admins can update any business"
ON public.businesses
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete any business
CREATE POLICY "Admins can delete any business"
ON public.businesses
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));