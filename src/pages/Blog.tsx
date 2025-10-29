import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import blogEvaluation from "@/assets/blog-evaluation-entreprise.jpg";
import blogAcheter from "@/assets/blog-acheter-entreprise.jpg";
import blogFinancement from "@/assets/blog-financement.jpg";
import blogDueDiligence from "@/assets/blog-due-diligence.jpg";
import blogTendances from "@/assets/blog-tendances-2025.jpg";
import blogPreparer from "@/assets/blog-preparer-vente.jpg";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  image: string;
  published: boolean;
}

const imageMap: Record<string, string> = {
  "/src/assets/blog-preparer-vente.jpg": blogPreparer,
  "/src/assets/blog-acheter-entreprise.jpg": blogAcheter,
  "/src/assets/blog-evaluation-entreprise.jpg": blogEvaluation,
  "/src/assets/blog-financement.jpg": blogFinancement,
  "/src/assets/blog-due-diligence.jpg": blogDueDiligence,
  "/src/assets/blog-tendances-2025.jpg": blogTendances,
};

const Blog = () => {
  const navigate = useNavigate();
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogPosts();
  }, []);

  const fetchBlogPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, slug, title, excerpt, date, read_time, category, image, published')
        .eq('published', true)
        .order('date', { ascending: false });

      if (error) throw error;

      const postsWithImages = (data || []).map(post => ({
        ...post,
        readTime: post.read_time,
        image: imageMap[post.image] || post.image
      }));

      setBlogPosts(postsWithImages);
    } catch (error) {
      console.error('Error fetching blog posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Blog Vente.Club",
    "description": "Conseils, guides et actualités sur l'achat et la vente d'entreprises au Québec",
    "url": "https://vente.club/blog",
    "publisher": {
      "@type": "Organization",
      "name": "Vente.Club"
    },
    "blogPost": blogPosts.map(post => ({
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.excerpt,
      "datePublished": post.date,
      "url": `https://vente.club/blog/${post.slug}`
    }))
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Blog Vente.Club | Guides et Conseils Achat-Vente Entreprise Québec"
        description="Conseils d'experts, guides pratiques et actualités sur l'achat et la vente d'entreprises au Québec. Évaluation, financement, due diligence et plus."
        keywords="blog achat entreprise, guide vente entreprise Québec, conseils acquisition PME, évaluation entreprise"
        canonical="/blog"
        type="article"
        structuredData={structuredData}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 to-accent/5 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Blog Vente.Club
            </h1>
            <p className="text-xl text-muted-foreground">
              Conseils, guides et actualités sur l'achat et la vente d'entreprises au Québec
            </p>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-card border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground text-center">
              <strong className="text-foreground">Avertissement :</strong> Les articles de ce blog sont fournis à titre informatif uniquement. 
              Vente.Club ne garantit pas l'exactitude, l'exhaustivité ou la pertinence des informations présentées et n'est pas responsable du contenu publié. 
              Les lecteurs sont encouragés à consulter des professionnels qualifiés (comptables, avocats, conseillers financiers) pour des conseils spécifiques à leur situation.
            </p>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Chargement des articles...</p>
        </div>
      ) : blogPosts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Aucun article disponible</p>
        </div>
      ) : (
        <>
          {/* Featured Post */}
          {blogPosts[0] && (
            <section className="py-12">
              <div className="container mx-auto px-4">
                <div className="max-w-5xl mx-auto">
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="relative aspect-video md:aspect-auto overflow-hidden">
                        <img 
                          src={blogPosts[0].image} 
                          alt={blogPosts[0].title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <CardContent className="p-8 flex flex-col justify-center">
                        <div className="flex items-center gap-4 mb-4">
                          <span className="text-sm font-semibold text-accent">
                            {blogPosts[0].category}
                          </span>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            {new Date(blogPosts[0].date).toLocaleDateString('fr-CA', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </div>
                        </div>
                        <h2 className="text-2xl font-bold mb-3 hover:text-accent transition-colors cursor-pointer"
                            onClick={() => navigate(`/blog/${blogPosts[0].slug}`)}>
                          {blogPosts[0].title}
                        </h2>
                        <p className="text-muted-foreground mb-4">
                          {blogPosts[0].excerpt}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            {blogPosts[0].readTime} de lecture
                          </div>
                          <Button variant="ghost" onClick={() => navigate(`/blog/${blogPosts[0].slug}`)}>
                            Lire l'article <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </div>
              </div>
            </section>
          )}

          {/* Blog Posts Grid */}
          <section className="py-12 bg-muted/30">
            <div className="container mx-auto px-4">
              <h2 className="text-3xl font-bold mb-8">Articles Récents</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {blogPosts.slice(1).map((post) => (
                  <Card key={post.slug} className="hover:shadow-lg transition-shadow overflow-hidden">
                    <div className="relative aspect-video overflow-hidden">
                      <img 
                        src={post.image} 
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-3">
                        <span className="text-xs font-semibold text-accent">
                          {post.category}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {post.readTime}
                        </div>
                      </div>
                      <h3 className="text-xl font-bold mb-2 hover:text-accent transition-colors cursor-pointer line-clamp-2"
                          onClick={() => navigate(`/blog/${post.slug}`)}>
                        {post.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {new Date(post.date).toLocaleDateString('fr-CA', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/blog/${post.slug}`)}>
                          Lire <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-accent/10 to-primary/10 rounded-2xl p-12">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              Prêt à Vendre ou Acheter Votre Entreprise ?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Rejoignez des centaines d'entrepreneurs qui font confiance à Vente.Club
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate("/list-business")} className="bg-accent hover:bg-accent/90">
                Vendre Mon Entreprise
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/")}>
                Explorer les Opportunités
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Blog;
