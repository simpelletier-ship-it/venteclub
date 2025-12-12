import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Wallet, PiggyBank, HelpCircle } from "lucide-react";
import { formatPrice } from "@/lib/priceFormat";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, subMonths, format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FinancialSummaryBoxesProps {
  transactions: any[];
}

type PeriodType = "this-week" | "this-month" | "last-month" | "3-months" | "6-months" | "ytd" | "this-year" | "all";

const periodOptions: { value: PeriodType; label: string }[] = [
  { value: "this-week", label: "Cette semaine" },
  { value: "this-month", label: "Ce mois" },
  { value: "last-month", label: "Mois dernier" },
  { value: "3-months", label: "3 mois" },
  { value: "6-months", label: "6 mois" },
  { value: "ytd", label: "Année à date" },
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
        label = `Depuis janvier ${now.getFullYear()}`;
        break;
      case "all":
      default:
        startDate = new Date(0);
        label = "Tout l'historique";
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
    <div className="space-y-5">
      {/* Period Selector - Clean */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground capitalize">{periodLabel}</p>
        <Select value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
          <SelectTrigger className="w-[130px] h-8 text-xs border-0 bg-muted/50">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periodOptions.map(option => (
              <SelectItem key={option.value} value={option.value} className="text-sm">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Grid - Minimal Design */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Revenus */}
        <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <span className="text-xs font-medium text-muted-foreground">Revenus</span>
          </div>
          <p className="text-lg sm:text-xl font-semibold text-emerald-600 tabular-nums">
            {formatPrice(totalIncome)}
          </p>
        </div>

        {/* Dépenses */}
        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="h-4 w-4 text-red-500" />
            <span className="text-xs font-medium text-muted-foreground">Dépenses</span>
          </div>
          <p className="text-lg sm:text-xl font-semibold text-red-500 tabular-nums">
            {formatPrice(totalExpenses)}
          </p>
        </div>

        {/* Économies */}
        <div className={cn(
          "p-4 rounded-xl border",
          netSavings >= 0 
            ? "bg-blue-500/5 border-blue-500/10" 
            : "bg-orange-500/5 border-orange-500/10"
        )}>
          <div className="flex items-center gap-2 mb-3">
            <PiggyBank className={cn("h-4 w-4", netSavings >= 0 ? "text-blue-600" : "text-orange-500")} />
            <span className="text-xs font-medium text-muted-foreground">Économies</span>
          </div>
          <p className={cn(
            "text-lg sm:text-xl font-semibold tabular-nums",
            netSavings >= 0 ? "text-blue-600" : "text-orange-500"
          )}>
            {netSavings >= 0 ? '+' : ''}{formatPrice(netSavings)}
          </p>
        </div>

        {/* Taux d'épargne */}
        <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Taux d'épargne</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[280px] p-3">
                  <p className="text-sm font-medium mb-1">Comment c'est calculé?</p>
                  <p className="text-xs text-muted-foreground">
                    (Revenus − Dépenses) ÷ Revenus × 100
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Un taux ≥ 20% est considéré excellent. Entre 10-20% c'est bon. Moins de 10% nécessite attention.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className={cn(
            "text-lg sm:text-xl font-semibold tabular-nums",
            savingsRate >= 20 ? "text-emerald-600" : savingsRate >= 10 ? "text-blue-600" : "text-muted-foreground"
          )}>
            {savingsRate.toFixed(0)}%
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            {savingsRate >= 20 ? "Excellent!" : savingsRate >= 10 ? "Bon" : "À améliorer"}
          </p>
        </div>
      </div>
    </div>
  );
};
