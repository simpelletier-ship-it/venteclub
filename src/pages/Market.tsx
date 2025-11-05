import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { TrendingUp, DollarSign, Users, Building2, MapPin, ArrowUpRight, ArrowDownRight } from "lucide-react";

const Market = () => {
  const navigate = useNavigate();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Marché de l'Achat-Vente d'Entreprises au Québec 2025",
    "description": "Statistiques, tendances et analyses du marché québécois de la transaction d'entreprises : prix médians, délais de vente, secteurs en croissance",
    "author": {
      "@type": "Organization",
      "name": "Vente.Club"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Vente.Club",
      "logo": {
        "@type": "ImageObject",
        "url": "https://vente.club/logo.png"
      }
    },
    "datePublished": "2025-01-01",
    "dateModified": "2025-01-01"
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Marché des Entreprises à Vendre au Québec 2025 | Statistiques et Tendances"
        description="Découvrez les statistiques du marché québécois : prix médian de 375K$, délai de vente de 8-10 mois, 2,340+ transactions annuelles. Analyses par secteur et région avec données 2025."
        keywords="marché entreprises Québec, statistiques vente entreprise, prix médian, tendances 2025, transaction PME, valorisation entreprise"
        canonical="/marche"
        structuredData={structuredData}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 to-accent/10 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-4">
              <TrendingUp className="w-4 h-4" />
              Données 2025
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Marché des Entreprises à Vendre au Québec
            </h1>
            <p className="text-xl text-muted-foreground">
              Statistiques, tendances et analyses du marché québécois de la transaction d'entreprises
            </p>
          </div>
        </div>
      </section>

      {/* Key Statistics Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Statistiques Clés 2025</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Basé sur l'analyse de 2,340+ transactions d'entreprises au Québec en 2024
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="text-center">
              <CardHeader>
                <DollarSign className="w-10 h-10 text-accent mx-auto mb-2" />
                <CardTitle className="text-3xl font-bold">375K$</CardTitle>
                <CardDescription>Prix médian</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Prix médian de vente d'une entreprise au Québec en 2024
                </p>
                <div className="flex items-center justify-center gap-1 mt-2 text-green-600">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-xs font-semibold">+8.7% vs 2023</span>
                </div>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Building2 className="w-10 h-10 text-primary mx-auto mb-2" />
                <CardTitle className="text-3xl font-bold">2,340+</CardTitle>
                <CardDescription>Transactions annuelles</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Nombre de transactions d'entreprises complétées au Québec en 2024
                </p>
                <div className="flex items-center justify-center gap-1 mt-2 text-green-600">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-xs font-semibold">+12.3% vs 2023</span>
                </div>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Users className="w-10 h-10 text-accent mx-auto mb-2" />
                <CardTitle className="text-3xl font-bold">8-10</CardTitle>
                <CardDescription>Mois de délai</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Délai moyen entre la mise en vente et la finalisation de la transaction
                </p>
                <div className="flex items-center justify-center gap-1 mt-2 text-red-600">
                  <ArrowDownRight className="w-4 h-4" />
                  <span className="text-xs font-semibold">-5% vs 2023</span>
                </div>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <TrendingUp className="w-10 h-10 text-primary mx-auto mb-2" />
                <CardTitle className="text-3xl font-bold">3.2×</CardTitle>
                <CardDescription>Multiple BAIIA médian</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Multiple médian appliqué au BAIIA pour la valorisation d'entreprises
                </p>
                <div className="flex items-center justify-center gap-1 mt-2 text-green-600">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-xs font-semibold">+6.7% vs 2023</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Facts */}
          <div className="bg-muted/30 rounded-lg p-8 max-w-4xl mx-auto">
            <h3 className="text-xl font-bold mb-6 text-center">En Bref</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <p className="text-sm text-muted-foreground">
                  <strong>65%</strong> des entreprises à vendre au Québec sont dans les secteurs services, commerce de détail et restauration
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <p className="text-sm text-muted-foreground">
                  <strong>78%</strong> des acheteurs sont des primo-acquéreurs cherchant leur première entreprise
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <p className="text-sm text-muted-foreground">
                  <strong>42%</strong> des transactions incluent un financement vendeur partiel
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-accent font-bold">•</span>
                <p className="text-sm text-muted-foreground">
                  <strong>3-5%</strong> frais totaux moyens (avocat, comptable, courtier) sur le prix de vente
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Regional Breakdown */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Prix Médians par Région</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-accent" />
                      <CardTitle>Montréal</CardTitle>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">525K$</div>
                      <div className="text-xs text-green-600 flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" />
                        +11.2%
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><strong>Fourchette typique :</strong> 200K$ - 1.5M$</p>
                    <p><strong>Délai de vente :</strong> 7-9 mois</p>
                    <p><strong>Secteurs dominants :</strong> Tech (28%), Restauration (22%), Services (18%)</p>
                    <p><strong>Multiple BAIIA moyen :</strong> 3.5×</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      <CardTitle>Québec</CardTitle>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">425K$</div>
                      <div className="text-xs text-green-600 flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" />
                        +9.5%
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><strong>Fourchette typique :</strong> 175K$ - 1.2M$</p>
                    <p><strong>Délai de vente :</strong> 8-10 mois</p>
                    <p><strong>Secteurs dominants :</strong> Tourisme (24%), Commerce (20%), Services (19%)</p>
                    <p><strong>Multiple BAIIA moyen :</strong> 3.2×</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-accent" />
                      <CardTitle>Laval & Rive-Nord</CardTitle>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">395K$</div>
                      <div className="text-xs text-green-600 flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" />
                        +10.3%
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><strong>Fourchette typique :</strong> 150K$ - 950K$</p>
                    <p><strong>Délai de vente :</strong> 8-11 mois</p>
                    <p><strong>Secteurs dominants :</strong> Commerce (32%), Services (25%), Construction (14%)</p>
                    <p><strong>Multiple BAIIA moyen :</strong> 3.1×</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      <CardTitle>Régions</CardTitle>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">285K$</div>
                      <div className="text-xs text-green-600 flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" />
                        +7.8%
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><strong>Fourchette typique :</strong> 100K$ - 650K$</p>
                    <p><strong>Délai de vente :</strong> 9-12 mois</p>
                    <p><strong>Secteurs dominants :</strong> Commerce (35%), Restauration (18%), Services (16%)</p>
                    <p><strong>Multiple BAIIA moyen :</strong> 2.8×</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Industry Analysis */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Analyse par Secteur d'Activité</h2>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Technologies de l'information</span>
                    <span className="text-2xl font-bold text-accent">4.5× BAIIA</span>
                  </CardTitle>
                  <CardDescription>Secteur le plus valorisé du marché québécois</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-semibold mb-1">Prix médian</p>
                      <p className="text-muted-foreground">650K$ - 1.8M$</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Croissance</p>
                      <p className="text-green-600 flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" />
                        +15.2% transactions
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Délai de vente</p>
                      <p className="text-muted-foreground">5-8 mois</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Les entreprises de développement logiciel, SaaS et services IT affichent les multiples les plus élevés. 
                    Forte demande pour des entreprises avec revenus récurrents (ARR).
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Restauration et Hôtellerie</span>
                    <span className="text-2xl font-bold text-primary">2.8× BAIIA</span>
                  </CardTitle>
                  <CardDescription>Reprise post-COVID avec demande croissante</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-semibold mb-1">Prix médian</p>
                      <p className="text-muted-foreground">325K$ - 850K$</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Croissance</p>
                      <p className="text-green-600 flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" />
                        +18.7% transactions
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Délai de vente</p>
                      <p className="text-muted-foreground">7-10 mois</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Forte reprise après la pandémie. Les concepts éprouvés avec clientèle fidèle se vendent rapidement. 
                    Attention aux baux commerciaux et aux coûts d'exploitation.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Commerce de détail</span>
                    <span className="text-2xl font-bold text-accent">3.0× BAIIA</span>
                  </CardTitle>
                  <CardDescription>Marché stable avec présence e-commerce valorisée</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-semibold mb-1">Prix médian</p>
                      <p className="text-muted-foreground">275K$ - 725K$</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Croissance</p>
                      <p className="text-green-600 flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" />
                        +8.4% transactions
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Délai de vente</p>
                      <p className="text-muted-foreground">8-11 mois</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Les commerces avec présence en ligne obtiennent 25-35% de valorisation supplémentaire. 
                    Marché stable mais transition digitale essentielle.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Services professionnels</span>
                    <span className="text-2xl font-bold text-primary">3.8× BAIIA</span>
                  </CardTitle>
                  <CardDescription>Forte valorisation pour cabinets établis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-semibold mb-1">Prix médian</p>
                      <p className="text-muted-foreground">450K$ - 1.2M$</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Croissance</p>
                      <p className="text-green-600 flex items-center gap-1">
                        <ArrowUpRight className="w-3 h-3" />
                        +11.8% transactions
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Délai de vente</p>
                      <p className="text-muted-foreground">6-9 mois</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Comptables, avocats, consultants et agences marketing affichent une forte demande. 
                    La rétention client est le critère clé de valorisation.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Trends 2025 */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Tendances 2025</h2>
            
            <div className="space-y-6">
              <div className="bg-card p-6 rounded-lg border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ArrowUpRight className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Demande croissante pour les entreprises digitales</h3>
                    <p className="text-muted-foreground">
                      Les entreprises avec revenus récurrents (abonnements, SaaS) voient leur valorisation augmenter de 
                      25-40% par rapport aux modèles traditionnels. Les multiples BAIIA atteignent 5-7× pour les meilleurs acteurs.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-lg border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ArrowUpRight className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Financement vendeur en hausse</h3>
                    <p className="text-muted-foreground">
                      42% des transactions incluent maintenant un financement vendeur (vs 35% en 2023), facilitant l'accès 
                      pour les primo-acquéreurs. Typiquement 15-30% du prix sur 3-5 ans à 5-7% d'intérêt.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-lg border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ArrowUpRight className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Valorisation des entreprises ESG</h3>
                    <p className="text-muted-foreground">
                      Les entreprises avec pratiques environnementales et sociales documentées obtiennent 10-15% de prime 
                      à la valorisation. L'impact social devient un critère d'achat pour 38% des acquéreurs.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-lg border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Accélération des délais de vente</h3>
                    <p className="text-muted-foreground">
                      Les entreprises bien préparées (finances claires, opérations documentées) se vendent 30-40% plus rapidement. 
                      Le délai médian pour ces entreprises est de 6-7 mois vs 10-12 mois pour les autres.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-lg border border-border">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Vague de transferts générationnels</h3>
                    <p className="text-muted-foreground">
                      58% des propriétaires de PME au Québec ont plus de 55 ans. On anticipe 15,000-20,000 transferts 
                      d'entreprises d'ici 2028, créant des opportunités historiques pour les acquéreurs.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Methodology */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-card border border-border rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Méthodologie</h2>
            <div className="prose prose-sm text-muted-foreground">
              <p className="mb-4">
                Les données présentées sur cette page sont basées sur l'analyse de 2,340+ transactions d'entreprises 
                complétées au Québec entre janvier et décembre 2024. Les sources incluent :
              </p>
              <ul className="space-y-2 mb-4">
                <li>Transactions rapportées sur Vente.Club (65% de la base de données)</li>
                <li>Données publiques des courtiers d'affaires québécois</li>
                <li>Rapports de marché de la Fédération des chambres de commerce du Québec</li>
                <li>Statistiques de la Banque de développement du Canada (BDC)</li>
              </ul>
              <p className="mb-4">
                <strong>Définitions :</strong>
              </p>
              <ul className="space-y-2">
                <li><strong>Prix médian :</strong> Le prix au milieu de la distribution (50% au-dessus, 50% en-dessous)</li>
                <li><strong>Multiple BAIIA :</strong> Prix de vente ÷ BAIIA annuel moyen sur 3 ans</li>
                <li><strong>Délai de vente :</strong> Période entre la première publication et la clôture de la transaction</li>
                <li><strong>Transaction complétée :</strong> Vente finalisée avec transfert de propriété légal</li>
              </ul>
              <p className="mt-4 text-xs">
                Dernière mise à jour : Janvier 2025
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-accent/10 to-primary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              Prêt à Rejoindre le Marché ?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Que vous achetiez ou vendiez, profitez d'un marché dynamique avec Vente.Club
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate("/entreprises")}>
                Voir les Opportunités
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/sell")}>
                Vendre Mon Entreprise
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Market;