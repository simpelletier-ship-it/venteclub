import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, Bell, BellOff, Settings, TrendingUp, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface SpendingLimit {
  id: string;
  category: string;
  icon: string;
  limit: number;
  spent: number;
  alertThreshold: number; // percentage
  isActive: boolean;
}

export const SpendingLimitsAlerts = () => {
  const [limits, setLimits] = useState<SpendingLimit[]>([
    { id: "1", category: "Restaurants", icon: "🍽️", limit: 300, spent: 245, alertThreshold: 80, isActive: true },
    { id: "2", category: "Divertissement", icon: "🎬", limit: 150, spent: 168, alertThreshold: 80, isActive: true },
    { id: "3", category: "Shopping", icon: "🛍️", limit: 200, spent: 89, alertThreshold: 80, isActive: true },
    { id: "4", category: "Transport", icon: "🚗", limit: 250, spent: 180, alertThreshold: 80, isActive: true },
    { id: "5", category: "Épicerie", icon: "🛒", limit: 600, spent: 520, alertThreshold: 80, isActive: true },
  ]);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const getStatusColor = (spent: number, limit: number) => {
    const percentage = (spent / limit) * 100;
    if (percentage >= 100) return "text-red-600 bg-red-100 dark:bg-red-900/30";
    if (percentage >= 80) return "text-amber-600 bg-amber-100 dark:bg-amber-900/30";
    return "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30";
  };

  const getProgressColor = (spent: number, limit: number) => {
    const percentage = (spent / limit) * 100;
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 80) return "bg-amber-500";
    return "bg-emerald-500";
  };

  const exceededLimits = limits.filter((l) => l.spent >= l.limit);
  const warningLimits = limits.filter((l) => l.spent >= l.limit * (l.alertThreshold / 100) && l.spent < l.limit);

  const toggleLimit = (id: string) => {
    setLimits(limits.map((l) => (l.id === id ? { ...l, isActive: !l.isActive } : l)));
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-xl bg-orange-500/10">
              <Zap className="w-5 h-5 text-orange-600" />
            </div>
            Limites et alertes
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={notificationsEnabled ? "text-primary" : "text-muted-foreground"}
            >
              {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Alerts summary */}
        {(exceededLimits.length > 0 || warningLimits.length > 0) && (
          <div className="space-y-2">
            {exceededLimits.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"
              >
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {exceededLimits.length} limite{exceededLimits.length > 1 ? "s" : ""} dépassée{exceededLimits.length > 1 ? "s" : ""}
                  </span>
                </div>
              </motion.div>
            )}
            {warningLimits.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800"
              >
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {warningLimits.length} catégorie{warningLimits.length > 1 ? "s" : ""} proche{warningLimits.length > 1 ? "s" : ""} de la limite
                  </span>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Limits list */}
        <div className="space-y-3">
          {limits.map((limit, index) => {
            const percentage = (limit.spent / limit.limit) * 100;
            const isExceeded = percentage >= 100;
            const isWarning = percentage >= limit.alertThreshold && !isExceeded;

            return (
              <motion.div
                key={limit.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-xl border ${
                  isExceeded 
                    ? "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/10" 
                    : isWarning 
                    ? "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/10"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{limit.icon}</span>
                    <div>
                      <p className="font-medium">{limit.category}</p>
                      <p className="text-xs text-muted-foreground">
                        Alerte à {limit.alertThreshold}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(limit.spent, limit.limit) + " border-0"}>
                      {isExceeded ? "Dépassé" : isWarning ? "Attention" : "OK"}
                    </Badge>
                    <Switch
                      checked={limit.isActive}
                      onCheckedChange={() => toggleLimit(limit.id)}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className={isExceeded ? "text-red-600 font-medium" : ""}>
                      {limit.spent.toFixed(0)}$ dépensés
                    </span>
                    <span className="text-muted-foreground">
                      Limite: {limit.limit}$
                    </span>
                  </div>
                  <div className="overflow-hidden rounded-full">
                    <Progress 
                      value={Math.min(percentage, 100)} 
                      className={`h-2 ${percentage >= 100 ? "[&>div]:bg-red-500" : percentage >= 80 ? "[&>div]:bg-amber-500" : "[&>div]:bg-emerald-500"}`}
                    />
                  </div>
                  {isExceeded && (
                    <p className="text-xs text-red-600">
                      Dépassement de {(limit.spent - limit.limit).toFixed(0)}$ ({(percentage - 100).toFixed(0)}%)
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Add new limit */}
        <Button variant="outline" className="w-full border-dashed">
          + Ajouter une limite de dépenses
        </Button>
      </CardContent>
    </Card>
  );
};
