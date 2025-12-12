import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, TrendingUp, TrendingDown, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
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

// Tranches combinées Québec + Fédéral 2025
const COMBINED_BRACKETS = [
  { min: 0, max: 51780, qcRate: 14, fedRate: 12.525, combinedRate: 26.525, color: "bg-slate-400" },
  { min: 51780, max: 55867, qcRate: 19, fedRate: 12.525, combinedRate: 31.525, color: "bg-slate-450" },
  { min: 55867, max: 103545, qcRate: 19, fedRate: 17.12, combinedRate: 36.12, color: "bg-slate-500" },
  { min: 103545, max: 111733, qcRate: 24, fedRate: 17.12, combinedRate: 41.12, color: "bg-slate-550" },
  { min: 111733, max: 126000, qcRate: 24, fedRate: 21.71, combinedRate: 45.71, color: "bg-slate-600" },
  { min: 126000, max: 173205, qcRate: 25.75, fedRate: 21.71, combinedRate: 47.46, color: "bg-slate-650" },
  { min: 173205, max: 246752, qcRate: 25.75, fedRate: 24.22, combinedRate: 49.97, color: "bg-slate-700" },
  { min: 246752, max: Infinity, qcRate: 25.75, fedRate: 27.56, combinedRate: 53.31, color: "bg-slate-800" },
];

// Montant personnel de base 2025
const QUEBEC_PERSONAL_AMOUNT = 18571;
const FEDERAL_PERSONAL_AMOUNT = 16129;

interface TaxBracketVisualizerProps {
  income?: number;
  onIncomeChange?: (income: number) => void;
  celiappContribution?: number;
  rrspContribution?: number;
}

