import { Helmet } from "react-helmet";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/CurrencyInput";
import { formatPrice } from "@/lib/priceFormat";
import { TrendingUp, TrendingDown } from "lucide-react";

const TaxReturnCalculator = () => {
  const [income, setIncome] = useState("60000");
  const [rrspContribution, setRrspContribution] = useState("5000");
  const [fhsaContribution, setFhsaContribution] = useState("0");
  const [charitableDonations, setCharitableDonations] = useState("500");
  const [medicalExpenses, setMedicalExpenses] = useState("0");
  const [childcareCosts, setChildcareCosts] = useState("0");

  const calculateTaxReturn = () => {
    const grossIncome = parseFloat(income) || 0;
    const rrsp = parseFloat(rrspContribution) || 0;
    const fhsa = parseFloat(fhsaContribution) || 0;
    const donations = parseFloat(charitableDonations) || 0;
    const medical = parseFloat(medicalExpenses) || 0;
    const childcare = parseFloat(childcareCosts) || 0;

    // Calcul simplifié du taux marginal (approximation)
    let marginalRate = 0.14; // Taux de base provincial Québec
    if (grossIncome > 51780) marginalRate = 0.19;
    if (grossIncome > 103545) marginalRate = 0.24;
    if (grossIncome > 126000) marginalRate = 0.2575;

    // Taux fédéral
    let federalRate = 0.15;
    if (grossIncome > 55867) federalRate = 0.205;
    if (grossIncome > 111733) federalRate = 0.26;
    if (grossIncome > 173205) federalRate = 0.29;
    if (grossIncome > 246752) federalRate = 0.33;

    const combinedRate = marginalRate + federalRate;

    // Économies d'impôt
    const rrspSavings = rrsp * combinedRate;
    const fhsaSavings = fhsa * combinedRate;
    
    // Crédit pour dons (15% premiers 200$, puis taux marginal)
    const donationCredit = donations <= 200 
      ? donations * 0.15 
      : (200 * 0.15) + ((donations - 200) * combinedRate);

    // Crédit pour frais médicaux (15% de ce qui dépasse 3% du revenu ou 2635$)
    const medicalThreshold = Math.min(grossIncome * 0.03, 2635);
    const medicalCredit = Math.max(0, medical - medicalThreshold) * 0.15;

    // Déduction pour frais de garde (déduction directe)
    const childcareDeduction = childcare * combinedRate;

    const totalReturn = rrspSavings + fhsaSavings + donationCredit + medicalCredit + childcareDeduction;

    return {
      rrspSavings,
      fhsaSavings,
      donationCredit,
      medicalCredit,
      childcareDeduction,
      totalReturn,
      marginalRate: combinedRate * 100
    };
  };

  const results = calculateTaxReturn();

  const savingsItems = [
    { 
      label: "REER", 
      value: results.rrspSavings, 
      input: parseFloat(rrspContribution) || 0,
      description: "Cotisations au Régime enregistré d'épargne-retraite"
    },
    { 
      label: "CELIAPP", 
      value: results.fhsaSavings, 
      input: parseFloat(fhsaContribution) || 0,
      description: "Compte d'épargne libre d'impôt pour l'achat d'une première propriété"
    },
    { 
      label: "Dons de charité", 
      value: results.donationCredit, 
      input: parseFloat(charitableDonations) || 0,
      description: "Crédit d'impôt pour dons de bienfaisance"
    },
    { 
      label: "Frais médicaux", 
      value: results.medicalCredit, 
      input: parseFloat(medicalExpenses) || 0,
      description: "Crédit pour frais médicaux dépassant le seuil"
    },
    { 
      label: "Frais de garde", 
      value: results.childcareDeduction, 
      input: parseFloat(childcareCosts) || 0,
      description: "Déduction pour frais de garde d'enfants"
    },
  ];

  return (
    <>
      <Helmet>
        <title>Calculateur de Retour d'Impôt Québec 2025 | Vente.Club</title>
        <meta name="description" content="Estimez votre retour d'impôt avec REER, CELIAPP, dons de charité et autres déductions. Calculateur gratuit avec les taux 2025 du Québec." />
      </Helmet>

      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 text-foreground">
              Calculateur de Retour d'Impôt
            </h1>
            <p className="text-muted-foreground text-lg">
              Estimez vos économies d'impôt grâce à vos cotisations et déductions
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Input Section */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Vos informations</CardTitle>
                <CardDescription>Entrez vos revenus et déductions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Revenu brut annuel</Label>
                  <CurrencyInput
                    value={income}
                    onChange={setIncome}
                    showCurrency={false}
                    className="mt-1"
                  />
                </div>

                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-3">Cotisations et déductions</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>REER</Label>
                      <CurrencyInput
                        value={rrspContribution}
                        onChange={setRrspContribution}
                        showCurrency={false}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Maximum 18% du revenu (max 31,560$ en 2025)
                      </p>
                    </div>

                    <div>
                      <Label>CELIAPP</Label>
                      <CurrencyInput
                        value={fhsaContribution}
                        onChange={setFhsaContribution}
                        showCurrency={false}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Maximum 8,000$ par année (max viager 40,000$)
                      </p>
                    </div>

                    <div>
                      <Label>Dons de charité</Label>
                      <CurrencyInput
                        value={charitableDonations}
                        onChange={setCharitableDonations}
                        showCurrency={false}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Frais médicaux</Label>
                      <CurrencyInput
                        value={medicalExpenses}
                        onChange={setMedicalExpenses}
                        showCurrency={false}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Frais de garde d'enfants</Label>
                      <CurrencyInput
                        value={childcareCosts}
                        onChange={setChildcareCosts}
                        showCurrency={false}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                <Button className="w-full mt-6" size="lg">
                  Calculer mes économies
                </Button>
              </CardContent>
            </Card>

            {/* Results Section */}
            <div className="lg:col-span-3 space-y-6">
              {/* Total Return Card */}
              <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-6 h-6" />
                    Retour d'impôt estimé
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-5xl font-bold mb-2">
                    {formatPrice(results.totalReturn)}
                  </div>
                  <p className="text-green-100">
                    Économies d'impôt totales basées sur un taux marginal de {results.marginalRate.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>

              {/* Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Détail des économies</CardTitle>
                  <CardDescription>
                    Voici comment vos contributions réduisent votre impôt
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {savingsItems.map((item, index) => (
                      item.input > 0 && (
                        <div key={index} className="border-b last:border-0 pb-4 last:pb-0">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="font-semibold text-foreground">{item.label}</div>
                              <div className="text-sm text-muted-foreground">{item.description}</div>
                              <div className="text-sm text-muted-foreground mt-1">
                                Contribution: {formatPrice(item.input)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                +{formatPrice(item.value)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                économie
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    ))}

                    {savingsItems.every(item => item.input === 0) && (
                      <div className="text-center py-8 text-muted-foreground">
                        Entrez vos contributions pour voir vos économies d'impôt
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Tips Card */}
              <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="text-blue-900 dark:text-blue-100">
                    Conseils pour maximiser votre retour
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-blue-800 dark:text-blue-200 space-y-2 text-sm">
                  <p>• Maximisez vos cotisations REER avant le 29 février de chaque année</p>
                  <p>• Le CELIAPP offre le double avantage: déduction fiscale + retraits non imposables</p>
                  <p>• Conservez tous vos reçus de dons et frais médicaux</p>
                  <p>• Les frais médicaux peuvent être réclamés pour toute période de 12 mois se terminant dans l'année</p>
                  <p>• Consultez un comptable pour optimiser votre situation fiscale</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TaxReturnCalculator;
