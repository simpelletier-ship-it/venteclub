import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calculator, TrendingUp, DollarSign, Percent, Calendar, HelpCircle } from "lucide-react";
import { z } from "zod";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FinancialCalculatorProps {
  askingPrice: number;
}

const calculatorSchema = z.object({
  salePrice: z.number().min(1, "Le prix doit être supérieur à 0"),
  downPayment: z.number().min(0, "La mise de fond ne peut pas être négative"),
  sellerBalance: z.number().min(0, "La balance ne peut pas être négative"),
  interestRate: z.number().min(0, "Le taux d'intérêt ne peut pas être négatif").max(100, "Le taux d'intérêt ne peut pas dépasser 100%"),
  loanTerm: z.number().min(1, "La durée doit être d'au moins 1 an").max(30, "La durée ne peut pas dépasser 30 ans"),
});

export const FinancialCalculator = ({ askingPrice }: FinancialCalculatorProps) => {
  const [salePrice, setSalePrice] = useState(askingPrice);
  const [downPayment, setDownPayment] = useState(askingPrice * 0.2); // 20% par défaut
  const [sellerBalance, setSellerBalance] = useState(0); // Balance de prix de vente
  const [interestRate, setInterestRate] = useState(6.5); // 6.5% par défaut
  const [loanTerm, setLoanTerm] = useState(10); // 10 ans par défaut
  
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [totalPayment, setTotalPayment] = useState(0);
  const [totalInterest, setTotalInterest] = useState(0);
  const [loanAmount, setLoanAmount] = useState(0);

  useEffect(() => {
    setSalePrice(askingPrice);
    setDownPayment(askingPrice * 0.2);
  }, [askingPrice]);

  useEffect(() => {
    calculatePayments();
  }, [salePrice, downPayment, sellerBalance, interestRate, loanTerm]);

  const calculatePayments = () => {
    try {
      const validated = calculatorSchema.parse({
        salePrice,
        downPayment,
        sellerBalance,
        interestRate,
        loanTerm,
      });

      // Montant à financer = Prix de vente - Mise de fond - Balance de prix de vente
      const principal = validated.salePrice - validated.downPayment - validated.sellerBalance;
      setLoanAmount(principal);

      if (principal <= 0) {
        setMonthlyPayment(0);
        setTotalPayment(validated.downPayment + validated.sellerBalance);
        setTotalInterest(0);
        return;
      }

      const monthlyRate = validated.interestRate / 100 / 12;
      const numPayments = validated.loanTerm * 12;

      if (monthlyRate === 0) {
        // Si taux d'intérêt = 0, paiement simple
        const payment = principal / numPayments;
        setMonthlyPayment(payment);
        setTotalPayment(principal + validated.downPayment + validated.sellerBalance);
        setTotalInterest(0);
      } else {
        // Formule standard de calcul de paiement mensuel
        const payment = (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                       (Math.pow(1 + monthlyRate, numPayments) - 1);
        
        const total = payment * numPayments;
        const interest = total - principal;
        
        setMonthlyPayment(payment);
        setTotalPayment(total + validated.downPayment + validated.sellerBalance);
        setTotalInterest(interest);
      }
    } catch (error) {
      // Validation échouée, ne rien afficher
      console.error('Validation error:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const downPaymentPercent = salePrice > 0 ? ((downPayment / salePrice) * 100).toFixed(1) : 0;

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-secondary/5 to-primary/5 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-secondary/10 rounded-xl">
              <Calculator className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-display">Calculateur de financement</CardTitle>
              <CardDescription>Estimez vos paiements mensuels pour l'achat de cette entreprise</CardDescription>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-2 hover:bg-muted rounded-full transition-colors">
                  <HelpCircle className="w-5 h-5 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-md p-4 bg-card border-border shadow-lg">
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-foreground">Information importante</h4>
                  <div className="text-xs text-muted-foreground space-y-2 leading-relaxed">
                    <p>
                      Cet outil en ligne a été créé pour vous aider à planifier et à calculer le montant des versements pour le financement d'une entreprise. Les résultats sont des estimations fondées sur les renseignements que vous avez saisis.
                    </p>
                    <p>
                      Ces estimations peuvent varier selon votre situation financière, votre cote de crédit et les conditions du marché au moment où le prêt est octroyé. Les calculs reposent sur l'hypothèse que le taux d'intérêt demeure le même pendant toute la durée du prêt.
                    </p>
                    <p>
                      Les frais additionnels tels que les frais de clôture, les frais juridiques, les assurances et les frais d'évaluation ne sont pas inclus dans ces calculs. Nous vous recommandons fortement de consulter un conseiller financier et votre institution financière pour obtenir des conseils personnalisés et connaître les taux d'intérêt en vigueur.
                    </p>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Prix de vente */}
        <div className="space-y-2">
          <Label htmlFor="salePrice" className="text-sm font-semibold flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" />
            Prix de vente
          </Label>
          <Input
            id="salePrice"
            type="number"
            value={salePrice}
            onChange={(e) => setSalePrice(Number(e.target.value))}
            className="text-lg font-semibold"
            min="0"
            step="1000"
          />
        </div>

        {/* Mise de fond */}
        <div className="space-y-2">
          <Label htmlFor="downPayment" className="text-sm font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-accent" />
              Mise de fond
            </span>
            <span className="text-xs text-muted-foreground font-normal">
              {downPaymentPercent}% du prix
            </span>
          </Label>
          <Input
            id="downPayment"
            type="number"
            value={downPayment}
            onChange={(e) => setDownPayment(Number(e.target.value))}
            className="text-lg font-semibold"
            min="0"
            max={salePrice}
            step="1000"
          />
        </div>

        {/* Balance de prix de vente (seller financing) */}
        <div className="space-y-2">
          <Label htmlFor="sellerBalance" className="text-sm font-semibold flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-accent" />
            Balance de prix de vente
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="p-0.5 hover:bg-muted rounded-full transition-colors">
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-sm p-3 bg-card border-border shadow-lg">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-foreground">Balance de prix de vente</h4>
                    <div className="text-xs text-muted-foreground space-y-1 leading-relaxed">
                      <p>
                        La balance de prix de vente est un montant que le vendeur accepte de financer directement à l'acheteur, sans passer par une institution financière.
                      </p>
                      <p className="font-medium text-foreground">
                        ✓ Ce montant se négocie entre l'acheteur et le vendeur
                      </p>
                      <p>
                        Cette balance est déduite du montant que vous devrez financer auprès d'une banque ou autre institution financière, réduisant ainsi vos paiements mensuels.
                      </p>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Input
            id="sellerBalance"
            type="number"
            value={sellerBalance}
            onChange={(e) => setSellerBalance(Number(e.target.value))}
            className="text-lg font-semibold"
            min="0"
            max={salePrice - downPayment}
            step="1000"
          />
        </div>

        {/* Taux d'intérêt */}
        <div className="space-y-2">
          <Label htmlFor="interestRate" className="text-sm font-semibold flex items-center gap-2">
            <Percent className="w-4 h-4 text-secondary" />
            Taux d'intérêt annuel (%)
          </Label>
          <Input
            id="interestRate"
            type="number"
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            className="text-lg font-semibold"
            min="0"
            max="100"
            step="0.1"
          />
        </div>

        {/* Durée du prêt */}
        <div className="space-y-2">
          <Label htmlFor="loanTerm" className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Durée du prêt (années)
          </Label>
          <Input
            id="loanTerm"
            type="number"
            value={loanTerm}
            onChange={(e) => setLoanTerm(Number(e.target.value))}
            className="text-lg font-semibold"
            min="1"
            max="30"
            step="1"
          />
        </div>

        {/* Décomposition du financement */}
        <div className="pt-4 border-t border-border/50">
          <div className="bg-muted/30 rounded-lg p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Décomposition du financement</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Prix de vente</span>
                <span className="font-semibold text-foreground">{formatCurrency(salePrice)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Mise de fond ({downPaymentPercent}%)</span>
                <span className="font-semibold text-foreground">- {formatCurrency(downPayment)}</span>
              </div>
              {sellerBalance > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Balance de prix de vente</span>
                  <span className="font-semibold text-foreground">- {formatCurrency(sellerBalance)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-border/50">
                <span className="text-base font-bold text-foreground">Montant à financer</span>
                <span className="text-xl font-display font-bold text-secondary">{formatCurrency(loanAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Résultats */}
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-base font-semibold text-foreground">Paiement mensuel estimé</span>
              <span className="text-2xl font-display font-bold text-primary">
                {formatCurrency(monthlyPayment)}<span className="text-sm text-muted-foreground">/mois</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/30 rounded-lg p-4 space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Coût total</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(totalPayment)}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Intérêts totaux</p>
              <p className="text-lg font-bold text-secondary">{formatCurrency(totalInterest)}</p>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-border/30 mt-4">
          <p className="text-xs text-muted-foreground italic">
            * Ces calculs sont fournis à titre indicatif seulement. Consultez un conseiller financier et votre institution financière pour une évaluation précise et personnalisée.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
