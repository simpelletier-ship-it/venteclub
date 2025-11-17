import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { CurrencyInput } from "@/components/CurrencyInput";

interface AIBudgetGeneratorProps {
  onBudgetGenerated: (budget: {
    income: Array<{ name: string; amount: number; icon: string }>;
    expenses: Array<{ name: string; amount: number; icon: string }>;
    explanation: string;
  }) => void;
}

export const AIBudgetGenerator = ({ onBudgetGenerated }: AIBudgetGeneratorProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [income, setIncome] = useState("");
  const [incomeType, setIncomeType] = useState<"hourly" | "monthly" | "yearly">("monthly");
  const [hoursPerWeek, setHoursPerWeek] = useState("40");
  const [dependents, setDependents] = useState("0");
  const [location, setLocation] = useState("Montréal");
  const [expenses, setExpenses] = useState("");
  const [generatedBudget, setGeneratedBudget] = useState<any>(null);
  const [editedBudget, setEditedBudget] = useState<any>(null);

  // Calculate monthly net income from gross
  const calculateMonthlyNet = () => {
    if (!income || parseFloat(income) <= 0) return 0;
    
    const grossAmount = parseFloat(income);
    let monthlyGross = 0;

    if (incomeType === "hourly") {
      const hours = parseFloat(hoursPerWeek) || 40;
      monthlyGross = grossAmount * hours * 4.33;
    } else if (incomeType === "yearly") {
      monthlyGross = grossAmount / 12;
    } else {
      monthlyGross = grossAmount;
    }

    const netMonthly = monthlyGross * 0.70;
    return Math.round(netMonthly);
  };

  const handleGenerate = async () => {
    if (!income || parseFloat(income) <= 0) {
      toast.error("Veuillez entrer un salaire valide");
      return;
    }

    if (incomeType === "hourly" && (!hoursPerWeek || parseFloat(hoursPerWeek) <= 0)) {
      toast.error("Veuillez entrer le nombre d'heures par semaine");
      return;
    }

    const monthlyNetIncome = calculateMonthlyNet();

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-budget', {
        body: {
          income: monthlyNetIncome,
          grossIncome: parseFloat(income),
          incomeType,
          hoursPerWeek: incomeType === "hourly" ? parseFloat(hoursPerWeek) : undefined,
          dependents: parseInt(dependents),
          location,
          expenses,
        }
      });

      if (error) throw error;
      if (data.error) {
        toast.error(data.error);
        return;
      }

      setGeneratedBudget(data);
      setEditedBudget(JSON.parse(JSON.stringify(data)));
      toast.success("✨ Budget généré avec succès!");
    } catch (error) {
      console.error("Error generating budget:", error);
      toast.error("Erreur lors de la génération du budget");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (editedBudget) {
      onBudgetGenerated(editedBudget);
      setOpen(false);
      setGeneratedBudget(null);
      setEditedBudget(null);
      setIncome("");
      setIncomeType("monthly");
      setHoursPerWeek("40");
      setDependents("0");
      setExpenses("");
    }
  };

  const handleEdit = (type: 'income' | 'expenses', index: number, newAmount: number) => {
    if (!editedBudget) return;
    const updatedBudget = { ...editedBudget };
    updatedBudget[type][index].amount = newAmount;
    setEditedBudget(updatedBudget);
  };

  const monthlyNetIncome = calculateMonthlyNet();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full h-11 border-dashed hover:border-primary/50 hover:bg-primary/5 transition-colors">
          <Sparkles className="mr-2 h-4 w-4" />
          Assistant Budget IA
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4 pb-8 border-b border-border/50">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/10">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-semibold tracking-tight">Assistant Budget IA</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1.5">
                Générez un budget personnalisé basé sur votre situation financière
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {!generatedBudget ? (
          <div className="space-y-8 py-6">
            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="income" className="text-sm font-medium flex items-center gap-2">
                  Salaire brut
                  <span className="text-xs text-muted-foreground font-normal">(avant impôts)</span>
                </Label>
                <Input
                  id="income"
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  placeholder="50 000"
                  className="h-12 text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-3">
                  <Label htmlFor="incomeType" className="text-sm font-medium">
                    Période de paie
                  </Label>
                  <Select value={incomeType} onValueChange={(value: any) => setIncomeType(value)}>
                    <SelectTrigger id="incomeType" className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Par heure</SelectItem>
                      <SelectItem value="monthly">Par mois</SelectItem>
                      <SelectItem value="yearly">Par année</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {incomeType === "hourly" && (
                  <div className="space-y-3">
                    <Label htmlFor="hoursPerWeek" className="text-sm font-medium">
                      Heures / semaine
                    </Label>
                    <Input
                      id="hoursPerWeek"
                      type="number"
                      value={hoursPerWeek}
                      onChange={(e) => setHoursPerWeek(e.target.value)}
                      placeholder="40"
                      className="h-12 text-base"
                    />
                  </div>
                )}
              </div>

              {monthlyNetIncome > 0 && (
                <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Revenu net estimé</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold tracking-tight">
                        {new Intl.NumberFormat('fr-CA', {
                          style: 'currency',
                          currency: 'CAD',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0
                        }).format(monthlyNetIncome)}
                      </span>
                      <span className="text-base text-muted-foreground font-medium">/mois</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Estimation après déductions fiscales (~30%)
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-3">
                  <Label htmlFor="dependents" className="text-sm font-medium">
                    Personnes à charge
                  </Label>
                  <Input
                    id="dependents"
                    type="number"
                    value={dependents}
                    onChange={(e) => setDependents(e.target.value)}
                    min="0"
                    placeholder="0"
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="location" className="text-sm font-medium">
                    Ville
                  </Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Montréal, QC"
                    className="h-12 text-base"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="expenses" className="text-sm font-medium">
                  Dépenses fixes mensuelles <span className="text-muted-foreground font-normal">(optionnel)</span>
                </Label>
                <Textarea
                  id="expenses"
                  value={expenses}
                  onChange={(e) => setExpenses(e.target.value)}
                  placeholder="Ex: Loyer 1200$, Voiture 450$, Internet 80$..."
                  rows={4}
                  className="resize-none text-base"
                />
                <p className="text-xs text-muted-foreground">
                  Listez vos dépenses récurrentes pour un budget plus précis
                </p>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading || !income}
              className="w-full h-14 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Générer mon budget personnalisé
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-8 py-6">
            <div className="space-y-7">
              <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <span className="text-lg">💰</span>
                    </div>
                    <h3 className="font-semibold text-lg">Revenus mensuels</h3>
                  </div>
                  <div className="space-y-3">
                    {editedBudget.income.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-background/60 rounded-xl border border-border/40 hover:border-primary/30 transition-colors">
                        <span className="text-sm font-medium">{item.name}</span>
                        <CurrencyInput
                          value={item.amount}
                          onChange={(value) => handleEdit('income', index, parseFloat(value) || 0)}
                          className="w-36 text-right h-10 text-base"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
                      <span className="text-lg">💸</span>
                    </div>
                    <h3 className="font-semibold text-lg">Dépenses mensuelles</h3>
                  </div>
                  <div className="space-y-3">
                    {editedBudget.expenses.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-background/60 rounded-xl border border-border/40 hover:border-primary/30 transition-colors">
                        <span className="text-sm font-medium">{item.name}</span>
                        <CurrencyInput
                          value={item.amount}
                          onChange={(value) => handleEdit('expenses', index, parseFloat(value) || 0)}
                          className="w-36 text-right h-10 text-base"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Total revenus</p>
                    <p className="text-3xl font-bold tracking-tight">
                      {new Intl.NumberFormat('fr-CA', {
                        style: 'currency',
                        currency: 'CAD',
                        minimumFractionDigits: 0
                      }).format(editedBudget.income.reduce((sum: number, item: any) => sum + item.amount, 0))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Total dépenses</p>
                    <p className="text-3xl font-bold tracking-tight">
                      {new Intl.NumberFormat('fr-CA', {
                        style: 'currency',
                        currency: 'CAD',
                        minimumFractionDigits: 0
                      }).format(editedBudget.expenses.reduce((sum: number, item: any) => sum + item.amount, 0))}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setGeneratedBudget(null);
                  setEditedBudget(null);
                }}
                className="flex-1 h-12 text-base font-medium border-border/50"
              >
                Recommencer
              </Button>
              <Button
                onClick={handleApply}
                className="flex-1 h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
              >
                Appliquer ce budget
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