export const TaxBracketVisualizer = ({ 
  income: externalIncome, 
  onIncomeChange,
  celiappContribution = 0,
  rrspContribution = 0
}: TaxBracketVisualizerProps) => {
  const [localIncome, setLocalIncome] = useState(60000);
  const [showDetails, setShowDetails] = useState(false);
  
  const income = externalIncome ?? localIncome;
  const setIncome = onIncomeChange ?? setLocalIncome;
  
  // Revenu après déductions REER/CELIAPP
  const totalDeductions = celiappContribution + rrspContribution;
  const adjustedIncome = Math.max(0, income - totalDeductions);

  const calculateTaxDetails = (incomeAmount: number) => {
    const taxableIncomeQC = Math.max(0, incomeAmount - QUEBEC_PERSONAL_AMOUNT);
    const taxableIncomeFed = Math.max(0, incomeAmount - FEDERAL_PERSONAL_AMOUNT);
    
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
        
        if (incomeAmount >= bracket.min && (bracket.max === Infinity || incomeAmount < bracket.max)) {
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
        
        if (incomeAmount >= bracket.min && (bracket.max === Infinity || incomeAmount < bracket.max)) {
          currentFedBracket = bracket;
        }
      }
    }
    
    // Tranche combinée
    let currentCombinedBracket = COMBINED_BRACKETS[0];
    for (const bracket of COMBINED_BRACKETS) {
      if (incomeAmount >= bracket.min && (bracket.max === Infinity || incomeAmount < bracket.max)) {
        currentCombinedBracket = bracket;
      }
    }
    
    const combinedMarginalRate = currentCombinedBracket.combinedRate;
    const totalTax = quebecTax + federalTax;
    const effectiveRate = incomeAmount > 0 ? (totalTax / incomeAmount) * 100 : 0;
    const netIncome = incomeAmount - totalTax;
    
    return {
      quebecTax,
      federalTax,
      totalTax,
      currentQCBracket,
      currentFedBracket,
      currentCombinedBracket,
      combinedMarginalRate,
      effectiveRate,
      netIncome,
      quebecBreakdown,
      federalBreakdown,
      taxableIncomeQC,
      taxableIncomeFed,
    };
  };
  
  const originalTax = useMemo(() => calculateTaxDetails(income), [income]);
  const adjustedTax = useMemo(() => calculateTaxDetails(adjustedIncome), [adjustedIncome]);
  
  const taxSavings = originalTax.totalTax - adjustedTax.totalTax;
  const bracketChanged = originalTax.currentCombinedBracket.combinedRate !== adjustedTax.currentCombinedBracket.combinedRate;

  // Position de l'indicateur sur la barre de progression
  const getPositionPercentage = (value: number, max: number) => {
    return Math.min((value / max) * 100, 100);
  };

  const currentTax = totalDeductions > 0 ? adjustedTax : originalTax;
  const currentIncome = totalDeductions > 0 ? adjustedIncome : income;

  return (
    <Card className="border-border">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Votre position fiscale 2025
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Visualisez exactement où vous vous situez dans les tranches d'imposition
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Slider de revenu */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Revenu brut</span>
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
            <span>100k $</span>
            <span>200k $</span>
            <span>300k $</span>
          </div>
        </div>

        {/* Alerte si CELIAPP/REER change la tranche */}
        {totalDeductions > 0 && bracketChanged && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold text-foreground mb-1">
                  Vos cotisations vous font descendre de tranche!
                </p>
                <p className="text-sm text-muted-foreground">
                  Grâce à vos contributions REER ({formatPrice(rrspContribution)}) et CELIAPP ({formatPrice(celiappContribution)}), 
                  votre revenu imposable passe de {formatPrice(income)} à {formatPrice(adjustedIncome)}.
                </p>
                <div className="mt-2 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Avant:</span>
                    <span className="font-bold text-destructive">{originalTax.combinedMarginalRate.toFixed(2)}%</span>
                  </div>
                  <TrendingDown className="h-4 w-4 text-primary" />
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Après:</span>
                    <span className="font-bold text-primary">{adjustedTax.combinedMarginalRate.toFixed(2)}%</span>
                  </div>
                </div>
                <p className="text-sm font-semibold text-primary mt-2">
                  Économie d'impôt: {formatPrice(taxSavings)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* KPI principaux */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-3 text-center border border-primary/20">
            <div className="text-xs text-muted-foreground mb-1">Taux marginal combiné</div>
            <div className="text-2xl font-bold text-primary">
              {currentTax.combinedMarginalRate.toFixed(2)}%
            </div>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3.5 w-3.5 text-muted-foreground mx-auto mt-1" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Le taux marginal combiné (Québec + Fédéral) est le pourcentage d'impôt que vous payez sur chaque dollar supplémentaire gagné.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Taux effectif</div>
            <div className="text-2xl font-bold text-foreground">
              {currentTax.effectiveRate.toFixed(2)}%
            </div>
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
            <div className="text-2xl font-bold text-destructive">
              {formatPrice(currentTax.totalTax)}
            </div>
          </div>
          
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Revenu net</div>
            <div className="text-2xl font-bold text-success">
              {formatPrice(currentTax.netIncome)}
            </div>
          </div>
        </div>

        {/* Visualisation des tranches */}
        <div className="space-y-4">
          {/* Québec - Barre entièrement bleue */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm font-medium">Québec</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Taux: </span>
                <span className="font-semibold text-blue-500">{currentTax.currentQCBracket.rate}%</span>
                <span className="text-muted-foreground ml-2">Impôt: </span>
                <span className="font-semibold">{formatPrice(currentTax.quebecTax)}</span>
              </div>
            </div>
            
            {/* Barre de progression Québec - Entièrement bleue */}
            <div className="relative h-8 rounded-lg overflow-hidden flex w-full">
              {QUEBEC_BRACKETS.map((bracket, i) => {
                const totalRange = 300000;
                const bracketEnd = bracket.max === Infinity ? totalRange : Math.min(bracket.max, totalRange);
                const bracketStart = bracket.min;
                const width = ((bracketEnd - bracketStart) / totalRange) * 100;
                const isActive = currentIncome >= bracket.min && (bracket.max === Infinity || currentIncome < bracket.max);
                
                return (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <div 
                        className={cn(
                          bracket.color,
                          "h-full flex items-center justify-center text-xs font-medium text-white cursor-pointer transition-all flex-shrink-0",
                          isActive && "ring-2 ring-white ring-inset"
                        )}
                        style={{ width: `${width}%` }}
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
                style={{ left: `${getPositionPercentage(currentIncome, 300000)}%` }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full border-2 border-foreground" />
              </div>
            </div>
          </div>

          {/* Fédéral - Barre entièrement rouge */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm font-medium">Fédéral (avec abattement QC)</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Taux: </span>
                <span className="font-semibold text-red-500">{currentTax.currentFedBracket.rate}%</span>
                <span className="text-muted-foreground ml-2">Impôt: </span>
                <span className="font-semibold">{formatPrice(currentTax.federalTax)}</span>
              </div>
            </div>
            
            {/* Barre de progression Fédéral - Entièrement rouge */}
            <div className="relative h-8 rounded-lg overflow-hidden flex w-full">
              {FEDERAL_BRACKETS.map((bracket, i) => {
                const totalRange = 300000;
                const bracketEnd = bracket.max === Infinity ? totalRange : Math.min(bracket.max, totalRange);
                const bracketStart = bracket.min;
                const width = ((bracketEnd - bracketStart) / totalRange) * 100;
                const isActive = currentIncome >= bracket.min && (bracket.max === Infinity || currentIncome < bracket.max);
                
                return (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <div 
                        className={cn(
                          bracket.color,
                          "h-full flex items-center justify-center text-xs font-medium text-white cursor-pointer transition-all flex-shrink-0",
                          isActive && "ring-2 ring-white ring-inset"
                        )}
                        style={{ width: `${width}%` }}
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
                style={{ left: `${getPositionPercentage(currentIncome, 300000)}%` }}
              >
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full border-2 border-foreground" />
              </div>
            </div>
          </div>

          {/* Combiné - Nouvelle barre grise */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-slate-500" />
                <span className="text-sm font-medium">Combiné (QC + Fédéral)</span>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Taux: </span>
                <span className="font-semibold text-slate-500">{currentTax.combinedMarginalRate.toFixed(2)}%</span>
                <span className="text-muted-foreground ml-2">Impôt: </span>
                <span className="font-semibold">{formatPrice(currentTax.totalTax)}</span>
              </div>
            </div>
            
            {/* Barre de progression Combiné - Gris */}
            <div className="relative h-8 rounded-lg overflow-hidden flex w-full">
              {COMBINED_BRACKETS.map((bracket, i) => {
                const totalRange = 300000;
                const bracketEnd = bracket.max === Infinity ? totalRange : Math.min(bracket.max, totalRange);
                const bracketStart = bracket.min;
                const width = ((bracketEnd - bracketStart) / totalRange) * 100;
                const isActive = currentIncome >= bracket.min && (bracket.max === Infinity || currentIncome < bracket.max);
                
                // Couleurs grises progressives
                const grayColors = [
                  "bg-slate-400",
                  "bg-slate-500",
                  "bg-slate-500",
                  "bg-slate-600",
                  "bg-slate-600",
                  "bg-slate-700",
                  "bg-slate-700",
                  "bg-slate-800"
                ];
                
                return (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <div 
                        className={cn(
                          grayColors[i] || "bg-slate-600",
                          "h-full flex items-center justify-center text-xs font-medium text-white cursor-pointer transition-all flex-shrink-0",
                          isActive && "ring-2 ring-white ring-inset"
                        )}
                        style={{ width: `${width}%` }}
                      >
                        {bracket.combinedRate.toFixed(1)}%
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm">
                        <p className="font-semibold">Tranche combinée {bracket.combinedRate}%</p>
                        <p>De {formatPrice(bracket.min)} à {bracket.max === Infinity ? '∞' : formatPrice(bracket.max)}</p>
                        <div className="flex gap-2 mt-1 text-xs">
                          <span className="text-blue-400">QC: {bracket.qcRate}%</span>
                          <span className="text-red-400">Fed: {bracket.fedRate}%</span>
                        </div>
                        {isActive && <p className="text-primary mt-1">Vous êtes ici</p>}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
              
              {/* Indicateur de position */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
                style={{ left: `${getPositionPercentage(currentIncome, 300000)}%` }}
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

        {/* Tableau des tranches combinées */}
        {showDetails && (
          <div className="space-y-4 pt-4 border-t border-border">
            <div>
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary" />
                Tableau des tranches combinées 2025 (Québec + Fédéral)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground font-medium">Revenu imposable</th>
                      <th className="text-center py-2 text-blue-500 font-medium">Québec</th>
                      <th className="text-center py-2 text-red-500 font-medium">Fédéral</th>
                      <th className="text-center py-2 text-slate-500 font-medium">Combiné</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMBINED_BRACKETS.map((bracket, i) => {
                      const isActive = currentIncome >= bracket.min && (bracket.max === Infinity || currentIncome < bracket.max);
                      return (
                        <tr 
                          key={i} 
                          className={cn(
                            "border-b border-border/50",
                            isActive && "bg-primary/10 font-medium"
                          )}
                        >
                          <td className="py-2">
                            {formatPrice(bracket.min)} - {bracket.max === Infinity ? '∞' : formatPrice(bracket.max)}
                            {isActive && <span className="ml-2 text-primary text-xs">← Vous</span>}
                          </td>
                          <td className="text-center py-2 text-blue-500">{bracket.qcRate}%</td>
                          <td className="text-center py-2 text-red-500">{bracket.fedRate}%</td>
                          <td className="text-center py-2 font-bold text-slate-500">{bracket.combinedRate}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Explications pédagogiques */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Comprendre votre fiscalité
              </h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong className="text-foreground">Taux marginal:</strong> C'est le taux d'imposition appliqué à votre dernier dollar gagné. 
                  Si vous gagnez 1 000$ de plus, vous paierez {(currentTax.combinedMarginalRate * 10).toFixed(0)}$ en impôts supplémentaires.
                </p>
                <p>
                  <strong className="text-foreground">Taux effectif:</strong> C'est le pourcentage réel de votre revenu total payé en impôts. 
                  Il est toujours inférieur au taux marginal car les premiers dollars sont imposés à des taux plus bas.
                </p>
                <p>
                  <strong className="text-foreground">Abattement Québec:</strong> Les résidents du Québec bénéficient d'une réduction de 16.5% 
                  sur l'impôt fédéral, car le Québec administre ses propres programmes sociaux.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
