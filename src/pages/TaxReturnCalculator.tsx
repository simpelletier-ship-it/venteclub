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

    // Taux marginal provincial Québec 2025
    let provincialRate = 0.14;
    if (grossIncome > 51780) provincialRate = 0.19;
    if (grossIncome > 103545) provincialRate = 0.24;
    if (grossIncome > 126000) provincialRate = 0.2575;

    // Taux marginal fédéral 2025
    let federalRate = 0.15;
    if (grossIncome > 55867) federalRate = 0.205;
    if (grossIncome > 111733) federalRate = 0.26;
    if (grossIncome > 173205) federalRate = 0.29;
    if (grossIncome > 246752) federalRate = 0.33;

    // Économies REER - séparées par palier
    const rrspSavingsProvincial = rrsp * provincialRate;
    const rrspSavingsFederal = rrsp * federalRate;
    
    // Économies CELIAPP - séparées par palier
    const fhsaSavingsProvincial = fhsa * provincialRate;
    const fhsaSavingsFederal = fhsa * federalRate;

    // Crédit pour dons - 20% Québec, 15% fédéral pour premiers 200$
    const donationCreditProvincial = donations <= 200 
      ? donations * 0.20 
      : (200 * 0.20) + ((donations - 200) * provincialRate);
    
    const donationCreditFederal = donations <= 200 
      ? donations * 0.15 
      : (200 * 0.15) + ((donations - 200) * federalRate);

    // Crédit pour frais médicaux - 20% Québec (ce qui dépasse 3% du revenu)
    const medicalThreshold = grossIncome * 0.03;
    const medicalCreditProvincial = Math.max(0, medical - medicalThreshold) * 0.20;
    
    // Fédéral - 15% de ce qui dépasse le moindre de 3% du revenu ou 2635$
    const federalMedicalThreshold = Math.min(grossIncome * 0.03, 2635);
    const medicalCreditFederal = Math.max(0, medical - federalMedicalThreshold) * 0.15;

    // Déduction pour frais de garde
    const childcareDeductionProvincial = childcare * provincialRate;
    const childcareDeductionFederal = childcare * federalRate;

    // Totaux par palier
    const totalProvincial = rrspSavingsProvincial + fhsaSavingsProvincial + 
                            donationCreditProvincial + medicalCreditProvincial + 
                            childcareDeductionProvincial;
    
    const totalFederal = rrspSavingsFederal + fhsaSavingsFederal + 
                         donationCreditFederal + medicalCreditFederal + 
                         childcareDeductionFederal;

    return {
      provincial: {
        rrsp: rrspSavingsProvincial,
        fhsa: fhsaSavingsProvincial,
        donations: donationCreditProvincial,
        medical: medicalCreditProvincial,
        childcare: childcareDeductionProvincial,
        total: totalProvincial,
        rate: provincialRate * 100
      },
      federal: {
        rrsp: rrspSavingsFederal,
        fhsa: fhsaSavingsFederal,
        donations: donationCreditFederal,
        medical: medicalCreditFederal,
        childcare: childcareDeductionFederal,
        total: totalFederal,
        rate: federalRate * 100
      },
      grandTotal: totalProvincial + totalFederal
    };
  };

  const results = calculateTaxReturn();

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
                    Retour d'impôt total estimé
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-5xl font-bold mb-4">
                    {formatPrice(results.grandTotal)}
                  </div>
                  <div className="grid grid-cols-2 gap-4 bg-white/10 rounded-lg p-4">
                    <div>
                      <div className="text-sm text-green-100 mb-1">Québec (bleu)</div>
                      <div className="text-2xl font-bold text-blue-200">
                        {formatPrice(results.provincial.total)}
                      </div>
                      <div className="text-xs text-green-100 mt-1">
                        Taux: {results.provincial.rate.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-green-100 mb-1">Fédéral (rouge)</div>
                      <div className="text-2xl font-bold text-red-200">
                        {formatPrice(results.federal.total)}
                      </div>
                      <div className="text-xs text-green-100 mt-1">
                        Taux: {results.federal.rate.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Québec Breakdown */}
              <Card className="border-blue-200 dark:border-blue-800">
                <CardHeader className="bg-blue-50 dark:bg-blue-950/20">
                  <CardTitle className="text-blue-900 dark:text-blue-100">
                    🔵 Retour d'impôt Québec
                  </CardTitle>
                  <CardDescription className="text-blue-700 dark:text-blue-300">
                    Portion provinciale de vos économies
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {parseFloat(rrspContribution) > 0 && (
                      <div className="flex justify-between items-center pb-3 border-b">
                        <div>
                          <div className="font-medium">REER</div>
                          <div className="text-sm text-muted-foreground">
                            Contribution: {formatPrice(parseFloat(rrspContribution))}
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {formatPrice(results.provincial.rrsp)}
                        </div>
                      </div>
                    )}
                    {parseFloat(fhsaContribution) > 0 && (
                      <div className="flex justify-between items-center pb-3 border-b">
                        <div>
                          <div className="font-medium">CELIAPP</div>
                          <div className="text-sm text-muted-foreground">
                            Contribution: {formatPrice(parseFloat(fhsaContribution))}
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {formatPrice(results.provincial.fhsa)}
                        </div>
                      </div>
                    )}
                    {parseFloat(charitableDonations) > 0 && (
                      <div className="flex justify-between items-center pb-3 border-b">
                        <div>
                          <div className="font-medium">Dons de charité</div>
                          <div className="text-sm text-muted-foreground">
                            Don: {formatPrice(parseFloat(charitableDonations))}
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {formatPrice(results.provincial.donations)}
                        </div>
                      </div>
                    )}
                    {parseFloat(medicalExpenses) > 0 && (
                      <div className="flex justify-between items-center pb-3 border-b">
                        <div>
                          <div className="font-medium">Frais médicaux</div>
                          <div className="text-sm text-muted-foreground">
                            Dépenses: {formatPrice(parseFloat(medicalExpenses))}
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {formatPrice(results.provincial.medical)}
                        </div>
                      </div>
                    )}
                    {parseFloat(childcareCosts) > 0 && (
                      <div className="flex justify-between items-center pb-3 border-b">
                        <div>
                          <div className="font-medium">Frais de garde</div>
                          <div className="text-sm text-muted-foreground">
                            Coût: {formatPrice(parseFloat(childcareCosts))}
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {formatPrice(results.provincial.childcare)}
                        </div>
                      </div>
                    )}
                    {[rrspContribution, fhsaContribution, charitableDonations, medicalExpenses, childcareCosts]
                      .every(v => parseFloat(v) === 0) && (
                      <div className="text-center py-6 text-muted-foreground">
                        Entrez vos contributions pour voir vos économies Québec
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Federal Breakdown */}
              <Card className="border-red-200 dark:border-red-800">
                <CardHeader className="bg-red-50 dark:bg-red-950/20">
                  <CardTitle className="text-red-900 dark:text-red-100">
                    🔴 Retour d'impôt fédéral
                  </CardTitle>
                  <CardDescription className="text-red-700 dark:text-red-300">
                    Portion fédérale de vos économies
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {parseFloat(rrspContribution) > 0 && (
                      <div className="flex justify-between items-center pb-3 border-b">
                        <div>
                          <div className="font-medium">REER</div>
                          <div className="text-sm text-muted-foreground">
                            Contribution: {formatPrice(parseFloat(rrspContribution))}
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {formatPrice(results.federal.rrsp)}
                        </div>
                      </div>
                    )}
                    {parseFloat(fhsaContribution) > 0 && (
                      <div className="flex justify-between items-center pb-3 border-b">
                        <div>
                          <div className="font-medium">CELIAPP</div>
                          <div className="text-sm text-muted-foreground">
                            Contribution: {formatPrice(parseFloat(fhsaContribution))}
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {formatPrice(results.federal.fhsa)}
                        </div>
                      </div>
                    )}
                    {parseFloat(charitableDonations) > 0 && (
                      <div className="flex justify-between items-center pb-3 border-b">
                        <div>
                          <div className="font-medium">Dons de charité</div>
                          <div className="text-sm text-muted-foreground">
                            Don: {formatPrice(parseFloat(charitableDonations))}
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {formatPrice(results.federal.donations)}
                        </div>
                      </div>
                    )}
                    {parseFloat(medicalExpenses) > 0 && (
                      <div className="flex justify-between items-center pb-3 border-b">
                        <div>
                          <div className="font-medium">Frais médicaux</div>
                          <div className="text-sm text-muted-foreground">
                            Dépenses: {formatPrice(parseFloat(medicalExpenses))}
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {formatPrice(results.federal.medical)}
                        </div>
                      </div>
                    )}
                    {parseFloat(childcareCosts) > 0 && (
                      <div className="flex justify-between items-center pb-3 border-b">
                        <div>
                          <div className="font-medium">Frais de garde</div>
                          <div className="text-sm text-muted-foreground">
                            Coût: {formatPrice(parseFloat(childcareCosts))}
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {formatPrice(results.federal.childcare)}
                        </div>
                      </div>
                    )}
                    {[rrspContribution, fhsaContribution, charitableDonations, medicalExpenses, childcareCosts]
                      .every(v => parseFloat(v) === 0) && (
                      <div className="text-center py-6 text-muted-foreground">
                        Entrez vos contributions pour voir vos économies fédérales
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
