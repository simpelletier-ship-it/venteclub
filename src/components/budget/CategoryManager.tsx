import { useState, useEffect } from "react";
import { Pencil, Trash2, Plus, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const EMOJI_OPTIONS = ['🍔', '🚗', '🏠', '💡', '🎮', '👕', '📱', '💊', '🎓', '✈️', '🎬', '☕', '🛒', '🏋️', '📚', '💰', '🎉', '💼', '📈', '🏘️', '🏷️', '💳', '🎁', '💵', '⛽', '💅', '🐾', '🛡️', '🍽️', '📺', '📦'];
const COLOR_OPTIONS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b', '#10b981', '#dc2626', '#ea580c', '#d946ef', '#06b6d4', '#84cc16', '#6366f1', '#0ea5e9', '#a855f7', '#94a3b8', '#14b8a6', '#f59e0b'];

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Alimentation', icon: '🍔', color: '#ef4444' },
  { name: 'Transport', icon: '🚗', color: '#f97316' },
  { name: 'Logement', icon: '🏠', color: '#eab308' },
  { name: 'Services publics', icon: '💡', color: '#22c55e' },
  { name: 'Divertissement', icon: '🎮', color: '#3b82f6' },
  { name: 'Vêtements', icon: '👕', color: '#8b5cf6' },
  { name: 'Santé', icon: '💊', color: '#ec4899' },
  { name: 'Éducation', icon: '🎓', color: '#14b8a6' },
  { name: 'Téléphone/Internet', icon: '📱', color: '#64748b' },
  { name: 'Assurances', icon: '🛡️', color: '#f59e0b' },
  { name: 'Restaurant', icon: '🍽️', color: '#10b981' },
  { name: 'Épicerie', icon: '🛒', color: '#dc2626' },
  { name: 'Essence', icon: '⛽', color: '#ea580c' },
  { name: 'Soins personnels', icon: '💅', color: '#d946ef' },
  { name: 'Cadeaux', icon: '🎁', color: '#06b6d4' },
  { name: 'Animaux', icon: '🐾', color: '#84cc16' },
  { name: 'Voyage', icon: '✈️', color: '#6366f1' },
  { name: 'Gym/Sport', icon: '🏋️', color: '#0ea5e9' },
  { name: 'Abonnements', icon: '📺', color: '#a855f7' },
  { name: 'Autre', icon: '📦', color: '#94a3b8' },
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salaire', icon: '💰', color: '#22c55e' },
  { name: 'Bonus', icon: '🎉', color: '#10b981' },
  { name: 'Freelance', icon: '💼', color: '#3b82f6' },
  { name: 'Investissements', icon: '📈', color: '#8b5cf6' },
  { name: 'Location', icon: '🏘️', color: '#06b6d4' },
  { name: 'Vente', icon: '🏷️', color: '#f59e0b' },
  { name: 'Remboursement', icon: '💳', color: '#14b8a6' },
  { name: 'Cadeau', icon: '🎁', color: '#ec4899' },
  { name: 'Autre revenu', icon: '💵', color: '#6366f1' },
];

