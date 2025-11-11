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

// Taux d'imposition fédéraux 2025 (communs à toutes les provinces)
const FEDERAL_TAX_BRACKETS = [
  { max: 55867, rate: 0.15 },
  { max: 111733, rate: 0.205 },
  { max: 173205, rate: 0.26 },
  { max: 246752, rate: 0.29 },
  { max: Infinity, rate: 0.33 }
];

// Taux provinciaux 2025
const PROVINCIAL_TAX_RATES: Record<string, any> = {
  QC: {
    brackets: [
      { max: 51780, rate: 0.14 },
      { max: 103545, rate: 0.19 },
      { max: 126000, rate: 0.24 },
      { max: Infinity, rate: 0.2575 }
    ],
    qpip: { rate: 0.00494, max: 94000 }
  },
  ON: {
    brackets: [
      { max: 51446, rate: 0.0505 },
      { max: 102894, rate: 0.0915 },
      { max: 150000, rate: 0.1116 },
      { max: 220000, rate: 0.1216 },
      { max: Infinity, rate: 0.1316 }
    ]
  },
  BC: {
    brackets: [
      { max: 47937, rate: 0.0506 },
      { max: 95875, rate: 0.077 },
      { max: 110076, rate: 0.105 },
      { max: 133664, rate: 0.1229 },
      { max: 181232, rate: 0.147 },
      { max: Infinity, rate: 0.168 }
    ]
  },
  AB: {
    brackets: [
      { max: 148269, rate: 0.10 },
      { max: 177922, rate: 0.12 },
      { max: 237230, rate: 0.13 },
      { max: 355845, rate: 0.14 },
      { max: Infinity, rate: 0.15 }
    ]
  }
};

// CPP/QPP et EI 2025
const CPP_RATE = 0.0595;
const CPP_MAX = 68500;
const CPP_EXEMPTION = 3500;
const EI_RATE = 0.0158; // Taux standard (sauf Québec)
const EI_RATE_QC = 0.0127; // Taux réduit Québec
const EI_MAX = 63200;

// Crédits d'impôt de base 2025 (montant personnel de base)
const FEDERAL_BASIC_PERSONAL_AMOUNT = 15705;
const PROVINCIAL_BASIC_AMOUNTS: Record<string, number> = {
  QC: 18056,
  ON: 11865,
  BC: 12580,
  AB: 21885
};

const SalaryCalculator = () => {
  const [grossSalary, setGrossSalary] = useState("52000");
  const [period, setPeriod] = useState<"annual" | "monthly" | "biweekly" | "weekly" | "hourly">("annual");
  const [province, setProvince] = useState("ON");
  const [hoursPerWeek, setHoursPerWeek] = useState("40");

  const calculateTax = (income: number) => {
    // Calcul impôt fédéral brut
    let federalTaxGross = 0;
    let previousMax = 0;
    for (const bracket of FEDERAL_TAX_BRACKETS) {
      const taxableInBracket = Math.min(income, bracket.max) - previousMax;
      if (taxableInBracket <= 0) break;
      federalTaxGross += taxableInBracket * bracket.rate;
      previousMax = Math.min(income, bracket.max);
      if (income <= bracket.max) break;
    }
    
    // Appliquer crédit de base fédéral
    const federalBasicCredit = FEDERAL_BASIC_PERSONAL_AMOUNT * 0.15;
    const federalTax = Math.max(0, federalTaxGross - federalBasicCredit);

    // Calcul impôt provincial brut
    const provincialRates = PROVINCIAL_TAX_RATES[province];
    let provincialTaxGross = 0;
    previousMax = 0;
    for (const bracket of provincialRates.brackets) {
      const taxableInBracket = Math.min(income, bracket.max) - previousMax;
      if (taxableInBracket <= 0) break;
      provincialTaxGross += taxableInBracket * bracket.rate;
      previousMax = Math.min(income, bracket.max);
      if (income <= bracket.max) break;
    }
    
    // Appliquer crédit de base provincial
    const provincialBasicAmount = PROVINCIAL_BASIC_AMOUNTS[province];
    const provincialBasicCredit = provincialBasicAmount * provincialRates.brackets[0].rate;
    const provincialTax = Math.max(0, provincialTaxGross - provincialBasicCredit);

    // CPP/QPP (RPC/RRQ)
    const cppContribution = Math.min(
      Math.max(income - CPP_EXEMPTION, 0) * CPP_RATE,
      (CPP_MAX - CPP_EXEMPTION) * CPP_RATE
    );

    // Assurance-emploi (EI)
    const eiRate = province === "QC" ? EI_RATE_QC : EI_RATE;
    const eiContribution = Math.min(income * eiRate, EI_MAX * eiRate);

    // RQAP (Québec seulement)
    const qpipContribution = province === "QC" 
      ? Math.min(income * provincialRates.qpip.rate, provincialRates.qpip.max * provincialRates.qpip.rate)
      : 0;

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
      effectiveRate: income > 0 ? (totalTax / income) * 100 : 0,
      marginalRate: calculateMarginalRate(income)
    };
  };

  const calculateMarginalRate = (income: number) => {
    // Trouver le taux fédéral marginal
    let federalRate = 0.15;
    for (const bracket of FEDERAL_TAX_BRACKETS) {
      if (income <= bracket.max) {
        federalRate = bracket.rate;
        break;
      }
    }

    // Trouver le taux provincial marginal
    const provincialRates = PROVINCIAL_TAX_RATES[province];
    let provincialRate = provincialRates.brackets[0].rate;
    for (const bracket of provincialRates.brackets) {
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
    { name: province === "QC" ? "RRQ" : "RPC", value: results.cppContribution, color: "#8b5cf6" },
    { name: "Assurance-emploi", value: results.eiContribution, color: "#3b82f6" },
    ...(province === "QC" ? [{ name: "RQAP", value: results.qpipContribution, color: "#ec4899" }] : []),
  ].filter(item => item.value > 0);

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
                              <span>{province === "QC" ? "RRQ" : "RPC"}</span>
                              <span>- {formatPrice(getPeriodValue(results.cppContribution))}</span>
                            </div>
                            <div className="flex justify-between items-center text-blue-600 dark:text-blue-400">
                              <span>Assurance-emploi</span>
                              <span>- {formatPrice(getPeriodValue(results.eiContribution))}</span>
                            </div>
                            {province === "QC" && (
                              <div className="flex justify-between items-center text-pink-600 dark:text-pink-400">
                                <span>RQAP</span>
                                <span>- {formatPrice(getPeriodValue(results.qpipContribution))}</span>
                              </div>
                            )}
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
              <p>• Les calculs sont basés sur les taux d'imposition 2025 du Canada et de votre province</p>
              <p>• Les crédits d'impôt de base sont automatiquement appliqués (montant personnel de base)</p>
              <p>• {province === "QC" ? "RRQ" : "RPC"} : {province === "QC" ? "Régime de rentes du Québec" : "Régime de pensions du Canada"}</p>
              <p>• AE : Assurance-emploi (taux réduit au Québec car RQAP est distinct)</p>
              {province === "QC" && <p>• RQAP : Régime québécois d'assurance parentale (Québec seulement)</p>}
              <p>• Ces calculs sont des estimations. Consultez un comptable pour des calculs précis</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default SalaryCalculator;
