import { Helmet } from "react-helmet";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/CurrencyInput";
import { formatPrice } from "@/lib/priceFormat";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { AlertCircle, CheckCircle, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const BudgetCalculator = () => {
  // Revenus
  const [monthlyIncome, setMonthlyIncome] = useState("4000");
  
  // Dépenses fixes
  const [rent, setRent] = useState("1200");
  const [utilities, setUtilities] = useState("150");
  const [internet, setInternet] = useState("60");
  const [phone, setPhone] = useState("50");
  const [insurance, setInsurance] = useState("200");
  const [carPayment, setCarPayment] = useState("300");
  
  // Dépenses variables
  const [groceries, setGroceries] = useState("400");
  const [transportation, setTransportation] = useState("150");
  const [entertainment, setEntertainment] = useState("200");
  const [restaurants, setRestaurants] = useState("150");
  const [shopping, setShopping] = useState("100");
  
  // Épargne et dettes
  const [savings, setSavings] = useState("300");
  const [debtPayment, setDebtPayment] = useState("200");

  const calculateBudget = () => {
    const income = parseFloat(monthlyIncome) || 0;
    
    const fixedExpenses = 
      (parseFloat(rent) || 0) +
      (parseFloat(utilities) || 0) +
      (parseFloat(internet) || 0) +
      (parseFloat(phone) || 0) +
      (parseFloat(insurance) || 0) +
      (parseFloat(carPayment) || 0);
    
    const variableExpenses = 
      (parseFloat(groceries) || 0) +
      (parseFloat(transportation) || 0) +
      (parseFloat(entertainment) || 0) +
      (parseFloat(restaurants) || 0) +
      (parseFloat(shopping) || 0);
    
    const savingsAmount = parseFloat(savings) || 0;
    const debtAmount = parseFloat(debtPayment) || 0;
    
    const totalExpenses = fixedExpenses + variableExpenses + savingsAmount + debtAmount;
    const remaining = income - totalExpenses;
    const savingsRate = income > 0 ? (savingsAmount / income) * 100 : 0;

    return {
      income,
      fixedExpenses,
      variableExpenses,
      savingsAmount,
      debtAmount,
      totalExpenses,
      remaining,
      savingsRate
    };
  };

  const results = calculateBudget();

  const chartData = [
    { name: "Dépenses fixes", value: results.fixedExpenses, color: "#ef4444" },
    { name: "Dépenses variables", value: results.variableExpenses, color: "#f59e0b" },
    { name: "Épargne", value: results.savingsAmount, color: "#10b981" },
    { name: "Remboursement dettes", value: results.debtAmount, color: "#8b5cf6" },
    { name: "Restant", value: Math.max(0, results.remaining), color: "#3b82f6" },
  ].filter(item => item.value > 0);

  const getBudgetStatus = () => {
    if (results.remaining >= 0 && results.savingsRate >= 20) {
      return {
        type: "success",
        icon: CheckCircle,
        message: "Excellent! Votre budget est équilibré et vous épargnez suffisamment.",
        color: "text-green-600 dark:text-green-400"
      };
    } else if (results.remaining >= 0 && results.savingsRate >= 10) {
      return {
        type: "warning",
        icon: TrendingUp,
        message: "Bon budget, mais essayez d'augmenter votre taux d'épargne à 20%.",
        color: "text-yellow-600 dark:text-yellow-400"
      };
    } else if (results.remaining >= 0) {
      return {
        type: "warning",
        icon: AlertCircle,
        message: "Votre budget est équilibré, mais vous devriez épargner davantage.",
        color: "text-orange-600 dark:text-orange-400"
      };
    } else {
      return {
        type: "error",
        icon: AlertCircle,
        message: "Attention! Vos dépenses dépassent vos revenus. Réduisez vos dépenses.",
        color: "text-red-600 dark:text-red-400"
      };
    }
  };

  const status = getBudgetStatus();
  const StatusIcon = status.icon;

  return (
    <>
      <Helmet>
        <title>Planificateur de Budget Personnel | Outils Financiers Vente.Club</title>
        <meta name="description" content="Créez et gérez votre budget mensuel facilement. Suivez vos revenus, dépenses et épargne avec notre calculateur gratuit." />
      </Helmet>

      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 text-foreground">
              Planificateur de Budget
            </h1>
            <p className="text-muted-foreground text-lg">
              Créez et gérez votre budget mensuel et annuel
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Input Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Revenus */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenus mensuels</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label>Revenu net mensuel</Label>
                    <CurrencyInput
                      value={monthlyIncome}
                      onChange={setMonthlyIncome}
                      showCurrency={false}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Dépenses fixes */}
              <Card>
                <CardHeader>
                  <CardTitle>Dépenses fixes</CardTitle>
                  <CardDescription>Dépenses récurrentes mensuelles</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Loyer / Hypothèque</Label>
                    <CurrencyInput value={rent} onChange={setRent} showCurrency={false} className="mt-1" />
                  </div>
                  <div>
                    <Label>Électricité / Chauffage</Label>
                    <CurrencyInput value={utilities} onChange={setUtilities} showCurrency={false} className="mt-1" />
                  </div>
                  <div>
                    <Label>Internet</Label>
                    <CurrencyInput value={internet} onChange={setInternet} showCurrency={false} className="mt-1" />
                  </div>
                  <div>
                    <Label>Téléphone</Label>
                    <CurrencyInput value={phone} onChange={setPhone} showCurrency={false} className="mt-1" />
                  </div>
                  <div>
                    <Label>Assurances</Label>
                    <CurrencyInput value={insurance} onChange={setInsurance} showCurrency={false} className="mt-1" />
                  </div>
                  <div>
                    <Label>Paiement auto</Label>
                    <CurrencyInput value={carPayment} onChange={setCarPayment} showCurrency={false} className="mt-1" />
                  </div>
                </CardContent>
              </Card>

              {/* Dépenses variables */}
              <Card>
                <CardHeader>
                  <CardTitle>Dépenses variables</CardTitle>
                  <CardDescription>Dépenses fluctuantes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Épicerie</Label>
                    <CurrencyInput value={groceries} onChange={setGroceries} showCurrency={false} className="mt-1" />
                  </div>
                  <div>
                    <Label>Transport / Essence</Label>
                    <CurrencyInput value={transportation} onChange={setTransportation} showCurrency={false} className="mt-1" />
                  </div>
                  <div>
                    <Label>Divertissement</Label>
                    <CurrencyInput value={entertainment} onChange={setEntertainment} showCurrency={false} className="mt-1" />
                  </div>
                  <div>
                    <Label>Restaurants</Label>
                    <CurrencyInput value={restaurants} onChange={setRestaurants} showCurrency={false} className="mt-1" />
                  </div>
                  <div>
                    <Label>Magasinage</Label>
                    <CurrencyInput value={shopping} onChange={setShopping} showCurrency={false} className="mt-1" />
                  </div>
                </CardContent>
              </Card>

              {/* Épargne et dettes */}
              <Card>
                <CardHeader>
                  <CardTitle>Épargne et dettes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Épargne mensuelle</Label>
                    <CurrencyInput value={savings} onChange={setSavings} showCurrency={false} className="mt-1" />
                  </div>
                  <div>
                    <Label>Remboursement dettes</Label>
                    <CurrencyInput value={debtPayment} onChange={setDebtPayment} showCurrency={false} className="mt-1" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results Section */}
            <div className="lg:col-span-3 space-y-6">
              {/* Status Alert */}
              <Alert className={`border-2 ${
                status.type === 'success' ? 'border-green-500 bg-green-50 dark:bg-green-950/20' :
                status.type === 'warning' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' :
                'border-red-500 bg-red-50 dark:bg-red-950/20'
              }`}>
                <StatusIcon className={`h-5 w-5 ${status.color}`} />
                <AlertDescription className={status.color}>
                  {status.message}
                </AlertDescription>
              </Alert>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Revenus mensuels
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {formatPrice(results.income)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Dépenses totales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {formatPrice(results.totalExpenses)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Taux d'épargne
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {results.savingsRate.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>

                <Card className={results.remaining >= 0 ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Restant
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${
                      results.remaining >= 0 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {formatPrice(results.remaining)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Répartition du budget</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatPrice(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Détails */}
              <Card>
                <CardHeader>
                  <CardTitle>Détail des dépenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-3 border-b">
                      <span className="text-muted-foreground">Dépenses fixes</span>
                      <span className="font-semibold">{formatPrice(results.fixedExpenses)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b">
                      <span className="text-muted-foreground">Dépenses variables</span>
                      <span className="font-semibold">{formatPrice(results.variableExpenses)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b">
                      <span className="text-green-600 dark:text-green-400">Épargne</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        {formatPrice(results.savingsAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b">
                      <span className="text-muted-foreground">Remboursement dettes</span>
                      <span className="font-semibold">{formatPrice(results.debtAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="font-bold text-lg">Projection annuelle (épargne)</span>
                      <span className="font-bold text-xl text-green-600 dark:text-green-400">
                        {formatPrice(results.savingsAmount * 12)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tips */}
              <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="text-blue-900 dark:text-blue-100">
                    Règle du 50/30/20
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-blue-800 dark:text-blue-200 space-y-2">
                  <p>• <strong>50%</strong> pour les besoins essentiels (logement, nourriture, transport)</p>
                  <p>• <strong>30%</strong> pour les désirs (loisirs, sorties, achats)</p>
                  <p>• <strong>20%</strong> pour l'épargne et le remboursement de dettes</p>
                  <p className="pt-2 text-sm">
                    Cette règle est un guide. Adaptez-la selon votre situation personnelle.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BudgetCalculator;
