import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Calendar } from "lucide-react";
import { formatPrice } from "@/lib/priceFormat";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, subMonths, subWeeks, format } from "date-fns";
import { fr } from "date-fns/locale";

interface FinancialSummaryBoxesProps {
  transactions: any[];
}

type PeriodType = "this-week" | "this-month" | "last-month" | "3-months" | "6-months" | "ytd" | "this-year" | "all";

const periodOptions: { value: PeriodType; label: string }[] = [
  { value: "this-week", label: "Cette semaine" },
  { value: "this-month", label: "Ce mois" },
  { value: "last-month", label: "Mois dernier" },
  { value: "3-months", label: "3 derniers mois" },
  { value: "6-months", label: "6 derniers mois" },
  { value: "ytd", label: "Année à date" },
  { value: "this-year", label: "Cette année" },
  { value: "all", label: "Tout" },
];

export const FinancialSummaryBoxes = ({ transactions }: FinancialSummaryBoxesProps) => {
  const [period, setPeriod] = useState<PeriodType>("this-month");

  const { totalIncome, totalExpenses, netSavings, periodLabel } = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;
    let label = "";

    switch (period) {
      case "this-week":
        startDate = startOfWeek(now, { weekStartsOn: 1 });
        endDate = endOfWeek(now, { weekStartsOn: 1 });
        label = `Semaine du ${format(startDate, 'd MMM', { locale: fr })}`;
        break;
      case "this-month":
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        label = format(now, 'MMMM yyyy', { locale: fr });
        break;
      case "last-month":
        const lastMonth = subMonths(now, 1);
        startDate = startOfMonth(lastMonth);
        endDate = endOfMonth(lastMonth);
        label = format(lastMonth, 'MMMM yyyy', { locale: fr });
        break;
      case "3-months":
        startDate = subMonths(now, 3);
        label = "3 derniers mois";
        break;
      case "6-months":
        startDate = subMonths(now, 6);
        label = "6 derniers mois";
        break;
      case "ytd":
        startDate = startOfYear(now);
        label = `Depuis le 1er janvier ${now.getFullYear()}`;
        break;
      case "this-year":
        startDate = startOfYear(now);
        endDate = new Date(now.getFullYear(), 11, 31);
        label = `Année ${now.getFullYear()}`;
        break;
      case "all":
      default:
        startDate = new Date(0);
        label = "Depuis le début";
        break;
    }

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const filteredTransactions = transactions.filter(t => {
      const date = t.transaction_date;
      return date >= startStr && date <= endStr;
    });

    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      totalIncome: income,
      totalExpenses: expenses,
      netSavings: income - expenses,
      periodLabel: label,
    };
  }, [transactions, period]);

  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span className="font-medium capitalize">{periodLabel}</span>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Boxes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Revenus */}
        <Card className="p-4 bg-emerald-500/10 border-emerald-500/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Revenus</span>
          </div>
          <p className="text-xl font-bold text-emerald-500">
            {formatPrice(totalIncome)}
          </p>
        </Card>

        {/* Total Dépenses */}
        <Card className="p-4 bg-red-500/10 border-red-500/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-red-500/20">
              <TrendingDown className="h-4 w-4 text-red-500" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Dépenses</span>
          </div>
          <p className="text-xl font-bold text-red-500">
            {formatPrice(totalExpenses)}
          </p>
        </Card>

        {/* Net / Économies */}
        <Card className={`p-4 ${netSavings >= 0 ? 'bg-primary/10 border-primary/20' : 'bg-orange-500/10 border-orange-500/20'}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded-lg ${netSavings >= 0 ? 'bg-primary/20' : 'bg-orange-500/20'}`}>
              <PiggyBank className={`h-4 w-4 ${netSavings >= 0 ? 'text-primary' : 'text-orange-500'}`} />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Économies</span>
          </div>
          <p className={`text-xl font-bold ${netSavings >= 0 ? 'text-primary' : 'text-orange-500'}`}>
            {netSavings >= 0 ? '+' : ''}{formatPrice(netSavings)}
          </p>
        </Card>

        {/* Taux d'épargne */}
        <Card className="p-4 bg-muted/50 border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-muted">
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Taux épargne</span>
          </div>
          <p className={`text-xl font-bold ${savingsRate >= 20 ? 'text-emerald-500' : savingsRate >= 10 ? 'text-primary' : 'text-muted-foreground'}`}>
            {savingsRate.toFixed(1)}%
          </p>
        </Card>
      </div>
    </div>
  );
};
