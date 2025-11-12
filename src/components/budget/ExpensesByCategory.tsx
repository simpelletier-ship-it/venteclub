import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatPrice } from "@/lib/priceFormat";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, TrendingUp } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ExpensesByCategoryProps {
  transactions: any[];
  categories: any[];
  onAnalyze?: () => void;
}

export const ExpensesByCategory = ({ transactions, categories, onAnalyze }: ExpensesByCategoryProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Calculate expenses by category for current month
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  const expensesByCategory = categories
    .filter(cat => cat.type === 'expense')
    .map(category => {
      const categoryTransactions = transactions.filter(
        t => t.category_id === category.id && 
        t.type === 'expense' && 
        t.transaction_date?.startsWith(currentMonth)
      );
      
      const total = categoryTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      
      return {
        id: category.id,
        name: category.name,
        value: total,
        icon: category.icon,
        color: category.color || '#6366f1',
        transactions: categoryTransactions,
      };
    })
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const totalExpenses = expensesByCategory.reduce((sum, item) => sum + item.value, 0);

  const selectedCategoryData = expensesByCategory.find(c => c.id === selectedCategory);

  // Delete transaction mutation
  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('budget_transactions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-transactions'] });
      toast.success("Transaction supprimée");
    },
  });

  if (expensesByCategory.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">📊 Dépenses par catégorie</CardTitle>
          <CardDescription>Ce mois-ci</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Aucune dépense enregistrée ce mois-ci
          </p>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3 cursor-pointer">
          <p className="font-semibold flex items-center gap-2">
            <span className="text-xl">{data.payload.icon}</span>
            {data.name}
          </p>
          <p className="text-lg font-bold text-primary">{formatPrice(data.value)}</p>
          <p className="text-sm text-muted-foreground">
            {((data.value / totalExpenses) * 100).toFixed(1)}% du total
          </p>
          <p className="text-xs text-primary mt-1">👆 Cliquer pour voir les détails</p>
        </div>
      );
    }
    return null;
  };

  const handleCategoryClick = (data: any) => {
    setSelectedCategory(data.id);
    setDialogOpen(true);
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, icon }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show label if less than 5%

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-lg font-bold"
        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
      >
        {icon}
      </text>
    );
  };

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">📊 Dépenses par catégorie</CardTitle>
              <CardDescription>Ce mois-ci • {formatPrice(totalExpenses)} total</CardDescription>
            </div>
            {onAnalyze && (
              <Button variant="outline" size="sm" onClick={onAnalyze}>
                <TrendingUp className="mr-2 h-4 w-4" />
                Analyser
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expensesByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props) => <CustomLabel {...props} icon={props.icon} />}
                outerRadius={110}
                fill="#8884d8"
                dataKey="value"
                onClick={handleCategoryClick}
                cursor="pointer"
              >
                {expensesByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend - Clickable */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {expensesByCategory.slice(0, 6).map((category) => (
              <button
                key={category.name}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setDialogOpen(true);
                }}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors text-left"
              >
                <div
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: category.color }}
                />
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  <span className="text-base">{category.icon}</span>
                  <span className="text-sm font-medium truncate">{category.name}</span>
                </div>
                <span className="text-sm font-bold shrink-0">
                  {formatPrice(category.value)}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog showing transactions for selected category */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <span className="text-2xl">{selectedCategoryData?.icon}</span>
              {selectedCategoryData?.name}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {selectedCategoryData?.transactions.length} transaction(s) • {formatPrice(selectedCategoryData?.value || 0)}
            </p>
          </DialogHeader>

          <div className="space-y-2 mt-4">
            {selectedCategoryData?.transactions.map((transaction: any) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/30 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-semibold">
                    {transaction.description || 'Sans description'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(transaction.transaction_date).toLocaleDateString('fr-CA', { 
                      day: 'numeric', 
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-lg">
                    {formatPrice(transaction.amount)}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteTransaction.mutate(transaction.id)}
                    disabled={deleteTransaction.isPending}
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
