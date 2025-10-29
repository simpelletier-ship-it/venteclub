import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
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
      <div className="relative w-full h-[400px] overflow-hidden">
        <img 
          src={post.image} 
          alt={post.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Content */}
      <article className="container mx-auto px-4 -mt-32 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-2xl shadow-xl p-8 md:p-12">
            {/* Back Button */}
            <Button 
              variant="ghost" 
              onClick={() => navigate("/blog")}
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au blog
            </Button>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <span className="text-sm font-semibold text-accent">
                {post.category}
              </span>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {new Date(post.date).toLocaleDateString('fr-CA', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {post.read_time} de lecture
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              {post.title}
            </h1>

            {/* Excerpt */}
            <p className="text-xl text-muted-foreground mb-8 pb-8 border-b border-border">
              {post.excerpt}
            </p>

            {/* Content */}
            <div 
              className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-accent prose-strong:text-foreground prose-ul:text-muted-foreground prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-3"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* CTA */}
            <div className="mt-12 pt-8 border-t border-border">
              <div className="bg-gradient-to-br from-accent/10 to-primary/10 rounded-xl p-8 text-center">
                <h3 className="text-2xl font-bold mb-4">
                  Prêt à Passer à l'Action?
                </h3>
                <p className="text-muted-foreground mb-6">
                  Découvrez les opportunités d'affaires disponibles au Québec
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" onClick={() => navigate("/")} className="bg-accent hover:bg-accent/90">
                    Voir les Entreprises
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate("/list-business")}>
                    Vendre Mon Entreprise
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Disclaimer */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-muted/50 border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground text-center">
              <strong className="text-foreground">Avertissement :</strong> Les articles de ce blog sont fournis à titre informatif uniquement. 
              Vente.Club ne garantit pas l'exactitude, l'exhaustivité ou la pertinence des informations présentées et n'est pas responsable du contenu publié. 
              Les lecteurs sont encouragés à consulter des professionnels qualifiés (comptables, avocats, conseillers financiers) pour des conseils spécifiques à leur situation.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BlogPost;
