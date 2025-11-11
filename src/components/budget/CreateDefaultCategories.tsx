import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

export const CreateDefaultCategories = () => {
  const queryClient = useQueryClient();

  // Check if default categories already exist
  const { data: existingCategories = [] } = useQuery({
    queryKey: ['budget-categories-check-defaults'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_categories')
        .select('id, is_custom')
        .eq('is_custom', false)
        .limit(1);
      if (error) throw error;
      return data || [];
    },
  });

  const createDefaults = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const defaultCategories = [
        // Revenus
        { name: "Salaire", icon: "💼", color: "#10b981", type: "income", user_id: user.id, is_custom: false },
        { name: "Freelance", icon: "💻", color: "#06b6d4", type: "income", user_id: user.id, is_custom: false },
        { name: "Investissements", icon: "📈", color: "#8b5cf6", type: "income", user_id: user.id, is_custom: false },
        { name: "Autre revenu", icon: "💰", color: "#14b8a6", type: "income", user_id: user.id, is_custom: false },
        
        // Dépenses
        { name: "Logement", icon: "🏠", color: "#ef4444", type: "expense", user_id: user.id, is_custom: false },
        { name: "Alimentation", icon: "🍽️", color: "#f59e0b", type: "expense", user_id: user.id, is_custom: false },
        { name: "Transport", icon: "🚗", color: "#3b82f6", type: "expense", user_id: user.id, is_custom: false },
        { name: "Divertissement", icon: "🎬", color: "#ec4899", type: "expense", user_id: user.id, is_custom: false },
        { name: "Santé", icon: "🏥", color: "#06b6d4", type: "expense", user_id: user.id, is_custom: false },
        { name: "Éducation", icon: "📚", color: "#8b5cf6", type: "expense", user_id: user.id, is_custom: false },
        { name: "Services publics", icon: "💡", color: "#f59e0b", type: "expense", user_id: user.id, is_custom: false },
        { name: "Assurances", icon: "🛡️", color: "#6366f1", type: "expense", user_id: user.id, is_custom: false },
        { name: "Vêtements", icon: "👕", color: "#ec4899", type: "expense", user_id: user.id, is_custom: false },
        { name: "Autre dépense", icon: "💳", color: "#64748b", type: "expense", user_id: user.id, is_custom: false },
      ];

      const { error } = await supabase
        .from('budget_categories')
        .insert(defaultCategories);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-categories'] });
      toast.success("Catégories par défaut créées avec succès !");
    },
    onError: (error) => {
      toast.error("Erreur lors de la création des catégories: " + error.message);
    },
  });

  // Hide button if default categories already exist
  if (existingCategories.length > 0) {
    return null;
  }

  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={() => createDefaults.mutate()}
      disabled={createDefaults.isPending}
    >
      <Plus className="h-4 w-4 mr-2" />
      {createDefaults.isPending ? "Création..." : "Créer catégories par défaut"}
    </Button>
  );
};
