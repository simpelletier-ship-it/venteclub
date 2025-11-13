import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Alimentation", icon: "🍔", color: "#ef4444", display_order: 0 },
  { name: "Transport", icon: "🚗", color: "#f59e0b", display_order: 1 },
  { name: "Logement", icon: "🏠", color: "#8b5cf6", display_order: 2 },
  { name: "Divertissement", icon: "🎬", color: "#ec4899", display_order: 3 },
  { name: "Santé", icon: "💊", color: "#10b981", display_order: 4 },
  { name: "Vêtements", icon: "👕", color: "#3b82f6", display_order: 5 },
  { name: "Éducation", icon: "📚", color: "#6366f1", display_order: 6 },
  { name: "Restaurant", icon: "🍽️", color: "#f97316", display_order: 7 },
  { name: "Épicerie", icon: "🛒", color: "#dc2626", display_order: 8 },
  { name: "Services publics", icon: "💡", color: "#7c3aed", display_order: 9 },
  { name: "Assurances", icon: "🛡️", color: "#059669", display_order: 10 },
  { name: "Téléphone", icon: "📱", color: "#0891b2", display_order: 11 },
  { name: "Internet", icon: "🌐", color: "#2563eb", display_order: 12 },
  { name: "Abonnements", icon: "📺", color: "#db2777", display_order: 13 },
  { name: "Sport", icon: "⚽", color: "#16a34a", display_order: 14 },
  { name: "Cadeaux", icon: "🎁", color: "#e11d48", display_order: 15 },
  { name: "Animaux", icon: "🐶", color: "#ea580c", display_order: 16 },
  { name: "Soins personnels", icon: "💆", color: "#a855f7", display_order: 17 },
  { name: "Voyages", icon: "✈️", color: "#0284c7", display_order: 18 },
  { name: "Autre", icon: "📦", color: "#64748b", display_order: 19 },
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: "Salaire", icon: "💰", color: "#10b981", display_order: 0 },
  { name: "Freelance", icon: "💼", color: "#3b82f6", display_order: 1 },
  { name: "Investissements", icon: "📈", color: "#8b5cf6", display_order: 2 },
  { name: "Dividendes", icon: "💵", color: "#059669", display_order: 3 },
  { name: "Location", icon: "🏘️", color: "#0891b2", display_order: 4 },
  { name: "Business", icon: "🏢", color: "#2563eb", display_order: 5 },
  { name: "Remboursements", icon: "↩️", color: "#16a34a", display_order: 6 },
  { name: "Bonus", icon: "🎉", color: "#db2777", display_order: 7 },
  { name: "Autre", icon: "📦", color: "#64748b", display_order: 8 },
];

/**
 * Composant qui crée automatiquement les catégories par défaut
 * pour les nouveaux utilisateurs du planificateur budgétaire
 */
export function CreateDefaultCategories() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Vérifier si l'utilisateur a déjà des catégories
  const { data: existingCategories, isLoading } = useQuery({
    queryKey: ["budget-categories", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("budget_categories")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Mutation pour créer les catégories par défaut
  const createDefaultCategories = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Non authentifié");

      // Créer les catégories de dépenses
      const expenseCategories = DEFAULT_EXPENSE_CATEGORIES.map((cat) => ({
        user_id: user.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        type: "expense",
        is_custom: false,
        is_pinned: cat.display_order < 6, // Épingler les 6 premières
        display_order: cat.display_order,
      }));

      // Créer les catégories de revenus
      const incomeCategories = DEFAULT_INCOME_CATEGORIES.map((cat) => ({
        user_id: user.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        type: "income",
        is_custom: false,
        is_pinned: cat.display_order === 0, // Épingler "Salaire" par défaut
        display_order: cat.display_order,
      }));

      // Insérer toutes les catégories
      const { error } = await supabase
        .from("budget_categories")
        .insert([...expenseCategories, ...incomeCategories]);

      if (error) throw error;
    },
    onSuccess: () => {
      // Rafraîchir les catégories
      queryClient.invalidateQueries({ queryKey: ["budget-categories"] });
    },
  });

  // Créer automatiquement les catégories si l'utilisateur n'en a pas
  useEffect(() => {
    if (!isLoading && existingCategories && existingCategories.length === 0) {
      createDefaultCategories.mutate();
    }
  }, [isLoading, existingCategories]);

  // Ce composant ne rend rien
  return null;
}
