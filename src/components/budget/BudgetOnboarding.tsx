import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, ArrowLeft, CheckCircle2, Target, DollarSign, TrendingUp, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Checkbox } from "@/components/ui/checkbox";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: any;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "👋 Bienvenue dans votre planificateur !",
    description: "Répondez à quelques questions pour personnaliser votre expérience",
    icon: Sparkles,
  },
  {
    id: "income",
    title: "💰 Vos revenus mensuels",
    description: "Combien gagnez-vous approximativement par mois ?",
    icon: DollarSign,
  },
  {
    id: "goals",
    title: "🎯 Vos objectifs financiers",
    description: "Qu'aimeriez-vous accomplir ?",
    icon: Target,
  },
  {
    id: "categories",
    title: "📂 Vos dépenses principales",
    description: "Sélectionnez vos catégories de dépenses courantes",
    icon: TrendingUp,
  },
  {
    id: "complete",
    title: "✨ Configuration terminée !",
    description: "Votre planificateur est prêt à l'emploi",
    icon: CheckCircle2,
  },
];

const COMMON_GOALS = [
  { id: "emergency-fund", name: "Fonds d'urgence", icon: "🛡️", targetAmount: 5000 },
  { id: "vacation", name: "Vacances", icon: "✈️", targetAmount: 3000 },
  { id: "car", name: "Nouvelle voiture", icon: "🚗", targetAmount: 15000 },
  { id: "house", name: "Mise de fond maison", icon: "🏠", targetAmount: 50000 },
  { id: "debt", name: "Remboursement dettes", icon: "💳", targetAmount: 10000 },
  { id: "retirement", name: "Retraite (REER)", icon: "👴", targetAmount: 100000 },
];

const COMMON_EXPENSE_CATEGORIES = [
  { name: "Alimentation", icon: "🍔", color: "#ef4444" },
  { name: "Transport", icon: "🚗", color: "#f59e0b" },
  { name: "Logement", icon: "🏠", color: "#8b5cf6" },
  { name: "Divertissement", icon: "🎬", color: "#ec4899" },
  { name: "Santé", icon: "💊", color: "#10b981" },
  { name: "Vêtements", icon: "👕", color: "#3b82f6" },
  { name: "Éducation", icon: "📚", color: "#6366f1" },
  { name: "Restaurant", icon: "🍽️", color: "#f97316" },
];

