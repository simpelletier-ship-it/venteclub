import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import blogEvaluation from "@/assets/blog-evaluation-entreprise.jpg";
import blogAcheter from "@/assets/blog-acheter-entreprise.jpg";
import blogFinancement from "@/assets/blog-financement.jpg";
import blogDueDiligence from "@/assets/blog-due-diligence.jpg";
import blogTendances from "@/assets/blog-tendances-2025.jpg";
import blogPreparer from "@/assets/blog-preparer-vente.jpg";
import blog10Choses from "@/assets/blog-10-choses-vente.jpg";
import blogEvaluationRealiste from "@/assets/blog-evaluation-realiste.jpg";
import blogConseillerJuridique from "@/assets/blog-conseiller-juridique.jpg";
import blogPlanificationFiscale from "@/assets/blog-planification-fiscale.jpg";

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
  "/src/assets/blog-10-choses-vente.jpg": blog10Choses,
  "/src/assets/blog-evaluation-realiste.jpg": blogEvaluationRealiste,
  "/src/assets/blog-conseiller-juridique.jpg": blogConseillerJuridique,
  "/src/assets/blog-planification-fiscale.jpg": blogPlanificationFiscale,
  "/blog-acquisition.jpg": blogAcheter,
  "/blog-vente.jpg": blogPreparer,
  "/blog-finance.jpg": blogFinancement,
  "/blog-franchises.jpg": blogDueDiligence,
  "/blog-tendances.jpg": blogTendances,
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
    <Layout>
      <SEO 
        title={`${post.title} | Vente.club`}
        description={post.excerpt}
        ogImage={post.image}
        type="article"
        keywords={`${post.category}, entreprise Québec, entrepreneur québécois, vente entreprise, achat entreprise, PME Québec, franchise Québec, ${post.title.toLowerCase()}`}
        canonical={`/blog/${post.slug}`}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": post.title,
          "description": post.excerpt,
          "image": post.image,
          "datePublished": post.date,
          "dateModified": post.date,
          "author": {
            "@type": "Organization",
            "name": "Vente.club"
          },
          "publisher": {
            "@type": "Organization",
            "name": "Vente.club",
            "logo": {
              "@type": "ImageObject",
              "url": "https://vente.club/logo.png"
            }
          },
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `https://vente.club/blog/${post.slug}`
          },
          "articleSection": post.category,
          "wordCount": post.content.split(/\s+/).length,
          "inLanguage": "fr-CA"
        }}
      />

      {/* Hero Image with Gradient Overlay */}
      <div className="relative w-full h-[400px] lg:h-[500px] overflow-hidden bg-muted">
        <img
          src={post.image}
          alt={post.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/50 to-transparent" />
      </div>

      {/* Article Content */}
      <article className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb Navigation */}
            <nav className="text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2 flex-wrap">
                <li>
                  <button onClick={() => navigate('/')} className="hover:text-primary transition-colors">
                    Accueil
                  </button>
                </li>
                <li>/</li>
                <li>
                  <button onClick={() => navigate('/blog')} className="hover:text-primary transition-colors">
                    Blog
                  </button>
                </li>
                <li>/</li>
                <li className="text-foreground font-medium truncate max-w-[200px] md:max-w-none">
                  {post.title}
                </li>
              </ol>
            </nav>

            {/* Article Header */}
            <header className="mb-12">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <Badge variant="secondary" className="text-sm px-4 py-1.5 font-medium">
                  {post.category}
                </Badge>
                <div className="flex items-center text-muted-foreground text-sm gap-4 flex-wrap">
                  <time className="flex items-center gap-2" dateTime={post.date}>
                    <Calendar className="h-4 w-4" />
                    {new Date(post.date).toLocaleDateString('fr-CA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </time>
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {post.read_time} de lecture
                  </span>
                </div>
              </div>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                {post.title}
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed border-l-4 border-primary pl-6 py-2">
                {post.excerpt}
              </p>
            </header>

            {/* Divider */}
            <div className="border-t mb-8 md:mb-10" />

            {/* Article Content with Enhanced SEO Styling */}
            <div 
              className="prose prose-lg lg:prose-xl max-w-none
                prose-headings:font-bold prose-headings:text-foreground prose-headings:scroll-mt-20
                prose-h2:text-2xl prose-h2:md:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:pb-3 prose-h2:border-b-2 prose-h2:border-primary/20
                prose-h3:text-xl prose-h3:md:text-2xl prose-h3:mt-8 prose-h3:mb-4
                prose-h4:text-lg prose-h4:md:text-xl prose-h4:mt-6 prose-h4:mb-3
                prose-p:text-base prose-p:md:text-lg prose-p:text-foreground/90 prose-p:leading-relaxed prose-p:mb-6
                prose-strong:text-foreground prose-strong:font-semibold
                prose-ul:my-6 prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-2
                prose-ol:my-6 prose-ol:list-decimal prose-ol:pl-6 prose-ol:space-y-2
                prose-li:text-base prose-li:md:text-lg prose-li:text-foreground/90 prose-li:leading-relaxed
                prose-blockquote:border-l-4 prose-blockquote:border-primary 
                prose-blockquote:pl-6 prose-blockquote:py-4 prose-blockquote:my-8
                prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-lg
                prose-blockquote:italic prose-blockquote:text-base prose-blockquote:md:text-lg
                prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline prose-a:transition-colors
                prose-code:bg-muted prose-code:px-2 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                prose-img:rounded-lg prose-img:shadow-lg prose-img:my-8
                dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Author/CTA Section */}
            <div className="mt-12 md:mt-16 p-6 md:p-8 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl border border-primary/20">
              <h3 className="text-xl md:text-2xl font-bold mb-4">Prêt à passer à l'action?</h3>
              <p className="text-muted-foreground mb-6 text-base md:text-lg leading-relaxed">
                Explorez des centaines d'opportunités d'affaires au Québec et trouvez l'entreprise parfaite pour vous, 
                ou vendez votre entreprise à des acheteurs qualifiés.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" onClick={() => navigate('/')} className="font-semibold">
                  Explorer les entreprises
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/list-business')} className="font-semibold">
                  Vendre votre entreprise
                </Button>
              </div>
            </div>

            {/* Important Disclaimer */}
            <div className="mt-8 md:mt-10 p-4 md:p-6 bg-muted/50 rounded-xl border border-border">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm md:text-base">Information importante</h4>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                    Cet article est fourni à titre informatif uniquement. 
                    Consultez toujours des professionnels qualifiés (avocats, comptables, conseillers financiers) 
                    avant de prendre des décisions d'affaires importantes concernant l'achat ou la vente d'une entreprise au Québec.
                  </p>
                </div>
              </div>
            </div>

            {/* Back to Blog */}
            <div className="mt-10 md:mt-12 text-center">
              <Button variant="ghost" onClick={() => navigate('/blog')} className="gap-2 hover:bg-muted">
                <ArrowLeft className="h-4 w-4" />
                Retour au blog
              </Button>
            </div>
          </div>
        </div>
      </article>
    </Layout>
  );
};

export default BlogPost;
