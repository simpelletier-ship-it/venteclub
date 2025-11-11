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
  const [province, setProvince] = useState("QC");
  const [hoursPerWeek, setHoursPerWeek] = useState("40");

  // Convertir automatiquement le salaire entre les périodes
  const handlePeriodChange = (newPeriod: "annual" | "monthly" | "biweekly" | "weekly" | "hourly") => {
    // Convertir le salaire actuel en annuel d'abord
    const currentAnnualSalary = getAnnualSalary();
    
    // Puis convertir l'annuel vers la nouvelle période
    let convertedSalary: number;
    const hours = parseFloat(hoursPerWeek) || 40;
    
    switch (newPeriod) {
      case "hourly":
        convertedSalary = currentAnnualSalary / (52 * hours);
        break;
      case "weekly":
        convertedSalary = currentAnnualSalary / 52;
        break;
      case "biweekly":
        convertedSalary = currentAnnualSalary / 26;
        break;
      case "monthly":
        convertedSalary = currentAnnualSalary / 12;
        break;
      default:
        convertedSalary = currentAnnualSalary;
    }
    
    // Arrondir à 2 décimales pour éviter les valeurs trop longues
    setGrossSalary(Math.round(convertedSalary * 100) / 100 + "");
    setPeriod(newPeriod);
  };

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

  const annualSalary = getAnnualSalary();
  const results = calculateTax(annualSalary);

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

  const formatPeriodPrice = (annualValue: number) => {
    const periodValue = getPeriodValue(annualValue);
    // For hourly, show 2 decimals if value is less than 10
    if (period === "hourly" && periodValue < 10 && periodValue > 0) {
      return periodValue.toFixed(2) + " $";
    }
    return formatPrice(periodValue);
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
        <title>Calculateur de Salaire Net Québec 2025 - Gratuit et Précis | Impôt, RRQ, AE</title>
        <meta name="description" content="Calculateur de salaire net gratuit pour le Québec 2025. Calcul instantané de votre paie après impôts fédéral et provincial, RRQ, assurance-emploi et RQAP. Conversion automatique annuel, mensuel, bihebdomadaire, hebdomadaire et horaire." />
        <meta name="keywords" content="calculateur salaire net québec, calcul paie après impôt, salaire brut net québec, impôt québec 2025, calculateur impôt revenu, paie nette québec, calculateur paie, salaire horaire annuel, RRQ AE RQAP" />
        <link rel="canonical" href="https://vente.club/outils/salaire" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Calculateur de Salaire Net Québec 2025 - Gratuit" />
        <meta property="og:description" content="Calculez instantanément votre salaire net après impôts au Québec avec les taux 2025. Conversion automatique entre toutes les périodes de paie." />
        <meta property="og:url" content="https://vente.club/outils/salaire" />
        
        {/* Schema.org markup for Google */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Calculateur de Salaire Net Québec",
            "description": "Calculateur gratuit de salaire net après impôts pour le Québec avec les taux d'imposition 2025",
            "applicationCategory": "FinanceApplication",
            "operatingSystem": "Any",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "CAD"
            },
            "featureList": [
              "Calcul impôt fédéral et provincial",
              "RRQ (Régime de rentes du Québec)",
              "Assurance-emploi",
              "RQAP (Régime québécois d'assurance parentale)",
              "Conversion entre périodes de paie"
            ]
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* SEO-optimized header section */}
          <header className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 text-foreground">
              Calculateur de Salaire Net Québec 2025
            </h1>
            <p className="text-muted-foreground text-base md:text-lg mb-4">
              Calculez instantanément votre paie nette après impôts • Taux 2025 à jour
            </p>
            <div className="max-w-3xl mx-auto text-sm text-muted-foreground mb-6">
              <p className="leading-relaxed">
                Outil gratuit de calcul de salaire net pour le Québec. Obtenez une estimation précise de votre paie après déductions des 
                <strong> impôts fédéral et provincial, cotisations RRQ, assurance-emploi et RQAP</strong>. 
                Conversion automatique entre salaire annuel, mensuel, bihebdomadaire, hebdomadaire et horaire.
              </p>
            </div>
          </header>

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
                  <Select value={period} onValueChange={(v: any) => handlePeriodChange(v)}>
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
              <Tabs defaultValue="annual" value={period} onValueChange={(v: any) => handlePeriodChange(v)}>
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="annual">Année</TabsTrigger>
                  <TabsTrigger value="monthly">Mois</TabsTrigger>
                  <TabsTrigger value="biweekly">2 sem.</TabsTrigger>
                  <TabsTrigger value="weekly">Semaine</TabsTrigger>
                  <TabsTrigger value="hourly">Heure</TabsTrigger>
                  <TabsTrigger value="compare">Comparaison</TabsTrigger>
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
                                {formatPeriodPrice(results.gross)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-red-600 dark:text-red-400">
                              <span>Impôt fédéral</span>
                              <span>- {formatPeriodPrice(results.federalTax)}</span>
                            </div>
                            <div className="flex justify-between items-center text-orange-600 dark:text-orange-400">
                              <span>Impôt provincial</span>
                              <span>- {formatPeriodPrice(results.provincialTax)}</span>
                            </div>
                            <div className="flex justify-between items-center text-purple-600 dark:text-purple-400">
                              <span>{province === "QC" ? "RRQ" : "RPC"}</span>
                              <span>- {formatPeriodPrice(results.cppContribution)}</span>
                            </div>
                            <div className="flex justify-between items-center text-blue-600 dark:text-blue-400">
                              <span>Assurance-emploi</span>
                              <span>- {formatPeriodPrice(results.eiContribution)}</span>
                            </div>
                            {province === "QC" && (
                              <div className="flex justify-between items-center text-pink-600 dark:text-pink-400">
                                <span>RQAP</span>
                                <span>- {formatPeriodPrice(results.qpipContribution)}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center py-3 border-t-2 border-primary">
                              <span className="font-bold text-lg">Salaire net</span>
                              <span className="font-bold text-2xl text-green-600 dark:text-green-400">
                                {formatPeriodPrice(results.netIncome)}
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

                {/* Comparaison rapide */}
                <TabsContent value="compare" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Comparaison rapide - Toutes les périodes</CardTitle>
                      <CardDescription>Vue d'ensemble de votre salaire net selon différentes périodes</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-3 px-4 font-semibold text-foreground">Période</th>
                              <th className="text-right py-3 px-4 font-semibold text-foreground">Salaire brut</th>
                              <th className="text-right py-3 px-4 font-semibold text-foreground">Impôts totaux</th>
                              <th className="text-right py-3 px-4 font-semibold text-green-600 dark:text-green-400">Salaire net</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                              <td className="py-3 px-4 font-medium text-foreground">Annuel</td>
                              <td className="text-right py-3 px-4 text-muted-foreground">{formatPrice(results.gross)}</td>
                              <td className="text-right py-3 px-4 text-red-600 dark:text-red-400">- {formatPrice(results.totalTax)}</td>
                              <td className="text-right py-3 px-4 font-semibold text-green-600 dark:text-green-400">{formatPrice(results.netIncome)}</td>
                            </tr>
                            <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                              <td className="py-3 px-4 font-medium text-foreground">Mensuel</td>
                              <td className="text-right py-3 px-4 text-muted-foreground">{formatPrice(results.gross / 12)}</td>
                              <td className="text-right py-3 px-4 text-red-600 dark:text-red-400">- {formatPrice(results.totalTax / 12)}</td>
                              <td className="text-right py-3 px-4 font-semibold text-green-600 dark:text-green-400">{formatPrice(results.netIncome / 12)}</td>
                            </tr>
                            <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                              <td className="py-3 px-4 font-medium text-foreground">Bihebdomadaire</td>
                              <td className="text-right py-3 px-4 text-muted-foreground">{formatPrice(results.gross / 26)}</td>
                              <td className="text-right py-3 px-4 text-red-600 dark:text-red-400">- {formatPrice(results.totalTax / 26)}</td>
                              <td className="text-right py-3 px-4 font-semibold text-green-600 dark:text-green-400">{formatPrice(results.netIncome / 26)}</td>
                            </tr>
                            <tr className="border-b border-border hover:bg-muted/50 transition-colors">
                              <td className="py-3 px-4 font-medium text-foreground">Hebdomadaire</td>
                              <td className="text-right py-3 px-4 text-muted-foreground">{formatPrice(results.gross / 52)}</td>
                              <td className="text-right py-3 px-4 text-red-600 dark:text-red-400">- {formatPrice(results.totalTax / 52)}</td>
                              <td className="text-right py-3 px-4 font-semibold text-green-600 dark:text-green-400">{formatPrice(results.netIncome / 52)}</td>
                            </tr>
                            <tr className="hover:bg-muted/50 transition-colors">
                              <td className="py-3 px-4 font-medium text-foreground">Horaire</td>
                              <td className="text-right py-3 px-4 text-muted-foreground">{formatPrice(results.gross / (52 * parseFloat(hoursPerWeek || "40")))}</td>
                              <td className="text-right py-3 px-4 text-red-600 dark:text-red-400">- {formatPrice(results.totalTax / (52 * parseFloat(hoursPerWeek || "40")))}</td>
                              <td className="text-right py-3 px-4 font-semibold text-green-600 dark:text-green-400">{formatPrice(results.netIncome / (52 * parseFloat(hoursPerWeek || "40")))}</td>
                            </tr>
                          </tbody>
                        </table>
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

          {/* SEO Content Section */}
          <section className="mt-12 space-y-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Comment fonctionne le calculateur de salaire net au Québec?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground">
                <p>
                  Notre calculateur de salaire net utilise les <strong>taux d'imposition 2025 officiels</strong> pour estimer avec précision 
                  votre paie nette après toutes les déductions obligatoires au Québec et au Canada.
                </p>
                
                <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">Déductions incluses dans le calcul:</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Impôt fédéral:</strong> Calculé selon les paliers d'imposition progressifs du gouvernement canadien</li>
                  <li><strong>Impôt provincial (Québec):</strong> Taux spécifiques à la province de Québec, incluant le crédit d'impôt de base</li>
                  <li><strong>RRQ (Régime de rentes du Québec):</strong> Cotisation au régime de pension provincial (5.95% en 2025)</li>
                  <li><strong>Assurance-emploi (AE):</strong> Taux réduit pour le Québec (1.27% vs 1.58% ailleurs au Canada)</li>
                  <li><strong>RQAP (Régime québécois d'assurance parentale):</strong> Cotisation unique au Québec (0.494% en 2025)</li>
                </ul>

                <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">Conversion intelligente entre périodes de paie</h3>
                <p>
                  Notre calculateur offre une <strong>conversion automatique intelligente</strong> entre toutes les périodes de paie. 
                  Entrez votre salaire dans n'importe quelle période (horaire, hebdomadaire, bihebdomadaire, mensuel ou annuel), 
                  et changez de période pour voir instantanément l'équivalent converti. Par exemple, un salaire de 25 $/heure 
                  (40h/semaine) est automatiquement converti en 52 000 $/année. Cette fonctionnalité unique facilite la comparaison 
                  d'offres d'emploi avec différentes structures de rémunération.
                </p>

                <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">Taux effectif vs taux marginal d'imposition</h3>
                <p>
                  <strong>Le taux effectif</strong> représente le pourcentage réel de votre salaire qui va aux impôts et cotisations, 
                  tandis que <strong>le taux marginal</strong> est le taux appliqué sur votre dernier dollar gagné. 
                  Le système d'imposition progressif canadien signifie que votre taux effectif est toujours inférieur à votre taux marginal.
                </p>

                <h3 className="text-lg font-semibold text-foreground mt-6 mb-3">Pourquoi utiliser un calculateur de salaire net?</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Négocier votre salaire en toute connaissance de votre revenu net réel</li>
                  <li>Comparer des offres d'emploi avec différentes structures de paie (horaire, salaire annuel, commission)</li>
                  <li>Planifier votre budget personnel basé sur votre revenu disponible après impôts</li>
                  <li>Comprendre l'impact fiscal d'une augmentation de salaire ou d'une prime</li>
                  <li>Évaluer le coût net d'un changement d'emploi ou de province</li>
                  <li>Prévoir vos retenues à la source pour une meilleure planification financière</li>
                </ul>

                <div className="bg-primary/5 p-4 rounded-lg mt-6">
                  <p className="text-sm">
                    <strong>Note importante:</strong> Ce calculateur fournit une estimation basée sur les taux standards 2025. 
                    Votre salaire net réel peut varier selon d'autres facteurs comme les déductions REER, cotisations syndicales, 
                    régimes de pension d'employeur, assurance collective, etc. Consultez toujours un professionnel pour une planification fiscale détaillée.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Questions fréquentes sur le calcul de salaire net</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Quelle est la différence entre salaire brut et salaire net?</h4>
                  <p className="text-sm text-muted-foreground">
                    Le <strong>salaire brut</strong> est votre rémunération totale avant toute déduction, tel que négocié avec votre employeur. 
                    Le <strong>salaire net</strong> (ou "take-home pay") est ce que vous recevez réellement dans votre compte bancaire après 
                    toutes les déductions d'impôts fédéral et provincial, cotisations RRQ, assurance-emploi et RQAP. En moyenne au Québec, 
                    le salaire net représente environ 70-75% du salaire brut.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">Les taux d'imposition sont-ils à jour pour 2025?</h4>
                  <p className="text-sm text-muted-foreground">
                    Oui, notre calculateur utilise les <strong>taux officiels 2025</strong> pour l'impôt fédéral (paliers de 15% à 33%), 
                    l'impôt provincial du Québec (14% à 25.75%), le RRQ (5.95%), l'assurance-emploi (1.27% au Québec) et le RQAP (0.494%). 
                    Ces taux sont mis à jour annuellement selon les budgets fédéral et provinciaux.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">Comment convertir un salaire horaire en salaire annuel au Québec?</h4>
                  <p className="text-sm text-muted-foreground">
                    Pour convertir un taux horaire en salaire annuel, multipliez votre taux horaire par le nombre d'heures travaillées 
                    par semaine (généralement 35-40h), puis par 52 semaines. <strong>Formule:</strong> Salaire annuel = Taux horaire × Heures/semaine × 52. 
                    Exemple: 25 $/h × 40h × 52 = 52 000 $/an. Notre calculateur fait cette conversion automatiquement.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">Pourquoi le taux d'assurance-emploi est-il différent au Québec?</h4>
                  <p className="text-sm text-muted-foreground">
                    Le Québec a son propre <strong>régime d'assurance parentale (RQAP)</strong> qui offre de meilleures prestations de maternité, 
                    paternité et parentales. En échange, les travailleurs québécois paient une cotisation RQAP additionnelle (0.494%), 
                    mais bénéficient d'un taux réduit d'assurance-emploi fédérale (1.27% vs 1.58% dans les autres provinces).
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">Ce calculateur fonctionne-t-il pour d'autres provinces canadiennes?</h4>
                  <p className="text-sm text-muted-foreground">
                    Oui! Notre calculateur supporte actuellement <strong>4 provinces:</strong> Québec, Ontario, Colombie-Britannique et Alberta, 
                    chacune avec leurs taux provinciaux spécifiques. Les taux d'imposition provincial varient considérablement entre les provinces, 
                    allant de 10% (Alberta) à 25.75% (Québec) pour les tranches supérieures.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">Qu'est-ce que le crédit d'impôt personnel de base?</h4>
                  <p className="text-sm text-muted-foreground">
                    Le <strong>montant personnel de base</strong> est un crédit d'impôt non remboursable accordé automatiquement à tous les contribuables. 
                    En 2025, il est de 15 705 $ au fédéral et 18 056 $ au Québec. Cela signifie que vous ne payez pas d'impôt sur cette portion 
                    de vos revenus. Notre calculateur applique automatiquement ces crédits pour un résultat plus précis.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">Comment calculer mon salaire net d'un bonus ou d'une prime?</h4>
                  <p className="text-sm text-muted-foreground">
                    Les bonus et primes sont généralement imposés au même taux que votre salaire régulier, mais peuvent vous faire passer 
                    dans une tranche d'imposition supérieure temporairement. Pour calculer votre bonus net, ajoutez-le à votre salaire annuel 
                    dans notre calculateur. Notez que l'employeur peut retenir davantage à la source, avec un remboursement lors de votre 
                    déclaration d'impôts si trop retenu.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">Que faire si mon calcul ne correspond pas à ma paie réelle?</h4>
                  <p className="text-sm text-muted-foreground">
                    Les écarts peuvent provenir de: cotisations syndicales, régimes de pension d'employeur (REER collectif), 
                    assurances collectives, déductions pour uniformes/outils, ou erreurs dans les retenues à la source de l'employeur. 
                    Vérifiez votre talon de paie et contactez votre service de paie ou un comptable si les différences sont importantes. 
                    Vous pourriez avoir droit à un remboursement d'impôts lors de votre déclaration.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader>
                <CardTitle className="text-xl">Autres outils de calcul financier disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Complétez votre planification financière avec nos autres calculateurs gratuits:
                </p>
                <ul className="space-y-2 text-sm">
                  <li>• <strong>Planificateur de budget:</strong> Gérez vos revenus et dépenses mensuelles</li>
                  <li>• <strong>Calculateur d'impôt sur le revenu:</strong> Estimez votre retour d'impôt annuel</li>
                  <li>• <strong>Simulateur REER/CELI:</strong> Optimisez votre épargne-retraite</li>
                </ul>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </>
  );
};

export default SalaryCalculator;
