import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Shield, Users, TrendingUp, Award } from "lucide-react";

const About = () => {
  const navigate = useNavigate();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "À propos de Vente.Club",
    "description": "Vente.Club est la plateforme québécoise de confiance pour l'achat et la vente d'entreprises",
    "url": "https://vente.club/a-propos",
    "mainEntity": {
      "@type": "Organization",
      "name": "Vente.Club",
      "foundingDate": "2024",
      "description": "Plateforme spécialisée dans les transactions d'entreprises au Québec"
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="À propos de Vente.Club | Leader en Achat-Vente d'Entreprises au Québec"
        description="Découvrez Vente.Club, la plateforme québécoise de référence pour l'achat et la vente d'entreprises. Sécurité, transparence et accompagnement professionnel depuis 2024."
        keywords="à propos vente.club, plateforme achat entreprise Québec, vente entreprise Québec, transactions sécurisées"
        canonical="/a-propos"
        structuredData={structuredData}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 to-accent/5 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              À propos de Vente.Club
            </h1>
            <p className="text-xl text-muted-foreground">
              La plateforme québécoise de confiance pour l'achat et la vente d'entreprises
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-8">Notre Mission</h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-muted-foreground leading-relaxed mb-6">
                Vente.Club a été créé avec une mission claire : simplifier et sécuriser les transactions d'entreprises au Québec. 
                Nous comprenons que l'achat ou la vente d'une entreprise est une décision majeure qui mérite un accompagnement 
                professionnel et une plateforme de confiance.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Notre équipe d'experts locaux travaille chaque jour pour vous offrir la meilleure expérience possible, 
                que vous soyez entrepreneur cherchant à vendre votre entreprise ou investisseur à la recherche de nouvelles opportunités.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Nos Valeurs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="bg-card p-6 rounded-xl border border-border">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">Sécurité</h3>
              <p className="text-muted-foreground">
                Plateforme sécurisée avec système de paiement protégé pour votre tranquillité d'esprit.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl border border-border">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">Transparence</h3>
              <p className="text-muted-foreground">
                Informations claires et complètes sur chaque entreprise pour des décisions éclairées.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl border border-border">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">Croissance</h3>
              <p className="text-muted-foreground">
                Nous accompagnons votre projet de croissance ou de transition avec expertise.
              </p>
            </div>

            <div className="bg-card p-6 rounded-xl border border-border">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Award className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">Excellence</h3>
              <p className="text-muted-foreground">
                Service professionnel et accompagnement de qualité à chaque étape du processus.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground mb-8">Pourquoi Choisir Vente.Club ?</h2>
            <div className="space-y-6">
              <div className="border-l-4 border-accent pl-6">
                <h3 className="text-xl font-bold mb-2">Expertise Locale</h3>
                <p className="text-muted-foreground">
                  Connaissance approfondie du marché québécois et de ses spécificités légales et fiscales.
                </p>
              </div>
              <div className="border-l-4 border-accent pl-6">
                <h3 className="text-xl font-bold mb-2">Vérification Rigoureuse</h3>
                <p className="text-muted-foreground">
                  Chaque annonce est vérifiée pour garantir l'authenticité et la qualité des opportunités proposées.
                </p>
              </div>
              <div className="border-l-4 border-accent pl-6">
                <h3 className="text-xl font-bold mb-2">Accompagnement Personnalisé</h3>
                <p className="text-muted-foreground">
                  Notre équipe vous guide à chaque étape, de la première consultation à la finalisation de la transaction.
                </p>
              </div>
              <div className="border-l-4 border-accent pl-6">
                <h3 className="text-xl font-bold mb-2">Confidentialité Garantie</h3>
                <p className="text-muted-foreground">
                  Protection de vos informations et transactions en toute discrétion.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-accent/10 to-primary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              Prêt à Démarrer Votre Projet ?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Que vous souhaitiez vendre votre entreprise ou trouver l'opportunité idéale, 
              nous sommes là pour vous accompagner.
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

export default About;