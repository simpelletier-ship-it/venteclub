-- Create indexes to improve query performance for businesses table
CREATE INDEX IF NOT EXISTS idx_businesses_status_approval ON public.businesses(status, approval_status) WHERE status IN ('active', 'sold') AND approval_status = 'approved';
CREATE INDEX IF NOT EXISTS idx_businesses_featured ON public.businesses(featured) WHERE featured = true AND status = 'active';
CREATE INDEX IF NOT EXISTS idx_businesses_city ON public.businesses(city) WHERE city IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_businesses_industry ON public.businesses(industry);
CREATE INDEX IF NOT EXISTS idx_businesses_created_at ON public.businesses(created_at DESC);

-- Create index for seller_contacts
CREATE INDEX IF NOT EXISTS idx_seller_contacts_seller_id ON public.seller_contacts(seller_id);

-- Create index for business_favorites to speed up favorite checks
CREATE INDEX IF NOT EXISTS idx_business_favorites_user_business ON public.business_favorites(user_id, business_id);