import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BusinessCard from "@/components/BusinessCard";
import SearchBar from "@/components/SearchBar";
import BusinessMap from "@/components/BusinessMap";
import { ArrowRight, Shield, TrendingUp, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-business.jpg";
import venteLogo from "@/assets/vente-logo.png";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [featuredBusinesses, setFeaturedBusinesses] = useState<any[]>([]);
  const [allBusinesses, setAllBusinesses] = useState<any[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    fetchBusinesses();

    return () => subscription.unsubscribe();
  }, []);

  const fetchBusinesses = async () => {
    // Fetch all active businesses
    const { data: businesses } = await supabase
      .from('businesses')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (businesses) {
      // Check which ones are featured
      const businessesWithFeature = await Promise.all(
        businesses.map(async (business) => {
          const { data: isFeatured } = await supabase
            .rpc('is_business_featured', { business_uuid: business.id });
          return { ...business, featured: !!isFeatured };
        })
      );

      // Separate featured and regular businesses
      const featured = businessesWithFeature
        .filter(b => b.featured)
        .slice(0, 3);
      const regular = businessesWithFeature.filter(b => !b.featured);

      setFeaturedBusinesses(featured);
      setAllBusinesses(regular);
    }
  };

  const mockFeaturedBusinesses = [
    {
      title: "Plateforme SaaS TechStart",
      industry: "Technologie",
      location: "Paris, France",
      revenue: "850K€",
      price: "2.5M",
      profit: "320K€",
      description: "Plateforme SaaS B2B établie avec plus de 500 clients actifs et un modèle de revenus récurrents. Forte trajectoire de croissance.",
      featured: true,
    },
    {
      title: "Chaîne de Cafés Bio",
      industry: "Restauration",
      location: "Lyon, France",
      revenue: "1.2M€",
      price: "950K",
      profit: "280K€",
      description: "Chaîne de cafés populaire avec 3 emplacements, clientèle fidèle et immobilier de premier choix. Exploitation clé en main.",
      featured: true,
    },
    {
      title: "Marque de Mode E-Commerce",
      industry: "E-commerce",
      location: "Bordeaux, France",
      revenue: "2.1M€",
      price: "1.8M",
      profit: "580K€",
      description: "Marque de mode direct-consommateur avec forte présence sur les réseaux sociaux et systèmes d'exécution automatisés.",
      featured: true,
    },
  ];

  const mockAllBusinesses = [
    {
      title: "Agence Marketing Digital",
      industry: "Services",
      location: "Marseille, France",
      revenue: "450K€",
      price: "380K",
      profit: "160K€",
      description: "Agence de marketing digital full-service avec plus de 15 clients long terme et équipe expérimentée en place.",
    },
    {
      title: "Entreprise de Fournitures Industrielles",
      industry: "Industrie",
      location: "Lille, France",
      revenue: "3.5M€",
      price: "2.8M",
      profit: "820K€",
      description: "Fournisseur B2B manufacturier avec contrats établis et installations de production efficaces.",
    },
    {
      title: "Studio de Fitness Boutique",
      industry: "Sport & Bien-être",
      location: "Nice, France",
      revenue: "380K€",
      price: "290K",
      profit: "125K€",
      description: "Studio de fitness moderne avec base d'adhérents solide et excellent emplacement dans un quartier en croissance.",
    },
    {
      title: "Développement d'Applications Mobiles",
      industry: "Technologie",
      location: "Toulouse, France",
      revenue: "680K€",
      price: "520K",
      profit: "240K€",
      description: "Studio de développement mobile-first spécialisé dans les applications iOS et Android pour clients d'entreprise.",
    },
    {
      title: "Animalerie de Détail",
      industry: "Commerce",
      location: "Nantes, France",
      revenue: "920K€",
      price: "650K",
      profit: "310K€",
      description: "Animalerie bien établie avec services de toilettage et fidèle communauté locale.",
    },
    {
      title: "Plateforme d'Éducation en Ligne",
      industry: "E-learning",
      location: "Strasbourg, France",
      revenue: "1.5M€",
      price: "1.2M",
      profit: "480K€",
      description: "Marketplace d'éducation en ligne en croissance avec plus de 50 instructeurs et milliers d'étudiants actifs.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <img src={venteLogo} alt="Vente.club" className="h-12" />
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-foreground hover:text-accent transition-colors font-medium">Parcourir</a>
            <a href="#" className="text-foreground hover:text-accent transition-colors font-medium">Vendre</a>
            <a href="#" className="text-foreground hover:text-accent transition-colors font-medium">Ressources</a>
            <a href="#" className="text-foreground hover:text-accent transition-colors font-medium">À propos</a>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                  Mes annonces
                </Button>
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => navigate("/list-business")}>
                  Lister votre entreprise
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" className="text-foreground hover:text-accent" onClick={() => navigate("/auth")}>
                  Connexion
                </Button>
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => navigate("/auth")}>
                  Lister votre entreprise
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="relative container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-5xl md:text-7xl font-bold text-foreground leading-tight">
              Achetez & Vendez des Entreprises
              <span className="block text-accent mt-2">En Toute Confiance</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Un réseau d'entrepreneurs en action. La plateforme de confiance qui connecte les propriétaires d'entreprises avec des acheteurs qualifiés.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground h-14 px-8 text-lg" onClick={() => document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' })}>
                Parcourir les entreprises
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-2 border-primary hover:bg-primary hover:text-primary-foreground" onClick={() => navigate(user ? "/list-business" : "/auth")}>
                Vendre votre entreprise
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <SearchBar />
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Transactions Sécurisées</h3>
              <p className="text-muted-foreground">
                Entreprises vérifiées et services d'entiercement sécurisés pour votre tranquillité d'esprit
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10">
                <TrendingUp className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Historique Prouvé</h3>
              <p className="text-muted-foreground">
                Plus de 2,5 milliards d'euros en transactions d'entreprises réussies sur notre plateforme
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10">
                <Users className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Accompagnement Expert</h3>
              <p className="text-muted-foreground">
                Conseillers dédiés pour vous guider à chaque étape du processus
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Businesses */}
      <section id="featured" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Opportunités En Vedette</h2>
            <p className="text-xl text-muted-foreground">
              Entreprises sélectionnées avec un potentiel de croissance exceptionnel
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {featuredBusinesses.length > 0 ? (
              featuredBusinesses.map((business) => (
                <BusinessCard key={business.id} {...business} />
              ))
            ) : (
              mockFeaturedBusinesses.map((business, index) => (
                <BusinessCard key={index} {...business} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Interactive Map Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Explorez la Carte Interactive</h2>
            <p className="text-xl text-muted-foreground">
              Découvrez les entreprises à vendre partout au Québec
            </p>
          </div>
          <BusinessMap />
        </div>
      </section>

      {/* All Listings */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Parcourir Toutes les Annonces</h2>
            <p className="text-xl text-muted-foreground">
              Explorez des centaines d'entreprises dans divers secteurs
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allBusinesses.length > 0 ? (
              allBusinesses.map((business) => (
                <BusinessCard key={business.id} {...business} />
              ))
            ) : (
              mockAllBusinesses.map((business, index) => (
                <BusinessCard key={index} {...business} />
              ))
            )}
          </div>
          <div className="text-center mt-12">
            <Button size="lg" variant="outline" className="h-12 px-8 border-2 border-primary hover:bg-primary hover:text-primary-foreground">
              Charger plus d'entreprises
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary via-primary to-primary/90 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5" />
        <div className="relative container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Prêt à Trouver Votre Prochaine Opportunité ?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Rejoignez des milliers d'entrepreneurs qui ont acheté ou vendu avec succès des entreprises sur notre plateforme.
          </p>
          <Button size="lg" className="bg-white hover:bg-white/90 text-primary h-14 px-8 text-lg font-semibold" onClick={() => navigate(user ? "/list-business" : "/auth")}>
            Commencer Maintenant
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <img src={venteLogo} alt="Vente.club" className="h-10 mb-4" />
              <p className="text-muted-foreground">
                Un réseau d'entrepreneurs en action. La plateforme de confiance pour acheter et vendre des entreprises.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Acheteurs</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-accent transition-colors">Parcourir les entreprises</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Comment ça marche</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Options de financement</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Vendeurs</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-accent transition-colors">Lister votre entreprise</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Outils d'évaluation</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Ressources vendeurs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Entreprise</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-accent transition-colors">À propos</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Politique de confidentialité</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-muted-foreground">
            <p>&copy; 2025 Vente.club. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;