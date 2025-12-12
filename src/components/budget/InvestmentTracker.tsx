import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, PieChart, Plus, ExternalLink } from "lucide-react";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { motion } from "framer-motion";

interface Investment {
  id: string;
  name: string;
  type: "REER" | "CELI" | "REEE" | "Non-enregistré";
  value: number;
  cost: number;
  allocation: string;
  returnPercent: number;
}

export const InvestmentTracker = () => {
  const investments: Investment[] = [
    { id: "1", name: "REER - Wealthsimple", type: "REER", value: 45000, cost: 38000, allocation: "Actions mondiales", returnPercent: 18.4 },
    { id: "2", name: "CELI - Questrade", type: "CELI", value: 28500, cost: 25000, allocation: "FNB diversifié", returnPercent: 14.0 },
    { id: "3", name: "REEE Enfants", type: "REEE", value: 12000, cost: 10000, allocation: "Croissance modérée", returnPercent: 20.0 },
    { id: "4", name: "Compte marge", type: "Non-enregistré", value: 8500, cost: 9200, allocation: "Actions tech", returnPercent: -7.6 },
  ];

  const totalValue = investments.reduce((acc, inv) => acc + inv.value, 0);
  const totalCost = investments.reduce((acc, inv) => acc + inv.cost, 0);
  const totalReturn = ((totalValue - totalCost) / totalCost) * 100;
  const totalGain = totalValue - totalCost;

  const allocationData = [
    { name: "REER", value: 45000, color: "#3b82f6" },
    { name: "CELI", value: 28500, color: "#10b981" },
    { name: "REEE", value: 12000, color: "#8b5cf6" },
    { name: "Non-enregistré", value: 8500, color: "#f59e0b" },
  ];

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-xl bg-blue-500/10">
              <PieChart className="w-5 h-5 text-blue-600" />
            </div>
            Portefeuille d'investissements
          </CardTitle>
          <Button variant="outline" size="sm" className="gap-1">
            <Plus className="w-4 h-4" />
            Ajouter
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Portfolio summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
            <p className="text-xs text-muted-foreground mb-1">Valeur totale</p>
            <p className="text-2xl font-bold">{totalValue.toLocaleString()}$</p>
            <div className={`flex items-center gap-1 mt-1 text-sm ${totalGain >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {totalGain >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{totalGain >= 0 ? "+" : ""}{totalGain.toLocaleString()}$ ({totalReturn.toFixed(1)}%)</span>
            </div>
          </div>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={allocationData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {allocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value.toLocaleString()}$`, ""]}
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.5rem",
                  }}
                />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Holdings list */}
        <div className="space-y-3">
          {investments.map((inv, index) => (
            <motion.div
              key={inv.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-xl border bg-card hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{inv.name}</span>
                    <Badge variant="outline" className="text-xs">{inv.type}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{inv.allocation}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{inv.value.toLocaleString()}$</p>
                  <p className={`text-sm flex items-center justify-end gap-1 ${inv.returnPercent >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {inv.returnPercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {inv.returnPercent >= 0 ? "+" : ""}{inv.returnPercent.toFixed(1)}%
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t">
          <div className="text-center">
            <p className="text-lg font-bold text-blue-600">
              {((investments.find(i => i.type === "REER")?.value || 0) / totalValue * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">REER</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-emerald-600">
              {((investments.find(i => i.type === "CELI")?.value || 0) / totalValue * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">CELI</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-violet-600">
              {((investments.filter(i => i.type !== "REER" && i.type !== "CELI").reduce((a, i) => a + i.value, 0)) / totalValue * 100).toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">Autre</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