export function BudgetOnboarding() {
  const queryClient = useQueryClient();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      const completed = localStorage.getItem("budget-onboarding-completed");
      if (!completed) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Check if user already has data
          const { data: categories } = await supabase
            .from('budget_categories')
            .select('id')
            .limit(1);
          
          const { data: goals } = await supabase
            .from('financial_goals')
            .select('id')
            .limit(1);

          // Only show onboarding if user has no data
          if (!categories?.length && !goals?.length) {
            setTimeout(() => setIsActive(true), 500);
          } else {
            localStorage.setItem("budget-onboarding-completed", "true");
          }
        }
      }
    };

    checkOnboarding();
  }, []);

  // Auto-scroll to actions when on goals or categories step
  useEffect(() => {
    const step = ONBOARDING_STEPS[currentStep];
    if ((step.id === "goals" || step.id === "categories") && actionsRef.current) {
      setTimeout(() => {
        actionsRef.current?.scrollIntoView({ 
          behavior: "smooth", 
          block: "end" 
        });
      }, 300);
    }
  }, [currentStep]);

  const createInitialData = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // 1. Create income goal if provided
      if (monthlyIncome && parseFloat(monthlyIncome) > 0) {
        // First create a category for salary if needed
        const { data: salaryCategory } = await supabase
          .from('budget_categories')
          .select('id')
          .eq('name', 'Salaire')
          .eq('type', 'income')
          .single();

        let categoryId = salaryCategory?.id;
        
        if (!categoryId) {
          const { data: newCategory, error: catError } = await supabase
            .from('budget_categories')
            .insert({
              user_id: user.id,
              name: 'Salaire',
              icon: '💰',
              color: '#10b981',
              type: 'income',
              is_custom: false,
              is_pinned: true,
            })
            .select('id')
            .single();
          
          if (catError) {
            console.error("Error creating salary category:", catError);
          } else {
            categoryId = newCategory.id;
          }
        }

        if (categoryId) {
          const { error: incomeError } = await supabase
            .from('budget_goals')
            .insert({
              user_id: user.id,
              category_id: categoryId,
              monthly_limit: parseFloat(monthlyIncome),
              frequency: 'monthly',
            });
          
          if (incomeError) console.error("Error creating income goal:", incomeError);
        }
      }

      // 2. Create selected expense categories
      if (selectedCategories.length > 0) {
        const categoriesToCreate = COMMON_EXPENSE_CATEGORIES
          .filter(cat => selectedCategories.includes(cat.name))
          .map((cat, index) => ({
            user_id: user.id,
            name: cat.name,
            icon: cat.icon,
            color: cat.color,
            type: 'expense' as const,
            is_custom: false,
            is_pinned: true,
            display_order: index,
          }));

        const { error: categoriesError } = await supabase
          .from('budget_categories')
          .insert(categoriesToCreate);
        
        if (categoriesError) console.error("Error creating categories:", categoriesError);
      }

      // 3. Create default income categories
      const incomeCategories = [
        { name: "Salaire", icon: "💰", color: "#10b981" },
        { name: "Freelance", icon: "💼", color: "#3b82f6" },
        { name: "Investissements", icon: "📈", color: "#8b5cf6" },
      ];

      const { error: incomeCategoriesError } = await supabase
        .from('budget_categories')
        .insert(incomeCategories.map((cat, index) => ({
          user_id: user.id,
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          type: 'income' as const,
          is_custom: false,
          is_pinned: index === 0, // Pin "Salaire" by default
          display_order: index,
        })));
      
      if (incomeCategoriesError) console.error("Error creating income categories:", incomeCategoriesError);

      // 4. Create financial goals
      if (selectedGoals.length > 0) {
        const goalsToCreate = COMMON_GOALS
          .filter(goal => selectedGoals.includes(goal.id))
          .map(goal => ({
            user_id: user.id,
            name: goal.name,
            target_amount: goal.targetAmount,
            current_amount: 0,
            icon: goal.icon,
            type: 'savings',
          }));

        const { error: goalsError } = await supabase
          .from('financial_goals')
          .insert(goalsToCreate);
        
        if (goalsError) console.error("Error creating goals:", goalsError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-categories'] });
      queryClient.invalidateQueries({ queryKey: ['budget-goals'] });
      queryClient.invalidateQueries({ queryKey: ['financial-goals'] });
      localStorage.setItem("budget-onboarding-completed", "true");
      toast.success("🎉 Votre planificateur est configuré !", { duration: 3000 });
      setIsActive(false);
    },
    onError: (error: any) => {
      toast.error("Erreur lors de la configuration: " + error.message);
    },
  });

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      createInitialData.mutate();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem("budget-onboarding-completed", "true");
    setIsActive(false);
  };

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev =>
      prev.includes(goalId)
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const toggleCategory = (categoryName: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryName)
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    );
  };

  const canProceed = () => {
    const step = ONBOARDING_STEPS[currentStep];
    if (step.id === "income") return monthlyIncome && parseFloat(monthlyIncome) > 0;
    if (step.id === "goals") return selectedGoals.length > 0;
    if (step.id === "categories") return selectedCategories.length > 0;
    return true;
  };

  const step = ONBOARDING_STEPS[currentStep];
  const StepIcon = step.icon;

  if (!isActive) return null;

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-[9998]"
      />

      {/* Onboarding Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[10000] w-full max-w-2xl px-4 max-h-[90vh] overflow-hidden"
      >
        <Card className="p-8 shadow-2xl border-primary/30 bg-background flex flex-col max-h-[85vh]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <div className="flex items-start gap-4 mb-6 shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <StepIcon className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </div>

              {/* Content - Scrollable */}
              <div className="mb-8 overflow-y-auto flex-1 pr-2" style={{ maxHeight: 'calc(85vh - 280px)' }}>
                {step.id === "welcome" && (
                  <div className="space-y-4 text-center py-8">
                    <p className="text-lg">
                      Nous allons configurer votre planificateur budgétaire en quelques étapes simples.
                    </p>
                    <p className="text-muted-foreground">
                      Cela ne prend que 2 minutes et vous aidera à démarrer rapidement !
                    </p>
                  </div>
                )}

                {step.id === "income" && (
                  <div className="space-y-4">
                    <Label htmlFor="monthly-income" className="text-base">
                      Revenus mensuels nets (après impôts)
                    </Label>
                    <CurrencyInput
                      value={monthlyIncome}
                      onChange={setMonthlyIncome}
                      placeholder="Ex: 4000"
                      className="h-14 text-xl"
                    />
                    <p className="text-sm text-muted-foreground">
                      💡 Cette information nous aide à créer des recommandations personnalisées
                    </p>
                  </div>
                )}

                {step.id === "goals" && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground mb-4">
                      Sélectionnez un ou plusieurs objectifs financiers
                    </p>
                    <div className="grid gap-3">
                      {COMMON_GOALS.map((goal) => (
                        <div
                          key={goal.id}
                          onClick={() => toggleGoal(goal.id)}
                          className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedGoals.includes(goal.id)
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <Checkbox
                            checked={selectedGoals.includes(goal.id)}
                            onCheckedChange={() => toggleGoal(goal.id)}
                          />
                          <span className="text-2xl">{goal.icon}</span>
                          <div className="flex-1">
                            <div className="font-medium">{goal.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Objectif suggéré: {goal.targetAmount.toLocaleString()} $
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {step.id === "categories" && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground mb-4">
                      Choisissez les catégories de dépenses que vous utilisez régulièrement
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {COMMON_EXPENSE_CATEGORIES.map((category) => (
                        <div
                          key={category.name}
                          onClick={() => toggleCategory(category.name)}
                          className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedCategories.includes(category.name)
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <Checkbox
                            checked={selectedCategories.includes(category.name)}
                            onCheckedChange={() => toggleCategory(category.name)}
                          />
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                            style={{ backgroundColor: category.color + '20' }}
                          >
                            {category.icon}
                          </div>
                          <div className="font-medium">{category.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {step.id === "complete" && (
                  <div className="space-y-4 text-center py-8">
                    <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </div>
                    <p className="text-lg">
                      Votre planificateur budgétaire est maintenant configuré avec :
                    </p>
                    <div className="space-y-2 text-left max-w-md mx-auto">
                      {monthlyIncome && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          Revenus mensuels: {parseFloat(monthlyIncome).toLocaleString()} $
                        </div>
                      )}
                      {selectedGoals.length > 0 && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          {selectedGoals.length} objectif{selectedGoals.length > 1 ? 's' : ''} financier{selectedGoals.length > 1 ? 's' : ''}
                        </div>
                      )}
                      {selectedCategories.length > 0 && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          {selectedCategories.length} catégorie{selectedCategories.length > 1 ? 's' : ''} de dépenses
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Progress */}
              <div className="flex gap-1.5 mb-6 shrink-0">
                {ONBOARDING_STEPS.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                      index <= currentStep ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>

              {/* Actions */}
              <div ref={actionsRef} className="flex items-center justify-between gap-4 shrink-0">
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="text-muted-foreground"
                >
                  Passer
                </Button>

                <div className="flex gap-2">
                  {currentStep > 0 && step.id !== "complete" && (
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      className="gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Retour
                    </Button>
                  )}

                  <Button
                    onClick={handleNext}
                    disabled={!canProceed() || createInitialData.isPending}
                    className="gap-2 min-w-[140px]"
                  >
                    {createInitialData.isPending ? (
                      "Configuration..."
                    ) : currentStep === ONBOARDING_STEPS.length - 1 ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Commencer
                      </>
                    ) : step.id === "goals" && selectedGoals.length > 0 ? (
                      <>
                        Suivant ({selectedGoals.length} sélectionné{selectedGoals.length > 1 ? 's' : ''})
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : step.id === "categories" && selectedCategories.length > 0 ? (
                      <>
                        Suivant ({selectedCategories.length} sélectionnée{selectedCategories.length > 1 ? 's' : ''})
                        <ArrowRight className="w-4 h-4" />
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
            </motion.div>
          </AnimatePresence>
        </Card>
      </motion.div>
    </>
  );
}
