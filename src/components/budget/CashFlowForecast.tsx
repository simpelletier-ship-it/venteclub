import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertTriangle, Calendar, ArrowRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from "recharts";
import { format, addDays, addMonths } from "date-fns";
import { fr } from "date-fns/locale";

interface CashFlowForecastProps {
  currentBalance?: number;
  monthlyIncome?: number;
  monthlyExpenses?: number;
  upcomingBills?: Array<{ name: string; amount: number; date: Date }>;
}

export const CashFlowForecast = ({
  currentBalance = 5200,
  monthlyIncome = 4500,
  monthlyExpenses = 3800,
  upcomingBills = [],
}: CashFlowForecastProps) => {
  // Generate 90-day forecast
  const forecastData = useMemo(() => {
    const data = [];
    let balance = currentBalance;
    const dailyIncome = monthlyIncome / 30;
    const dailyExpense = monthlyExpenses / 30;

    for (let i = 0; i <= 90; i++) {
      const date = addDays(new Date(), i);
      
      // Simulate income on 1st and 15th
      if (date.getDate() === 1 || date.getDate() === 15) {
        balance += monthlyIncome / 2;
      }
      
      // Daily expenses (with some variance)
      balance -= dailyExpense * (0.8 + Math.random() * 0.4);
      
      // Add scheduled bills
      const dueToday = upcomingBills.filter(
        (b) => format(b.date, "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
      );
      dueToday.forEach((bill) => (balance -= bill.amount));

      data.push({
        date: format(date, "d MMM", { locale: fr }),
        fullDate: date,
        balance: Math.round(balance),
        projected: Math.round(balance),
        isNegative: balance < 0,
      });
    }

    return data;
  }, [currentBalance, monthlyIncome, monthlyExpenses, upcomingBills]);

  const minBalance = Math.min(...forecastData.map((d) => d.balance));
  const maxBalance = Math.max(...forecastData.map((d) => d.balance));
  const avgBalance = forecastData.reduce((acc, d) => acc + d.balance, 0) / forecastData.length;
  
  const lowPointDate = forecastData.find((d) => d.balance === minBalance);
  const willGoNegative = minBalance < 0;

  // Calculate monthly projections
  const monthlyProjections = [1, 2, 3].map((monthOffset) => {
    const monthEnd = addMonths(new Date(), monthOffset);
    const projectedBalance = currentBalance + (monthlyIncome - monthlyExpenses) * monthOffset;
    return {
      month: format(monthEnd, "MMMM", { locale: fr }),
      balance: Math.round(projectedBalance),
    };
  });

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-xl bg-indigo-500/10">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>
            Prévisions de trésorerie
          </CardTitle>
          <Badge variant="secondary">90 jours</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Alert if negative balance predicted */}
        {willGoNegative && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Attention: Solde négatif prévu</span>
            </div>
            <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">
              Votre solde pourrait devenir négatif le{" "}
              {lowPointDate && format(lowPointDate.fullDate, "d MMMM", { locale: fr })}.
              Réduisez vos dépenses ou augmentez vos revenus.
            </p>
          </div>
        )}

        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={forecastData}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickLine={false}
                interval={14}
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickLine={false}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
                formatter={(value: number) => [`${value.toLocaleString()}$`, "Solde"]}
              />
              <ReferenceLine y={0} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
              <Area
                type="monotone"
                dataKey="balance"
                stroke="hsl(var(--primary))"
                fill="url(#colorBalance)"
                strokeWidth={2}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-xl bg-muted/50">
            <p className={`text-xl font-bold ${minBalance < 0 ? "text-red-600" : "text-foreground"}`}>
              {minBalance.toLocaleString()}$
            </p>
            <p className="text-xs text-muted-foreground">Solde min.</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-muted/50">
            <p className="text-xl font-bold">{avgBalance.toLocaleString()}$</p>
            <p className="text-xs text-muted-foreground">Solde moyen</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-muted/50">
            <p className="text-xl font-bold text-emerald-600">{maxBalance.toLocaleString()}$</p>
            <p className="text-xs text-muted-foreground">Solde max.</p>
          </div>
        </div>

        {/* Monthly projections */}
        <div className="space-y-3">
          <p className="text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Projections mensuelles
          </p>
          <div className="flex items-center justify-between gap-2">
            {monthlyProjections.map((proj, i) => (
              <div key={i} className="flex-1 text-center p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20">
                <p className="text-xs text-muted-foreground capitalize">{proj.month}</p>
                <p className={`text-lg font-bold ${proj.balance < 0 ? "text-red-600" : "text-indigo-600"}`}>
                  {proj.balance.toLocaleString()}$
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Savings rate indicator */}
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span className="font-medium">Taux d'épargne mensuel</span>
            </div>
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
              {(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100).toFixed(0)}%
            </Badge>
          </div>
          <p className="text-sm text-emerald-600/80 dark:text-emerald-400/80 mt-2">
            Vous économisez environ <strong>{(monthlyIncome - monthlyExpenses).toLocaleString()}$</strong> par mois
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
