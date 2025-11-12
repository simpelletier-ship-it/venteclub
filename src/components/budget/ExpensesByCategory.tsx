import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { formatPrice } from "@/lib/priceFormat";

interface ExpensesByCategoryProps {
  transactions: any[];
  categories: any[];
}

export const ExpensesByCategory = ({ transactions, categories }: ExpensesByCategoryProps) => {
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
        name: category.name,
        value: total,
        icon: category.icon,
        color: category.color || '#6366f1',
      };
    })
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const totalExpenses = expensesByCategory.reduce((sum, item) => sum + item.value, 0);

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
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-semibold flex items-center gap-2">
            <span className="text-xl">{data.payload.icon}</span>
            {data.name}
          </p>
          <p className="text-lg font-bold text-primary">{formatPrice(data.value)}</p>
          <p className="text-sm text-muted-foreground">
            {((data.value / totalExpenses) * 100).toFixed(1)}% du total
          </p>
        </div>
      );
    }
    return null;
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
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl">📊 Dépenses par catégorie</CardTitle>
        <CardDescription>Ce mois-ci • {formatPrice(totalExpenses)} total</CardDescription>
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
            >
              {expensesByCategory.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          {expensesByCategory.slice(0, 6).map((category) => (
            <div
              key={category.name}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors"
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
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
