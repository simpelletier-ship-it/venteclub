import { SEO } from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, BookOpen, Calculator, PiggyBank, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const FAQ = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "C'est quoi un budget personnel ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Un budget personnel est un plan financier qui vous aide à suivre vos revenus et dépenses. Il vous permet de savoir exactement où va votre argent et de prendre le contrôle de vos finances."
        }
      },
      {
        "@type": "Question",
        "name": "Comment calculer mon salaire net au Québec ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Utilisez notre calculateur de salaire gratuit qui prend en compte les impôts fédéraux et provinciaux du Québec, le RRQ, le RQAP et l'assurance-emploi pour obtenir votre salaire net exact."
        }
      },
      {
        "@type": "Question",
        "name": "C'est quoi la valeur nette ?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "La valeur nette est la différence entre ce que vous possédez (actifs) et ce que vous devez (dettes). C'est un indicateur clé de votre santé financière globale."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="FAQ Outils Financiers | Questions sur Budget, Salaire et Impôts Québec"
        description="Réponses aux questions fréquentes sur la gestion de budget, le calcul de salaire net au Québec, les retours d'impôt et la valeur nette. Guides pratiques pour gérer vos finances personnelles."
        keywords="FAQ budget personnel, questions calcul salaire Québec, aide retour impôt, valeur nette expliquée, gestion finances personnelles, outils financiers gratuits"
        canonical="/faq"
        structuredData={structuredData}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 to-accent/10 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <HelpCircle className="w-16 h-16 text-accent mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              FAQ et Glossaire Financier
            </h1>
            <p className="text-xl text-muted-foreground">
              Trouvez des réponses à vos questions sur la gestion de budget, le calcul de salaire et les impôts au Québec
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
              {/* Budget Questions */}
              <AccordionItem value="budget-1" className="border rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  C'est quoi un budget personnel et pourquoi c'est important ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p className="mb-3">
                    Un budget personnel est un plan simple qui montre combien d'argent vous gagnez et combien vous dépensez chaque mois. 
                    C'est comme une photo de vos finances qui vous aide à voir où va votre argent.
                  </p>
                  <p className="mb-4">
                    <strong>Pourquoi c'est important ?</strong> Un budget vous permet de :
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    <li>Éviter de dépenser plus que ce que vous gagnez</li>
                    <li>Économiser pour vos projets (voyage, maison, retraite)</li>
                    <li>Réduire le stress lié à l'argent</li>
                    <li>Atteindre vos objectifs financiers plus rapidement</li>
                  </ul>
                  <Link to="/budget">
                    <Button className="w-full sm:w-auto">
                      Créer mon budget gratuitement
                    </Button>
                  </Link>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="budget-2" className="border rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  Comment commencer à faire un budget ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p className="mb-3">
                    Commencer un budget est plus simple qu'on le pense. Voici les étapes de base :
                  </p>
                  <ol className="list-decimal pl-6 space-y-2 mb-4">
                    <li><strong>Notez vos revenus</strong> : salaire, allocations, autres sources</li>
                    <li><strong>Listez vos dépenses fixes</strong> : loyer, téléphone, assurances</li>
                    <li><strong>Suivez vos dépenses variables</strong> : épicerie, essence, sorties</li>
                    <li><strong>Calculez la différence</strong> : revenus - dépenses = ce qui reste</li>
                  </ol>
                  <p>
                    Notre planificateur de budget fait tout ça automatiquement pour vous. Il suffit d'entrer vos transactions et il s'occupe du reste!
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="budget-3" className="border rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  C'est quoi la règle 50/30/20 ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p className="mb-3">
                    La règle 50/30/20 est une méthode simple pour diviser votre argent :
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    <li><strong>50% pour les besoins</strong> : loyer, épicerie, factures, transport</li>
                    <li><strong>30% pour les envies</strong> : restaurants, loisirs, magasinage</li>
                    <li><strong>20% pour l'épargne</strong> : fonds d'urgence, REER, CELI, dettes</li>
                  </ul>
                  <p>
                    C'est un bon point de départ, mais chaque situation est unique. Notre outil vous aide à trouver la répartition qui vous convient.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="budget-4" className="border rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  C'est quoi un fonds d'urgence et combien devrais-je avoir ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p className="mb-3">
                    Un fonds d'urgence est de l'argent mis de côté pour les imprévus : perte d'emploi, réparation de voiture, urgence médicale. 
                    C'est votre filet de sécurité financier.
                  </p>
                  <p className="mb-3">
                    <strong>Combien avoir ?</strong> L'idéal est d'avoir 3 à 6 mois de dépenses essentielles. Par exemple, si vos dépenses mensuelles sont de 2 500$, visez entre 7 500$ et 15 000$.
                  </p>
                  <p>
                    Commencez petit : même 1 000$ peut vous aider à éviter les dettes en cas d'imprévu. Notre outil vous aide à calculer et suivre votre objectif.
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* Salary Calculator Questions */}
              <AccordionItem value="salary-1" className="border rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  Comment calculer mon salaire net au Québec ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p className="mb-3">
                    Votre salaire net est ce qui reste après les déductions. Au Québec, les principales déductions sont :
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    <li><strong>Impôt fédéral</strong> : calculé selon les paliers du Canada</li>
                    <li><strong>Impôt provincial</strong> : calculé selon les paliers du Québec</li>
                    <li><strong>RRQ</strong> : Régime de rentes du Québec (retraite)</li>
                    <li><strong>RQAP</strong> : Régime québécois d'assurance parentale</li>
                    <li><strong>Assurance-emploi</strong> : cotisation fédérale</li>
                  </ul>
                  <Link to="/outils/calculateur-salaire">
                    <Button className="w-full sm:w-auto">
                      Calculer mon salaire net
                    </Button>
                  </Link>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="salary-2" className="border rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  Quelle est la différence entre salaire brut et salaire net ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p className="mb-3">
                    <strong>Salaire brut</strong> : C'est le montant total avant les déductions. C'est souvent ce qu'on voit dans une offre d'emploi (ex: "60 000$/an").
                  </p>
                  <p className="mb-3">
                    <strong>Salaire net</strong> : C'est ce qui arrive vraiment dans votre compte bancaire après les impôts et cotisations. C'est l'argent que vous pouvez réellement dépenser.
                  </p>
                  <p>
                    Au Québec, le salaire net représente environ 65-75% du salaire brut selon votre niveau de revenu. Plus vous gagnez, plus le pourcentage de déductions augmente.
                  </p>
                </AccordionContent>
              </AccordionItem>

              {/* Tax Questions */}
              <AccordionItem value="tax-1" className="border rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  Comment augmenter mon retour d'impôt au Québec ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p className="mb-3">
                    Voici les moyens les plus efficaces pour maximiser votre retour d'impôt :
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    <li><strong>Cotiser au REER</strong> : Chaque dollar cotisé réduit votre revenu imposable</li>
                    <li><strong>Cotiser au CELIAPP</strong> : Pour l'achat d'une première maison</li>
                    <li><strong>Frais médicaux</strong> : Déductibles au-delà d'un certain seuil</li>
                    <li><strong>Dons de charité</strong> : Crédit d'impôt généreux</li>
                    <li><strong>Frais de garde</strong> : Déductibles si vous avez des enfants</li>
                    <li><strong>Frais de déménagement</strong> : Si vous déménagez pour le travail ou les études</li>
                  </ul>
                  <Link to="/outils/calculateur-impot">
                    <Button className="w-full sm:w-auto">
                      Estimer mon retour d'impôt
                    </Button>
                  </Link>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="tax-2" className="border rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  C'est quoi la différence entre REER, CELI et CELIAPP ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p className="mb-3">
                    Ce sont trois comptes d'épargne avec des avantages fiscaux différents :
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    <li>
                      <strong>REER (Régime enregistré d'épargne-retraite)</strong> : 
                      Vos cotisations réduisent votre revenu imposable maintenant. Vous payez l'impôt au retrait (idéalement à la retraite quand vos revenus sont plus bas).
                    </li>
                    <li>
                      <strong>CELI (Compte d'épargne libre d'impôt)</strong> : 
                      Pas de déduction à la cotisation, mais tous les gains sont libres d'impôt au retrait. Parfait pour l'épargne à court et moyen terme.
                    </li>
                    <li>
                      <strong>CELIAPP (Compte d'épargne libre d'impôt pour l'achat d'une première propriété)</strong> : 
                      Combine les avantages des deux! Déduction à la cotisation ET retraits libres d'impôt pour acheter votre première maison.
                    </li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              {/* Net Worth Questions */}
              <AccordionItem value="networth-1" className="border rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  C'est quoi la valeur nette et comment la calculer ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p className="mb-3">
                    Votre valeur nette est un chiffre simple qui résume votre situation financière :
                  </p>
                  <p className="mb-3 text-lg font-medium">
                    Valeur nette = Ce que vous possédez (actifs) - Ce que vous devez (dettes)
                  </p>
                  <p className="mb-3">
                    <strong>Actifs</strong> : argent en banque, REER, CELI, valeur de votre maison, auto, placements
                  </p>
                  <p className="mb-3">
                    <strong>Dettes</strong> : hypothèque, prêt auto, cartes de crédit, prêt étudiant
                  </p>
                  <p>
                    Une valeur nette négative n'est pas rare au début de la vie adulte (prêt étudiant, hypothèque). L'objectif est de la faire augmenter avec le temps!
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="networth-2" className="border rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  Mes données financières sont-elles en sécurité ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p className="mb-3">
                    Oui, la sécurité de vos données est notre priorité absolue :
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Vos données sont chiffrées et stockées de manière sécurisée</li>
                    <li>Nous ne partageons jamais vos informations avec des tiers</li>
                    <li>Vous êtes le seul à avoir accès à vos données financières</li>
                    <li>Vous pouvez supprimer votre compte et vos données à tout moment</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="tools-1" className="border rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  Les outils sont-ils vraiment gratuits ?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <p className="mb-3">
                    Oui! Tous nos outils financiers sont 100% gratuits :
                  </p>
                  <ul className="list-disc pl-6 space-y-2 mb-4">
                    <li>Calculateur de salaire net québécois</li>
                    <li>Calculateur de retour d'impôt</li>
                    <li>Planificateur de budget complet</li>
                    <li>Suivi de valeur nette</li>
                    <li>Objectifs d'épargne</li>
                  </ul>
                  <p>
                    Pas de frais cachés, pas d'abonnement obligatoire. Notre mission est d'aider les Québécois à mieux gérer leurs finances.
                  </p>
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
              <h2 className="text-3xl font-bold">Glossaire Financier</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PiggyBank className="h-5 w-5 text-primary" />
                    Budget
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Plan qui organise vos revenus et dépenses pour une période donnée (généralement un mois). 
                    Un bon budget vous aide à vivre selon vos moyens et atteindre vos objectifs financiers.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Valeur nette
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    La différence entre vos actifs (ce que vous possédez) et vos passifs (ce que vous devez). 
                    C'est le meilleur indicateur de votre santé financière globale.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Salaire brut</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Le montant total de votre rémunération avant les déductions (impôts, cotisations sociales). 
                    C'est généralement le montant indiqué dans votre contrat de travail.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Salaire net</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Le montant que vous recevez réellement dans votre compte bancaire après toutes les déductions. 
                    C'est l'argent que vous pouvez dépenser ou épargner.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>REER</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Régime enregistré d'épargne-retraite. Compte qui permet de reporter l'impôt sur vos cotisations 
                    jusqu'au retrait (idéalement à la retraite quand vos revenus sont plus bas).
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>CELI</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Compte d'épargne libre d'impôt. Les gains réalisés dans ce compte ne sont jamais imposés. 
                    Parfait pour épargner pour des projets à court ou moyen terme.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>RRQ</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Régime de rentes du Québec. Cotisation obligatoire prélevée sur votre salaire qui vous donnera 
                    droit à une rente de retraite. Équivalent du RPC pour le reste du Canada.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>RQAP</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Régime québécois d'assurance parentale. Cotisation obligatoire qui finance les congés parentaux 
                    au Québec (maternité, paternité, adoption).
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Fonds d'urgence</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Argent mis de côté pour les imprévus (perte d'emploi, réparations, urgences). 
                    Recommandé : 3 à 6 mois de dépenses essentielles dans un compte facilement accessible.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Taux d'épargne</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Pourcentage de vos revenus que vous épargnez chaque mois. Un bon objectif est de viser 
                    au moins 20% de vos revenus, mais tout montant d'épargne est un bon début.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Dépenses fixes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Dépenses qui reviennent chaque mois au même montant : loyer/hypothèque, assurances, 
                    abonnements, paiements de dettes. Plus faciles à budgéter.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Dépenses variables</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Dépenses qui changent d'un mois à l'autre : épicerie, essence, restaurants, loisirs. 
                    C'est généralement là où vous pouvez ajuster pour économiser plus.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Calculator className="w-16 h-16 text-primary mx-auto" />
            <h2 className="text-3xl font-bold">Prêt à prendre le contrôle de vos finances ?</h2>
            <p className="text-lg text-muted-foreground">
              Nos outils gratuits vous aident à calculer votre salaire net, estimer votre retour d'impôt 
              et créer un budget personnalisé.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/outils">
                <Button size="lg" className="w-full sm:w-auto">
                  Découvrir les outils gratuits
                </Button>
              </Link>
              <Link to="/budget">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Créer mon budget
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQ;