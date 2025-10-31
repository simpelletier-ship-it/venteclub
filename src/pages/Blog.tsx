import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  "/src/assets/blog-10-choses-vente.jpg": blog10Choses,
  "/src/assets/blog-evaluation-realiste.jpg": blogEvaluationRealiste,
  "/src/assets/blog-conseiller-juridique.jpg": blogConseillerJuridique,
  "/src/assets/blog-planification-fiscale.jpg": blogPlanificationFiscale,
  "/blog-10-choses-vente.jpg": blog10Choses,
  "/blog-acquisition.jpg": blogAcheter,
  "/blog-vente.jpg": blogPreparer,
  "/blog-finance.jpg": blogFinancement,
  "/blog-franchises.jpg": blogDueDiligence,
  "/blog-tendances.jpg": blogTendances,
  "/blog-preparer-vente.jpg": blogPreparer,
  "/blog-acheter-entreprise.jpg": blogAcheter,
  "/blog-evaluation-entreprise.jpg": blogEvaluation,
  "/blog-financement.jpg": blogFinancement,
  "/blog-due-diligence.jpg": blogDueDiligence,
  "/blog-conseiller-juridique.jpg": blogConseillerJuridique,
  "/blog-evaluation-realiste.jpg": blogEvaluationRealiste,
  "/blog-planification-fiscale.jpg": blogPlanificationFiscale,
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
        title="Blog Entreprises à Vendre Québec | Guides Achat-Vente PME et Franchises"
        description="Articles d'experts sur l'achat et vente d'entreprises au Québec: évaluation, financement, due diligence, franchises. Conseils pratiques pour entrepreneurs québécois."
        keywords="blog achat entreprise québec, guide vente PME, conseil acquisition commerce, évaluation entreprise, financement achat entreprise, franchise québec, transmission entreprise, vendre mon commerce"
        canonical="/blog"
        type="website"
        structuredData={structuredData}
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-16 md:py-24 border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Blog Vente.Club
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Conseils, guides et actualités pour réussir l'achat et la vente d'entreprises
            </p>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="bg-muted/20 py-6 border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start gap-3 p-4 bg-background rounded-lg border border-border">
              <div className="space-y-1">
                <h3 className="font-semibold text-base">Information importante</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Les articles de ce blog sont fournis à titre informatif uniquement. 
                  Consultez toujours des experts qualifiés avant de prendre des décisions importantes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground">Chargement des articles...</p>
              </div>
            ) : blogPosts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground">Aucun article disponible pour le moment.</p>
              </div>
            ) : (
              <div className="space-y-12 md:space-y-16">
                {/* Featured Post */}
                {blogPosts[0] && (
                  <article className="group">
                    <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center">
                      <div className="relative overflow-hidden rounded-lg aspect-[16/10] bg-muted">
                        <img 
                          src={blogPosts[0].image} 
                          alt={blogPosts[0].title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <Badge variant="secondary" className="font-medium">
                            {blogPosts[0].category}
                          </Badge>
                          <span className="text-muted-foreground">•</span>
                          <time className="text-muted-foreground">
                            {new Date(blogPosts[0].date).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </time>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">{blogPosts[0].readTime}</span>
                        </div>
                        
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight group-hover:text-primary transition-colors">
                          {blogPosts[0].title}
                        </h2>
                        
                        <p className="text-base md:text-lg text-muted-foreground leading-relaxed line-clamp-3">
                          {blogPosts[0].excerpt}
                        </p>
                        
                        <Button 
                          onClick={() => navigate(`/blog/${blogPosts[0].slug}`)}
                          className="group/btn mt-2"
                        >
                          Lire l'article
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                        </Button>
                      </div>
                    </div>
                  </article>
                )}

                {/* Blog Posts Grid */}
                {blogPosts.length > 1 && (
                  <div className="space-y-8">
                    <h2 className="text-2xl md:text-3xl font-bold">Tous les articles</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                      {blogPosts.slice(1).map((post) => (
                        <article 
                          key={post.slug}
                          className="group cursor-pointer"
                          onClick={() => navigate(`/blog/${post.slug}`)}
                        >
                          <Card className="h-full overflow-hidden hover:shadow-lg transition-all duration-300 border">
                            <div className="relative overflow-hidden aspect-[16/10] bg-muted">
                              <img 
                                src={post.image} 
                                alt={post.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                            </div>
                            <CardContent className="p-5 space-y-3">
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <Badge variant="secondary" className="font-medium text-xs">
                                  {post.category}
                                </Badge>
                                <span className="text-muted-foreground">•</span>
                                <time className="text-muted-foreground">
                                  {new Date(post.date).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </time>
                              </div>
                              
                              <h3 className="text-lg md:text-xl font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2 min-h-[3.5rem]">
                                {post.title}
                              </h3>
                              
                              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 min-h-[4rem]">
                                {post.excerpt}
                              </p>
                              
                              <div className="flex items-center text-sm text-primary font-medium pt-2">
                                Lire la suite
                                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                              </div>
                            </CardContent>
                          </Card>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-t">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">
              Prêt à passer à l'action ?
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Découvrez les opportunités d'achat d'entreprises ou vendez votre société
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <Button size="lg" onClick={() => navigate('/list-business')} className="font-semibold">
                Vendre mon entreprise
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/')} className="font-semibold">
                Explorer les opportunités
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Blog;
