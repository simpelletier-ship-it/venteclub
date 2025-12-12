import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Calculator, PiggyBank, TrendingUp, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  icon: React.ReactNode;
}

const blogPosts: BlogPost[] = [
  {
    slug: "comment-creer-budget-personnel",
    title: "Comment créer un budget personnel en 5 étapes simples",
    excerpt: "Apprenez à créer un budget efficace qui vous aidera à prendre le contrôle de vos finances, économiser plus et atteindre vos objectifs financiers.",
    date: "2025-01-10",
    readTime: "5 min",
    category: "Budget",
    icon: <PiggyBank className="h-5 w-5" />
  },
  {
    slug: "calculer-salaire-net-quebec",
    title: "Comment calculer son salaire net au Québec en 2025",
    excerpt: "Guide complet pour comprendre les déductions sur votre paie : impôts fédéral et provincial, RRQ, RQAP et assurance-emploi expliqués simplement.",
    date: "2025-01-08",
    readTime: "7 min",
    category: "Salaire",
    icon: <Calculator className="h-5 w-5" />
  },
  {
    slug: "augmenter-retour-impot-quebec",
    title: "10 façons d'augmenter votre retour d'impôt au Québec",
    excerpt: "Découvrez les crédits d'impôt et déductions les plus avantageux pour maximiser votre remboursement : REER, CELIAPP, frais médicaux et plus.",
    date: "2025-01-05",
    readTime: "8 min",
    category: "Impôts",
    icon: <TrendingUp className="h-5 w-5" />
  },
  {
    slug: "fonds-urgence-combien-epargner",
    title: "Fonds d'urgence : combien devriez-vous épargner ?",
    excerpt: "Tout ce que vous devez savoir sur le fonds d'urgence : pourquoi c'est essentiel, combien viser et comment le constituer progressivement.",
    date: "2025-01-03",
    readTime: "6 min",
    category: "Épargne",
    icon: <PiggyBank className="h-5 w-5" />
  },
  {
    slug: "difference-reer-celi-celiapp",
    title: "REER, CELI ou CELIAPP : lequel choisir ?",
    excerpt: "Comprenez les différences entre ces trois comptes d'épargne avec avantages fiscaux et découvrez lequel convient le mieux à votre situation.",
    date: "2024-12-28",
    readTime: "9 min",
    category: "Épargne",
    icon: <BookOpen className="h-5 w-5" />
  },
  {
    slug: "calculer-valeur-nette",
    title: "Comment calculer et améliorer votre valeur nette",
    excerpt: "La valeur nette est l'indicateur ultime de votre santé financière. Apprenez à la calculer et découvrez des stratégies pour l'augmenter.",
    date: "2024-12-20",
    readTime: "6 min",
    category: "Valeur nette",
    icon: <TrendingUp className="h-5 w-5" />
  }
];

const Blog = () => {
  const navigate = useNavigate();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Blog Finances Personnelles",
    "description": "Conseils et guides pratiques sur la gestion de budget, le calcul de salaire et les finances personnelles au Québec",
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
        title="Blog Finances Personnelles | Guides Budget, Salaire et Impôts Québec"
        description="Articles pratiques sur la gestion de budget, le calcul de salaire net au Québec, les retours d'impôt et l'épargne. Conseils financiers simples pour tous les Québécois."
        keywords="blog finances personnelles, guide budget québec, conseils épargne, calcul salaire net, retour impôt québec, REER CELI conseils, valeur nette"
        canonical="/blog"
        type="website"
        structuredData={structuredData}
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-16 md:py-24 border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Blog Finances Personnelles
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Conseils pratiques et guides simples pour mieux gérer votre argent au Québec
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
                  Consultez un conseiller financier pour des conseils personnalisés à votre situation.
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
            <div className="space-y-12 md:space-y-16">
              {/* Featured Post */}
              {blogPosts[0] && (
                <article className="group">
                  <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center">
                    <div className="relative overflow-hidden rounded-lg aspect-[16/10] bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <PiggyBank className="h-24 w-24 text-primary/50" />
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
                        onClick={() => navigate(`/faq`)}
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
                        onClick={() => navigate(`/faq`)}
                      >
                        <Card className="h-full overflow-hidden hover:shadow-lg transition-all duration-300 border">
                          <div className="relative overflow-hidden aspect-[16/10] bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                            {post.icon && <div className="text-primary/40 scale-[3]">{post.icon}</div>}
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
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-t">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">
              Prêt à prendre le contrôle de vos finances ?
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Utilisez nos outils gratuits pour calculer votre salaire, estimer votre retour d'impôt et créer votre budget
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <Button size="lg" onClick={() => navigate('/budget')} className="font-semibold">
                Créer mon budget
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/outils')} className="font-semibold">
                Découvrir les outils
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Blog;