import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, TrendingUp, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { formatPrice } from "@/lib/priceFormat";
import { cn } from "@/lib/utils";

// Tranches d'imposition 2025 - Québec
const QUEBEC_BRACKETS = [
  { min: 0, max: 51780, rate: 14, color: "bg-blue-400" },
  { min: 51780, max: 103545, rate: 19, color: "bg-blue-500" },
  { min: 103545, max: 126000, rate: 24, color: "bg-blue-600" },
  { min: 126000, max: Infinity, rate: 25.75, color: "bg-blue-700" },
];

// Tranches d'imposition 2025 - Fédéral (avec abattement Québec 16.5%)
const FEDERAL_BRACKETS = [
  { min: 0, max: 55867, rate: 12.525, baseRate: 15, color: "bg-red-400" },
  { min: 55867, max: 111733, rate: 17.12, baseRate: 20.5, color: "bg-red-500" },
  { min: 111733, max: 173205, rate: 21.71, baseRate: 26, color: "bg-red-600" },
  { min: 173205, max: 246752, rate: 24.22, baseRate: 29, color: "bg-red-700" },
  { min: 246752, max: Infinity, rate: 27.56, baseRate: 33, color: "bg-red-800" },
];

// Montant personnel de base 2025
const QUEBEC_PERSONAL_AMOUNT = 18571;
const FEDERAL_PERSONAL_AMOUNT = 16129;

interface TaxBracketVisualizerProps {
  income?: number;
  onIncomeChange?: (income: number) => void;
}

