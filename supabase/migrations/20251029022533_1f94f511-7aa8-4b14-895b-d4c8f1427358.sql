-- Change default approval status back to 'pending'
ALTER TABLE public.businesses 
ALTER COLUMN approval_status SET DEFAULT 'pending';

-- Add rejection reason column
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Update businesses table comment
COMMENT ON COLUMN public.businesses.rejection_reason IS 'Reason provided by admin when rejecting a business listing';