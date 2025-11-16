import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
      monthlyGross = grossAmount * hours * 4.33; // 4.33 weeks per month average
    } else if (incomeType === "yearly") {
      monthlyGross = grossAmount / 12;
    } else {
      monthlyGross = grossAmount;
    }

    // Rough Quebec tax estimation (approximately 30% for average earner)
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

      if (error) {
        throw error;
      }

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setGeneratedBudget(data);
      setEditedBudget(JSON.parse(JSON.stringify(data))); // Deep copy
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

  const updateBudgetItem = (type: 'income' | 'expenses', index: number, field: 'amount', value: number) => {
    if (!editedBudget) return;
    const newBudget = { ...editedBudget };
    newBudget[type][index][field] = value;
    setEditedBudget(newBudget);
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Générer avec IA
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Assistant Budget IA
          </DialogTitle>
          <DialogDescription>
            Répondez à quelques questions pour générer un budget personnalisé
          </DialogDescription>
        </DialogHeader>

        {!generatedBudget ? (
          <div className="space-y-4 py-4">
            <div className="space-y-3 p-4 rounded-lg bg-muted/50 border">
              <div>
                <Label htmlFor="incomeType">Type de salaire</Label>
                <Select value={incomeType} onValueChange={(value: any) => setIncomeType(value)}>
                  <SelectTrigger id="incomeType" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">💼 Horaire ($/heure)</SelectItem>
                    <SelectItem value="monthly">📅 Mensuel ($/mois)</SelectItem>
                    <SelectItem value="yearly">📊 Annuel ($/année)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="income">
                  Salaire brut {incomeType === "hourly" ? "($/heure)" : incomeType === "yearly" ? "($/année)" : "($/mois)"}
                </Label>
                <CurrencyInput
                  id="income"
                  value={income}
                  onChange={setIncome}
                  placeholder={incomeType === "hourly" ? "Ex: 25" : incomeType === "yearly" ? "Ex: 65000" : "Ex: 5000"}
                  className="mt-1.5"
                />
              </div>

              {incomeType === "hourly" && (
                <div>
                  <Label htmlFor="hoursPerWeek">Heures par semaine</Label>
                  <Input
                    id="hoursPerWeek"
                    type="number"
                    value={hoursPerWeek}
                    onChange={(e) => setHoursPerWeek(e.target.value)}
                    placeholder="Ex: 40"
                    className="mt-1.5"
                    min="1"
                    max="80"
                  />
                </div>
              )}

              {income && parseFloat(income) > 0 && (
                <div className="p-3 rounded bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    💰 Revenu net mensuel estimé: <span className="font-bold">{formatPrice(calculateMonthlyNet())}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    (Estimation après déductions fiscales ~30%)
                  </p>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="dependents">Nombre de personnes à charge</Label>
              <Select value={dependents} onValueChange={setDependents}>
                <SelectTrigger id="dependents" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Aucune</SelectItem>
                  <SelectItem value="1">1 personne</SelectItem>
                  <SelectItem value="2">2 personnes</SelectItem>
                  <SelectItem value="3">3 personnes</SelectItem>
                  <SelectItem value="4">4 personnes ou plus</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location">Région</Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger id="location" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Montréal">Montréal</SelectItem>
                  <SelectItem value="Québec">Québec</SelectItem>
                  <SelectItem value="Laval">Laval</SelectItem>
                  <SelectItem value="Gatineau">Gatineau</SelectItem>
                  <SelectItem value="Sherbrooke">Sherbrooke</SelectItem>
                  <SelectItem value="Saguenay">Saguenay</SelectItem>
                  <SelectItem value="Trois-Rivières">Trois-Rivières</SelectItem>
                  <SelectItem value="Autre région">Autre région</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="expenses">Dépenses actuelles connues (optionnel)</Label>
              <Input
                id="expenses"
                value={expenses}
                onChange={(e) => setExpenses(e.target.value)}
                placeholder="Ex: Loyer 1200$, Auto 400$"
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Entrez vos dépenses principales si vous les connaissez
              </p>
            </div>

            <Button 
              onClick={handleGenerate} 
              disabled={loading} 
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Générer mon budget
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <p className="text-sm">{generatedBudget.explanation}</p>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-3 text-green-600 flex items-center gap-2">
                  💰 Revenus
                </h4>
                <div className="space-y-2">
                  {editedBudget?.income?.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                      <span className="flex items-center gap-2 flex-1">
                        <span className="text-lg">{item.icon}</span>
                        <span className="font-medium">{item.name}</span>
                      </span>
                      <Input
                        type="number"
                        value={item.amount}
                        onChange={(e) => updateBudgetItem('income', index, 'amount', parseFloat(e.target.value) || 0)}
                        className="w-32 text-right font-semibold"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3 text-red-600 flex items-center gap-2">
                  💳 Dépenses recommandées
                </h4>
                <div className="space-y-2">
                  {editedBudget?.expenses?.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                      <span className="flex items-center gap-2 flex-1">
                        <span className="text-lg">{item.icon}</span>
                        <span className="font-medium">{item.name}</span>
                      </span>
                      <Input
                        type="number"
                        value={item.amount}
                        onChange={(e) => updateBudgetItem('expenses', index, 'amount', parseFloat(e.target.value) || 0)}
                        className="w-32 text-right font-semibold"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={() => {
                  setGeneratedBudget(null);
                  setEditedBudget(null);
                  setIncome("");
                  setIncomeType("monthly");
                  setHoursPerWeek("40");
                  setDependents("0");
                  setExpenses("");
                }}
                variant="outline"
                className="flex-1"
              >
                Recommencer
              </Button>
              <Button onClick={handleApply} className="flex-1">
                Appliquer ce budget
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