export const TaxBracketVisualizer = ({ 
  income: externalIncome, 
  onIncomeChange 
}: TaxBracketVisualizerProps) => {
  const [localIncome, setLocalIncome] = useState(60000);
  const [showDetails, setShowDetails] = useState(false);
  
  const income = externalIncome ?? localIncome;
  const setIncome = onIncomeChange ?? setLocalIncome;

  const calculateTaxDetails = useMemo(() => {
    const taxableIncomeQC = Math.max(0, income - QUEBEC_PERSONAL_AMOUNT);
    const taxableIncomeFed = Math.max(0, income - FEDERAL_PERSONAL_AMOUNT);
    
    // Calcul impôt Québec par tranche
    let quebecTax = 0;
    let currentQCBracket = QUEBEC_BRACKETS[0];
    const quebecBreakdown: { bracket: typeof QUEBEC_BRACKETS[0]; amount: number; tax: number }[] = [];
    
    for (const bracket of QUEBEC_BRACKETS) {
      if (taxableIncomeQC > bracket.min) {
        const taxableInBracket = Math.min(
          taxableIncomeQC - bracket.min,
          bracket.max === Infinity ? Infinity : bracket.max - bracket.min
        );
        const taxInBracket = taxableInBracket * (bracket.rate / 100);
        quebecTax += taxInBracket;
        quebecBreakdown.push({ bracket, amount: taxableInBracket, tax: taxInBracket });
        
        if (income >= bracket.min && (bracket.max === Infinity || income < bracket.max)) {
          currentQCBracket = bracket;
        }
      }
    }
    
    // Calcul impôt fédéral par tranche
    let federalTax = 0;
    let currentFedBracket = FEDERAL_BRACKETS[0];
    const federalBreakdown: { bracket: typeof FEDERAL_BRACKETS[0]; amount: number; tax: number }[] = [];
    
    for (const bracket of FEDERAL_BRACKETS) {
      if (taxableIncomeFed > bracket.min) {
        const taxableInBracket = Math.min(
          taxableIncomeFed - bracket.min,
          bracket.max === Infinity ? Infinity : bracket.max - bracket.min
        );
        const taxInBracket = taxableInBracket * (bracket.rate / 100);
        federalTax += taxInBracket;
        federalBreakdown.push({ bracket, amount: taxableInBracket, tax: taxInBracket });
        
        if (income >= bracket.min && (bracket.max === Infinity || income < bracket.max)) {
          currentFedBracket = bracket;
        }
      }
    }
    
    const combinedMarginalRate = currentQCBracket.rate + currentFedBracket.rate;
    const totalTax = quebecTax + federalTax;
    const effectiveRate = income > 0 ? (totalTax / income) * 100 : 0;
    const netIncome = income - totalTax;
    
    return {
      quebecTax,
      federalTax,
      totalTax,
      currentQCBracket,
      currentFedBracket,
      combinedMarginalRate,
      effectiveRate,
      netIncome,
      quebecBreakdown,
      federalBreakdown,
      taxableIncomeQC,
      taxableIncomeFed,
    };
  }, [income]);

  const { 
    quebecTax, 
    federalTax, 
    totalTax, 
    currentQCBracket, 
    currentFedBracket,
    combinedMarginalRate,
    effectiveRate,
    netIncome,
    quebecBreakdown,
    federalBreakdown,
  } = calculateTaxDetails;

  // Position de l'indicateur sur la barre de progression
  const getPositionPercentage = (value: number, max: number) => {
    return Math.min((value / max) * 100, 100);
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Votre position dans les tranches d'imposition 2025
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Visualisez exactement où vous vous situez et comprenez votre fiscalité
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Slider de revenu */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Revenu imposable</span>
            <span className="text-lg font-bold text-primary">{formatPrice(income)}</span>
          </div>
          <Slider
            value={[income]}
            onValueChange={([val]) => setIncome(val)}
            min={0}
            max={300000}
            step={1000}
            className="py-4"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 $</span>
            <span>100 000 $</span>
            <span>200 000 $</span>
            <span>300 000 $</span>
          </div>
        </div>

        {/* KPI principaux */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Taux marginal combiné</div>
            <div className="text-2xl font-bold text-foreground">{combinedMarginalRate.toFixed(2)}%</div>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3.5 w-3.5 text-muted-foreground mx-auto mt-1" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Le taux marginal est le pourcentage d'impôt que vous payez sur chaque dollar supplémentaire gagné.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Taux effectif</div>
            <div className="text-2xl font-bold text-foreground">{effectiveRate.toFixed(2)}%</div>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3.5 w-3.5 text-muted-foreground mx-auto mt-1" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Le taux effectif est le pourcentage réel de votre revenu total payé en impôts.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Impôt total</div>
            <div className="text-2xl font-bold text-destructive">{formatPrice(totalTax)}</div>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Revenu net</div>
            <div className="text-2xl font-bold text-success">{formatPrice(netIncome)}</div>
          </div>
        </div>

        {/* Visualisation des tranches */}
        <div className="space-y-4">
          {/* Québec */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm font-medium">Québec</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Taux: </span>
                <span className="font-semibold text-blue-500">{currentQCBracket.rate}%</span>
                <span className="text-muted-foreground ml-2">Impôt: </span>
                <span className="font-semibold">{formatPrice(quebecTax)}</span>
              </div>
            </div>
            
            {/* Barre de progression Québec */}
            <div className="relative h-8 rounded-lg overflow-hidden flex">
              {QUEBEC_BRACKETS.map((bracket, i) => {
                const width = bracket.max === Infinity 
                  ? 25 
                  : ((bracket.max - bracket.min) / 300000) * 100;
                const isActive = income >= bracket.min && (bracket.max === Infinity || income < bracket.max);
                
                return (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <div 
                        className={cn(
                          bracket.color,
                          "h-full flex items-center justify-center text-xs font-medium text-white cursor-pointer transition-all",
                          isActive && "ring-2 ring-white ring-inset"
                        )}
                        style={{ width: `${width}%`, minWidth: '50px' }}
                      >
                        {bracket.rate}%
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm">
                        <p className="font-semibold">Tranche {bracket.rate}%</p>
                        <p>De {formatPrice(bracket.min)} à {bracket.max === Infinity ? '∞' : formatPrice(bracket.max)}</p>
                        {isActive && <p className="text-primary mt-1">Vous êtes ici</p>}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
              
              {/* Indicateur de position */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
                style={{ left: `${getPositionPercentage(income, 300000)}%` }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full border-2 border-foreground" />
              </div>
            </div>
          </div>

          {/* Fédéral */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm font-medium">Fédéral (avec abattement QC)</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Taux: </span>
                <span className="font-semibold text-red-500">{currentFedBracket.rate}%</span>
                <span className="text-muted-foreground ml-2">Impôt: </span>
                <span className="font-semibold">{formatPrice(federalTax)}</span>
              </div>
            </div>
            
            {/* Barre de progression Fédéral */}
            <div className="relative h-8 rounded-lg overflow-hidden flex">
              {FEDERAL_BRACKETS.map((bracket, i) => {
                const width = bracket.max === Infinity 
                  ? 20 
                  : ((bracket.max - bracket.min) / 300000) * 100;
                const isActive = income >= bracket.min && (bracket.max === Infinity || income < bracket.max);
                
                return (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <div 
                        className={cn(
                          bracket.color,
                          "h-full flex items-center justify-center text-xs font-medium text-white cursor-pointer transition-all",
                          isActive && "ring-2 ring-white ring-inset"
                        )}
                        style={{ width: `${width}%`, minWidth: '40px' }}
                      >
                        {bracket.rate}%
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm">
                        <p className="font-semibold">Tranche {bracket.baseRate}% (net: {bracket.rate}%)</p>
                        <p>De {formatPrice(bracket.min)} à {bracket.max === Infinity ? '∞' : formatPrice(bracket.max)}</p>
                        <p className="text-muted-foreground text-xs">Abattement QC de 16.5% appliqué</p>
                        {isActive && <p className="text-primary mt-1">Vous êtes ici</p>}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
              
              {/* Indicateur de position */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
                style={{ left: `${getPositionPercentage(income, 300000)}%` }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full border-2 border-foreground" />
              </div>
            </div>
          </div>
        </div>

        {/* Bouton voir détails */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {showDetails ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Masquer le détail par tranche
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Voir le détail du calcul par tranche
            </>
          )}
        </button>

        {/* Détail par tranche */}
        {showDetails && (
          <div className="space-y-4 pt-4 border-t border-border">
            {/* Tableau Québec */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                Détail impôt Québec
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground font-medium">Tranche</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Taux</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Montant imposé</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Impôt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quebecBreakdown.map((item, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-2">
                          {formatPrice(item.bracket.min)} - {item.bracket.max === Infinity ? '∞' : formatPrice(item.bracket.max)}
                        </td>
                        <td className="text-right py-2 font-medium text-blue-500">{item.bracket.rate}%</td>
                        <td className="text-right py-2">{formatPrice(item.amount)}</td>
                        <td className="text-right py-2 font-medium">{formatPrice(item.tax)}</td>
                      </tr>
                    ))}
                    <tr className="font-semibold">
                      <td colSpan={3} className="py-2 text-right">Total Québec</td>
                      <td className="text-right py-2 text-blue-500">{formatPrice(quebecTax)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tableau Fédéral */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                Détail impôt Fédéral (après abattement QC 16.5%)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground font-medium">Tranche</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Taux net</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Montant imposé</th>
                      <th className="text-right py-2 text-muted-foreground font-medium">Impôt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {federalBreakdown.map((item, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-2">
                          {formatPrice(item.bracket.min)} - {item.bracket.max === Infinity ? '∞' : formatPrice(item.bracket.max)}
                        </td>
                        <td className="text-right py-2 font-medium text-red-500">{item.bracket.rate}%</td>
                        <td className="text-right py-2">{formatPrice(item.amount)}</td>
                        <td className="text-right py-2 font-medium">{formatPrice(item.tax)}</td>
                      </tr>
                    ))}
                    <tr className="font-semibold">
                      <td colSpan={3} className="py-2 text-right">Total Fédéral</td>
                      <td className="text-right py-2 text-red-500">{formatPrice(federalTax)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Explications */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Comment ça fonctionne?
              </h4>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  <strong className="text-foreground">Taux marginal vs effectif:</strong> Le taux marginal s'applique uniquement au dernier dollar gagné. 
                  Votre taux effectif ({effectiveRate.toFixed(2)}%) représente le pourcentage réel de votre revenu payé en impôts.
                </p>
                <p>
                  <strong className="text-foreground">Montant personnel de base:</strong> Les premiers {formatPrice(QUEBEC_PERSONAL_AMOUNT)} (QC) 
                  et {formatPrice(FEDERAL_PERSONAL_AMOUNT)} (Fédéral) ne sont pas imposés.
                </p>
                <p>
                  <strong className="text-foreground">Abattement Québec:</strong> Les résidents du Québec bénéficient d'un abattement de 16.5% 
                  sur l'impôt fédéral pour éviter la double imposition.
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <ArrowRight className="h-4 w-4 text-primary" />
                  <span>
                    Sur un revenu de <strong className="text-foreground">{formatPrice(income)}</strong>, 
                    vous gardez <strong className="text-success">{formatPrice(netIncome)}</strong> après impôts.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
