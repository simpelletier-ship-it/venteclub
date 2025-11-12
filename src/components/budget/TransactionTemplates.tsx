import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/CurrencyInput";
import { formatPrice } from "@/lib/priceFormat";
import { toast } from "sonner";
import { Plus, Trash2, Zap, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TransactionTemplatesProps {
  isAuthenticated: boolean;
  categories: any[];
  onUseTemplate?: (template: any) => void;
}

export const TransactionTemplates = ({ isAuthenticated, categories, onUseTemplate }: TransactionTemplatesProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  const queryClient = useQueryClient();

  // Fetch templates
  const { data: templates = [] } = useQuery({
    queryKey: ['transaction-templates'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transaction_templates')
        .select('*, category:budget_categories(*)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch tags
  const { data: tags = [] } = useQuery({
    queryKey: ['transaction-tags'],
    enabled: isAuthenticated,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transaction_tags')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
  });

  // Create template
  const createTemplate = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const category = categories.find(c => c.id === categoryId);
      if (!category) throw new Error("Catégorie introuvable");

      const { error } = await supabase
        .from('transaction_templates')
        .insert({
          user_id: user.id,
          name,
          amount: parseFloat(amount),
          description,
          type: category.type,
          category_id: categoryId,
          tag_ids: selectedTags,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-templates'] });
      toast.success("Template créé avec succès");
      setDialogOpen(false);
      setName("");
      setAmount("");
      setDescription("");
      setCategoryId("");
      setSelectedTags([]);
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Delete template
  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transaction_templates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction-templates'] });
      toast.success("Template supprimé");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Le nom du template est requis");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Le montant doit être supérieur à 0");
      return;
    }
    if (!categoryId) {
      toast.error("La catégorie est requise");
      return;
    }
    createTemplate.mutate();
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const incomeCategories = categories.filter(c => c.type === 'income');
  const expenseCategories = categories.filter(c => c.type === 'expense');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Templates de Transactions
            </CardTitle>
            <CardDescription>Ajoutez rapidement vos transactions fréquentes</CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Créer un template</DialogTitle>
                <DialogDescription>
                  Créez un modèle pour vos transactions fréquentes
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Nom du template *</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Café quotidien, Essence..."
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label>Catégorie *</Label>
                  <Select value={categoryId} onValueChange={setCategoryId} required>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {incomeCategories.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Revenus</div>
                          {incomeCategories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.icon} {cat.name}
                            </SelectItem>
                          ))}
                        </>
                      )}
                      {expenseCategories.length > 0 && (
                        <>
                          <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">Dépenses</div>
                          {expenseCategories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.icon} {cat.name}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Montant *</Label>
                  <CurrencyInput value={amount} onChange={setAmount} className="mt-1" required />
                </div>

                <div>
                  <Label>Description (optionnel)</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Détails..."
                    className="mt-1"
                    rows={2}
                  />
                </div>

                {tags.length > 0 && (
                  <div>
                    <Label>Tags (optionnel)</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map(tag => (
                        <Badge
                          key={tag.id}
                          variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleTag(tag.id)}
                        >
                          {tag.icon} {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={createTemplate.isPending}>
                  {createTemplate.isPending ? "Création..." : "Créer le template"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {templates.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Aucun template créé</p>
            <p className="text-sm mt-1">Créez des templates pour ajouter rapidement vos transactions fréquentes</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {templates.map((template) => (
              <div
                key={template.id}
                className="group relative p-4 rounded-lg border bg-card hover:shadow-md transition-all"
              >
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteTemplate.mutate(template.id)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
                
                <div className="mb-3">
                  <p className="font-semibold text-lg">{template.name}</p>
                  {template.description && (
                    <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{template.category?.icon}</span>
                  <span className="text-sm text-muted-foreground">{template.category?.name}</span>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xl font-bold">{formatPrice(template.amount)}</p>
                  {onUseTemplate && (
                    <Button
                      size="sm"
                      onClick={() => onUseTemplate(template)}
                    >
                      <Zap className="h-4 w-4 mr-1" />
                      Utiliser
                    </Button>
                  )}
                </div>

                {template.tag_ids && template.tag_ids.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {template.tag_ids.map((tagId: string) => {
                      const tag = tags.find(t => t.id === tagId);
                      if (!tag) return null;
                      return (
                        <Badge key={tagId} variant="outline" className="text-xs">
                          {tag.icon} {tag.name}
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
