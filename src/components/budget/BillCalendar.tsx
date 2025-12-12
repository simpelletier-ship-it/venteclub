import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Bell, Plus, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isBefore } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";

interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: Date;
  category: string;
  isPaid: boolean;
  isRecurring: boolean;
}

export const BillCalendar = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Sample bills
  const [bills] = useState<Bill[]>([
    { id: "1", name: "Loyer", amount: 1200, dueDate: new Date(2024, 0, 1), category: "Logement", isPaid: true, isRecurring: true },
    { id: "2", name: "Hydro-Québec", amount: 85, dueDate: new Date(2024, 0, 15), category: "Utilités", isPaid: false, isRecurring: true },
    { id: "3", name: "Internet", amount: 75, dueDate: new Date(2024, 0, 18), category: "Utilités", isPaid: false, isRecurring: true },
    { id: "4", name: "Assurance auto", amount: 120, dueDate: new Date(2024, 0, 20), category: "Transport", isPaid: false, isRecurring: true },
    { id: "5", name: "Netflix", amount: 16.99, dueDate: new Date(2024, 0, 22), category: "Divertissement", isPaid: false, isRecurring: true },
    { id: "6", name: "Téléphone", amount: 65, dueDate: new Date(2024, 0, 25), category: "Utilités", isPaid: false, isRecurring: true },
  ]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getBillsForDate = (date: Date) => bills.filter((bill) => isSameDay(bill.dueDate, date));

  const upcomingBills = bills
    .filter((bill) => !bill.isPaid && !isBefore(bill.dueDate, new Date()))
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
    .slice(0, 5);

  const totalDue = upcomingBills.reduce((acc, bill) => acc + bill.amount, 0);

  const getDayColor = (date: Date) => {
    const dayBills = getBillsForDate(date);
    if (dayBills.length === 0) return "";
    if (dayBills.every((b) => b.isPaid)) return "bg-emerald-100 dark:bg-emerald-900/30";
    if (isBefore(date, new Date())) return "bg-red-100 dark:bg-red-900/30";
    return "bg-amber-100 dark:bg-amber-900/30";
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-xl bg-blue-500/10">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            Calendrier des factures
          </CardTitle>
          <Button variant="outline" size="sm" className="gap-1">
            <Plus className="w-4 h-4" />
            Ajouter
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Mini calendar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-medium capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: fr })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {["D", "L", "M", "M", "J", "V", "S"].map((day, i) => (
              <div key={i} className="py-1 text-muted-foreground font-medium">
                {day}
              </div>
            ))}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {days.map((day) => {
              const dayBills = getBillsForDate(day);
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    relative p-1 rounded-lg text-sm transition-all
                    ${isToday(day) ? "ring-2 ring-primary" : ""}
                    ${getDayColor(day)}
                    ${selectedDate && isSameDay(selectedDate, day) ? "ring-2 ring-blue-500" : ""}
                    hover:bg-accent
                  `}
                >
                  {format(day, "d")}
                  {dayBills.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Total à payer ce mois</span>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30">
              {upcomingBills.length} factures
            </Badge>
          </div>
          <p className="text-3xl font-bold text-blue-600">{totalDue.toFixed(2)}$</p>
        </div>

        {/* Upcoming bills */}
        <div className="space-y-3">
          <p className="text-sm font-medium flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Prochaines échéances
          </p>
          <div className="space-y-2">
            {upcomingBills.map((bill, i) => (
              <motion.div
                key={bill.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  {bill.isPaid ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : isBefore(bill.dueDate, new Date()) ? (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="font-medium text-sm">{bill.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(bill.dueDate, "d MMMM", { locale: fr })}
                    </p>
                  </div>
                </div>
                <span className="font-semibold">{bill.amount.toFixed(2)}$</span>
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
