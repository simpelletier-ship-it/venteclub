import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, ArrowRight, ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TutorialStep {
  target: string;
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
  highlight?: boolean;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    target: "welcome",
    title: "👋 Bienvenue dans votre planificateur budgétaire !",
    description: "Nous allons vous guider pour ajouter votre première dépense en quelques étapes simples.",
    position: "bottom",
  },
  {
    target: "transaction-type",
    title: "💰 Type de transaction",
    description: "Choisissez si vous ajoutez une dépense (argent sorti) ou un revenu (argent entré).",
    position: "bottom",
    highlight: true,
  },
  {
    target: "amount-input",
    title: "💵 Montant",
    description: "Entrez le montant de votre dépense. Par exemple : 45 pour 45$.",
    position: "bottom",
    highlight: true,
  },
  {
    target: "category-buttons",
    title: "📂 Catégorie",
    description: "Cliquez sur une catégorie rapide ou choisissez 'Autre catégorie...' pour plus d'options.",
    position: "top",
    highlight: true,
  },
  {
    target: "date-picker",
    title: "📅 Date",
    description: "La date d'aujourd'hui est déjà sélectionnée, mais vous pouvez la changer si besoin.",
    position: "bottom",
    highlight: true,
  },
  {
    target: "description-input",
    title: "📝 Description (facultatif)",
    description: "Ajoutez des détails si vous voulez vous en souvenir plus tard. Par exemple : 'Épicerie IGA'.",
    position: "bottom",
    highlight: true,
  },
  {
    target: "add-button",
    title: "✅ Ajouter la dépense",
    description: "Cliquez ici pour enregistrer votre dépense. C'est tout !",
    position: "top",
    highlight: true,
  },
  {
    target: "complete",
    title: "🎉 Bravo ! Vous êtes prêt !",
    description: "Vous pouvez maintenant gérer votre budget facilement. Bon contrôle de vos finances !",
    position: "bottom",
  },
];

export function BudgetTutorial() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà vu le tutoriel
    const completed = localStorage.getItem("budget-tutorial-completed");
    if (!completed) {
      // Petit délai pour que la page se charge complètement
      setTimeout(() => setIsActive(true), 1000);
    } else {
      setHasCompletedTutorial(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTutorial = () => {
    localStorage.setItem("budget-tutorial-completed", "true");
    setIsActive(false);
    setHasCompletedTutorial(true);
  };

  const skipTutorial = () => {
    localStorage.setItem("budget-tutorial-completed", "true");
    setIsActive(false);
    setHasCompletedTutorial(true);
  };

  const restartTutorial = () => {
    setCurrentStep(0);
    setIsActive(true);
  };

  const step = TUTORIAL_STEPS[currentStep];

  if (!isActive && !hasCompletedTutorial) return null;

  return (
    <>
      {/* Overlay sombre */}
      <AnimatePresence>
        {isActive && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
              onClick={skipTutorial}
            />

            {/* Highlight de l'élément cible */}
            {step.highlight && step.target !== "welcome" && step.target !== "complete" && (
              <motion.div
                key={step.target}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed z-[9999] pointer-events-none"
                style={{
                  boxShadow: "0 0 0 4px hsl(var(--primary)), 0 0 0 9999px rgba(0,0,0,0.6)",
                  borderRadius: "8px",
                }}
                id={`tutorial-highlight-${step.target}`}
              />
            )}

            {/* Bulle de tutoriel */}
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="fixed z-[10000]"
              style={{
                left: "50%",
                top: step.target === "welcome" || step.target === "complete" ? "50%" : "20%",
                transform: step.target === "welcome" || step.target === "complete" ? "translate(-50%, -50%)" : "translateX(-50%)",
              }}
            >
              <Card className="p-6 max-w-md shadow-2xl border-primary/20 bg-background">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                    <h3 className="text-lg font-bold">{step.title}</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 -mt-1 -mr-1"
                    onClick={skipTutorial}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {step.description}
                </p>

                {/* Indicateur de progression */}
                <div className="flex gap-1 mb-4">
                  {TUTORIAL_STEPS.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        index <= currentStep ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Étape {currentStep + 1} sur {TUTORIAL_STEPS.length}
                  </div>

                  <div className="flex gap-2">
                    {currentStep > 0 && step.target !== "welcome" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrevious}
                      >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Retour
                      </Button>
                    )}

                    <Button
                      size="sm"
                      onClick={handleNext}
                      className="gap-1"
                    >
                      {currentStep === TUTORIAL_STEPS.length - 1 ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Terminer
                        </>
                      ) : (
                        <>
                          Suivant
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {currentStep === 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-3 text-muted-foreground"
                    onClick={skipTutorial}
                  >
                    Passer le tutoriel
                  </Button>
                )}
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bouton pour relancer le tutoriel */}
      {hasCompletedTutorial && !isActive && (
        <Button
          variant="outline"
          size="sm"
          className="fixed bottom-4 right-4 z-50 gap-2"
          onClick={restartTutorial}
        >
          <Sparkles className="w-4 h-4" />
          Revoir le tutoriel
        </Button>
      )}
    </>
  );
}
