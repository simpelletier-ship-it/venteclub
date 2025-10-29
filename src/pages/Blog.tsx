import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import blogEvaluation from "@/assets/blog-evaluation-entreprise.jpg";
import blogAcheter from "@/assets/blog-acheter-entreprise.jpg";
import blogFinancement from "@/assets/blog-financement.jpg";
import blogDueDiligence from "@/assets/blog-due-diligence.jpg";
import blogTendances from "@/assets/blog-tendances-2025.jpg";
import blogPreparer from "@/assets/blog-preparer-vente.jpg";

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  image?: string;
}

const blogPosts: BlogPost[] = [
  {
    slug: "guide-complet-vendre-entreprise-quebec",
    title: "Guide Complet pour Vendre Votre Entreprise au Québec en 2025",
    excerpt: "Découvrez les 10 étapes essentielles pour vendre votre entreprise avec succès au Québec. De l'évaluation à la transaction finale, tout ce que vous devez savoir.",
    date: "2025-01-15",
    readTime: "8 min",
    category: "Guide Vendeur",
    image: blogPreparer
  },
  {
    slug: "acheter-premiere-entreprise-conseils",
    title: "Acheter sa Première Entreprise : 7 Conseils d'Experts",
    excerpt: "Vous envisagez d'acheter votre première entreprise ? Nos experts partagent leurs meilleurs conseils pour réussir votre acquisition et éviter les pièges courants.",
    date: "2025-01-10",
    readTime: "6 min",
    category: "Guide Acheteur",
    image: blogAcheter
  },
  {
    slug: "evaluation-entreprise-methodes",
    title: "Comment Évaluer la Valeur d'une Entreprise : Les 3 Méthodes Clés",
    excerpt: "Apprenez à évaluer correctement une entreprise avec les méthodes reconnues : actifs nets, capitalisation des bénéfices et flux de trésorerie actualisés.",
    date: "2025-01-05",
    readTime: "10 min",
    category: "Évaluation",
    image: blogEvaluation
  },
  {
    slug: "financer-achat-entreprise-options",
    title: "Financer l'Achat d'une Entreprise : Toutes les Options au Québec",
    excerpt: "Découvrez toutes les solutions de financement disponibles au Québec pour l'acquisition d'une entreprise : prêts bancaires, investisseurs, subventions et plus.",
    date: "2025-01-01",
    readTime: "7 min",
    category: "Financement",
    image: blogFinancement
  },
  {
    slug: "due-diligence-checklist-complete",
    title: "Due Diligence : La Checklist Complète pour Acheteurs",
    excerpt: "Assurez-vous de ne rien manquer lors de votre vérification diligente. Notre checklist détaillée couvre tous les aspects financiers, légaux et opérationnels.",
    date: "2025-01-28",
    readTime: "12 min",
    category: "Acquisition",
    image: blogDueDiligence
  },
  {
    slug: "secteurs-porteurs-quebec-2025",
    title: "Les Secteurs les Plus Porteurs pour Investir au Québec en 2025",
    excerpt: "Analyse des industries les plus prometteuses pour l'acquisition d'entreprises au Québec : technologie, santé, alimentation et services aux entreprises.",
    date: "2025-01-20",
    readTime: "9 min",
    category: "Tendances",
    image: blogTendances
  }
];

const Blog = () => {
  const navigate = useNavigate();

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