import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Lightbulb, ArrowRight, ArrowLeft, CheckCircle, HelpCircle, Target, Wallet } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import confetti from "canvas-confetti";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Question {
  id: string;
  label: string;
  description: string;
  category: string;
  type: 'income' | 'expense';
}

const QUESTIONS: Question[] = [
  {
    id: 'salary',
    label: 'Quel est ton salaire mensuel net?',
    description: 'Le montant que tu reçois après impôts',
    category: 'Salaire',
    type: 'income',
  },
  {
    id: 'other_income',
    label: 'As-tu d\'autres revenus mensuels?',
    description: 'Travail autonome, rentes, allocations...',
    category: 'Autre revenu',
    type: 'income',
  },
  {
    id: 'housing',
    label: 'Combien paies-tu pour ton logement?',
    description: 'Loyer ou paiement hypothèque mensuel',
    category: 'Logement',
    type: 'expense',
  },
  {
    id: 'utilities',
    label: 'Combien pour les services publics?',
    description: 'Électricité, internet, téléphone...',
    category: 'Services',
    type: 'expense',
  },
  {
    id: 'groceries',
    label: 'Combien dépenses-tu en épicerie?',
    description: 'Nourriture et produits ménagers',
    category: 'Alimentation',
    type: 'expense',
  },
  {
    id: 'transport',
    label: 'Combien pour le transport?',
    description: 'Essence, transport en commun, paiements auto...',
    category: 'Transport',
    type: 'expense',
  },
  {
    id: 'insurance',
    label: 'Combien pour les assurances?',
    description: 'Auto, maison, vie...',
    category: 'Assurances',
    type: 'expense',
  },
  {
    id: 'savings',
    label: 'Combien veux-tu épargner par mois?',
    description: 'REER, CELI, fonds d\'urgence...',
    category: 'Épargne',
    type: 'expense',
  },
];

export const BudgetQuestionnaire = ({ onComplete }: { onComplete: () => void }) => {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ['budget-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('budget_categories').select('*');
      if (error) throw error;
      return data;
    },
  });

  const currentQuestion = QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;

  const handleNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Create budget goals for each answered question
      for (const question of QUESTIONS) {
        const amount = parseFloat(answers[question.id] || '0');
        if (amount <= 0) continue;

        // Find matching category
        const category = categories.find(c => 
          c.name.toLowerCase().includes(question.category.toLowerCase()) ||
          question.category.toLowerCase().includes(c.name.toLowerCase())
        );

        if (category) {
          // Check if goal already exists
          const { data: existingGoal } = await supabase
            .from('budget_goals')
            .select('id')
            .eq('user_id', user.id)
            .eq('category_id', category.id)
            .single();

          if (existingGoal) {
            await supabase
              .from('budget_goals')
              .update({ monthly_limit: amount })
              .eq('id', existingGoal.id);
          } else {
            await supabase
              .from('budget_goals')
              .insert({
                user_id: user.id,
                category_id: category.id,
                monthly_limit: amount,
                frequency: 'monthly',
              });
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ['budget-goals'] });
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      toast.success("Ton budget est prêt!");
      onComplete();
    } catch (error) {
      console.error('Error creating budget:', error);
      toast.error("Erreur lors de la création du budget");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Target className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Créer mon budget</CardTitle>
            <CardDescription>Réponds à quelques questions pour commencer</CardDescription>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">
          Question {currentStep + 1} sur {QUESTIONS.length}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Question */}
        <div className="min-h-[180px] flex flex-col justify-center">
          <div className="flex items-start gap-2 mb-3">
            <h3 className="text-lg font-semibold">{currentQuestion.label}</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{currentQuestion.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">{currentQuestion.description}</p>
          
          <div className="flex gap-3 items-center">
            <CurrencyInput
              value={answers[currentQuestion.id] || ''}
              onChange={(value) => setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }))}
              placeholder="0 $"
              className="h-14 text-2xl font-bold flex-1 max-w-xs"
              allowDecimals
            />
            <span className="text-sm text-muted-foreground">par mois</span>
          </div>

          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
            <Lightbulb className="w-3 h-3" />
            Mets 0 si ça ne s'applique pas
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Précédent
          </Button>

          {currentStep === QUESTIONS.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Créer mon budget
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Suivant
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
