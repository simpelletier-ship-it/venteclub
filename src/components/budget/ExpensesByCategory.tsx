import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { formatPrice } from "@/lib/priceFormat";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, TrendingUp, List, Grid3x3, ArrowUpDown, PieChartIcon, BarChart3, ChevronLeft, ChevronRight, LayoutGrid, DollarSign, TrendingDown } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CategoryIcon } from "./CategoryIcon";

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

  const hasData = expensesByCategory.length > 0;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3 cursor-pointer">
          <p className="font-semibold flex items-center gap-2">
            <CategoryIcon icon={data.payload.icon} className="h-5 w-5" />
            {data.name}
          </p>
          <p className="text-lg font-bold text-primary">{formatPrice(data.value)}</p>
          <p className="text-sm text-muted-foreground">
            {((data.value / totalExpenses) * 100).toFixed(1)}% du total
          </p>
          <p className="text-xs text-primary mt-1">Cliquer pour voir les détails</p>
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
      <div className="space-y-5">
        {/* Header - Ultra Clean */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button 
              onClick={goToPreviousMonth}
              className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <span className="text-sm font-medium min-w-[90px] text-center">
              {format(selectedMonth, 'MMM yyyy', { locale: fr })}
            </span>
            <button 
              onClick={goToNextMonth}
              disabled={selectedMonth.getMonth() === new Date().getMonth() && selectedMonth.getFullYear() === new Date().getFullYear()}
              className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-muted/30 rounded-lg p-0.5">
              <button 
                onClick={() => setChartType("pie")}
                className={`p-1.5 rounded-md transition-colors ${chartType === "pie" ? "bg-background shadow-sm" : ""}`}
              >
                <PieChartIcon className="h-3.5 w-3.5" />
              </button>
              <button 
                onClick={() => setChartType("bar")}
                className={`p-1.5 rounded-md transition-colors ${chartType === "bar" ? "bg-background shadow-sm" : ""}`}
              >
                <BarChart3 className="h-3.5 w-3.5" />
              </button>
            </div>
            <span className="text-lg font-semibold tabular-nums">{formatPrice(totalExpenses)}</span>
          </div>
        </div>

        {!hasData ? (
          <div className="flex flex-col items-center justify-center h-[200px] text-center">
            <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-3">
              <LayoutGrid className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">Aucune dépense ce mois</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              {chartType === "pie" ? (
                <PieChart>
                  <Pie
                    data={expensesByCategory}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    innerRadius={55}
                    fill="#8884d8"
                    dataKey="value"
                    onClick={handleCategoryClick}
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                    activeIndex={activeIndex ?? undefined}
                    activeShape={renderActiveShape}
                    cursor="pointer"
                    strokeWidth={3}
                    stroke="hsl(var(--background))"
                  >
                    {expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              ) : (
                <BarChart data={expensesByCategory} layout="vertical" margin={{ left: 0, right: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis 
                    type="category"
                    dataKey="name" 
                    className="text-[11px]"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    width={75}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="value" 
                    onClick={handleCategoryClick}
                    cursor="pointer"
                    radius={[0, 6, 6, 0]}
                  >
                    {expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>

            {/* Legend - Clean Grid */}
            <div className="grid grid-cols-2 gap-2">
              {expensesByCategory.slice(0, 6).map((category) => (
                <button
                  key={category.name}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setDialogOpen(true);
                  }}
                  className="flex items-center gap-2.5 py-2 px-2.5 rounded-lg hover:bg-muted/30 transition-colors text-left group"
                >
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm truncate flex-1 group-hover:text-foreground transition-colors">{category.name}</span>
                  <span className="text-sm font-medium text-muted-foreground tabular-nums">
                    {((category.value / totalExpenses) * 100).toFixed(0)}%
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Dialog showing transactions for selected category */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <CategoryIcon icon={selectedCategoryData?.icon || 'circle'} className="h-6 w-6" />
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
