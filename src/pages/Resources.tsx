import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { BookOpen, TrendingUp, FileText, Calculator, Shield, CheckCircle } from "lucide-react";

const Resources = () => {
  const navigate = useNavigate();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Ressources et Guides - Vente.Club",
    "description": "Guides complets pour acheter ou vendre une entreprise au Québec : processus, financement, évaluation et conseils d'experts",
    "url": "https://vente.club/ressources"
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Ressources et Guides | Achat et Vente d'Entreprises au Québec"
        description="Découvrez nos guides complets pour acheter ou vendre une entreprise au Québec : processus étape par étape, financement, évaluation, due diligence et conseils d'experts."
        keywords="guide achat entreprise, guide vente entreprise, processus acquisition, financement entreprise, évaluation entreprise, due diligence"
        canonical="/ressources"
        structuredData={structuredData}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 to-accent/10 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Ressources et Guides
            </h1>
            <p className="text-xl text-muted-foreground">
              Tous les outils et conseils dont vous avez besoin pour réussir votre projet d'acquisition ou de vente d'entreprise au Québec
            </p>
          </div>
        </div>
      </section>

      {/* Main Guides Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-16">
            <Card className="border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
                <CardTitle className="text-2xl">Guide de l'Acheteur</CardTitle>
                <CardDescription>
                  Tout ce que vous devez savoir pour acheter une entreprise au Québec
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-1">1. Définir vos objectifs</h4>
                      <p className="text-sm text-muted-foreground">
                        Identifiez vos critères : secteur d'activité, taille, localisation, budget et objectifs de croissance
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-1">2. Recherche d'opportunités</h4>
                      <p className="text-sm text-muted-foreground">
                        Explorez notre plateforme, configurez des alertes et analysez les entreprises disponibles
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-1">3. Évaluation financière</h4>
                      <p className="text-sm text-muted-foreground">
                        Analysez les états financiers, ratios de rentabilité et potentiel de croissance
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-1">4. Due diligence</h4>
                      <p className="text-sm text-muted-foreground">
                        Vérification juridique, financière, opérationnelle et commerciale approfondie
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-1">5. Négociation et financement</h4>
                      <p className="text-sm text-muted-foreground">
                        Structurez votre offre, négociez les termes et sécurisez le financement
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-1">6. Finalisation et transition</h4>
                      <p className="text-sm text-muted-foreground">
                        Signez les documents, effectuez le transfert et planifiez la transition
                      </p>
                    </div>
                  </div>
                </div>
                <Button className="w-full mt-6" onClick={() => navigate("/entreprises")}>
                  Explorer les Opportunités
                </Button>
              </CardContent>
            </Card>

            <Card className="border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-2xl">Guide du Vendeur</CardTitle>
                <CardDescription>
                  Les étapes clés pour vendre votre entreprise au meilleur prix
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-1">1. Préparation de la vente</h4>
                      <p className="text-sm text-muted-foreground">
                        Organisez vos documents financiers, optimisez vos opérations et clarifiez votre structure
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-1">2. Évaluation réaliste</h4>
                      <p className="text-sm text-muted-foreground">
                        Déterminez la valeur marchande avec des méthodes d'évaluation reconnues
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-1">3. Création de l'annonce</h4>
                      <p className="text-sm text-muted-foreground">
                        Rédigez une description attractive avec photos professionnelles et données financières claires
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-1">4. Marketing et confidentialité</h4>
                      <p className="text-sm text-muted-foreground">
                        Diffusez votre annonce tout en protégeant les informations sensibles
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-1">5. Qualification des acheteurs</h4>
                      <p className="text-sm text-muted-foreground">
                        Identifiez les acheteurs sérieux avec capacité financière et vision alignée
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold mb-1">6. Négociation et clôture</h4>
                      <p className="text-sm text-muted-foreground">
                        Négociez les termes, finalisez avec vos conseillers et assurez une transition harmonieuse
                      </p>
                    </div>
                  </div>
                </div>
                <Button className="w-full mt-6" onClick={() => navigate("/sell")}>
                  Vendre Mon Entreprise
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Additional Resources Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Outils et Ressources Complémentaires</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card>
              <CardHeader>
                <Calculator className="w-8 h-8 text-accent mb-2" />
                <CardTitle>Calculateur Financier</CardTitle>
                <CardDescription>
                  Estimez la rentabilité, le retour sur investissement et les flux de trésorerie
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={() => navigate("/entreprises")}>
                  Utiliser l'outil
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="w-8 h-8 text-primary mb-2" />
                <CardTitle>Liste de Vérification</CardTitle>
                <CardDescription>
                  Documents nécessaires pour la due diligence et la transaction
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                  <li>• États financiers (3 ans)</li>
                  <li>• Bail commercial</li>
                  <li>• Contrats fournisseurs</li>
                  <li>• Liste des actifs</li>
                  <li>• Déclarations fiscales</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="w-8 h-8 text-accent mb-2" />
                <CardTitle>Conseillers Juridiques</CardTitle>
                <CardDescription>
                  Importance de l'accompagnement professionnel dans votre transaction
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Faites appel à un avocat spécialisé en droit des affaires et à un comptable pour sécuriser votre transaction.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Financing Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Options de Financement au Québec</h2>
            <div className="space-y-6">
              <div className="border-l-4 border-accent pl-6">
                <h3 className="text-xl font-bold mb-2">Financement bancaire traditionnel</h3>
                <p className="text-muted-foreground mb-2">
                  Les institutions financières offrent des prêts d'acquisition avec des taux compétitifs. 
                  Généralement, un apport personnel de 20-30% est requis.
                </p>
                <p className="text-sm text-muted-foreground">
                  Institutions : Banque Nationale, Desjardins, BDC, RBC, TD
                </p>
              </div>

              <div className="border-l-4 border-primary pl-6">
                <h3 className="text-xl font-bold mb-2">Banque de développement du Canada (BDC)</h3>
                <p className="text-muted-foreground mb-2">
                  Programmes spécialisés pour l'acquisition d'entreprises avec accompagnement et conditions avantageuses.
                </p>
                <p className="text-sm text-muted-foreground">
                  Financement jusqu'à 5M$ avec expertise sectorielle
                </p>
              </div>

              <div className="border-l-4 border-accent pl-6">
                <h3 className="text-xl font-bold mb-2">Financement du vendeur</h3>
                <p className="text-muted-foreground mb-2">
                  Le vendeur finance une partie du prix de vente, facilitant la transaction et démontrant sa confiance.
                </p>
                <p className="text-sm text-muted-foreground">
                  Généralement 10-40% du prix sur 3-5 ans
                </p>
              </div>

              <div className="border-l-4 border-primary pl-6">
                <h3 className="text-xl font-bold mb-2">Investissement Québec</h3>
                <p className="text-muted-foreground mb-2">
                  Programmes gouvernementaux pour soutenir les acquisitions d'entreprises québécoises.
                </p>
                <p className="text-sm text-muted-foreground">
                  Prêts participatifs et garanties de prêt disponibles
                </p>
              </div>

              <div className="border-l-4 border-accent pl-6">
                <h3 className="text-xl font-bold mb-2">Capital-investissement et fonds privés</h3>
                <p className="text-muted-foreground mb-2">
                  Pour les acquisitions plus importantes, des fonds d'investissement peuvent participer au financement.
                </p>
                <p className="text-sm text-muted-foreground">
                  Idéal pour transactions de 2M$ et plus
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Valuation Methods Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Méthodes d'Évaluation d'Entreprise</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Méthode des Multiples</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Basée sur le BAIIA (bénéfice avant intérêts, impôts et amortissement) multiplié par un coefficient sectoriel.
                  </p>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm font-mono">
                      Valeur = BAIIA × Multiple (2-5×)
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Flux de Trésorerie Actualisés</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Calcule la valeur actuelle des flux de trésorerie futurs anticipés de l'entreprise.
                  </p>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm font-mono">
                      VAN = Σ (FT / (1+r)ⁿ)
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Valeur des Actifs</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Somme des actifs tangibles et intangibles moins les dettes. Utile pour les entreprises à forte intensité d'actifs.
                  </p>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm font-mono">
                      Valeur = Actifs - Passifs
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Comparables de Marché</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Analyse des transactions récentes d'entreprises similaires dans le même secteur et la même région.
                  </p>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm">
                      Basé sur données réelles
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Market Reports Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Rapports de Marché Québécois</h2>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tendances du Marché 2025</CardTitle>
                  <CardDescription>Analyse sectorielle et opportunités régionales</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Secteurs en croissance</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Technologies de l'information : +15% de transactions</li>
                        <li>• Services professionnels : Demande stable</li>
                        <li>• Commerce électronique : Forte valorisation</li>
                        <li>• Restauration et hôtellerie : Reprise post-COVID</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Fourchettes de prix par région</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Montréal : 150K$ - 2M$ (médiane 450K$)</li>
                        <li>• Québec : 100K$ - 1.5M$ (médiane 350K$)</li>
                        <li>• Régions : 75K$ - 800K$ (médiane 225K$)</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Étude de Cas : Acquisition Réussie</CardTitle>
                  <CardDescription>Restaurant à Montréal - 375K$</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <p className="text-muted-foreground">
                      <span className="font-semibold text-foreground">Contexte :</span> Restaurant établi depuis 8 ans, 
                      50 places, cuisine méditerranéenne, quartier résidentiel.
                    </p>
                    <p className="text-muted-foreground">
                      <span className="font-semibold text-foreground">Financement :</span> 30% apport personnel (112K$), 
                      50% prêt bancaire (187K$), 20% financement vendeur (76K$).
                    </p>
                    <p className="text-muted-foreground">
                      <span className="font-semibold text-foreground">Résultats :</span> Rentabilité maintenue dès la première année, 
                      croissance de 12% sur 24 mois grâce à optimisation du menu et présence digitale.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-accent/10 to-primary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              Besoin d'Aide Personnalisée ?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Notre équipe est disponible pour répondre à vos questions et vous accompagner dans votre projet.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate("/contact")}>
                Nous Contacter
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/blog")}>
                Lire le Blog
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Resources;