import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/priceFormat";
import { format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense';
}

interface Transaction {
  id: string;
  amount: number;
  description: string;
  transaction_date: string;
  type: 'income' | 'expense';
  category_id: string;
  category: Category;
}

interface TransactionsCalendarProps {
  transactions: Transaction[];
  categories: Category[];
}

export const TransactionsCalendar = ({ transactions, categories }: TransactionsCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Group transactions by date
  const transactionsByDate = transactions.reduce((acc, transaction) => {
    const date = transaction.transaction_date;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(transaction);
    return acc;
  }, {} as Record<string, Transaction[]>);

  // Get transactions for selected date
  const selectedDateTransactions = selectedDate
    ? transactions.filter(t => isSameDay(new Date(t.transaction_date), selectedDate))
    : [];

  // Calculate totals for selected date
  const dayIncome = selectedDateTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const dayExpense = selectedDateTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Mark days that have transactions
  const daysWithTransactions = Object.keys(transactionsByDate).map(dateStr => new Date(dateStr));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Calendrier des transactions</CardTitle>
          <CardDescription>Cliquez sur une date pour voir les transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={fr}
            className={cn("rounded-md border pointer-events-auto")}
            modifiers={{
              hasTransactions: daysWithTransactions
            }}
            modifiersClassNames={{
              hasTransactions: "font-bold text-primary relative after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-primary"
            }}
          />

          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              Légende des catégories
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {categories.slice(0, 12).map(cat => (
                <div key={cat.id} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-sm truncate">
                    {cat.icon} {cat.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDate ? format(selectedDate, 'dd MMMM yyyy', { locale: fr }) : 'Sélectionnez une date'}
          </CardTitle>
          <CardDescription>
            {selectedDateTransactions.length} transaction{selectedDateTransactions.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedDateTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucune transaction ce jour
            </p>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg">
                  <span className="text-sm font-medium">Revenus</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    + {formatPrice(dayIncome)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-500/10 rounded-lg">
                  <span className="text-sm font-medium">Dépenses</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    - {formatPrice(dayExpense)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                  <span className="text-sm font-medium">Balance</span>
                  <span className={cn(
                    "font-semibold",
                    dayIncome - dayExpense >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  )}>
                    {dayIncome - dayExpense >= 0 ? '+' : ''} {formatPrice(dayIncome - dayExpense)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {selectedDateTransactions.map(transaction => (
                  <div
                    key={transaction.id}
                    className="p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="outline"
                            className="flex-shrink-0"
                            style={{
                              borderColor: transaction.category.color,
                              color: transaction.category.color,
                            }}
                          >
                            {transaction.category.icon} {transaction.category.name}
                          </Badge>
                        </div>
                        {transaction.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {transaction.description}
                          </p>
                        )}
                      </div>
                      <span
                        className={cn(
                          "font-semibold whitespace-nowrap",
                          transaction.type === 'income' ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                        )}
                      >
                        {transaction.type === 'income' ? '+' : '-'} {formatPrice(transaction.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
