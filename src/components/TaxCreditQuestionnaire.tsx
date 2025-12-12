import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  AlertCircle,
  Baby,
  Home,
  GraduationCap,
  Heart,
  Car,
  Briefcase,
  Users,
  DollarSign,
  Building,
  Stethoscope,
  BookOpen,
  Bus,
  Accessibility,
  Gift,
  Leaf
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CreditRecommendation {
  id: string;
  name: string;
  description: string;
  estimatedValue: string;
  icon: React.ElementType;
  category: string;
  eligibility: string[];
}

const CREDIT_RECOMMENDATIONS: Record<string, CreditRecommendation[]> = {
  enfants: [
    {
      id: "garde",
      name: "Frais de garde d'enfants",
      description: "Déduction pour les frais de garderie, camp de jour, service de garde",
      estimatedValue: "Jusqu'à 11 000$/enfant",
      icon: Baby,
      category: "Famille",
      eligibility: ["Enfant de moins de 16 ans", "Reçu officiel de garderie"]
    },
    {
      id: "activites",
      name: "Crédit pour activités des enfants (QC)",
      description: "Activités artistiques, culturelles ou sportives pour enfants de 5 à 16 ans",
      estimatedValue: "Jusqu'à 500$/enfant",
      icon: Users,
      category: "Famille",
      eligibility: ["Enfant de 5 à 16 ans", "Inscrit à un programme admissible"]
    },
    {
      id: "allocation",
      name: "Allocation famille Québec",
      description: "Prestation versée automatiquement selon le revenu familial",
      estimatedValue: "Variable selon revenus",
      icon: Heart,
      category: "Famille",
      eligibility: ["Résider au Québec", "Enfant à charge"]
    },
    {
      id: "fournitures",
      name: "Crédit fournitures scolaires",
      description: "Déduction pour le matériel scolaire des enfants",
      estimatedValue: "Jusqu'à 100$/enfant",
      icon: BookOpen,
      category: "Famille",
      eligibility: ["Enfant en âge scolaire", "Factures d'achat"]
    }
  ],
  immobilier: [
    {
      id: "premiere-maison",
      name: "Crédit achat première habitation",
      description: "Montant fixe pour l'achat d'une première propriété",
      estimatedValue: "750$ QC + 1 500$ Fed",
      icon: Home,
      category: "Immobilier",
      eligibility: ["Première maison", "Achetée dans l'année"]
    },
    {
      id: "celiapp",
      name: "CELIAPP - Compte épargne première propriété",
      description: "Cotisations déductibles pour l'achat d'une première maison",
      estimatedValue: "Jusqu'à 8 000$/an",
      icon: Building,
      category: "Immobilier",
      eligibility: ["N'avoir jamais été propriétaire", "Maximum 40 000$ viager"]
    },
    {
      id: "renovation-ecolo",
      name: "RénoVert et crédits rénovation écoénergétique",
      description: "Rénovations pour améliorer l'efficacité énergétique",
      estimatedValue: "Variable selon travaux",
      icon: Leaf,
      category: "Immobilier",
      eligibility: ["Travaux admissibles", "Entrepreneur qualifié"]
    },
    {
      id: "accessibilite",
      name: "Crédit rénovation accessibilité domiciliaire",
      description: "Modifications pour personnes âgées ou à mobilité réduite",
      estimatedValue: "Jusqu'à 10 000$",
      icon: Accessibility,
      category: "Immobilier",
      eligibility: ["Personne de 65+ ans ou handicapée", "Travaux admissibles"]
    },
    {
      id: "taxes-foncieres",
      name: "Remboursement de taxes foncières",
      description: "Crédit pour propriétaires à faible revenu",
      estimatedValue: "Variable selon revenu",
      icon: Home,
      category: "Immobilier",
      eligibility: ["Revenu modeste", "Propriétaire occupant"]
    }
  ],
  emploi: [
    {
      id: "teletravail",
      name: "Déduction pour télétravail",
      description: "Frais de bureau à domicile si vous travaillez de la maison",
      estimatedValue: "2$/jour ou frais réels",
      icon: Briefcase,
      category: "Emploi",
      eligibility: ["Télétravail > 50% du temps", "Employeur ne rembourse pas"]
    },
    {
      id: "transport",
      name: "Crédit transport en commun (QC)",
      description: "Abonnements mensuels ou annuels de transport collectif",
      estimatedValue: "20% des frais",
      icon: Bus,
      category: "Emploi",
      eligibility: ["Passes STM, RTL, STL, etc.", "Reçus officiels"]
    },
    {
      id: "ftq",
      name: "REER FTQ/Fondaction",
      description: "Crédit additionnel de 30% sur les cotisations",
      estimatedValue: "Jusqu'à 1 500$",
      icon: DollarSign,
      category: "Emploi",
      eligibility: ["Maximum 5 000$ cotisation", "Fonds de travailleurs"]
    },
    {
      id: "outils",
      name: "Déduction pour outils de gens de métier",
      description: "Achat d'outils requis pour votre emploi",
      estimatedValue: "Jusqu'à 500$",
      icon: Briefcase,
      category: "Emploi",
      eligibility: ["Travailleur qualifié", "Outils non remboursés"]
    },
    {
      id: "deplacement",
      name: "Frais de déplacement pour travail",
      description: "Véhicule utilisé pour le travail (pas trajet domicile-bureau)",
      estimatedValue: "Variable selon km",
      icon: Car,
      category: "Emploi",
      eligibility: ["Véhicule requis pour travail", "Journal de bord"]
    },
    {
      id: "syndicales",
      name: "Cotisations syndicales et professionnelles",
      description: "Cotisations obligatoires à un syndicat ou ordre professionnel",
      estimatedValue: "100% déductible",
      icon: Users,
      category: "Emploi",
      eligibility: ["Cotisations obligatoires", "Reçu officiel"]
    }
  ],
  etudes: [
    {
      id: "frais-scolarite",
      name: "Frais de scolarité",
      description: "Université, cégep, formation professionnelle admissible",
      estimatedValue: "8% QC + 15% Fed",
      icon: GraduationCap,
      category: "Études",
      eligibility: ["Établissement reconnu", "Formulaire T2202"]
    },
    {
      id: "interets-prets",
      name: "Intérêts sur prêts étudiants",
      description: "Intérêts payés sur prêts gouvernementaux (AFE)",
      estimatedValue: "8% QC + 15% Fed",
      icon: BookOpen,
      category: "Études",
      eligibility: ["Prêts AFE/gouvernementaux", "Intérêts de l'année"]
    },
    {
      id: "manuels",
      name: "Crédit pour manuels et fournitures",
      description: "Matériel scolaire pour études postsecondaires",
      estimatedValue: "Variable",
      icon: BookOpen,
      category: "Études",
      eligibility: ["Étudiant inscrit", "Reçus d'achat"]
    },
    {
      id: "examen",
      name: "Frais d'examen professionnel",
      description: "Examens pour obtenir un titre professionnel",
      estimatedValue: "15% fédéral",
      icon: GraduationCap,
      category: "Études",
      eligibility: ["Examen reconnu", "Reçu officiel"]
    }
  ],
  sante: [
    {
      id: "frais-medicaux",
      name: "Frais médicaux",
      description: "Médicaments, soins dentaires, lunettes, physiothérapie, etc.",
      estimatedValue: "Variable",
      icon: Stethoscope,
      category: "Santé",
      eligibility: ["Dépassent 3% du revenu", "Reçus conservés"]
    },
    {
      id: "aidant-naturel",
      name: "Crédit pour aidant naturel",
      description: "Proche aidant d'une personne ayant une déficience",
      estimatedValue: "Jusqu'à 1 250$",
      icon: Heart,
      category: "Santé",
      eligibility: ["Soutien régulier", "Personne à charge"]
    },
    {
      id: "handicap",
      name: "Crédit pour personnes handicapées",
      description: "Déficience physique ou mentale prolongée",
      estimatedValue: "Crédit significatif",
      icon: Accessibility,
      category: "Santé",
      eligibility: ["Formulaire T2201", "Certification médicale"]
    },
    {
      id: "reei",
      name: "Régime enregistré d'épargne-invalidité (REEI)",
      description: "Épargne bonifiée par le gouvernement pour personnes handicapées",
      estimatedValue: "Subventions + Bons",
      icon: Accessibility,
      category: "Santé",
      eligibility: ["Crédit handicap approuvé", "Moins de 60 ans"]
    },
    {
      id: "maintien-domicile",
      name: "Crédit maintien à domicile (65+)",
      description: "Services de maintien à domicile pour aînés",
      estimatedValue: "Jusqu'à 35% des frais",
      icon: Home,
      category: "Santé",
      eligibility: ["70 ans et plus", "Services admissibles"]
    }
  ],
  autre: [
    {
      id: "dons",
      name: "Dons de charité",
      description: "Dons à des organismes de bienfaisance enregistrés",
      estimatedValue: "15-33% selon montant",
      icon: Gift,
      category: "Autre",
      eligibility: ["Reçu officiel", "Organisme enregistré"]
    },
    {
      id: "reer",
      name: "Cotisations REER",
      description: "Réduisez votre revenu imposable et épargnez pour la retraite",
      estimatedValue: "Au taux marginal",
      icon: DollarSign,
      category: "Épargne",
      eligibility: ["Maximum 18% du revenu", "Droits inutilisés reportables"]
    },
    {
      id: "celi",
      name: "CELI - Compte d'épargne libre d'impôt",
      description: "Revenus de placement à l'abri de l'impôt",
      estimatedValue: "Croissance non imposée",
      icon: DollarSign,
      category: "Épargne",
      eligibility: ["Droits de cotisation", "7 000$/an en 2025"]
    },
    {
      id: "solidarite",
      name: "Crédit d'impôt pour solidarité (QC)",
      description: "Aide pour les frais de logement, TVQ et villages nordiques",
      estimatedValue: "Jusqu'à 1 400$/an",
      icon: Heart,
      category: "Autre",
      eligibility: ["Revenu modeste", "Inscription Revenu Québec"]
    },
    {
      id: "travailleurs",
      name: "Crédit d'impôt pour travailleurs",
      description: "Crédit pour les travailleurs à faible ou moyen revenu",
      estimatedValue: "Jusqu'à 1 200$",
      icon: Briefcase,
      category: "Autre",
      eligibility: ["Revenu de travail", "Automatique"]
    },
    {
      id: "pompiers",
      name: "Crédit pour pompiers volontaires/secouristes",
      description: "Volontaires ayant fait au moins 200h de service",
      estimatedValue: "3 000$",
      icon: Users,
      category: "Autre",
      eligibility: ["200+ heures de service", "Attestation"]
    },
    {
      id: "politique",
      name: "Contribution politique",
      description: "Dons à des partis politiques provinciaux ou fédéraux",
      estimatedValue: "Jusqu'à 75%",
      icon: Gift,
      category: "Autre",
      eligibility: ["Reçu officiel", "Parti enregistré"]
    }
  ]
};

