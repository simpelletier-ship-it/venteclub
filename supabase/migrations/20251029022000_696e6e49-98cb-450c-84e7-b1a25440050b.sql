-- Change default approval status to 'approved' so new listings are immediately visible
ALTER TABLE public.businesses 
ALTER COLUMN approval_status SET DEFAULT 'approved';

-- Update any pending businesses to approved (one-time migration)
UPDATE public.businesses 
SET approval_status = 'approved' 
WHERE approval_status = 'pending';