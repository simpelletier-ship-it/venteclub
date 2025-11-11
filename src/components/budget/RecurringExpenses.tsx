import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2, RepeatIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface RecurringExpensesProps {
  isAuthenticated: boolean;
}

const RecurringExpenses = ({ isAuthenticated }: RecurringExpensesProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: recurringExpenses = [], isLoading } = useQuery({
    queryKey: ["recurring-expenses", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("budget_transactions")
        .select("*, budget_categories(name, icon, color)")
        .eq("user_id", user.id)
        .eq("type", "expense")
        .eq("is_recurring", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: isAuthenticated && !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const { error } = await supabase
        .from("budget_transactions")
        .delete()
        .eq("id", transactionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-expenses"] });
      toast({ title: "Dépense récurrente supprimée" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (transaction: any) => {
      const { error } = await supabase
        .from("budget_transactions")
        .update({
          amount: transaction.amount,
          description: transaction.description,
          recurring_frequency: transaction.recurring_frequency,
          category_id: transaction.category_id,
        })
        .eq("id", transaction.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-expenses"] });
      toast({ title: "Dépense récurrente mise à jour" });
      setIsEditOpen(false);
      setEditingTransaction(null);
    },
    onError: () => {
      toast({ title: "Erreur lors de la mise à jour", variant: "destructive" });
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["budget-categories-expense", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("budget_categories")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "expense")
        .order("name");
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthenticated && !!user?.id,
  });

  const frequencyLabels: Record<string, string> = {
    weekly: "Hebdomadaire",
    biweekly: "Bihebdomadaire",
    monthly: "Mensuel",
    yearly: "Annuel",
  };

  if (!isAuthenticated) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">Connectez-vous pour voir vos dépenses récurrentes</p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">Chargement...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <RepeatIcon className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Dépenses récurrentes</h3>
      </div>

      {recurringExpenses.length === 0 ? (
        <Card className="p-6">
          <p className="text-muted-foreground text-center">Aucune dépense récurrente enregistrée</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {recurringExpenses.map((expense: any) => (
            <Card key={expense.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-2xl">
                    {expense.budget_categories?.icon || "💸"}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{expense.description || "Sans description"}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{expense.budget_categories?.name || "Autre"}</span>
                      <span>•</span>
                      <span>{frequencyLabels[expense.recurring_frequency] || expense.recurring_frequency}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-lg">{expense.amount.toFixed(2)} $</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Dialog open={isEditOpen && editingTransaction?.id === expense.id} onOpenChange={(open) => {
                    setIsEditOpen(open);
                    if (!open) setEditingTransaction(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingTransaction(expense)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Modifier la dépense récurrente</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Input
                            value={editingTransaction?.description || ""}
                            onChange={(e) =>
                              setEditingTransaction({
                                ...editingTransaction,
                                description: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Montant ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={editingTransaction?.amount || ""}
                            onChange={(e) =>
                              setEditingTransaction({
                                ...editingTransaction,
                                amount: parseFloat(e.target.value),
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Catégorie</Label>
                          <Select
                            value={editingTransaction?.category_id || ""}
                            onValueChange={(value) =>
                              setEditingTransaction({
                                ...editingTransaction,
                                category_id: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat: any) => (
                                <SelectItem key={cat.id} value={cat.id}>
                                  {cat.icon} {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Fréquence</Label>
                          <Select
                            value={editingTransaction?.recurring_frequency || ""}
                            onValueChange={(value) =>
                              setEditingTransaction({
                                ...editingTransaction,
                                recurring_frequency: value,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">Hebdomadaire</SelectItem>
                              <SelectItem value="biweekly">Bihebdomadaire</SelectItem>
                              <SelectItem value="monthly">Mensuel</SelectItem>
                              <SelectItem value="yearly">Annuel</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          onClick={() => updateMutation.mutate(editingTransaction)}
                          className="w-full"
                        >
                          Enregistrer
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm("Supprimer cette dépense récurrente ?")) {
                        deleteMutation.mutate(expense.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecurringExpenses;
