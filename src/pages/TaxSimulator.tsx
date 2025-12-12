import { Helmet } from "react-helmet";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CurrencyInput } from "@/components/CurrencyInput";
import { formatPrice } from "@/lib/priceFormat";
import { TrendingUp, TrendingDown, AlertTriangle, Calculator, Sparkles, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TaxBracketVisualizer } from "@/components/TaxBracketVisualizer";
import { TaxCreditQuestionnaire } from "@/components/TaxCreditQuestionnaire";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const TaxSimulator = () => {
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
  
  const [showAdvancedCredits, setShowAdvancedCredits] = useState(false);

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

    // Économies REER
    const rrspSavingsProvincial = rrsp * provincialRate;
    const rrspSavingsFederal = rrsp * federalRate;
    
    // Économies CELIAPP
    const fhsaSavingsProvincial = fhsa * provincialRate;
    const fhsaSavingsFederal = fhsa * federalRate;

    // Crédit pour dons
    const donationCreditProvincial = donations <= 200 
      ? donations * 0.20 
      : (200 * 0.20) + ((donations - 200) * provincialRate);
    
    const donationCreditFederal = donations <= 200 
      ? donations * 0.15 
      : (200 * 0.15) + ((donations - 200) * federalRate);

    // Crédit pour frais médicaux
    const medicalThreshold = grossIncome * 0.03;
    const medicalCreditProvincial = Math.max(0, medical - medicalThreshold) * 0.20;
    const federalMedicalThreshold = Math.min(grossIncome * 0.03, 2635);
    const medicalCreditFederal = Math.max(0, medical - federalMedicalThreshold) * 0.15;

    // Déduction pour frais de garde
    const childcareDeductionProvincial = childcare * provincialRate;
    const childcareDeductionFederal = childcare * federalRate;

    // Crédit REER FTQ/Fondaction
    const ftqMax = Math.min(ftq, 5000);
    const ftqCreditProvincial = ftqMax * 0.15;
    const ftqCreditFederal = ftqMax * 0.15;

    // Frais de scolarité
    const tuitionCreditProvincial = tuition * 0.08;
    const tuitionCreditFederal = tuition * 0.15;

    // Intérêts prêts étudiants
    const studentInterestCreditProvincial = studentInterest * 0.08;
    const studentInterestCreditFederal = studentInterest * 0.15;

    // Crédit achat première habitation
    const homeBuyersCreditProvincial = homebuyers ? 750 : 0;
    const homeBuyersCreditFederal = homebuyers ? 1500 : 0;

    // Transport en commun
    const transitCreditProvincial = transit * 0.20;
    const transitCreditFederal = 0;

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
  const incomeValue = parseFloat(income) || 0;
  const rrspValue = parseFloat(rrspContribution) || 0;
  const fhsaValue = parseFloat(fhsaContribution) || 0;

  return (
    <>
      <Helmet>
        <title>Simulateur d'Impôt Québec 2025 | Calcul et Tranches d'imposition</title>
        <meta name="description" content="Simulateur d'impôt Québec et fédéral 2025. Visualisez vos tranches d'imposition, calculez votre retour d'impôt avec REER, CELIAPP, et découvrez tous les crédits d'impôt auxquels vous avez droit." />
        <meta name="keywords" content="simulateur impôt québec 2025, tranches imposition québec, crédit impôt québec, REER déduction, CELIAPP, retour impôt fédéral, calculateur fiscal" />
        
        <meta property="og:title" content="Simulateur d'Impôt Québec et Fédéral 2025" />
        <meta property="og:description" content="Visualisez exactement où vous vous situez dans les tranches d'imposition et maximisez votre retour d'impôt. Outil gratuit et précis." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://budget.club/impots" />
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://budget.club" },
              { "@type": "ListItem", "position": 2, "name": "Outils", "item": "https://budget.club/outils" },
              { "@type": "ListItem", "position": 3, "name": "Simulateur d'Impôt", "item": "https://budget.club/impots" }
            ]
          })}
        </script>
        
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Simulateur d'Impôt Québec 2025",
            "description": "Simulateur complet pour visualiser vos tranches d'imposition Québec et fédéral, calculer votre retour d'impôt, et découvrir les crédits d'impôt disponibles.",
            "url": "https://budget.club/impots",
            "applicationCategory": "FinanceApplication",
            "operatingSystem": "Any",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "CAD" }
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background py-8 lg:py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold mb-3 text-foreground">
              Simulateur d'Impôt 2025
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Visualisez vos tranches d'imposition Québec et fédéral, calculez votre retour d'impôt 
              et découvrez les crédits auxquels vous avez droit
            </p>
          </div>

          <Tabs defaultValue="simulation" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
              <TabsTrigger value="simulation" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                <span>Simulation</span>
              </TabsTrigger>
              <TabsTrigger value="credits" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span>Crédits</span>
              </TabsTrigger>
            </TabsList>

            {/* Onglet Simulation (fusion Tranches + Calcul) */}
            <TabsContent value="simulation" className="space-y-6">
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
                      <h3 className="font-semibold mb-3">Cotisations principales</h3>
                      
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

                    <Collapsible open={showAdvancedCredits} onOpenChange={setShowAdvancedCredits}>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between">
                          <span className="text-primary font-medium">Autres crédits populaires</span>
                          {showAdvancedCredits ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-4 pt-4">
                        <div>
                          <Label>REER FTQ / Fondaction</Label>
                          <CurrencyInput
                            value={ftqRrsp}
                            onChange={setFtqRrsp}
                            showCurrency={false}
                            className="mt-1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Crédit additionnel de 30%, max 5 000$
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
                        </div>

                        <div>
                          <Label>Intérêts prêts étudiants</Label>
                          <CurrencyInput
                            value={studentLoanInterest}
                            onChange={setStudentLoanInterest}
                            showCurrency={false}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label>Transport en commun</Label>
                          <CurrencyInput
                            value={transitPasses}
                            onChange={setTransitPasses}
                            showCurrency={false}
                            className="mt-1"
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30">
                          <div className="flex-1">
                            <Label htmlFor="homebuyers" className="cursor-pointer">
                              Crédit achat première habitation
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              750$ QC + 1 500$ fédéral
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
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                </Card>

                {/* Results Section */}
                <div className="lg:col-span-3 space-y-6">
                  {/* Total Return Card */}
                  <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
                    <CardHeader>
                      <CardTitle className="text-primary-foreground flex items-center gap-2">
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
                          <div className="text-sm text-primary-foreground/80 mb-1">Québec</div>
                          <div className="text-2xl font-bold text-blue-200">
                            {formatPrice(results.provincial.total)}
                          </div>
                          <div className="text-xs text-primary-foreground/70 mt-1">
                            Taux: {results.provincial.rate.toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-primary-foreground/80 mb-1">Fédéral</div>
                          <div className="text-2xl font-bold text-red-200">
                            {formatPrice(results.federal.total)}
                          </div>
                          <div className="text-xs text-primary-foreground/70 mt-1">
                            Taux: {results.federal.rate.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Visualisation des tranches */}
                  <TaxBracketVisualizer 
                    income={incomeValue}
                    onIncomeChange={(val) => setIncome(val.toString())}
                    celiappContribution={fhsaValue}
                    rrspContribution={rrspValue}
                  />

                  {/* Breakdown Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border-blue-200 dark:border-blue-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2 text-blue-600 dark:text-blue-400">
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                          Détail Québec
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        {results.provincial.rrsp > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">REER</span>
                            <span className="font-medium">{formatPrice(results.provincial.rrsp)}</span>
                          </div>
                        )}
                        {results.provincial.fhsa > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">CELIAPP</span>
                            <span className="font-medium">{formatPrice(results.provincial.fhsa)}</span>
                          </div>
                        )}
                        {results.provincial.donations > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Dons</span>
                            <span className="font-medium">{formatPrice(results.provincial.donations)}</span>
                          </div>
                        )}
                        {results.provincial.medical > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Frais médicaux</span>
                            <span className="font-medium">{formatPrice(results.provincial.medical)}</span>
                          </div>
                        )}
                        {results.provincial.childcare > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Garde d'enfants</span>
                            <span className="font-medium">{formatPrice(results.provincial.childcare)}</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t font-semibold">
                          <span>Total Québec</span>
                          <span className="text-blue-600">{formatPrice(results.provincial.total)}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-red-200 dark:border-red-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2 text-red-600 dark:text-red-400">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          Détail Fédéral
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        {results.federal.rrsp > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">REER</span>
                            <span className="font-medium">{formatPrice(results.federal.rrsp)}</span>
                          </div>
                        )}
                        {results.federal.fhsa > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">CELIAPP</span>
                            <span className="font-medium">{formatPrice(results.federal.fhsa)}</span>
                          </div>
                        )}
                        {results.federal.donations > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Dons</span>
                            <span className="font-medium">{formatPrice(results.federal.donations)}</span>
                          </div>
                        )}
                        {results.federal.medical > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Frais médicaux</span>
                            <span className="font-medium">{formatPrice(results.federal.medical)}</span>
                          </div>
                        )}
                        {results.federal.childcare > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Garde d'enfants</span>
                            <span className="font-medium">{formatPrice(results.federal.childcare)}</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t font-semibold">
                          <span>Total Fédéral</span>
                          <span className="text-red-600">{formatPrice(results.federal.total)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Disclaimer */}
                  <Alert variant="default" className="bg-muted/50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Avis important</AlertTitle>
                    <AlertDescription className="text-sm">
                      Ces calculs sont des estimations basées sur les taux 2025. Ne vous fiez pas uniquement à cet outil. 
                      Consultez un professionnel en fiscalité pour une analyse complète de votre situation.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </TabsContent>

            {/* Onglet Crédits disponibles */}
            <TabsContent value="credits" className="space-y-6">
              <div className="max-w-2xl mx-auto">
                <TaxCreditQuestionnaire />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default TaxSimulator;
