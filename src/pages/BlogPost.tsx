import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import blogEvaluation from "@/assets/blog-evaluation-entreprise.jpg";
import blogAcheter from "@/assets/blog-acheter-entreprise.jpg";
import blogFinancement from "@/assets/blog-financement.jpg";
import blogDueDiligence from "@/assets/blog-due-diligence.jpg";
import blogTendances from "@/assets/blog-tendances-2025.jpg";
import blogPreparer from "@/assets/blog-preparer-vente.jpg";

interface BlogPostData {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  image: string;
  content: string;
}

const blogPostsData: Record<string, BlogPostData> = {
  "guide-complet-vendre-entreprise-quebec": {
    slug: "guide-complet-vendre-entreprise-quebec",
    title: "Guide Complet pour Vendre Votre Entreprise au Québec en 2025",
    excerpt: "Découvrez les 10 étapes essentielles pour vendre votre entreprise avec succès au Québec.",
    date: "2025-01-15",
    readTime: "8 min",
    category: "Guide Vendeur",
    image: blogPreparer,
    content: `
<h2>Introduction</h2>
<p>Vendre son entreprise est une décision majeure qui nécessite une préparation minutieuse. Au Québec, le marché des PME est dynamique, mais pour maximiser la valeur de votre commerce et attirer les bons acheteurs, il faut suivre une démarche structurée.</p>

<h2>1. Évaluation de Votre Entreprise</h2>
<p>La première étape consiste à faire évaluer votre entreprise par un professionnel. Au Québec, plusieurs méthodes sont utilisées : la valeur des actifs nets, la capitalisation des bénéfices et l'analyse des flux de trésorerie. Un évaluateur agréé pourra vous donner un portrait réaliste de ce que vaut vraiment votre commerce.</p>

<h2>2. Préparer les États Financiers</h2>
<p>Les acheteurs sérieux vont vouloir éplucher vos finances. Assurez-vous d'avoir des états financiers à jour et vérifiés par un comptable. Au Québec, c'est essentiel d'avoir ses papiers en ordre, incluant les déclarations de taxes (TPS/TVQ), les relevés Revenu Québec et vos états de résultats des 3 dernières années minimum.</p>

<h2>3. Mettre de l'Ordre dans vos Documents Légaux</h2>
<p>Rassemblez tous vos documents importants : contrats de location, accords avec les fournisseurs, licences d'exploitation, permis municipaux, etc. Une entreprise avec une documentation claire et complète inspire confiance aux acheteurs potentiels.</p>

<h2>4. Optimiser les Opérations</h2>
<p>Avant de mettre votre entreprise en vente, assurez-vous qu'elle roule bien. Documentez vos processus, formez votre équipe et assurez-vous que le commerce peut fonctionner sans vous. Les acheteurs recherchent des entreprises qui peuvent continuer à générer des profits après la transaction.</p>

<h2>5. Choisir le Bon Moment</h2>
<p>Le timing est crucial. Idéalement, vendez quand vos résultats financiers sont en croissance. Au Québec, certaines périodes de l'année sont plus propices selon votre secteur d'activité. Les restaurants, par exemple, se vendent mieux au printemps qu'en hiver.</p>

<h2>6. Déterminer un Prix Réaliste</h2>
<p>Ne surévaluez pas votre entreprise. Un prix trop élevé va faire fuir les acheteurs sérieux. Basez-vous sur l'évaluation professionnelle et sur les comparables dans votre secteur au Québec.</p>

<h2>7. Préparer un Mémorandum de Vente</h2>
<p>Ce document présente votre entreprise sous son meilleur jour. Il doit inclure l'historique, les forces, les opportunités de croissance, les états financiers résumés et tout ce qui peut convaincre un acheteur que votre commerce est une bonne affaire.</p>

<h2>8. Maintenir la Confidentialité</h2>
<p>Vous ne voulez pas que vos employés, clients ou fournisseurs apprennent que vous vendez avant le moment opportun. Utilisez des accords de confidentialité et travaillez avec des professionnels discrets.</p>

<h2>9. Négocier avec Sagesse</h2>
<p>Soyez prêt à négocier, mais connaissez votre prix plancher. Les acheteurs vont souvent essayer d'obtenir un rabais après la vérification diligente. Ayez une marge de manœuvre, mais ne bradez pas votre entreprise.</p>

<h2>10. Bien S'Entourer</h2>
<p>Faites appel à des professionnels : comptable, avocat spécialisé en transactions commerciales, courtier d'affaires. Au Québec, ces experts connaissent les particularités légales et fiscales qui peuvent faire toute la différence dans une transaction réussie.</p>

<h2>Conclusion</h2>
<p>Vendre une entreprise au Québec demande du temps et de la préparation, mais en suivant ces étapes, vous maximisez vos chances de conclure une transaction profitable et sans tracas. Prenez le temps de bien faire les choses et vous serez récompensé.</p>
    `
  },
  "acheter-premiere-entreprise-conseils": {
    slug: "acheter-premiere-entreprise-conseils",
    title: "Acheter sa Première Entreprise : 7 Conseils d'Experts",
    excerpt: "Conseils pratiques pour réussir l'achat de votre première entreprise au Québec.",
    date: "2025-01-10",
    readTime: "6 min",
    category: "Guide Acheteur",
    image: blogAcheter,
    content: `
<h2>Introduction</h2>
<p>Acheter sa première entreprise est excitant, mais ça peut aussi être stressant. Au Québec, le marché des PME offre plein d'opportunités, mais il faut savoir comment s'y prendre pour éviter les pièges.</p>

<h2>1. Connaître Vos Capacités Financières</h2>
<p>Avant même de commencer à magasiner, déterminez combien vous pouvez investir. Calculez votre mise de fonds, explorez les options de financement disponibles au Québec (prêts bancaires, BDC, Investissement Québec) et prévoyez un coussin pour les imprévus.</p>

<h2>2. Choisir le Bon Secteur d'Activité</h2>
<p>Achetez dans un domaine que vous connaissez ou qui vous passionne. Si vous n'avez aucune expérience dans le secteur, assurez-vous d'avoir accès à des ressources ou à du mentorat. Au Québec, plusieurs organismes comme les SADC peuvent vous accompagner.</p>

<h2>3. Faire une Vérification Diligente Rigoureuse</h2>
<p>Ne vous fiez jamais uniquement aux chiffres présentés par le vendeur. Engagez un comptable pour vérifier les états financiers, analysez les contrats importants, et parlez aux employés clés si possible. Au Québec, vérifiez aussi le respect des normes de la CNESST et de Revenu Québec.</p>

<h2>4. Évaluer le Potentiel de Croissance</h2>
<p>Une entreprise qui stagne peut être un bon deal si vous avez un plan pour la faire grandir. Identifiez les opportunités : nouveaux marchés, amélioration des opérations, diversification des produits. Pensez à long terme.</p>

<h2>5. Négocier Intelligemment</h2>
<p>Le prix affiché n'est souvent qu'un point de départ. Négociez en vous basant sur des faits concrets découverts lors de votre vérification. Au Québec, il est courant de négocier des clauses d'ajustement de prix basées sur la performance post-achat.</p>

<h2>6. Prévoir la Transition</h2>
<p>Assurez-vous d'avoir une période de formation avec le vendeur. Idéalement, demandez qu'il reste disponible quelques mois après la vente pour faciliter la transition avec les clients, fournisseurs et employés.</p>

<h2>7. Protéger Vos Arrières</h2>
<p>Travaillez avec un avocat spécialisé en acquisitions d'entreprises. Il rédigera ou révisera le contrat de vente, s'assurera que vous êtes protégé contre les dettes cachées et veillera à ce que la transaction respecte toutes les lois québécoises.</p>

<h2>Conclusion</h2>
<p>Acheter sa première entreprise au Québec est une aventure qui demande de la préparation et du courage. Suivez ces conseils, entourez-vous bien, et vous augmentez considérablement vos chances de succès.</p>
    `
  },
  "evaluation-entreprise-methodes": {
    slug: "evaluation-entreprise-methodes",
    title: "Comment Évaluer la Valeur d'une Entreprise : Les 3 Méthodes Clés",
    excerpt: "Les méthodes d'évaluation reconnues pour déterminer la vraie valeur d'une entreprise.",
    date: "2025-01-05",
    readTime: "10 min",
    category: "Évaluation",
    image: blogEvaluation,
    content: `
<h2>Introduction</h2>
<p>Évaluer une entreprise, c'est un art autant qu'une science. Au Québec, plusieurs méthodes sont utilisées pour déterminer combien vaut vraiment un commerce. Voici les trois approches principales.</p>

<h2>1. Méthode de l'Actif Net</h2>
<p>Cette méthode est simple : on prend la valeur de tous les actifs (équipements, inventaire, comptes clients) et on soustrait les dettes. C'est le strict minimum qu'une entreprise devrait valoir. Au Québec, cette méthode est souvent utilisée pour les entreprises en difficulté ou celles dont la valeur repose principalement sur leurs actifs tangibles.</p>

<h3>Quand l'utiliser?</h3>
<p>Cette approche convient bien aux entreprises manufacturières, aux commerces de détail avec beaucoup d'inventaire, ou aux entreprises en liquidation. Par contre, elle ne capture pas la valeur de l'achalandage, de la clientèle fidèle ou de la marque.</p>

<h2>2. Méthode des Multiples de Bénéfices</h2>
<p>C'est la méthode la plus populaire au Québec. On prend le bénéfice net ou l'EBITDA (bénéfice avant intérêts, impôts, dépréciation et amortissement) et on le multiplie par un coefficient qui varie selon l'industrie.</p>

<h3>Exemple concret</h3>
<p>Si votre restaurant génère 150 000$ de bénéfice net par année et que le multiple dans l'industrie est de 2,5x, votre commerce vaut environ 375 000$. Au Québec, les multiples varient généralement entre 2x et 5x selon le secteur et la stabilité des revenus.</p>

<h3>Facteurs qui influencent le multiple</h3>
<ul>
<li>La croissance des revenus</li>
<li>La dépendance au propriétaire</li>
<li>La diversification de la clientèle</li>
<li>La qualité des systèmes en place</li>
<li>La situation géographique</li>
</ul>

<h2>3. Méthode des Flux de Trésorerie Actualisés</h2>
<p>Cette méthode plus sophistiquée projette les flux de trésorerie futurs et les ramène à leur valeur actuelle. C'est comme demander : "Combien vaut aujourd'hui l'argent que cette entreprise va générer dans les prochaines années?"</p>

<h3>Pourquoi actualiser?</h3>
<p>Parce qu'un dollar aujourd'hui vaut plus qu'un dollar dans 5 ans. On applique un taux d'actualisation qui reflète le risque et le coût du capital. Au Québec, ce taux se situe souvent entre 15% et 25% pour les PME.</p>

<h3>Quand l'utiliser?</h3>
<p>Cette méthode est idéale pour les entreprises en croissance avec des projections financières fiables. Elle est moins appropriée pour les commerces établis dont les revenus sont stables et prévisibles.</p>

<h2>Ajustements Spécifiques au Québec</h2>
<p>Peu importe la méthode, n'oubliez pas de considérer:</p>
<ul>
<li>Les obligations linguistiques (Loi 101)</li>
<li>Les normes CNESST et les assurances</li>
<li>Les particularités fiscales québécoises</li>
<li>Les permis et licences municipaux</li>
</ul>

<h2>Conclusion</h2>
<p>L'évaluation d'une entreprise n'est pas une science exacte. Au Québec, il est sage de consulter un évaluateur agréé d'entreprise (EAE) qui pourra combiner ces méthodes et ajuster selon les particularités de votre situation.</p>
    `
  },
  "financer-achat-entreprise-options": {
    slug: "financer-achat-entreprise-options",
    title: "Financer l'Achat d'une Entreprise : Toutes les Options au Québec",
    excerpt: "Guide complet des solutions de financement disponibles au Québec pour acquérir une entreprise.",
    date: "2025-01-01",
    readTime: "7 min",
    category: "Financement",
    image: blogFinancement,
    content: `
<h2>Introduction</h2>
<p>Financer l'achat d'une entreprise au Québec peut sembler complexe, mais plusieurs options s'offrent à vous. Voici un tour d'horizon complet des solutions de financement disponibles.</p>

<h2>1. Prêt Bancaire Traditionnel</h2>
<p>Les banques canadiennes offrent des prêts pour l'acquisition d'entreprises, mais elles sont prudentes. Vous aurez généralement besoin d'une mise de fonds de 20% à 30% du prix d'achat. Les taux d'intérêt varient selon votre profil et les garanties offertes.</p>

<h3>Ce que les banques regardent</h3>
<ul>
<li>Votre expérience dans le domaine</li>
<li>Les états financiers de l'entreprise</li>
<li>Votre historique de crédit</li>
<li>Les garanties disponibles</li>
</ul>

<h2>2. Banque de Développement du Canada (BDC)</h2>
<p>La BDC est souvent plus flexible que les banques traditionnelles. Elle se spécialise dans le financement des PME québécoises et peut financer jusqu'à 90% du coût d'acquisition. Les taux sont compétitifs et les conseillers comprennent les réalités des entrepreneurs.</p>

<h2>3. Investissement Québec</h2>
<p>Ce partenaire financier du gouvernement du Québec offre différents programmes de financement pour les acquisitions d'entreprises. Les montants et conditions varient selon la taille de l'entreprise et le secteur d'activité.</p>

<h2>4. Balance de Prix de Vente</h2>
<p>C'est une des options les plus intéressantes au Québec. Le vendeur finance une partie du prix d'achat que vous remboursez sur quelques années. Ça prouve que le vendeur a confiance dans la viabilité de son entreprise et ça réduit votre besoin de financement externe.</p>

<h3>Avantages</h3>
<ul>
<li>Réduction de la mise de fonds requise</li>
<li>Processus plus rapide qu'avec une banque</li>
<li>Flexibilité dans les modalités</li>
</ul>

<h2>5. Programmes Gouvernementaux</h2>
<p>Au Québec, plusieurs programmes peuvent vous aider:</p>
<ul>
<li>Programme de garantie de prêts pour les PME</li>
<li>Fonds locaux d'investissement (FLI)</li>
<li>Sociétés d'aide au développement des collectivités (SADC)</li>
</ul>

<h2>6. Sociétés de Capital de Risque</h2>
<p>Pour les acquisitions de plus grande envergure avec un fort potentiel de croissance, les sociétés de capital de risque peuvent investir en échange d'une participation au capital. C'est moins commun pour les PME traditionnelles, mais ça reste une option.</p>

<h2>7. Partenaires Financiers</h2>
<p>Parfois, s'associer avec d'autres investisseurs permet de répartir le risque et d'augmenter votre capacité d'emprunt. Attention par contre à bien définir les rôles et responsabilités de chacun dans une convention d'actionnaires solide.</p>

<h2>Stratégie de Financement Mixte</h2>
<p>La meilleure approche combine souvent plusieurs sources:</p>
<ul>
<li>30% de mise de fonds personnelle</li>
<li>40% de prêt bancaire ou BDC</li>
<li>30% de balance de prix de vente</li>
</ul>

<h2>Conclusion</h2>
<p>Le financement d'une acquisition au Québec nécessite de la créativité et de la persévérance. N'hésitez pas à magasiner vos options et à vous faire accompagner par un comptable ou un conseiller financier spécialisé en transactions d'entreprises.</p>
    `
  },
  "due-diligence-checklist-complete": {
    slug: "due-diligence-checklist-complete",
    title: "Due Diligence : La Checklist Complète pour Acheteurs",
    excerpt: "Liste détaillée de tous les éléments à vérifier avant d'acheter une entreprise au Québec.",
    date: "2025-01-28",
    readTime: "12 min",
    category: "Acquisition",
    image: blogDueDiligence,
    content: `
<h2>Introduction</h2>
<p>La vérification diligente (due diligence) est l'étape cruciale qui vous protège contre les mauvaises surprises. Au Québec, voici tout ce que vous devez vérifier avant de signer.</p>

<h2>Vérification Financière</h2>
<h3>États financiers</h3>
<ul>
<li>Bilans des 3 à 5 dernières années</li>
<li>États des résultats détaillés</li>
<li>États des flux de trésorerie</li>
<li>Rapports d'impôts des dernières années</li>
</ul>

<h3>Revenus</h3>
<ul>
<li>Analyse des tendances de ventes</li>
<li>Saisonnalité des revenus</li>
<li>Dépendance à certains clients (risque de concentration)</li>
<li>Revenus récurrents vs ponctuels</li>
</ul>

<h3>Dépenses</h3>
<ul>
<li>Salaires et charges sociales</li>
<li>Loyer et conditions du bail</li>
<li>Coûts des marchandises vendues</li>
<li>Dépenses d'exploitation</li>
</ul>

<h2>Vérification Légale</h2>
<h3>Documents corporatifs</h3>
<ul>
<li>Certificat de constitution</li>
<li>Registre des actionnaires</li>
<li>Procès-verbaux des assemblées</li>
<li>Convention entre actionnaires</li>
</ul>

<h3>Conformité québécoise</h3>
<ul>
<li>Situation avec Revenu Québec (TPS/TVQ)</li>
<li>Conformité CNESST</li>
<li>Respect de la Loi 101 (affichage, francisation)</li>
<li>Permis d'exploitation municipaux</li>
<li>Licences spécifiques au secteur</li>
</ul>

<h2>Vérification Opérationnelle</h2>
<h3>Ressources humaines</h3>
<ul>
<li>Liste des employés et leurs fonctions</li>
<li>Contrats de travail</li>
<li>Convention collective (si syndiqué)</li>
<li>Historique de roulement du personnel</li>
<li>Compétences clés et dépendances</li>
</ul>

<h3>Clients et fournisseurs</h3>
<ul>
<li>Liste des 20 plus gros clients</li>
<li>Contrats avec les clients principaux</li>
<li>Relations avec les fournisseurs</li>
<li>Conditions de paiement et de crédit</li>
</ul>

<h2>Vérification des Actifs</h2>
<h3>Équipements et inventaire</h3>
<ul>
<li>Liste détaillée de tous les équipements</li>
<li>État de l'équipement et valeur marchande</li>
<li>Inventaire physique et rotation</li>
<li>Obsolescence de certains items</li>
</ul>

<h3>Propriété intellectuelle</h3>
<ul>
<li>Marques de commerce</li>
<li>Noms de domaine et sites web</li>
<li>Brevets ou droits d'auteur</li>
<li>Listes de clients et bases de données</li>
</ul>

<h2>Vérification du Bail Commercial</h2>
<p>Au Québec, le bail est souvent un élément critique:</p>
<ul>
<li>Durée restante et options de renouvellement</li>
<li>Montant du loyer et augmentations prévues</li>
<li>Possibilité de transférer le bail</li>
<li>Clauses particulières (exclusivité, heures d'ouverture)</li>
<li>État des lieux et responsabilités d'entretien</li>
</ul>

<h2>Vérification de la Réputation</h2>
<ul>
<li>Avis en ligne et réputation sur les réseaux sociaux</li>
<li>Plaintes auprès de l'Office de la protection du consommateur</li>
<li>Litiges en cours ou passés</li>
<li>Relations avec la communauté</li>
</ul>

<h2>Red Flags à Surveiller</h2>
<p>Soyez particulièrement vigilant si vous remarquez:</p>
<ul>
<li>Refus du vendeur de fournir certains documents</li>
<li>Baisse soudaine des revenus récents</li>
<li>Roulement élevé d'employés clés</li>
<li>Dettes cachées ou contentieux non divulgués</li>
<li>Dépendance totale au propriétaire actuel</li>
</ul>

<h2>Conclusion</h2>
<p>La vérification diligente peut sembler longue et coûteuse, mais c'est un investissement essentiel. Au Québec, engagez un comptable et un avocat expérimentés en transactions d'entreprises pour vous accompagner. Mieux vaut investir quelques milliers de dollars maintenant que de perdre des centaines de milliers plus tard.</p>
    `
  },
  "secteurs-porteurs-quebec-2025": {
    slug: "secteurs-porteurs-quebec-2025",
    title: "Les Secteurs les Plus Porteurs pour Investir au Québec en 2025",
    excerpt: "Analyse des industries prometteuses pour l'acquisition d'entreprises au Québec.",
    date: "2025-01-20",
    readTime: "9 min",
    category: "Tendances",
    image: blogTendances,
    content: `
<h2>Introduction</h2>
<p>Le marché québécois des PME évolue rapidement. En 2025, certains secteurs offrent des opportunités particulièrement intéressantes pour les acheteurs d'entreprises. Voici notre analyse des industries porteuses.</p>

<h2>1. Technologies de l'Information</h2>
<p>Le Québec connaît un boom technologique, particulièrement à Montréal et Québec. Les entreprises de développement de logiciels, de cybersécurité et d'intelligence artificielle sont en forte demande.</p>

<h3>Pourquoi c'est porteur</h3>
<ul>
<li>Croissance rapide du secteur</li>
<li>Main-d'œuvre qualifiée disponible</li>
<li>Soutien gouvernemental important</li>
<li>Marges bénéficiaires élevées</li>
</ul>

<h3>À surveiller</h3>
<p>La rétention des talents et la compétition féroce pour les développeurs expérimentés peuvent représenter des défis.</p>

<h2>2. Santé et Services aux Aînés</h2>
<p>Avec le vieillissement de la population québécoise, tout ce qui touche aux soins de santé et aux services aux aînés est en croissance. Cliniques privées, résidences pour personnes âgées, services de soins à domicile... les opportunités sont nombreuses.</p>

<h3>Opportunités spécifiques</h3>
<ul>
<li>Cliniques dentaires et optométriques</li>
<li>Physiothérapie et réadaptation</li>
<li>Services de maintien à domicile</li>
<li>Technologies de télésanté</li>
</ul>

<h2>3. Alimentation et Restauration</h2>
<p>Les Québécois adorent bien manger! Le secteur alimentaire reste dynamique, surtout pour les concepts qui s'adaptent aux nouvelles habitudes de consommation.</p>

<h3>Tendances prometteuses</h3>
<ul>
<li>Restaurants avec service de livraison intégré</li>
<li>Produits locaux et bio</li>
<li>Concepts de restauration rapide santé</li>
<li>Microbrasseries et distilleries artisanales</li>
</ul>

<h3>Enjeux</h3>
<p>La pénurie de main-d'œuvre et les marges serrées demandent une gestion rigoureuse.</p>

<h2>4. Services Professionnels aux Entreprises</h2>
<p>Les PME québécoises ont constamment besoin de services spécialisés. Les entreprises de comptabilité, marketing numérique, consultation en RH et services légaux affichent une belle stabilité.</p>

<h3>Avantages</h3>
<ul>
<li>Revenus récurrents prévisibles</li>
<li>Faibles investissements en équipement</li>
<li>Possibilité de travailler à distance</li>
<li>Clientèle diversifiée</li>
</ul>

<h2>5. Construction et Rénovation</h2>
<p>Le secteur de la construction résidentielle et commerciale au Québec demeure robuste. La demande pour les services de rénovation, particulièrement les projets écoénergétiques, est en hausse.</p>

<h3>Opportunités de niche</h3>
<ul>
<li>Rénovations écoresponsables</li>
<li>Toitures et isolation thermique</li>
<li>Aménagement de sous-sols</li>
<li>Services spécialisés (fenêtres, revêtements)</li>
</ul>

<h2>6. Commerce en Ligne et E-commerce</h2>
<p>Les habitudes d'achat des Québécois ont changé. Les entreprises qui combinent boutique physique et présence en ligne performent particulièrement bien.</p>

<h3>Modèles gagnants</h3>
<ul>
<li>Produits de niche avec forte marge</li>
<li>Abonnements récurrents</li>
<li>Modèle dropshipping optimisé</li>
<li>Plateforme B2B spécialisée</li>
</ul>

<h2>7. Services Environnementaux</h2>
<p>L'économie verte est en plein essor au Québec. Les entreprises qui aident d'autres organisations à réduire leur empreinte écologique ont le vent dans les voiles.</p>

<h3>Secteurs émergents</h3>
<ul>
<li>Gestion des matières résiduelles</li>
<li>Consultation en efficacité énergétique</li>
<li>Installation de bornes de recharge électrique</li>
<li>Récupération et recyclage spécialisé</li>
</ul>

<h2>Facteurs de Succès Communs</h2>
<p>Peu importe le secteur, les entreprises qui réussissent au Québec partagent ces caractéristiques:</p>
<ul>
<li>Équipe solide et stable</li>
<li>Processus bien documentés</li>
<li>Présence numérique forte</li>
<li>Service client exceptionnel</li>
<li>Adaptation aux réalités québécoises</li>
</ul>

<h2>Conclusion</h2>
<p>L'année 2025 offre de belles opportunités aux acheteurs d'entreprises au Québec. Le secret? Choisir un secteur en croissance, mais surtout une entreprise bien gérée avec des fondations solides. Faites vos devoirs, entourez-vous bien, et vous trouverez la perle rare qui correspondra à vos objectifs.</p>
    `
  }
};

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const post = slug ? blogPostsData[slug] : null;

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Article non trouvé</h1>
          <Button onClick={() => navigate("/blog")}>Retour au blog</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={`${post.title} | Blog Vente.Club`}
        description={post.excerpt}
        keywords={`${post.category}, achat entreprise Québec, vente PME`}
        canonical={`/blog/${post.slug}`}
        type="article"
      />

      {/* Hero Image */}
      <div className="relative w-full h-[400px] overflow-hidden">
        <img 
          src={post.image} 
          alt={post.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Content */}
      <article className="container mx-auto px-4 -mt-32 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-2xl shadow-xl p-8 md:p-12">
            {/* Back Button */}
            <Button 
              variant="ghost" 
              onClick={() => navigate("/blog")}
              className="mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au blog
            </Button>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <span className="text-sm font-semibold text-accent">
                {post.category}
              </span>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {new Date(post.date).toLocaleDateString('fr-CA', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {post.readTime} de lecture
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              {post.title}
            </h1>

            {/* Excerpt */}
            <p className="text-xl text-muted-foreground mb-8 pb-8 border-b border-border">
              {post.excerpt}
            </p>

            {/* Content */}
            <div 
              className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-a:text-accent prose-strong:text-foreground prose-ul:text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* CTA */}
            <div className="mt-12 pt-8 border-t border-border">
              <div className="bg-gradient-to-br from-accent/10 to-primary/10 rounded-xl p-8 text-center">
                <h3 className="text-2xl font-bold mb-4">
                  Prêt à Passer à l'Action?
                </h3>
                <p className="text-muted-foreground mb-6">
                  Découvrez les opportunités d'affaires disponibles au Québec
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" onClick={() => navigate("/")} className="bg-accent hover:bg-accent/90">
                    Voir les Entreprises
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate("/list-business")}>
                    Vendre Mon Entreprise
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Disclaimer */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-muted/50 border border-border rounded-lg p-6">
            <p className="text-sm text-muted-foreground text-center">
              <strong className="text-foreground">Avertissement :</strong> Les articles de ce blog sont fournis à titre informatif uniquement. 
              Vente.Club ne garantit pas l'exactitude, l'exhaustivité ou la pertinence des informations présentées et n'est pas responsable du contenu publié. 
              Les lecteurs sont encouragés à consulter des professionnels qualifiés (comptables, avocats, conseillers financiers) pour des conseils spécifiques à leur situation.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BlogPost;
