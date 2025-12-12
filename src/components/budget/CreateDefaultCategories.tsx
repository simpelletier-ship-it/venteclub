import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Mapping emoji → Lucide icon key for migration
const EMOJI_TO_LUCIDE: Record<string, string> = {
  '🍔': 'utensils', '🍽️': 'utensils-crossed', '🥗': 'utensils', '🍕': 'pizza',
  '🚗': 'car', '🚙': 'car', '🚕': 'car', '⛽': 'fuel',
  '🏠': 'home', '🏡': 'home', '🏢': 'building', '🏦': 'landmark',
  '💊': 'pill', '💉': 'stethoscope', '🏥': 'heart-pulse', '❤️': 'heart',
  '👕': 'shirt', '👗': 'shirt', '👔': 'shirt', '✂️': 'scissors',
  '📚': 'graduation-cap', '🎓': 'graduation-cap', '📖': 'book',
  '✈️': 'plane', '🛫': 'plane', '🧳': 'plane',
  '🎬': 'film', '🎥': 'film', '🎮': 'gamepad-2', '🎵': 'music',
  '☕': 'coffee', '🍺': 'beer', '🍻': 'beer',
  '💡': 'lightbulb', '🔌': 'zap', '⚡': 'zap',
  '🛡️': 'shield', '🔒': 'shield', '🔐': 'shield',
  '📱': 'smartphone', '💻': 'smartphone', '📲': 'smartphone',
  '📶': 'wifi', '🌐': 'wifi',
  '📺': 'tv', '🎧': 'music',
  '🏋️': 'dumbbell', '💪': 'dumbbell', '🏃': 'dumbbell',
  '🎁': 'gift', '🎀': 'gift',
  '🐕': 'paw-print', '🐈': 'paw-print', '🐾': 'paw-print',
  '✨': 'sparkles', '💅': 'sparkles',
  '💳': 'credit-card', '💵': 'banknote', '💰': 'banknote', '🪙': 'coins',
  '📦': 'box', '🛒': 'shopping-cart', '🛍️': 'shopping-cart',
  '💼': 'briefcase', '👨‍💼': 'briefcase',
  '📈': 'trending-up', '📊': 'trending-up', '💹': 'coins',
  '🔄': 'undo', '↩️': 'undo',
  '🎉': 'party-popper', '🥳': 'party-popper',
  '👶': 'baby', '🍼': 'baby',
  '🔧': 'wrench', '🛠️': 'wrench',
  '🚌': 'bus', '🚆': 'train', '🚲': 'bike',
  '🍎': 'apple',
  '📄': 'file-text', '📝': 'file-text',
  '👥': 'users', '👨‍👩‍👧': 'users',
  '💲': 'banknote', '🏧': 'landmark',
  '💸': 'banknote', '🤑': 'banknote',
  '🏬': 'building-2', '🏗️': 'building-2',
  '💝': 'heart', '🩺': 'stethoscope',
  '🎈': 'party-popper', '🎊': 'party-popper',
  '🥤': 'coffee', '🍩': 'utensils',
  '🧴': 'sparkles', '💆': 'sparkles',
  '🐶': 'paw-print', '🐱': 'paw-print',
  '🚴': 'bike', '🏊': 'dumbbell',
  '📻': 'music', '🎤': 'music',
  '🧾': 'receipt'
};

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Alimentation", icon: "utensils", color: "#ef4444", display_order: 0 },
  { name: "Transport", icon: "car", color: "#f59e0b", display_order: 1 },
  { name: "Logement", icon: "home", color: "#8b5cf6", display_order: 2 },
  { name: "Divertissement", icon: "film", color: "#ec4899", display_order: 3 },
  { name: "Santé", icon: "heart-pulse", color: "#10b981", display_order: 4 },
  { name: "Vêtements", icon: "shirt", color: "#3b82f6", display_order: 5 },
  { name: "Éducation", icon: "graduation-cap", color: "#6366f1", display_order: 6 },
  { name: "Restaurant", icon: "utensils-crossed", color: "#f97316", display_order: 7 },
  { name: "Épicerie", icon: "shopping-cart", color: "#dc2626", display_order: 8 },
  { name: "Services publics", icon: "lightbulb", color: "#7c3aed", display_order: 9 },
  { name: "Assurances", icon: "shield", color: "#059669", display_order: 10 },
  { name: "Téléphone", icon: "smartphone", color: "#0891b2", display_order: 11 },
  { name: "Internet", icon: "wifi", color: "#2563eb", display_order: 12 },
  { name: "Abonnements", icon: "tv", color: "#db2777", display_order: 13 },
  { name: "Sport", icon: "dumbbell", color: "#16a34a", display_order: 14 },
  { name: "Cadeaux", icon: "gift", color: "#e11d48", display_order: 15 },
  { name: "Animaux", icon: "paw-print", color: "#ea580c", display_order: 16 },
  { name: "Soins personnels", icon: "sparkles", color: "#a855f7", display_order: 17 },
  { name: "Voyages", icon: "plane", color: "#0284c7", display_order: 18 },
  { name: "Autre", icon: "box", color: "#64748b", display_order: 19 },
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: "Salaire", icon: "banknote", color: "#10b981", display_order: 0 },
  { name: "Freelance", icon: "briefcase", color: "#3b82f6", display_order: 1 },
  { name: "Investissements", icon: "trending-up", color: "#8b5cf6", display_order: 2 },
  { name: "Dividendes", icon: "coins", color: "#059669", display_order: 3 },
  { name: "Location", icon: "building", color: "#0891b2", display_order: 4 },
  { name: "Business", icon: "building-2", color: "#2563eb", display_order: 5 },
  { name: "Remboursements", icon: "undo", color: "#16a34a", display_order: 6 },
  { name: "Bonus", icon: "party-popper", color: "#db2777", display_order: 7 },
  { name: "Autre", icon: "box", color: "#64748b", display_order: 8 },
];