const QUESTIONS = [
  {
    id: "enfants",
    question: "Avez-vous des enfants à charge?",
    icon: Baby,
    subQuestions: [
      "Payez-vous des frais de garderie ou camp de jour?",
      "Vos enfants participent-ils à des activités sportives ou culturelles?",
      "Recevez-vous l'allocation famille Québec?",
      "Avez-vous acheté des fournitures scolaires?"
    ]
  },
  {
    id: "immobilier",
    question: "Avez-vous acheté ou rénové une propriété?",
    icon: Home,
    subQuestions: [
      "Avez-vous acheté votre première maison cette année?",
      "Cotisez-vous au CELIAPP?",
      "Avez-vous fait des rénovations écoénergétiques?",
      "Avez-vous fait des rénovations pour l'accessibilité?",
      "Êtes-vous propriétaire à faible revenu?"
    ]
  },
  {
    id: "emploi",
    question: "Concernant votre emploi...",
    icon: Briefcase,
    subQuestions: [
      "Travaillez-vous de la maison (télétravail)?",
      "Utilisez-vous le transport en commun pour le travail?",
      "Cotisez-vous au Fonds FTQ ou Fondaction?",
      "Avez-vous acheté des outils pour votre métier?",
      "Utilisez-vous votre véhicule pour le travail?",
      "Payez-vous des cotisations syndicales ou professionnelles?"
    ]
  },
  {
    id: "etudes",
    question: "Êtes-vous aux études ou avez-vous des prêts étudiants?",
    icon: GraduationCap,
    subQuestions: [
      "Payez-vous des frais de scolarité?",
      "Avez-vous des prêts étudiants avec intérêts?",
      "Avez-vous acheté des manuels ou fournitures?",
      "Avez-vous passé un examen professionnel?"
    ]
  },
  {
    id: "sante",
    question: "Concernant la santé...",
    icon: Stethoscope,
    subQuestions: [
      "Avez-vous des frais médicaux importants non remboursés?",
      "Êtes-vous proche aidant d'une personne?",
      "Vous ou un proche avez-vous une déficience reconnue?",
      "Cotisez-vous à un REEI?",
      "Avez-vous 70+ ans et utilisez des services de maintien à domicile?"
    ]
  },
  {
    id: "autre",
    question: "Autres situations",
    icon: Gift,
    subQuestions: [
      "Faites-vous des dons à des organismes de charité?",
      "Cotisez-vous à un REER?",
      "Cotisez-vous à un CELI?",
      "Êtes-vous éligible au crédit pour solidarité?",
      "Avez-vous un revenu de travail modeste?",
      "Êtes-vous pompier volontaire ou secouriste?",
      "Avez-vous fait des dons à un parti politique?"
    ]
  }
];

