import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { GraduationCap, Briefcase, Users, Sparkles } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface BudgetTemplate {
  id: string;
  name: string;
  description: string;
  icon: any;
  categories: {
    name: string;
    type: 'income' | 'expense';
    budgetAmount: number;
    icon: string;
    color: string;
  }[];
}

const templates: BudgetTemplate[] = [
  {
    id: "student",
    name: "Étudiant",
    description: "Budget adapté pour les étudiants avec revenus limités",
    icon: GraduationCap,
    categories: [
      { name: "Emploi étudiant", type: "income", budgetAmount: 1000, icon: "💼", color: "#10b981" },
      { name: "Aide familiale", type: "income", budgetAmount: 500, icon: "👨‍👩‍👧", color: "#3b82f6" },
      { name: "Loyer", type: "expense", budgetAmount: 600, icon: "🏠", color: "#ef4444" },
      { name: "Épicerie", type: "expense", budgetAmount: 250, icon: "🛒", color: "#f59e0b" },
      { name: "Transport", type: "expense", budgetAmount: 100, icon: "🚌", color: "#8b5cf6" },
      { name: "Matériel scolaire", type: "expense", budgetAmount: 150, icon: "📚", color: "#ec4899" },
      { name: "Téléphone", type: "expense", budgetAmount: 50, icon: "📱", color: "#06b6d4" },
      { name: "Sorties", type: "expense", budgetAmount: 100, icon: "🎉", color: "#f97316" },
    ]
  },
  {
    id: "young-professional",
    name: "Jeune professionnel",
    description: "Budget pour jeunes travailleurs en début de carrière",
    icon: Briefcase,
    categories: [
      { name: "Salaire", type: "income", budgetAmount: 3500, icon: "💰", color: "#10b981" },
      { name: "Loyer", type: "expense", budgetAmount: 1200, icon: "🏠", color: "#ef4444" },
      { name: "Épicerie", type: "expense", budgetAmount: 400, icon: "🛒", color: "#f59e0b" },
      { name: "Transport", type: "expense", budgetAmount: 200, icon: "🚗", color: "#8b5cf6" },
      { name: "Assurances", type: "expense", budgetAmount: 150, icon: "🛡️", color: "#06b6d4" },
      { name: "Téléphone & Internet", type: "expense", budgetAmount: 120, icon: "📱", color: "#ec4899" },
      { name: "Épargne REER", type: "expense", budgetAmount: 500, icon: "📈", color: "#10b981" },
      { name: "Loisirs", type: "expense", budgetAmount: 300, icon: "🎮", color: "#f97316" },
      { name: "Restaurants", type: "expense", budgetAmount: 250, icon: "🍽️", color: "#eab308" },
      { name: "Vêtements", type: "expense", budgetAmount: 150, icon: "👔", color: "#a855f7" },
    ]
  },
  {
    id: "family",
    name: "Famille",
    description: "Budget complet pour une famille avec enfants",
    icon: Users,
    categories: [
      { name: "Salaire principal", type: "income", budgetAmount: 4500, icon: "💰", color: "#10b981" },
      { name: "Salaire conjoint", type: "income", budgetAmount: 3000, icon: "💼", color: "#3b82f6" },
      { name: "Allocations familiales", type: "income", budgetAmount: 400, icon: "👶", color: "#06b6d4" },
      { name: "Hypothèque/Loyer", type: "expense", budgetAmount: 1800, icon: "🏠", color: "#ef4444" },
      { name: "Épicerie", type: "expense", budgetAmount: 800, icon: "🛒", color: "#f59e0b" },
      { name: "Transport", type: "expense", budgetAmount: 400, icon: "🚗", color: "#8b5cf6" },
      { name: "Garderie", type: "expense", budgetAmount: 600, icon: "🧸", color: "#ec4899" },
      { name: "Assurances", type: "expense", budgetAmount: 300, icon: "🛡️", color: "#06b6d4" },
      { name: "Électricité & Gaz", type: "expense", budgetAmount: 200, icon: "⚡", color: "#eab308" },
      { name: "Téléphone & Internet", type: "expense", budgetAmount: 150, icon: "📱", color: "#a855f7" },
      { name: "Épargne REER", type: "expense", budgetAmount: 800, icon: "📈", color: "#10b981" },
      { name: "Épargne REEE", type: "expense", budgetAmount: 200, icon: "🎓", color: "#3b82f6" },
      { name: "Loisirs famille", type: "expense", budgetAmount: 300, icon: "🎡", color: "#f97316" },
      { name: "Vêtements", type: "expense", budgetAmount: 200, icon: "👕", color: "#a855f7" },
    ]
  }
];

export const BudgetTemplates = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState<string | null>(null);

  const applyTemplate = async (template: BudgetTemplate) => {
    setLoading(template.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Insérer les catégories du template
      const categoriesToInsert = template.categories.map(cat => ({
        user_id: user.id,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.color,
        budget_amount: cat.budgetAmount,
      }));

      const { error } = await supabase
        .from('budget_categories')
        .insert(categoriesToInsert);

      if (error) throw error;

      // Invalider les caches
      queryClient.invalidateQueries({ queryKey: ['budget-categories'] });
      queryClient.invalidateQueries({ queryKey: ['budget-transactions'] });

      toast({
        title: "✅ Template appliqué!",
        description: `Le budget "${template.name}" a été appliqué avec succès. Vous pouvez maintenant personnaliser les montants selon vos besoins.`,
      });
    } catch (error: any) {
      console.error('Error applying template:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'appliquer le template",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Templates de budget
        </CardTitle>
        <CardDescription>
          Démarrez rapidement avec un budget pré-configuré adapté à votre situation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {templates.map((template) => {
            const Icon = template.icon;
            return (
              <Card key={template.id} className="border-2">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  </div>
                  <CardDescription className="text-sm">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <p className="text-xs text-muted-foreground font-medium">Inclus:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• {template.categories.filter(c => c.type === 'income').length} catégories de revenus</li>
                      <li>• {template.categories.filter(c => c.type === 'expense').length} catégories de dépenses</li>
                      <li>• Montants budgétés suggérés</li>
                    </ul>
                  </div>
                  <Button 
                    onClick={() => applyTemplate(template)}
                    disabled={loading !== null}
                    className="w-full"
                    variant="default"
                  >
                    {loading === template.id ? "Application..." : "Appliquer ce template"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