/**
 * Composant qui crée automatiquement les catégories par défaut
 * pour les nouveaux utilisateurs du planificateur budgétaire
 * et migre les catégories avec emojis vers des icônes Lucide
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
        .select("id, icon, name, type")
        .eq("user_id", user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Mutation pour créer les catégories par défaut (seulement celles qui n'existent pas)
  const createDefaultCategories = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Non authentifié");

      // Get existing category names (case-insensitive)
      const existingNames = new Set(
        (existingCategories || []).map(cat => cat.name?.toLowerCase())
      );

      // Créer les catégories de dépenses (seulement si n'existe pas déjà)
      const expenseCategories = DEFAULT_EXPENSE_CATEGORIES
        .filter(cat => !existingNames.has(cat.name.toLowerCase()))
        .map((cat) => ({
          user_id: user.id,
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          type: "expense",
          is_custom: false,
          is_pinned: cat.display_order < 6,
          display_order: cat.display_order,
        }));

      // Créer les catégories de revenus (seulement si n'existe pas déjà)
      const incomeCategories = DEFAULT_INCOME_CATEGORIES
        .filter(cat => !existingNames.has(cat.name.toLowerCase()))
        .map((cat) => ({
          user_id: user.id,
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          type: "income",
          is_custom: false,
          is_pinned: cat.display_order === 0,
          display_order: cat.display_order,
        }));

      const allNewCategories = [...expenseCategories, ...incomeCategories];
      
      if (allNewCategories.length === 0) return; // Rien à créer

      // Insérer toutes les catégories
      const { error } = await supabase
        .from("budget_categories")
        .insert(allNewCategories);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-categories"] });
    },
  });

  // Mutation pour migrer les emojis vers Lucide
  const migrateEmojiIcons = useMutation({
    mutationFn: async (categoriesToMigrate: { id: string; icon: string }[]) => {
      if (!user?.id) throw new Error("Non authentifié");

      // Mettre à jour chaque catégorie avec un emoji
      for (const cat of categoriesToMigrate) {
        const lucideIcon = EMOJI_TO_LUCIDE[cat.icon];
        if (lucideIcon) {
          await supabase
            .from("budget_categories")
            .update({ icon: lucideIcon })
            .eq("id", cat.id)
            .eq("user_id", user.id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget-categories"] });
    },
  });

  // Créer automatiquement les catégories si l'utilisateur n'en a pas
  // ou migrer les emojis vers Lucide
  useEffect(() => {
    if (!isLoading && existingCategories) {
      if (existingCategories.length === 0) {
        createDefaultCategories.mutate();
      } else {
        // Vérifier s'il y a des catégories avec des emojis à migrer
        const categoriesToMigrate = existingCategories.filter(
          (cat) => cat.icon && EMOJI_TO_LUCIDE[cat.icon]
        );
        
        if (categoriesToMigrate.length > 0) {
          migrateEmojiIcons.mutate(categoriesToMigrate as { id: string; icon: string }[]);
        }
      }
    }
  }, [isLoading, existingCategories]);

  // Ce composant ne rend rien
  return null;
}
