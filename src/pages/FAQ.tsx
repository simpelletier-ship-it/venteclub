import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useNavigate } from "react-router-dom";
import { HelpCircle, BookOpen } from "lucide-react";

const FAQ = () => {
  const navigate = useNavigate();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Qu'est-ce qu'une opportunité d'affaires ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Une opportunité d'affaires désigne une entreprise établie disponible à l'achat, offrant un potentiel de revenus immédiat avec une clientèle existante et des opérations en cours."
        }
      },
      {
        "@type": "Question",
        "name": "Comment évaluer le prix d'une entreprise ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Le prix d'une entreprise s'évalue généralement selon plusieurs méthodes : multiple du BAIIA (2-5×), flux de trésorerie actualisés, valeur des actifs, ou comparables de marché dans le même secteur."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="FAQ et Glossaire | Questions sur l'Achat-Vente d'Entreprises"
        description="Réponses aux questions fréquentes sur l'achat et la vente d'entreprises au Québec. Glossaire complet des termes : opportunité affaires, cession entreprise, reprise commerce, due diligence."
        keywords="FAQ achat entreprise, questions vente entreprise, glossaire affaires, opportunité affaires, cession entreprise, reprise commerce, due diligence"
        canonical="/faq"
        structuredData={structuredData}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 to-accent/10 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <HelpCircle className="w-16 h-16 text-accent mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              FAQ et Glossaire
            </h1>
            <p className="text-xl text-muted-foreground">
              Trouvez des réponses à vos questions et familiarisez-vous avec les termes clés de l'achat-vente d'entreprises
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Questions Fréquentes</h2>
            
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="premium" className="border rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  À quoi sert l'abonnement Club Select ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p className="mb-3">
                    L'abonnement Club Select à 19,99$/mois vous permet d'avoir des conversations illimitées (vs 1 par 24h gratuit), d'accéder aux coordonnées de TOUS les vendeurs sans restriction, et de bénéficier d'un chat illimité. 
                  </p>
                  <p className="mb-3">
                    <strong>Pourquoi un abonnement payant ?</strong> Le Club Select garantit des acheteurs sérieux et engagés, ce qui permet aux vendeurs de recevoir des demandes de qualité. Cela filtre le spam, les robots automatiques et réduit au maximum les courtiers opportunistes.
                  </p>
                  <p>
                    C'est l'outil idéal pour les acheteurs actifs recherchant plusieurs opportunités et souhaitant être pris au sérieux par les vendeurs.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="free-limit" className="border rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  Combien de conversations puis-je avoir gratuitement ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Le plan gratuit vous permet de démarrer 1 nouvelle conversation toutes les 24 heures avec un vendeur différent. Une fois une conversation démarrée, vous pouvez continuer à échanger sans limite avec ce vendeur. La limite se réinitialise 24 heures après votre dernière conversation. Pour des conversations illimitées et accès aux coordonnées complètes, rejoignez le Club Select à 19,99$/mois.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-1" className="border rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  Comment fonctionne l'achat d'une entreprise sur Vente.Club ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Sur Vente.Club, vous pouvez explorer des centaines d'opportunités d'affaires au Québec. 
                  Créez votre compte gratuitement, parcourez les annonces, configurez des alertes selon vos critères, 
                  et contactez directement les vendeurs pour les opportunités qui vous intéressent. Un paiement unique 
                  débloque les coordonnées du vendeur pour initier les discussions.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  Quel est le prix moyen d'une entreprise à vendre au Québec ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Le prix varie considérablement selon le secteur, la taille et la localisation. En 2025, 
                  les entreprises se vendent généralement entre 100K$ et 1M$ au Québec. Les commerces de détail 
                  et restaurants sont souvent dans la fourchette 150K$-500K$, tandis que les entreprises de services 
                  professionnels peuvent atteindre 500K$-2M$. Le prix est typiquement un multiple de 2-5× le BAIIA annuel.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  Combien de temps prend la vente d'une entreprise ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Le processus de vente prend généralement 6 à 12 mois du début à la fin. Cela inclut la préparation 
                  de l'annonce (1-2 mois), la recherche d'acheteurs (2-4 mois), la négociation et due diligence (2-3 mois), 
                  et la finalisation légale (1-2 mois). Les entreprises bien préparées avec des finances claires se vendent plus rapidement.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  Ai-je besoin d'un avocat pour acheter ou vendre une entreprise ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Oui, fortement recommandé. Un avocat spécialisé en droit des affaires est essentiel pour rédiger 
                  ou réviser le contrat d'achat, vérifier les aspects légaux (baux, permis, contrats), et protéger 
                  vos intérêts. Un comptable est également recommandé pour l'analyse financière et l'optimisation fiscale. 
                  Ces professionnels représentent un investissement de 3-5% du prix de vente mais évitent des erreurs coûteuses.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="border rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  Quels documents dois-je préparer pour vendre mon entreprise ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Documents essentiels : états financiers des 3 dernières années, déclarations fiscales, 
                  liste détaillée des actifs et inventaire, contrats en cours (fournisseurs, clients, employés), 
                  bail commercial, permis et licences, organigramme et description des opérations. 
                  Plus vos documents sont organisés et transparents, plus les acheteurs seront confiants.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6" className="border rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  Comment financer l'achat d'une entreprise au Québec ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Plusieurs options : prêt bancaire (généralement 60-80% avec apport de 20-30%), financement BDC 
                  (Banque de développement du Canada), financement du vendeur (10-40% sur 3-5 ans), programmes 
                  gouvernementaux (Investissement Québec), ou capital-investissement pour grandes acquisitions. 
                  La plupart des acheteurs combinent 2-3 sources de financement.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-7" className="border rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  Qu'est-ce que la due diligence et pourquoi est-elle importante ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  La due diligence est une vérification approfondie de tous les aspects de l'entreprise avant l'achat : 
                  finances (révision des états financiers, vérification des revenus), juridique (contrats, litiges, conformité), 
                  opérationnel (processus, équipements, employés), et commercial (clients, concurrence, marché). 
                  Elle permet d'identifier les risques et de négocier le prix en conséquence. Comptez 4-8 semaines pour une due diligence complète.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-8" className="border rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  Comment protéger la confidentialité lors de la vente ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Sur Vente.Club, les informations sensibles (nom exact, adresse précise) sont masquées jusqu'à ce 
                  que l'acheteur paie pour débloquer les coordonnées. Utilisez des accords de confidentialité (NDA) 
                  avant de partager des informations détaillées. Ne divulguez la vente ni aux employés ni aux clients 
                  tant que la transaction n'est pas finalisée, sauf si nécessaire.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-9" className="border rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  Puis-je acheter une entreprise sans expérience dans le secteur ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Oui, mais avec prudence. Privilégiez des entreprises avec des opérations bien documentées, 
                  une équipe en place, et idéalement un vendeur disposé à former. Certains secteurs comme la restauration 
                  ou le commerce de détail sont plus accessibles aux débutants. Envisagez de garder le vendeur comme consultant 
                  pendant 3-6 mois de transition. Une formation préalable ou un partenariat avec quelqu'un d'expérimenté est recommandé.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-10" className="border rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  Quels sont les coûts cachés lors de l'achat d'une entreprise ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Au-delà du prix d'achat, prévoyez : frais juridiques et comptables (3-5%), taxes de transfert, 
                  mise à niveau d'équipements ou rénovations, fonds de roulement supplémentaire (2-3 mois d'opérations), 
                  formation et recrutement, marketing pour la transition, et systèmes informatiques. 
                  Budgétisez 10-20% du prix d'achat pour ces frais additionnels.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Glossary Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <BookOpen className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold">Glossaire des Termes Clés</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Opportunité d'affaires</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Une entreprise établie disponible à l'achat, offrant un potentiel de revenus immédiat 
                    avec une clientèle existante et des opérations en cours. Contrairement à une startup, 
                    l'opportunité d'affaires a un historique prouvé.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cession d'entreprise</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Processus de transfert de propriété d'une entreprise du vendeur (cédant) à l'acheteur (cessionnaire). 
                    La cession peut être partielle (actions) ou totale (actifs). Implique aspects juridiques, 
                    financiers et opérationnels.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Reprise de commerce</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Action d'acquérir une entreprise existante plutôt que d'en créer une nouvelle. 
                    La reprise permet de bénéficier immédiatement d'une clientèle, de revenus, 
                    d'une équipe et d'une réputation établie, réduisant les risques du démarrage.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>BAIIA (EBITDA)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Bénéfice Avant Intérêts, Impôts et Amortissement. Indicateur financier clé mesurant 
                    la rentabilité opérationnelle d'une entreprise. Utilisé pour calculer la valeur d'une entreprise 
                    via les multiples (ex: 3× BAIIA).
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Due Diligence</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Vérification approfondie et systématique de tous les aspects d'une entreprise avant l'achat. 
                    Inclut analyse financière, juridique, opérationnelle et commerciale. Essentielle pour identifier 
                    les risques et confirmer la valeur.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Actif net</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Valeur comptable de l'entreprise calculée en soustrayant le total des passifs (dettes) 
                    du total des actifs. Représente la valeur nette de l'entreprise sur le papier, 
                    mais souvent différente de la valeur marchande.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Clause de non-concurrence</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Disposition contractuelle empêchant le vendeur d'ouvrir une entreprise concurrente 
                    dans un territoire et délai définis (généralement 2-5 ans). Protège l'acheteur 
                    et la valeur de l'acquisition, notamment la clientèle.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Fonds de roulement</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Ressources financières nécessaires pour les opérations quotidiennes : stocks, 
                    comptes à recevoir, trésorerie moins comptes à payer. Essentiel pour maintenir 
                    les activités. Souvent négocié séparément du prix d'achat.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Achat d'actions vs actifs</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Deux structures de transaction : l'achat d'actions transfère la société avec tous ses actifs 
                    et passifs (y compris obligations cachées). L'achat d'actifs permet de choisir ce qu'on achète, 
                    limitant les risques mais souvent moins avantageux fiscalement pour le vendeur.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Multiple de valorisation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Coefficient appliqué à une métrique financière (BAIIA, revenus) pour déterminer la valeur d'une entreprise. 
                    Varie selon le secteur, la croissance, et les risques. Par exemple, un restaurant peut se vendre 
                    à 2-3× BAIIA, une tech à 4-6× BAIIA.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Earnout (paiement conditionnel)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Structure de paiement où une partie du prix est conditionnelle aux performances futures 
                    de l'entreprise (revenus, profits). Utilisé pour combler un écart de valorisation entre 
                    acheteur et vendeur ou lors d'incertitude sur la croissance.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Période de transition</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Phase durant laquelle le vendeur forme l'acheteur et facilite le transfert des opérations. 
                    Généralement 1-6 mois selon la complexité. Inclut présentation aux clients, fournisseurs, 
                    formation sur les systèmes et processus. Souvent rémunérée ou incluse dans le contrat.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Regional Terms Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Termes par Région du Québec</h2>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Achat commerce Montréal</CardTitle>
                  <CardDescription>Acquisition d'entreprises dans la métropole québécoise</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    L'achat d'un commerce à Montréal offre accès au plus grand marché du Québec avec 4+ millions d'habitants. 
                    Secteurs dynamiques : technologie, restauration, commerce de détail, services professionnels. 
                    Prix généralement 20-30% plus élevés qu'en région mais avec potentiel de revenus supérieur.
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-semibold">Prix médian</p>
                      <p className="text-muted-foreground">450K$ - 600K$</p>
                    </div>
                    <div>
                      <p className="font-semibold">Secteurs populaires</p>
                      <p className="text-muted-foreground">Tech, restauration, services</p>
                    </div>
                  </div>
                  <Button className="w-full mt-4" variant="outline" onClick={() => navigate("/entreprises-a-vendre-montreal")}>
                    Voir les entreprises à Montréal
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Vente entreprise Québec</CardTitle>
                  <CardDescription>Cession d'entreprises dans la capitale nationale</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    La ville de Québec offre un marché stable avec une économie diversifiée (fonction publique, tourisme, technologie). 
                    Les entreprises se vendent généralement 10-15% moins cher qu'à Montréal mais avec une concurrence moindre 
                    et une qualité de vie appréciée.
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-semibold">Prix médian</p>
                      <p className="text-muted-foreground">350K$ - 500K$</p>
                    </div>
                    <div>
                      <p className="font-semibold">Délai de vente moyen</p>
                      <p className="text-muted-foreground">8-10 mois</p>
                    </div>
                  </div>
                  <Button className="w-full mt-4" variant="outline" onClick={() => navigate("/entreprises-a-vendre-quebec")}>
                    Voir les entreprises à Québec
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Opportunités d'affaires régionales</CardTitle>
                  <CardDescription>Entreprises à vendre dans les régions du Québec</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Les régions du Québec (Saguenay, Mauricie, Estrie, Outaouais, etc.) offrent des prix d'acquisition 
                    plus accessibles avec moins de concurrence. Idéal pour primo-acquéreurs ou ceux recherchant 
                    un meilleur équilibre vie-travail. Attention à la démographie et au bassin de main-d'œuvre.
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-semibold">Prix médian</p>
                      <p className="text-muted-foreground">175K$ - 350K$</p>
                    </div>
                    <div>
                      <p className="font-semibold">Avantages</p>
                      <p className="text-muted-foreground">Prix bas, moins de concurrence</p>
                    </div>
                  </div>
                  <Button className="w-full mt-4" variant="outline" onClick={() => navigate("/entreprises")}>
                    Explorer toutes les régions
                  </Button>
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
              Vous avez d'autres questions ?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Notre équipe est là pour vous aider à naviguer dans votre projet d'acquisition ou de vente.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate("/contact")}>
                Contactez-nous
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/ressources")}>
                Guides et Ressources
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQ;