import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { formatPrice } from "@/lib/priceFormat";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, TrendingUp, List, Grid3x3, ArrowUpDown, PieChartIcon, BarChart3, ChevronLeft, ChevronRight } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ExpensesByCategoryProps {
  transactions: any[];
  categories: any[];
  onAnalyze?: () => void;
}

export const ExpensesByCategory = ({ transactions, categories, onAnalyze }: ExpensesByCategoryProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [sortBy, setSortBy] = useState<string>("date");
  const [chartType, setChartType] = useState<string>("pie");
  const queryClient = useQueryClient();

  // Navigate months
  const goToPreviousMonth = () => {
    setSelectedMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    const now = new Date();
    setSelectedMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      // Don't go beyond current month
      if (newDate > now) return prev;
      return newDate;
    });
  };

  // Calculate date range based on selected month
  const getDateRange = () => {
    const startDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
    const endDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  };

  const { start: startDate, end: endDate } = getDateRange();
  
  const expensesByCategoryAll = categories
    .filter(cat => cat.type === 'expense')
    .map(category => {
      const categoryTransactions = transactions.filter(
        t => t.category_id === category.id && 
        t.type === 'expense' && 
        t.transaction_date >= startDate &&
        t.transaction_date <= endDate
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
  
  // Grouper les petites catégories (<5% du total) en "Autres"
  const threshold = 0.05;
  const tempTotal = expensesByCategoryAll.reduce((sum, item) => sum + item.value, 0);
  
  const majorCategories = expensesByCategoryAll.filter(item => (item.value / tempTotal) >= threshold);
  const minorCategories = expensesByCategoryAll.filter(item => (item.value / tempTotal) < threshold);
  
  const expensesByCategory = minorCategories.length > 0 ? [
    ...majorCategories,
    {
      id: 'autres',
      name: 'Autres',
      value: minorCategories.reduce((sum, item) => sum + item.value, 0),
      icon: '📋',
      color: '#94a3b8',
      transactions: minorCategories.flatMap(c => c.transactions),
    }
  ] : expensesByCategoryAll;

  const totalExpenses = expensesByCategory.reduce((sum, item) => sum + item.value, 0);

  const selectedCategoryData = expensesByCategory.find(c => c.id === selectedCategory);

  // Sort transactions based on selected sort option
  const sortTransactions = (trans: any[]) => {
    const sorted = [...trans];
    switch (sortBy) {
      case "date":
        return sorted.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
      case "amount":
        return sorted.sort((a, b) => b.amount - a.amount);
      default:
        return sorted;
    }
  };

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

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 10}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl">📊 Dépenses par catégorie</CardTitle>
              <CardDescription>{formatPrice(totalExpenses)} total</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <ToggleGroup type="single" value={chartType} onValueChange={(v) => v && setChartType(v)}>
                <ToggleGroupItem value="pie" aria-label="Graphique circulaire">
                  <PieChartIcon className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="bar" aria-label="Graphique à bandes">
                  <BarChart3 className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
              
              {/* Month navigation */}
              <div className="flex items-center gap-1 bg-muted/50 rounded-md p-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={goToPreviousMonth}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium px-3 min-w-[120px] text-center">
                  {format(selectedMonth, 'MMMM yyyy', { locale: fr })}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={goToNextMonth}
                  disabled={selectedMonth.getMonth() === new Date().getMonth() && selectedMonth.getFullYear() === new Date().getFullYear()}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              {onAnalyze && (
                <Button variant="outline" size="sm" onClick={onAnalyze}>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Analyser
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            {chartType === "pie" ? (
              <PieChart>
                <Pie
                  data={expensesByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={110}
                  fill="#8884d8"
                  dataKey="value"
                  onClick={handleCategoryClick}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  activeIndex={activeIndex ?? undefined}
                  activeShape={renderActiveShape}
                  cursor="pointer"
                >
                  {expensesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            ) : (
              <BarChart data={expensesByCategory}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="name" 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="value" 
                  fill="#6366f1"
                  onClick={handleCategoryClick}
                  cursor="pointer"
                  name="Dépenses"
                >
                  {expensesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            )}
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
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <span className="text-2xl">{selectedCategoryData?.icon}</span>
                  {selectedCategoryData?.name}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedCategoryData?.transactions.length} transaction(s) • {formatPrice(selectedCategoryData?.value || 0)}
                </p>
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Trier par..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4" />
                      Par date
                    </div>
                  </SelectItem>
                  <SelectItem value="amount">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-4 w-4" />
                      Par montant
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </DialogHeader>

          <Tabs defaultValue="chronological" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chronological" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Chronologique
              </TabsTrigger>
              <TabsTrigger value="grouped" className="flex items-center gap-2">
                <Grid3x3 className="h-4 w-4" />
                Par description
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chronological" className="space-y-2">
              {sortTransactions(selectedCategoryData?.transactions || []).map((transaction: any) => (
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
            </TabsContent>

            <TabsContent value="grouped" className="space-y-3">
              {(() => {
                // Group transactions by description
                const grouped = (selectedCategoryData?.transactions || []).reduce((acc: any, transaction: any) => {
                  const desc = transaction.description || 'Sans description';
                  if (!acc[desc]) {
                    acc[desc] = {
                      description: desc,
                      transactions: [],
                      total: 0,
                    };
                  }
                  acc[desc].transactions.push(transaction);
                  acc[desc].total += Number(transaction.amount);
                  return acc;
                }, {});

                const groupedArray = Object.values(grouped).sort((a: any, b: any) => b.total - a.total);

                return groupedArray.map((group: any) => (
                  <div key={group.description} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-lg">{group.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {group.transactions.length} transaction(s)
                        </p>
                      </div>
                      <p className="text-xl font-bold text-primary">
                        {formatPrice(group.total)}
                      </p>
                    </div>
                    
                    <div className="space-y-1 pl-4 border-l-2 border-border">
                      {group.transactions.map((transaction: any) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between text-sm py-1"
                        >
                          <span className="text-muted-foreground">
                            {new Date(transaction.transaction_date).toLocaleDateString('fr-CA', { 
                              day: 'numeric', 
                              month: 'short'
                            })}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {formatPrice(transaction.amount)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteTransaction.mutate(transaction.id)}
                              disabled={deleteTransaction.isPending}
                              className="h-6 w-6"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
};
