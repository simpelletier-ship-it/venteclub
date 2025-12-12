import { Helmet } from "react-helmet";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/CurrencyInput";
import { formatPrice } from "@/lib/priceFormat";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const TaxReturnCalculator = () => {
  const [income, setIncome] = useState("60000");
  const [rrspContribution, setRrspContribution] = useState("5000");
  const [fhsaContribution, setFhsaContribution] = useState("0");
  const [charitableDonations, setCharitableDonations] = useState("500");
  const [medicalExpenses, setMedicalExpenses] = useState("0");
  const [childcareCosts, setChildcareCosts] = useState("0");
  
  // Nouveaux crédits populaires
  const [ftqRrsp, setFtqRrsp] = useState("0");
  const [tuitionFees, setTuitionFees] = useState("0");
  const [studentLoanInterest, setStudentLoanInterest] = useState("0");
  const [homebuyers, setHomeBuyers] = useState(false);
  const [transitPasses, setTransitPasses] = useState("0");

  const calculateTaxReturn = () => {
    const grossIncome = parseFloat(income) || 0;
    const rrsp = parseFloat(rrspContribution) || 0;
    const fhsa = parseFloat(fhsaContribution) || 0;
    const donations = parseFloat(charitableDonations) || 0;
    const medical = parseFloat(medicalExpenses) || 0;
    const childcare = parseFloat(childcareCosts) || 0;
    const ftq = parseFloat(ftqRrsp) || 0;
    const tuition = parseFloat(tuitionFees) || 0;
    const studentInterest = parseFloat(studentLoanInterest) || 0;
    const transit = parseFloat(transitPasses) || 0;

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

    // Crédit REER FTQ/Fondaction - 15% QC + 15% fédéral (max 5000$)
    const ftqMax = Math.min(ftq, 5000);
    const ftqCreditProvincial = ftqMax * 0.15;
    const ftqCreditFederal = ftqMax * 0.15;

    // Frais de scolarité - 8% QC, 15% fédéral
    const tuitionCreditProvincial = tuition * 0.08;
    const tuitionCreditFederal = tuition * 0.15;

    // Intérêts prêts étudiants - 8% QC, 15% fédéral
    const studentInterestCreditProvincial = studentInterest * 0.08;
    const studentInterestCreditFederal = studentInterest * 0.15;

    // Crédit achat première habitation - 750$ QC, 1500$ fédéral (montant fixe)
    const homeBuyersCreditProvincial = homebuyers ? 750 : 0;
    const homeBuyersCreditFederal = homebuyers ? 1500 : 0;

    // Transport en commun - 20% QC (déduction basée sur montant)
    const transitCreditProvincial = transit * 0.20;
    const transitCreditFederal = 0; // Supprimé au fédéral mais gardé pour historique

    // Totaux par palier
    const totalProvincial = rrspSavingsProvincial + fhsaSavingsProvincial + 
                            donationCreditProvincial + medicalCreditProvincial + 
                            childcareDeductionProvincial + ftqCreditProvincial +
                            tuitionCreditProvincial + studentInterestCreditProvincial +
                            homeBuyersCreditProvincial + transitCreditProvincial;
    
    const totalFederal = rrspSavingsFederal + fhsaSavingsFederal + 
                         donationCreditFederal + medicalCreditFederal + 
                         childcareDeductionFederal + ftqCreditFederal +
                         tuitionCreditFederal + studentInterestCreditFederal +
                         homeBuyersCreditFederal + transitCreditFederal;

    return {
      provincial: {
        rrsp: rrspSavingsProvincial,
        fhsa: fhsaSavingsProvincial,
        donations: donationCreditProvincial,
        medical: medicalCreditProvincial,
        childcare: childcareDeductionProvincial,
        ftq: ftqCreditProvincial,
        tuition: tuitionCreditProvincial,
        studentInterest: studentInterestCreditProvincial,
        homeBuyers: homeBuyersCreditProvincial,
        transit: transitCreditProvincial,
        total: totalProvincial,
        rate: provincialRate * 100
      },
      federal: {
        rrsp: rrspSavingsFederal,
        fhsa: fhsaSavingsFederal,
        donations: donationCreditFederal,
        medical: medicalCreditFederal,
        childcare: childcareDeductionFederal,
        ftq: ftqCreditFederal,
        tuition: tuitionCreditFederal,
        studentInterest: studentInterestCreditFederal,
        homeBuyers: homeBuyersCreditFederal,
        transit: transitCreditFederal,
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
        <title>Calculateur de Retour d'Impôt Québec et Fédéral 2025 | Gratuit</title>
        <meta name="description" content="Calculez votre retour d'impôt provincial (Québec) et fédéral 2025 avec REER, CELIAPP, dons de charité, frais médicaux et garde d'enfants. Outil gratuit avec taux à jour." />
        <meta name="keywords" content="calculateur retour impôt québec, remboursement impôt 2025, REER économie impôt, CELIAPP déduction fiscale, calculer retour impôt fédéral, dons charité crédit impôt" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Calculateur de Retour d'Impôt Québec et Fédéral 2025" />
        <meta property="og:description" content="Estimez votre retour d'impôt provincial et fédéral 2025 avec toutes vos déductions fiscales. Outil gratuit et précis." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://vente.club/outils/retour-impot" />
        
        {/* Breadcrumb Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Accueil",
                "item": "https://vente.club"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Outils Financiers",
                "item": "https://vente.club/outils"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": "Calculateur de Retour d'Impôt",
                "item": "https://vente.club/outils/retour-impot"
              }
            ]
          })}
        </script>
        
        {/* WebApplication Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Calculateur de Retour d'Impôt Québec 2025",
            "description": "Calculateur gratuit pour estimer votre retour d'impôt provincial (Québec) et fédéral avec REER, CELIAPP, dons de charité et autres déductions fiscales.",
            "url": "https://vente.club/outils/retour-impot",
            "applicationCategory": "FinanceApplication",
            "operatingSystem": "Any",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "CAD"
            },
            "provider": {
              "@type": "Organization",
              "name": "Vente.Club",
              "url": "https://vente.club"
            }
          })}
        </script>
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

                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-3 text-primary">Autres crédits populaires</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label>REER FTQ / Fondaction</Label>
                      <CurrencyInput
                        value={ftqRrsp}
                        onChange={setFtqRrsp}
                        showCurrency={false}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Crédit additionnel de 30% (15% QC + 15% fédéral), max 5 000$
                      </p>
                    </div>

                    <div>
                      <Label>Frais de scolarité</Label>
                      <CurrencyInput
                        value={tuitionFees}
                        onChange={setTuitionFees}
                        showCurrency={false}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Études postsecondaires (université, cégep, formation)
                      </p>
                    </div>

                    <div>
                      <Label>Intérêts prêts étudiants</Label>
                      <CurrencyInput
                        value={studentLoanInterest}
                        onChange={setStudentLoanInterest}
                        showCurrency={false}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Intérêts payés sur prêts AFE/gouvernementaux
                      </p>
                    </div>

                    <div>
                      <Label>Abonnements transport en commun</Label>
                      <CurrencyInput
                        value={transitPasses}
                        onChange={setTransitPasses}
                        showCurrency={false}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Passes mensuelles/annuelles STM, STL, RTL, etc.
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                      <div className="flex-1">
                        <Label htmlFor="homebuyers" className="cursor-pointer">
                          Crédit achat première habitation
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Montant fixe: 750$ QC + 1 500$ fédéral
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        id="homebuyers"
                        checked={homebuyers}
                        onChange={(e) => setHomeBuyers(e.target.checked)}
                        className="h-5 w-5 rounded border-gray-300"
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
                      <div className="text-sm text-green-100 mb-1">Québec</div>
                      <div className="text-2xl font-bold text-blue-200">
                        {formatPrice(results.provincial.total)}
                      </div>
                      <div className="text-xs text-green-100 mt-1">
                        Taux: {results.provincial.rate.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-green-100 mb-1">Fédéral</div>
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
                  <CardTitle className="text-blue-900 dark:text-blue-100 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    Retour d'impôt Québec
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
                    {parseFloat(ftqRrsp) > 0 && (
                      <div className="flex justify-between items-center pb-3 border-b">
                        <div>
                          <div className="font-medium">REER FTQ/Fondaction</div>
                          <div className="text-sm text-muted-foreground">
                            Crédit additionnel 15%: {formatPrice(parseFloat(ftqRrsp))}
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {formatPrice(results.provincial.ftq)}
                        </div>
                      </div>
                    )}
                    {parseFloat(tuitionFees) > 0 && (
                      <div className="flex justify-between items-center pb-3 border-b">
                        <div>
                          <div className="font-medium">Frais de scolarité</div>
                          <div className="text-sm text-muted-foreground">
                            Montant: {formatPrice(parseFloat(tuitionFees))}
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {formatPrice(results.provincial.tuition)}
                        </div>
                      </div>
                    )}
                    {parseFloat(studentLoanInterest) > 0 && (
                      <div className="flex justify-between items-center pb-3 border-b">
                        <div>
                          <div className="font-medium">Intérêts prêts étudiants</div>
                          <div className="text-sm text-muted-foreground">
                            Intérêts: {formatPrice(parseFloat(studentLoanInterest))}
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {formatPrice(results.provincial.studentInterest)}
                        </div>
                      </div>
                    )}
                    {homebuyers && (
                      <div className="flex justify-between items-center pb-3 border-b">
                        <div>
                          <div className="font-medium">Achat première habitation</div>
                          <div className="text-sm text-muted-foreground">
                            Crédit fixe de 750$
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {formatPrice(results.provincial.homeBuyers)}
                        </div>
                      </div>
                    )}
                    {parseFloat(transitPasses) > 0 && (
                      <div className="flex justify-between items-center pb-3 border-b">
                        <div>
                          <div className="font-medium">Transport en commun</div>
                          <div className="text-sm text-muted-foreground">
                            Passes: {formatPrice(parseFloat(transitPasses))}
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {formatPrice(results.provincial.transit)}
                        </div>
                      </div>
                    )}
                    {[rrspContribution, fhsaContribution, charitableDonations, medicalExpenses, childcareCosts, ftqRrsp, tuitionFees, studentLoanInterest, transitPasses]
                      .every(v => parseFloat(v) === 0) && !homebuyers && (
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
                  <CardTitle className="text-red-900 dark:text-red-100 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    Retour d'impôt fédéral
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
                    {parseFloat(ftqRrsp) > 0 && (
                      <div className="flex justify-between items-center pb-3 border-b">
                        <div>
                          <div className="font-medium">REER FTQ/Fondaction</div>
                          <div className="text-sm text-muted-foreground">
                            Crédit additionnel 15%: {formatPrice(parseFloat(ftqRrsp))}
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {formatPrice(results.federal.ftq)}
                        </div>
                      </div>
                    )}
                    {parseFloat(tuitionFees) > 0 && (
                      <div className="flex justify-between items-center pb-3 border-b">
                        <div>
                          <div className="font-medium">Frais de scolarité</div>
                          <div className="text-sm text-muted-foreground">
                            Montant: {formatPrice(parseFloat(tuitionFees))}
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {formatPrice(results.federal.tuition)}
                        </div>
                      </div>
                    )}
                    {parseFloat(studentLoanInterest) > 0 && (
                      <div className="flex justify-between items-center pb-3 border-b">
                        <div>
                          <div className="font-medium">Intérêts prêts étudiants</div>
                          <div className="text-sm text-muted-foreground">
                            Intérêts: {formatPrice(parseFloat(studentLoanInterest))}
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {formatPrice(results.federal.studentInterest)}
                        </div>
                      </div>
                    )}
                    {homebuyers && (
                      <div className="flex justify-between items-center pb-3 border-b">
                        <div>
                          <div className="font-medium">Achat première habitation</div>
                          <div className="text-sm text-muted-foreground">
                            Crédit fixe de 1 500$
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                          {formatPrice(results.federal.homeBuyers)}
                        </div>
                      </div>
                    )}
                    {[rrspContribution, fhsaContribution, charitableDonations, medicalExpenses, childcareCosts, ftqRrsp, tuitionFees, studentLoanInterest]
                      .every(v => parseFloat(v) === 0) && !homebuyers && (
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

          {/* SEO Content Section */}
          <div className="mt-16 prose prose-slate dark:prose-invert max-w-none">
            <div className="bg-card rounded-lg p-8 space-y-8">
              <div>
                <h2 className="text-3xl font-bold mb-4">Calculateur de Retour d'Impôt Québec et Fédéral 2025</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Notre calculateur de retour d'impôt gratuit vous permet d'estimer précisément vos économies fiscales pour l'année 2025, 
                  en tenant compte des taux d'imposition provincial (Québec) et fédéral les plus récents. Calculez instantanément l'impact 
                  de vos cotisations REER, CELIAPP, dons de charité, frais médicaux et frais de garde d'enfants sur votre remboursement d'impôt.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Comment maximiser votre retour d'impôt au Québec en 2025</h2>
                
                <h3 className="text-xl font-semibold mt-6 mb-3">1. Cotisations REER (Régime enregistré d'épargne-retraite)</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Les cotisations REER sont l'une des stratégies les plus efficaces pour réduire votre impôt. Pour 2025, vous pouvez cotiser 
                  jusqu'à 18% de votre revenu gagné de l'année précédente, avec un maximum de 31 560$. Chaque dollar cotisé réduit votre revenu 
                  imposable, générant des économies d'impôt importantes selon votre taux marginal d'imposition provincial et fédéral. 
                  N'oubliez pas la date limite du 29 février 2025 pour cotiser et réclamer la déduction sur votre déclaration de revenus 2024.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3">2. CELIAPP (Compte d'épargne libre d'impôt pour l'achat d'une première propriété)</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Le CELIAPP offre le meilleur des deux mondes : une déduction fiscale immédiate comme le REER (jusqu'à 8 000$ par année) 
                  ET des retraits non imposables lors de l'achat de votre première maison. C'est un outil exceptionnel pour les futurs 
                  propriétaires québécois qui permet d'accumuler jusqu'à 40 000$ tout en maximisant votre remboursement d'impôt annuel.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3">3. Dons de charité et crédits d'impôt</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Les dons aux organismes de bienfaisance enregistrés donnent droit à des crédits d'impôt généreux au Québec et au fédéral. 
                  Les premiers 200$ de dons génèrent un crédit de base (20% provincial, 15% fédéral), tandis que les dons excédentaires 
                  bénéficient de taux plus élevés basés sur votre taux marginal. Conservez tous vos reçus officiels pour maximiser vos crédits.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3">4. Frais médicaux admissibles</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Les frais médicaux dépassant un certain seuil (environ 3% de votre revenu net) peuvent être réclamés pour obtenir des 
                  crédits d'impôt. Cela inclut les médicaments sur ordonnance, les soins dentaires, l'optométrie, la physiothérapie, 
                  les appareils médicaux et bien plus. Vous pouvez réclamer vos frais et ceux de votre conjoint(e) et enfants à charge.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3">5. Frais de garde d'enfants déductibles</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Les frais de garde d'enfants admissibles (garderie, camp de jour, service de garde scolaire) sont entièrement déductibles 
                  de votre revenu imposable. Cette déduction réduit directement votre revenu imposable aux paliers provincial et fédéral, 
                  générant des économies d'impôt substantielles pour les familles québécoises.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3">6. REER FTQ et Fondaction - Double crédit d'impôt</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Les actions du Fonds de solidarité FTQ et de Fondaction offrent un avantage fiscal exceptionnel : en plus de la déduction 
                  REER classique, vous recevez un crédit d'impôt additionnel de 15% au provincial et 15% au fédéral, pour un total de 30% 
                  de crédits supplémentaires. Avec un maximum de 5 000$ par année, vous pouvez obtenir jusqu'à 1 500$ en crédits d'impôt 
                  additionnels tout en épargnant pour votre retraite et en soutenant l'économie québécoise.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3">7. Frais de scolarité postsecondaire</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Les frais de scolarité pour études postsecondaires (université, cégep, formations professionnelles reconnues) donnent 
                  droit à des crédits d'impôt de 8% au Québec et 15% au fédéral. Conservez tous vos reçus T2202 (fédéral) et Relevé 8 (Québec) 
                  fournis par votre institution d'enseignement. Ces crédits peuvent être reportés aux années futures si vous n'avez pas 
                  d'impôt à payer actuellement.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3">8. Intérêts sur prêts étudiants</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Les intérêts payés sur vos prêts étudiants gouvernementaux (Aide financière aux études du Québec, prêts canadiens) 
                  donnent droit à des crédits d'impôt de 8% (Québec) et 15% (fédéral). Vous pouvez reporter ces crédits jusqu'à 5 ans, 
                  ce qui est particulièrement avantageux si vous êtes en début de carrière avec un faible revenu.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3">9. Crédit pour l'achat d'une première habitation</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Si vous achetez votre première propriété en 2025, vous avez droit à un crédit d'impôt de 750$ au provincial (Québec) 
                  et 1 500$ au fédéral. Ce montant fixe est accordé automatiquement lors de votre déclaration de revenus de l'année 
                  d'acquisition. Assurez-vous de remplir les formulaires appropriés (Annexe H au fédéral).
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3">10. Transport en commun au Québec</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Le Québec offre un crédit d'impôt de 20% sur le coût des abonnements mensuels ou annuels de transport en commun 
                  (STM, STL, RTL, etc.). Bien que ce crédit ait été aboli au fédéral, il demeure très avantageux au provincial. 
                  Conservez tous vos reçus de passes mensuelles ou annuelles pour les réclamer lors de votre déclaration.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Taux d'imposition Québec et fédéral 2025</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Notre calculateur utilise les derniers taux d'imposition pour 2025 afin de vous fournir une estimation précise de votre 
                  retour d'impôt. Les taux provinciaux du Québec varient de 14% à 25,75% selon votre revenu imposable, tandis que les taux 
                  fédéraux s'échelonnent de 15% à 33%. Votre économie fiscale réelle dépend de votre taux marginal d'imposition combiné.
                </p>

                <h3 className="text-xl font-semibold mt-6 mb-3">Taux marginaux provinciaux (Québec) 2025</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>14% sur les premiers 51 780$ de revenu imposable</li>
                  <li>19% de 51 781$ à 103 545$</li>
                  <li>24% de 103 546$ à 126 000$</li>
                  <li>25,75% au-delà de 126 000$</li>
                </ul>

                <h3 className="text-xl font-semibold mt-6 mb-3">Taux marginaux fédéraux 2025</h3>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>15% sur les premiers 55 867$ de revenu imposable</li>
                  <li>20,5% de 55 868$ à 111 733$</li>
                  <li>26% de 111 734$ à 173 205$</li>
                  <li>29% de 173 206$ à 246 752$</li>
                  <li>33% au-delà de 246 752$</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Stratégies fiscales pour augmenter votre retour d'impôt</h2>
                <div className="space-y-4 text-muted-foreground">
                  <p className="leading-relaxed">
                    <strong className="text-foreground">Fractionnement de revenu:</strong> Si vous avez un conjoint dans une tranche d'imposition 
                    inférieure, envisagez le fractionnement de revenu de pension pour réduire votre impôt familial global.
                  </p>
                  <p className="leading-relaxed">
                    <strong className="text-foreground">Crédits d'impôt pour intérêts payés sur prêts étudiants:</strong> Les intérêts payés sur 
                    vos prêts étudiants donnent droit à un crédit d'impôt non remboursable.
                  </p>
                  <p className="leading-relaxed">
                    <strong className="text-foreground">Crédit d'impôt pour activités des enfants:</strong> Les activités physiques, artistiques 
                    et culturelles de vos enfants peuvent donner droit à des crédits d'impôt au Québec.
                  </p>
                  <p className="leading-relaxed">
                    <strong className="text-foreground">Frais de déménagement:</strong> Si vous avez déménagé pour vous rapprocher d'un nouveau 
                    lieu de travail ou d'études (40 km ou plus), vos frais de déménagement peuvent être déductibles.
                  </p>
                  <p className="leading-relaxed">
                    <strong className="text-foreground">Crédit d'impôt pour maintien à domicile:</strong> Au Québec, les personnes âgées de 70 ans 
                    et plus peuvent réclamer un crédit pour les services de maintien à domicile.
                  </p>
                  <p className="leading-relaxed">
                    <strong className="text-foreground">REER dans les fonds de travailleurs (FTQ/Fondaction):</strong> Obtenez un crédit d'impôt 
                    additionnel de 30% (15% QC + 15% fédéral) en plus de la déduction REER régulière, jusqu'à 5 000$ par année.
                  </p>
                  <p className="leading-relaxed">
                    <strong className="text-foreground">Frais de scolarité reportables:</strong> Si vous n'utilisez pas tous vos crédits de 
                    scolarité l'année courante, vous pouvez les reporter indéfiniment aux années futures ou les transférer à vos parents.
                  </p>
                  <p className="leading-relaxed">
                    <strong className="text-foreground">Crédit TPS/TVQ:</strong> Pour les personnes à faible revenu, des crédits trimestriels 
                    remboursables sont disponibles pour compenser la taxe de vente payée sur les achats essentiels.
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4">Questions fréquentes sur le retour d'impôt au Québec</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Quand vais-je recevoir mon remboursement d'impôt?</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Si vous produisez votre déclaration électroniquement et optez pour le dépôt direct, Revenu Québec traite généralement 
                      votre remboursement en 2 semaines environ. Le fédéral (ARC) traite les déclarations électroniques en 8 à 10 jours ouvrables. 
                      Les déclarations papier prennent beaucoup plus de temps.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Puis-je modifier ma déclaration après l'avoir envoyée?</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Oui, vous pouvez demander un ajustement à votre déclaration via le service en ligne "Mon dossier" de Revenu Québec 
                      ou "Mon dossier pour les particuliers" de l'ARC. Vous avez généralement jusqu'à 10 ans pour demander un ajustement.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Le calculateur est-il précis?</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Notre calculateur utilise les taux d'imposition officiels de 2025 et fournit une estimation fiable de votre retour d'impôt. 
                      Cependant, il s'agit d'un outil de planification fiscale simplifié. Votre situation personnelle peut inclure d'autres 
                      déductions ou crédits non couverts par ce calculateur. Pour un calcul définitif, consultez un comptable professionnel.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Dois-je cotiser au REER ou au CELIAPP en premier?</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Si vous êtes un futur acheteur d'une première propriété, priorisez le CELIAPP car il combine déduction fiscale ET 
                      retraits non imposables. Si vous avez déjà une propriété ou avez maximisé votre CELIAPP, le REER demeure un excellent 
                      véhicule d'épargne-retraite avec déduction fiscale immédiate. Considérez aussi le REER FTQ/Fondaction pour obtenir 
                      un crédit d'impôt additionnel de 30% sur vos cotisations.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Comment fonctionne le crédit REER FTQ/Fondaction?</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      En achetant des actions du Fonds de solidarité FTQ ou de Fondaction CSN, vous obtenez une déduction REER classique 
                      PLUS un crédit d'impôt additionnel de 15% au Québec et 15% au fédéral (30% total). Sur un investissement de 5 000$ 
                      (maximum annuel), vous recevez donc 1 500$ en crédits d'impôt supplémentaires, en plus de l'économie d'impôt liée 
                      à la déduction REER. C'est l'un des crédits les plus avantageux au Québec.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Puis-je transférer mes crédits de scolarité inutilisés?</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Oui! Si vous ne payez pas d'impôt ou si vos crédits dépassent votre impôt à payer, vous pouvez : (1) Reporter 
                      indéfiniment vos crédits inutilisés aux années futures, (2) Transférer jusqu'à 5 000$ par année à vos parents, 
                      grands-parents, conjoint ou à leur conjoint. Le transfert doit être fait l'année même où les frais sont payés, 
                      mais le report peut être fait n'importe quand dans le futur.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">Que faire si je dois de l'impôt au lieu de recevoir un remboursement?</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Si votre employeur n'a pas retenu suffisamment d'impôt à la source ou si vous avez d'autres revenus non déclarés, 
                      vous pourriez devoir payer de l'impôt. Vous pouvez demander à votre employeur d'augmenter les retenues à la source 
                      ou faire des acomptes provisionnels. Consultez un fiscaliste pour optimiser votre situation.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                <h2 className="text-2xl font-bold mb-4 text-blue-900 dark:text-blue-100">
                  Autres outils financiers gratuits
                </h2>
                <p className="text-blue-800 dark:text-blue-200 mb-4">
                  Découvrez nos autres calculateurs pour optimiser vos finances au Québec:
                </p>
                <ul className="space-y-2 text-blue-800 dark:text-blue-200">
                  <li>
                    <a href="/outils/salaire" className="font-semibold hover:underline">
                      📊 Calculateur de Salaire Net Québec
                    </a>
                    {" - Calculez votre salaire net après impôts, RRQ, RQAP et AE avec les taux 2025"}
                  </li>
                  <li>
                    <a href="/outils/budget" className="font-semibold hover:underline">
                      💰 Planificateur de Budget Personnel
                    </a>
                    {" - Gérez vos finances, suivez vos dépenses et atteignez vos objectifs d'épargne"}
                  </li>
                </ul>
              </div>
            </div>

            {/* Avertissement en bas de page */}
            <Alert className="mt-8 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
              <AlertTitle className="text-yellow-800 dark:text-yellow-400">Avertissement important</AlertTitle>
              <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                Ce calculateur fournit une estimation de votre retour d'impôt basée sur les taux et crédits de 2025. Les résultats sont approximatifs et peuvent varier selon votre situation fiscale complète. Consultez toujours un comptable ou un fiscaliste qualifié pour une évaluation précise et des conseils fiscaux personnalisés.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </>
  );
};

export default TaxReturnCalculator;
