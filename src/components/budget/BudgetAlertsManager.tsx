import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, AlertCircle, TrendingUp, Calendar, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  date: string;
}

export const BudgetAlertsManager = () => {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [alertsEnabled, setAlertsEnabled] = useState(true);

  // Load dismissed alerts and settings from localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem('dismissedBudgetAlerts');
    if (dismissed) {
      setDismissedAlerts(JSON.parse(dismissed));
    }
    const enabled = localStorage.getItem('budgetAlertsEnabled');
    if (enabled !== null) {
      setAlertsEnabled(JSON.parse(enabled));
    }
  }, []);

  // Fetch user transactions
  const { data: transactions } = useQuery({
    queryKey: ['budget-transactions-all'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from('budget_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: goals } = useQuery({
    queryKey: ['budget-goals'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from('budget_goals')
        .select('*, budget_categories(*)')
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    },
  });

  const dismissAlert = (alertId: string) => {
    const newDismissed = [...dismissedAlerts, alertId];
    setDismissedAlerts(newDismissed);
    localStorage.setItem('dismissedBudgetAlerts', JSON.stringify(newDismissed));
  };

  const toggleAlerts = (enabled: boolean) => {
    setAlertsEnabled(enabled);
    localStorage.setItem('budgetAlertsEnabled', JSON.stringify(enabled));
    if (enabled) {
      toast({
        title: "Alertes activées",
        description: "Vous recevrez maintenant des notifications pour vos budgets",
      });
    }
  };

  // Generate alerts based on budget data
  useEffect(() => {
    if (!transactions || !goals || !alertsEnabled) return;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const newAlerts: Alert[] = [];

    goals.forEach(goal => {
      if (!goal.category_id) return;

      const monthlyTransactions = transactions.filter(t => {
        const date = new Date(t.transaction_date);
        return date.getMonth() === currentMonth && 
               date.getFullYear() === currentYear &&
               t.category_id === goal.category_id &&
               t.type === 'expense';
      });

      const spent = monthlyTransactions.reduce((sum, t) => sum + t.amount, 0);
      const budget = goal.monthly_limit;
      const percentage = budget > 0 ? (spent / budget) * 100 : 0;

      const alertId = `budget-${goal.id}`;
      
      // Skip if alert was dismissed
      if (dismissedAlerts.includes(alertId)) {
        return;
      }

      // Check if approaching budget (80-100%)
      if (percentage >= 80 && percentage < 100) {
        newAlerts.push({
          id: alertId,
          type: 'warning',
          title: `Attention: ${goal.budget_categories?.name || 'Catégorie'}`,
          message: `Vous avez utilisé ${percentage.toFixed(0)}% de votre budget (${spent.toFixed(2)}$ / ${budget}$)`,
          date: new Date().toISOString(),
        });
      }

      // Check if budget exceeded
      if (percentage >= 100) {
        const overspent = spent - budget;
        newAlerts.push({
          id: alertId,
          type: 'critical',
          title: `Budget dépassé: ${goal.budget_categories?.name || 'Catégorie'}`,
          message: `Vous avez dépassé votre budget de ${overspent.toFixed(2)}$ (${percentage.toFixed(0)}%)`,
          date: new Date().toISOString(),
        });
      }
    });

    setAlerts(newAlerts);

    // Show toast notification for critical alerts
    const criticalAlerts = newAlerts.filter(a => a.type === 'critical');
    if (criticalAlerts.length > 0 && alertsEnabled) {
      toast({
        title: "⚠️ Attention requise",
        description: `Vous avez ${criticalAlerts.length} budget(s) dépassé(s)`,
        variant: "destructive",
      });
    }
  }, [transactions, goals, dismissedAlerts, alertsEnabled, toast]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alertes intelligentes
              {alerts.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {alerts.length}
                </Badge>
              )}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="alerts-toggle" className="text-sm text-muted-foreground">
              Notifications
            </Label>
            <Switch
              id="alerts-toggle"
              checked={alertsEnabled}
              onCheckedChange={toggleAlerts}
            />
          </div>
        </div>
        <CardDescription>
          Restez informé de vos dépassements budgétaires en temps réel
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!alertsEnabled ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Les alertes sont désactivées. Activez-les pour recevoir des notifications.
          </p>
        ) : alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune alerte pour le moment. Tout va bien! 🎉
          </p>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const Icon = alert.type === 'critical' ? AlertCircle 
                : alert.type === 'warning' ? TrendingUp 
                : alert.type === 'info' ? Calendar 
                : Bell;

              const bgColor = alert.type === 'critical'
                ? 'bg-red-500/10 border-red-500/20'
                : alert.type === 'warning'
                ? 'bg-yellow-500/10 border-yellow-500/20'
                : alert.type === 'info'
                ? 'bg-blue-500/10 border-blue-500/20'
                : 'bg-green-500/10 border-green-500/20';

              return (
                <div key={alert.id} className={`p-3 rounded-lg border ${bgColor}`}>
                  <div className="flex items-start gap-3">
                    <Icon className="h-5 w-5 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{alert.title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {alert.message}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissAlert(alert.id)}
                      className="shrink-0 h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
