import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import blogEvaluation from "@/assets/blog-evaluation-entreprise.jpg";
import blogAcheter from "@/assets/blog-acheter-entreprise.jpg";
import blogFinancement from "@/assets/blog-financement.jpg";
import blogDueDiligence from "@/assets/blog-due-diligence.jpg";
import blogTendances from "@/assets/blog-tendances-2025.jpg";
import blogPreparer from "@/assets/blog-preparer-vente.jpg";

interface BlogPostData {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  read_time: string;
  category: string;
  image: string;
  content: string;
}

const imageMap: Record<string, string> = {
  "/src/assets/blog-preparer-vente.jpg": blogPreparer,
  "/src/assets/blog-acheter-entreprise.jpg": blogAcheter,
  "/src/assets/blog-evaluation-entreprise.jpg": blogEvaluation,
  "/src/assets/blog-financement.jpg": blogFinancement,
  "/src/assets/blog-due-diligence.jpg": blogDueDiligence,
  "/src/assets/blog-tendances-2025.jpg": blogTendances,
};

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPostData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  const fetchPost = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPost({
          ...data,
          image: imageMap[data.image] || data.image
        });
      }
    } catch (error) {
      console.error('Error fetching blog post:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Chargement de l'article...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Article non trouvé</h1>
          <Button onClick={() => navigate("/blog")}>Retour au blog</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={`${post.title} | Blog Vente.Club`}
        description={post.excerpt}
        keywords={`${post.category}, achat entreprise Québec, vente PME`}
        canonical={`/blog/${post.slug}`}
        type="article"
      />

      {/* Hero Image */}
      <section className="relative h-[40vh] md:h-[50vh] min-h-[300px] max-h-[500px] overflow-hidden bg-muted">
        <img 
          src={post.image} 
          alt={post.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </section>

      {/* Article Content */}
      <article className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* Back Button */}
            <Button
              variant="ghost"
              onClick={() => navigate('/blog')}
              className="mb-6 -ml-2 hover:bg-muted"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au blog
            </Button>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-2 text-sm mb-4">
              <Badge variant="secondary" className="font-medium">
                {post.category}
              </Badge>
              <span className="text-muted-foreground">•</span>
              <time className="text-muted-foreground">
                {new Date(post.date).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </time>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{post.read_time}</span>
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 leading-tight tracking-tight">
              {post.title}
            </h1>

            {/* Excerpt */}
            <p className="text-lg md:text-xl text-muted-foreground mb-6 md:mb-8 leading-relaxed">
              {post.excerpt}
            </p>

            {/* Divider */}
            <div className="border-t mb-6 md:mb-8" />

            {/* Content */}
            <div 
              className="prose prose-base md:prose-lg max-w-none
                prose-headings:font-bold prose-headings:tracking-tight prose-headings:scroll-mt-20
                prose-h1:text-3xl prose-h1:md:text-4xl prose-h1:mt-12 prose-h1:mb-6
                prose-h2:text-2xl prose-h2:md:text-3xl prose-h2:mt-10 prose-h2:mb-4
                prose-h3:text-xl prose-h3:md:text-2xl prose-h3:mt-8 prose-h3:mb-3
                prose-p:text-base prose-p:md:text-lg prose-p:leading-relaxed prose-p:mb-4 prose-p:text-foreground/90
                prose-ul:my-6 prose-ul:space-y-2 prose-ul:list-disc prose-ul:pl-6
                prose-ol:my-6 prose-ol:space-y-2 prose-ol:list-decimal prose-ol:pl-6
                prose-li:text-base prose-li:md:text-lg prose-li:leading-relaxed
                prose-strong:font-semibold prose-strong:text-foreground
                prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline prose-a:transition-colors
                prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-6 prose-blockquote:py-2 prose-blockquote:italic prose-blockquote:text-muted-foreground
                prose-code:bg-muted prose-code:px-2 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:text-foreground
                prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-pre:border
                prose-img:rounded-lg prose-img:shadow-md prose-img:my-8
                prose-hr:border-border prose-hr:my-8"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* CTA Section */}
            <div className="mt-12 md:mt-16 p-6 md:p-8 bg-gradient-to-br from-primary/5 via-background to-secondary/5 rounded-lg border">
              <h3 className="text-xl md:text-2xl font-bold mb-3 text-center">
                Prêt à franchir le cap ?
              </h3>
              <p className="text-center text-muted-foreground mb-6 leading-relaxed">
                Découvrez nos opportunités d'achat ou vendez votre entreprise
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={() => navigate('/list-business')} className="font-semibold">
                  Vendre mon entreprise
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/')} className="font-semibold">
                  Explorer les opportunités
                </Button>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-8 md:mt-12 p-4 md:p-6 bg-muted/20 rounded-lg border-l-4 border-primary">
              <div className="flex items-start gap-3">
                <div className="space-y-2">
                  <h4 className="font-semibold text-base">Avertissement Important</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Cet article est fourni à titre informatif uniquement et ne constitue pas un conseil juridique, 
                    financier ou professionnel. Consultez toujours des professionnels compétents avant de prendre 
                    toute décision d'achat ou de vente d'entreprise.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
};

export default BlogPost;
