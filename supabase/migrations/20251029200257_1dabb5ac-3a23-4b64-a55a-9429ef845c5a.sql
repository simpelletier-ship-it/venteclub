-- Create blog_posts table
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  image TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  read_time TEXT NOT NULL DEFAULT '5 min',
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view published posts
CREATE POLICY "Anyone can view published blog posts"
ON public.blog_posts
FOR SELECT
USING (published = true);

-- Policy: Admins can view all posts
CREATE POLICY "Admins can view all blog posts"
ON public.blog_posts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Admins can insert posts
CREATE POLICY "Admins can insert blog posts"
ON public.blog_posts
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Admins can update posts
CREATE POLICY "Admins can update blog posts"
ON public.blog_posts
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Admins can delete posts
CREATE POLICY "Admins can delete blog posts"
ON public.blog_posts
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert existing blog posts
INSERT INTO public.blog_posts (slug, title, excerpt, content, category, image, date, read_time) VALUES
(
  'guide-complet-vendre-entreprise-quebec',
  'Guide Complet pour Vendre Votre Entreprise au Québec en 2025',
  'Découvrez les 10 étapes essentielles pour vendre votre entreprise avec succès au Québec.',
  '<h2>Introduction</h2><p>Vendre son entreprise est une décision majeure qui nécessite une préparation minutieuse...</p>',
  'Guide Vendeur',
  '/src/assets/blog-preparer-vente.jpg',
  '2025-01-15',
  '8 min'
),
(
  'acheter-premiere-entreprise-conseils',
  'Acheter sa Première Entreprise : 7 Conseils d''Experts',
  'Conseils pratiques pour réussir l''achat de votre première entreprise au Québec.',
  '<h2>Introduction</h2><p>Acheter sa première entreprise est excitant...</p>',
  'Guide Acheteur',
  '/src/assets/blog-acheter-entreprise.jpg',
  '2025-01-10',
  '6 min'
);
