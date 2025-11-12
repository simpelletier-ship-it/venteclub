import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { AlertTriangle, Trash2 } from "lucide-react";

export const BudgetResetDialog = () => {
  const [confirmText, setConfirmText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const resetBudget = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Delete all user budget data
      const tables = [
        'budget_transactions',
        'financial_goals',
        'user_assets',
        'user_debts',
        'asset_history',
        'debt_history',
        'transaction_tag_links',
        'transaction_tags',
        'budget_categories',
      ];

      for (const table of tables) {
        const { error } = await supabase
          .from(table as any)
          .delete()
          .eq('user_id', user.id);
        
        if (error && error.code !== 'PGRST116') { // Ignore "no rows deleted" error
          console.error(`Error deleting from ${table}:`, error);
          throw error;
        }
      }
    },
    onSuccess: () => {
      // Invalidate all budget-related queries
      queryClient.invalidateQueries({ queryKey: ['budget-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['budget-categories'] });
      queryClient.invalidateQueries({ queryKey: ['financial-goals'] });
      queryClient.invalidateQueries({ queryKey: ['user-assets'] });
      queryClient.invalidateQueries({ queryKey: ['user-debts'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-tags'] });
      
      toast.success("Toutes vos données budgétaires ont été supprimées");
      setIsOpen(false);
      setConfirmText("");
    },
    onError: (error) => {
      console.error("Reset error:", error);
      toast.error("Erreur lors de la réinitialisation");
    },
  });

  const handleReset = () => {
    if (confirmText !== "SUPPRIMER") {
      toast.error('Veuillez taper "SUPPRIMER" pour confirmer');
      return;
    }
    resetBudget.mutate();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4 mr-2" />
          Réinitialiser tout
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Réinitialisation complète
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p className="font-semibold text-foreground">
              ⚠️ ATTENTION : Cette action est IRRÉVERSIBLE !
            </p>
            <p>
              Vous êtes sur le point de supprimer <strong>TOUTES</strong> vos données budgétaires :
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Toutes les transactions (revenus et dépenses)</li>
              <li>Toutes les catégories personnalisées</li>
              <li>Tous les objectifs financiers</li>
              <li>Tous les actifs (REER, CELI, propriétés, etc.)</li>
              <li>Toutes les dettes</li>
              <li>Tout l'historique de valeur nette</li>
              <li>Tous les tags personnalisés</li>
            </ul>
            <p className="font-semibold text-destructive">
              Il sera impossible de récupérer ces données après suppression.
            </p>
            <div className="space-y-2">
              <p className="text-sm">
                Pour confirmer, tapez <strong>SUPPRIMER</strong> ci-dessous :
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Tapez SUPPRIMER"
                className="font-mono"
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmText("")}>
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReset}
            disabled={confirmText !== "SUPPRIMER" || resetBudget.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {resetBudget.isPending ? "Suppression..." : "Supprimer définitivement"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
