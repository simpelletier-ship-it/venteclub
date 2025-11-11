import { Helmet } from "react-helmet";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/CurrencyInput";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { formatPrice } from "@/lib/priceFormat";

const PROVINCES = [
  { value: "QC", label: "Québec" },
  { value: "ON", label: "Ontario" },
  { value: "BC", label: "Colombie-Britannique" },
  { value: "AB", label: "Alberta" },
];

// Taux 2025 pour le Québec
const TAX_RATES_QC = {
  federal: [
    { max: 55867, rate: 0.15 },
    { max: 111733, rate: 0.205 },
    { max: 173205, rate: 0.26 },
    { max: 246752, rate: 0.29 },
    { max: Infinity, rate: 0.33 }
  ],
  provincial: [
    { max: 51780, rate: 0.14 },
    { max: 103545, rate: 0.19 },
    { max: 126000, rate: 0.24 },
    { max: Infinity, rate: 0.2575 }
  ],
  cpp: { rate: 0.0595, max: 68500, exemption: 3500 },
  ei: { rate: 0.0127, max: 63200 },
  qpip: { rate: 0.00494, max: 94000 }
};

const SalaryCalculator = () => {
  const [grossSalary, setGrossSalary] = useState("52000");
  const [period, setPeriod] = useState<"annual" | "monthly" | "biweekly" | "weekly" | "hourly">("annual");
  const [province, setProvince] = useState("QC");
  const [hoursPerWeek, setHoursPerWeek] = useState("40");

  const calculateTax = (income: number) => {
    let federalTax = 0;
    let provincialTax = 0;
    let remainingIncome = income;
    
    // Calcul impôt fédéral
    let previousMax = 0;
    for (const bracket of TAX_RATES_QC.federal) {
      const taxableInBracket = Math.min(remainingIncome, bracket.max - previousMax);
      if (taxableInBracket <= 0) break;
      federalTax += taxableInBracket * bracket.rate;
      previousMax = bracket.max;
      if (remainingIncome <= bracket.max) break;
    }

    // Calcul impôt provincial
    remainingIncome = income;
    previousMax = 0;
    for (const bracket of TAX_RATES_QC.provincial) {
      const taxableInBracket = Math.min(remainingIncome, bracket.max - previousMax);
      if (taxableInBracket <= 0) break;
      provincialTax += taxableInBracket * bracket.rate;
      previousMax = bracket.max;
      if (remainingIncome <= bracket.max) break;
    }

    // RPC/QPP
    const cppContribution = Math.min(
      Math.max(income - TAX_RATES_QC.cpp.exemption, 0) * TAX_RATES_QC.cpp.rate,
      (TAX_RATES_QC.cpp.max - TAX_RATES_QC.cpp.exemption) * TAX_RATES_QC.cpp.rate
    );

    // Assurance-emploi
    const eiContribution = Math.min(income * TAX_RATES_QC.ei.rate, TAX_RATES_QC.ei.max * TAX_RATES_QC.ei.rate);

    // RQAP (Québec seulement)
    const qpipContribution = Math.min(income * TAX_RATES_QC.qpip.rate, TAX_RATES_QC.qpip.max * TAX_RATES_QC.qpip.rate);

    const totalTax = federalTax + provincialTax + cppContribution + eiContribution + qpipContribution;
    const netIncome = income - totalTax;

    return {
      gross: income,
      federalTax,
      provincialTax,
      cppContribution,
      eiContribution,
      qpipContribution,
      totalTax,
      netIncome,
      effectiveRate: (totalTax / income) * 100,
      marginalRate: calculateMarginalRate(income)
    };
  };

  const calculateMarginalRate = (income: number) => {
    let federalRate = 0.15;
    for (const bracket of TAX_RATES_QC.federal) {
      if (income <= bracket.max) {
        federalRate = bracket.rate;
        break;
      }
    }

    let provincialRate = 0.14;
    for (const bracket of TAX_RATES_QC.provincial) {
      if (income <= bracket.max) {
        provincialRate = bracket.rate;
        break;
      }
    }

    return ((federalRate + provincialRate) * 100);
  };

  const getAnnualSalary = () => {
    const salary = parseFloat(grossSalary) || 0;
    switch (period) {
      case "hourly":
        const hours = parseFloat(hoursPerWeek) || 40;
        return salary * hours * 52;
      case "weekly":
        return salary * 52;
      case "biweekly":
        return salary * 26;
      case "monthly":
        return salary * 12;
      default:
        return salary;
    }
  };

  const results = calculateTax(getAnnualSalary());

  const getPeriodValue = (annualValue: number) => {
    switch (period) {
      case "hourly":
        const hours = parseFloat(hoursPerWeek) || 40;
        return annualValue / (52 * hours);
      case "weekly":
        return annualValue / 52;
      case "biweekly":
        return annualValue / 26;
      case "monthly":
        return annualValue / 12;
      default:
        return annualValue;
    }
  };

  const chartData = [
    { name: "Salaire net", value: results.netIncome, color: "#10b981" },
    { name: "Impôt fédéral", value: results.federalTax, color: "#ef4444" },
    { name: "Impôt provincial", value: results.provincialTax, color: "#f59e0b" },
    { name: "RPC/QPP", value: results.cppContribution, color: "#8b5cf6" },
    { name: "Assurance-emploi", value: results.eiContribution, color: "#3b82f6" },
    { name: "RQAP", value: results.qpipContribution, color: "#ec4899" },
  ];

  return (
    <>
      <Helmet>
        <title>Calculateur de Salaire Net Québec 2025 | Vente.Club</title>
        <meta name="description" content="Calculez votre salaire net après impôts au Québec. Inclut impôts fédéral et provincial, RPC, assurance-emploi, RQAP. Calculs précis avec les taux 2025." />
      </Helmet>

      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 text-foreground">
              Calculateur de Salaire Net - Québec
            </h1>
            <p className="text-muted-foreground text-lg">
              Estimez le montant de votre salaire après impôts (taux 2025)
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Section */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Paramètres</CardTitle>
                <CardDescription>Entrez vos informations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Salaire brut</Label>
                  <CurrencyInput
                    value={grossSalary}
                    onChange={setGrossSalary}
                    showCurrency={false}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Période</Label>
                  <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annual">Année</SelectItem>
                      <SelectItem value="monthly">Mois</SelectItem>
                      <SelectItem value="biweekly">Deux semaines</SelectItem>
                      <SelectItem value="weekly">Semaine</SelectItem>
                      <SelectItem value="hourly">Heure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {period === "hourly" && (
                  <div>
                    <Label>Heures par semaine</Label>
                    <CurrencyInput
                      value={hoursPerWeek}
                      onChange={setHoursPerWeek}
                      showCurrency={false}
                      className="mt-1"
                    />
                  </div>
                )}

                <div>
                  <Label>Province</Label>
                  <Select value={province} onValueChange={setProvince}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVINCES.map((prov) => (
                        <SelectItem key={prov.value} value={prov.value}>
                          {prov.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full" size="lg">
                  Calculer
                </Button>
              </CardContent>
            </Card>

            {/* Results Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tabs for different periods */}
              <Tabs defaultValue="annual" value={period} onValueChange={(v: any) => setPeriod(v)}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="annual">Année</TabsTrigger>
                  <TabsTrigger value="monthly">Mois</TabsTrigger>
                  <TabsTrigger value="biweekly">2 sem.</TabsTrigger>
                  <TabsTrigger value="weekly">Semaine</TabsTrigger>
                  <TabsTrigger value="hourly">Heure</TabsTrigger>
                </TabsList>

                <TabsContent value={period} className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Résumé</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b">
                              <span className="text-muted-foreground">Salaire brut</span>
                              <span className="font-semibold text-lg">
                                {formatPrice(getPeriodValue(results.gross))}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-red-600 dark:text-red-400">
                              <span>Impôt fédéral</span>
                              <span>- {formatPrice(getPeriodValue(results.federalTax))}</span>
                            </div>
                            <div className="flex justify-between items-center text-orange-600 dark:text-orange-400">
                              <span>Impôt provincial</span>
                              <span>- {formatPrice(getPeriodValue(results.provincialTax))}</span>
                            </div>
                            <div className="flex justify-between items-center text-purple-600 dark:text-purple-400">
                              <span>RPC/QPP</span>
                              <span>- {formatPrice(getPeriodValue(results.cppContribution))}</span>
                            </div>
                            <div className="flex justify-between items-center text-blue-600 dark:text-blue-400">
                              <span>Assurance-emploi</span>
                              <span>- {formatPrice(getPeriodValue(results.eiContribution))}</span>
                            </div>
                            <div className="flex justify-between items-center text-pink-600 dark:text-pink-400">
                              <span>RQAP</span>
                              <span>- {formatPrice(getPeriodValue(results.qpipContribution))}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-t-2 border-primary">
                              <span className="font-bold text-lg">Salaire net</span>
                              <span className="font-bold text-2xl text-green-600 dark:text-green-400">
                                {formatPrice(getPeriodValue(results.netIncome))}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-center">
                          <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                              <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={2}
                                dataKey="value"
                              >
                                {chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value: number) => formatPrice(value)}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Tax Rates */}
              <Card>
                <CardHeader>
                  <CardTitle>Taux d'imposition</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Taux d'imposition marginal</div>
                      <div className="text-2xl font-bold text-primary">
                        {results.marginalRate.toFixed(1)}%
                      </div>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-sm text-muted-foreground mb-1">Taux d'imposition moyen</div>
                      <div className="text-2xl font-bold text-primary">
                        {results.effectiveRate.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Info Section */}
          <Card className="mt-8 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100">À propos des calculs</CardTitle>
            </CardHeader>
            <CardContent className="text-blue-800 dark:text-blue-200 space-y-2">
              <p>• Les calculs sont basés sur les taux d'imposition 2025 du Québec et du Canada</p>
              <p>• RPC/QPP : Cotisation au Régime de pensions du Canada / Régime de rentes du Québec</p>
              <p>• RQAP : Régime québécois d'assurance parentale (Québec seulement)</p>
              <p>• Ces calculs sont des estimations. Consultez un comptable pour des calculs précis</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default SalaryCalculator;