export const CategoryManager = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  const queryClient = useQueryClient();
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  const [categoryType, setCategoryType] = useState<'expense' | 'income'>('expense');
  
  // Form state for new category
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🍔");
  const [color, setColor] = useState("#3b82f6");
  
  // Inline edit state
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [editColor, setEditColor] = useState("");

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['budget-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_categories')
        .select('*')
        .order('type', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthenticated,
    retry: 1,
  });

  // Initialize default categories if none exist
  useEffect(() => {
    if (isAuthenticated && categories.length === 0 && !isLoading) {
      initializeDefaultCategories();
    }
  }, [isAuthenticated, categories, isLoading]);

  const initializeDefaultCategories = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const allDefaults = [
      ...DEFAULT_EXPENSE_CATEGORIES.map(cat => ({ ...cat, type: 'expense' as const, is_custom: false })),
      ...DEFAULT_INCOME_CATEGORIES.map(cat => ({ ...cat, type: 'income' as const, is_custom: false })),
    ];

    const { error } = await supabase
      .from('budget_categories')
      .insert(
        allDefaults.map(cat => ({
          user_id: user.id,
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          type: cat.type,
          is_custom: cat.is_custom,
        }))
      );

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['budget-categories'] });
      toast.success("✨ Catégories par défaut créées!", { duration: 2000 });
    }
  };

  // Create mutation
  const createCategory = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");
      if (!name.trim()) throw new Error("Le nom est requis");

      const { data, error } = await supabase
        .from('budget_categories')
        .insert({
          user_id: user.id,
          name: name.trim(),
          icon,
          color,
          type: categoryType,
          is_custom: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (newCategory) => {
      queryClient.invalidateQueries({ queryKey: ['budget-categories'] });
      toast.success(`✨ Catégorie "${newCategory.name}" créée!`);
      setNewCategoryOpen(false);
      resetForm();
    },
  });

  // Update mutation
  const updateCategory = useMutation({
    mutationFn: async ({ id, name, icon, color }: { id: string, name: string, icon: string, color: string }) => {
      if (!name.trim()) throw new Error("Le nom est requis");

      const { error } = await supabase
        .from('budget_categories')
        .update({
          name: name.trim(),
          icon,
          color,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-categories'] });
      toast.success("✅ Catégorie mise à jour!");
      setEditingCategoryId(null);
    },
  });

  // Delete mutation
  const deleteCategory = useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase
        .from('budget_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-categories'] });
      toast.success("🗑️ Catégorie supprimée!");
    },
  });

  const resetForm = () => {
    setName("");
    setIcon("🍔");
    setColor("#3b82f6");
  };

  const startEditing = (category: any) => {
    setEditingCategoryId(category.id);
    setEditName(category.name);
    setEditIcon(category.icon || "🍔");
    setEditColor(category.color || "#3b82f6");
  };

  const cancelEditing = () => {
    setEditingCategoryId(null);
    setEditName("");
    setEditIcon("");
    setEditColor("");
  };

  const saveEditing = (categoryId: string) => {
    updateCategory.mutate({
      id: categoryId,
      name: editName,
      icon: editIcon,
      color: editColor,
    });
  };

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const incomeCategories = categories.filter(c => c.type === 'income');

  const CategoryList = ({ cats, type }: { cats: any[], type: string }) => (
    <div className="space-y-2">
      {cats.map((category) => {
        const isEditing = editingCategoryId === category.id;
        
        return (
          <div
            key={category.id}
            className="flex items-center justify-between p-3 rounded-lg border bg-card transition-colors"
          >
            {isEditing ? (
              // Mode édition inline
              <>
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex gap-2">
                    {EMOJI_OPTIONS.slice(0, 8).map((emoji) => (
                      <Button
                        key={emoji}
                        type="button"
                        variant={editIcon === emoji ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8 text-lg"
                        onClick={() => setEditIcon(emoji)}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1"
                    placeholder="Nom de la catégorie"
                  />
                  <div className="flex gap-1">
                    {COLOR_OPTIONS.slice(0, 6).map((c) => (
                      <Button
                        key={c}
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 p-0 relative"
                        onClick={() => setEditColor(c)}
                      >
                        <div 
                          className="absolute inset-1 rounded"
                          style={{ backgroundColor: c }}
                        />
                        {editColor === c && (
                          <span className="absolute inset-0 flex items-center justify-center text-white text-xs">✓</span>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => saveEditing(category.id)}
                    disabled={!editName.trim() || updateCategory.isPending}
                  >
                    ✓ Sauvegarder
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={cancelEditing}
                  >
                    ✕ Annuler
                  </Button>
                </div>
              </>
            ) : (
              // Mode affichage normal
              <>
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                    style={{ backgroundColor: category.color + '20' }}
                  >
                    {category.icon}
                  </div>
                  <div>
                    <div className="font-medium">{category.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {category.is_custom ? 'Personnalisée' : 'Par défaut'}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => startEditing(category)}
                    title="Modifier"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {category.is_custom && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm(`Supprimer la catégorie "${category.name}" ?`)) {
                          deleteCategory.mutate(category.id);
                        }
                      }}
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}
      {cats.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          Aucune catégorie {type === 'expense' ? 'de dépense' : 'de revenu'}
        </p>
      )}
    </div>
  );

  const CategoryFormContent = () => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Nom de la catégorie</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Restaurant, Essence..."
        />
      </div>

      <div className="space-y-2">
        <Label>Icône</Label>
        <div className="grid grid-cols-8 gap-2">
          {EMOJI_OPTIONS.map((emoji) => (
            <Button
              key={emoji}
              type="button"
              variant={icon === emoji ? "default" : "outline"}
              className="h-10 w-10 p-0 text-xl"
              onClick={() => setIcon(emoji)}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Couleur</Label>
        <div className="grid grid-cols-10 gap-2">
          {COLOR_OPTIONS.map((c) => (
            <Button
              key={c}
              type="button"
              variant="outline"
              className="h-10 w-10 p-0 relative"
              onClick={() => setColor(c)}
            >
              <div 
                className="absolute inset-1 rounded"
                style={{ backgroundColor: c }}
              />
              {color === c && (
                <span className="absolute inset-0 flex items-center justify-center text-white font-bold">✓</span>
              )}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">🎨 Gérer les catégories</CardTitle>
        <CardDescription>
          Personnalisez vos catégories de revenus et dépenses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="expense" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 h-11">
            <TabsTrigger value="expense" className="text-base">
              💳 Dépenses ({expenseCategories.length})
            </TabsTrigger>
            <TabsTrigger value="income" className="text-base">
              💰 Revenus ({incomeCategories.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="expense" className="space-y-4">
            <Dialog open={newCategoryOpen} onOpenChange={setNewCategoryOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" onClick={() => { setCategoryType('expense'); resetForm(); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle catégorie de dépense
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nouvelle catégorie de dépense</DialogTitle>
                  <DialogDescription>Créez une catégorie personnalisée</DialogDescription>
                </DialogHeader>
                <CategoryFormContent />
                <Button 
                  onClick={() => createCategory.mutate()}
                  disabled={createCategory.isPending || !name.trim()}
                  className="w-full"
                >
                  {createCategory.isPending ? "Création..." : "Créer"}
                </Button>
              </DialogContent>
            </Dialog>

            <CategoryList cats={expenseCategories} type="expense" />
          </TabsContent>

          <TabsContent value="income" className="space-y-4">
            <Dialog open={newCategoryOpen} onOpenChange={setNewCategoryOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" onClick={() => { setCategoryType('income'); resetForm(); }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle catégorie de revenu
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nouvelle catégorie de revenu</DialogTitle>
                  <DialogDescription>Créez une catégorie personnalisée</DialogDescription>
                </DialogHeader>
                <CategoryFormContent />
                <Button 
                  onClick={() => createCategory.mutate()}
                  disabled={createCategory.isPending || !name.trim()}
                  className="w-full"
                >
                  {createCategory.isPending ? "Création..." : "Créer"}
                </Button>
              </DialogContent>
            </Dialog>

            <CategoryList cats={incomeCategories} type="income" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