export const TaxCreditQuestionnaire = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean[]>>({});
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = QUESTIONS[currentStep];

  const handleAnswer = (subIndex: number) => {
    const key = currentQuestion.id;
    const currentAnswers = answers[key] || Array(currentQuestion.subQuestions.length).fill(false);
    const newAnswers = [...currentAnswers];
    newAnswers[subIndex] = !newAnswers[subIndex];
    setAnswers({ ...answers, [key]: newAnswers });
  };

  const nextStep = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowResults(true);
    }
  };

  const prevStep = () => {
    if (showResults) {
      setShowResults(false);
    } else if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getRecommendations = (): CreditRecommendation[] => {
    const recommendations: CreditRecommendation[] = [];
    
    Object.entries(answers).forEach(([categoryId, categoryAnswers]) => {
      const credits = CREDIT_RECOMMENDATIONS[categoryId];
      if (credits && categoryAnswers.some(a => a)) {
        categoryAnswers.forEach((answered, idx) => {
          if (answered && credits[idx]) {
            recommendations.push(credits[idx]);
          }
        });
      }
    });

    return recommendations;
  };

  const recommendations = getRecommendations();

  const reset = () => {
    setCurrentStep(0);
    setAnswers({});
    setShowResults(false);
  };

  if (showResults) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-6 w-6 text-primary" />
            Vos crédits d'impôt potentiels
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Basé sur vos réponses, voici les crédits que vous pourriez réclamer
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {recommendations.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Aucun crédit spécifique identifié. N'hésitez pas à consulter un expert fiscal pour une analyse complète.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations.map((credit) => (
                <div 
                  key={credit.id}
                  className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <credit.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-foreground">{credit.name}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {credit.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {credit.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">Valeur estimée:</span>
                        <span className="text-sm font-semibold text-primary">{credit.estimatedValue}</span>
                      </div>
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground mb-1">Conditions d'admissibilité:</p>
                        <ul className="text-xs text-muted-foreground space-y-0.5">
                          {credit.eligibility.map((cond, i) => (
                            <li key={i} className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-primary" />
                              {cond}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-border">
            <Button variant="outline" onClick={prevStep} className="flex-1">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Retour
            </Button>
            <Button onClick={reset} className="flex-1">
              Recommencer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-6 w-6 text-primary" />
            Maximisez votre retour d'impôt
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {currentStep + 1} / {QUESTIONS.length}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Répondez à quelques questions pour découvrir les crédits que vous pourriez réclamer
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className="bg-primary rounded-full h-2 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / QUESTIONS.length) * 100}%` }}
          />
        </div>

        {/* Question */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <currentQuestion.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {currentQuestion.question}
            </h3>
          </div>

          <div className="space-y-3 pl-2">
            {currentQuestion.subQuestions.map((subQ, idx) => {
              const isChecked = answers[currentQuestion.id]?.[idx] || false;
              return (
                <div 
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                    isChecked 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <Checkbox 
                    checked={isChecked}
                    onCheckedChange={() => handleAnswer(idx)}
                    className="h-5 w-5"
                  />
                  <Label className="cursor-pointer flex-1 text-sm">
                    {subQ}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button 
            variant="outline" 
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex-1"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Précédent
          </Button>
          <Button onClick={nextStep} className="flex-1">
            {currentStep === QUESTIONS.length - 1 ? (
              <>
                Voir mes crédits
                <Sparkles className="h-4 w-4 ml-1" />
              </>
            ) : (
              <>
                Suivant
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
