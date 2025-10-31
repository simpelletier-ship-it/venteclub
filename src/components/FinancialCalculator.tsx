import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calculator, TrendingUp, DollarSign, Percent, Calendar } from "lucide-react";
import { z } from "zod";

interface FinancialCalculatorProps {
  askingPrice: number;
}

const calculatorSchema = z.object({
  salePrice: z.number().min(1, "Le prix doit être supérieur à 0"),
  downPayment: z.number().min(0, "La mise de fond ne peut pas être négative"),
  interestRate: z.number().min(0, "Le taux d'intérêt ne peut pas être négatif").max(100, "Le taux d'intérêt ne peut pas dépasser 100%"),
  loanTerm: z.number().min(1, "La durée doit être d'au moins 1 an").max(30, "La durée ne peut pas dépasser 30 ans"),
});

export const FinancialCalculator = ({ askingPrice }: FinancialCalculatorProps) => {
  const [salePrice, setSalePrice] = useState(askingPrice);
  const [downPayment, setDownPayment] = useState(askingPrice * 0.2); // 20% par défaut
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
  }, [salePrice, downPayment, interestRate, loanTerm]);

  const calculatePayments = () => {
    try {
      const validated = calculatorSchema.parse({
        salePrice,
        downPayment,
        interestRate,
        loanTerm,
      });

      const principal = validated.salePrice - validated.downPayment;
      setLoanAmount(principal);

      if (principal <= 0) {
        setMonthlyPayment(0);
        setTotalPayment(validated.downPayment);
        setTotalInterest(0);
        return;
      }

      const monthlyRate = validated.interestRate / 100 / 12;
      const numPayments = validated.loanTerm * 12;

      if (monthlyRate === 0) {
        // Si taux d'intérêt = 0, paiement simple
        const payment = principal / numPayments;
        setMonthlyPayment(payment);
        setTotalPayment(principal + validated.downPayment);
        setTotalInterest(0);
      } else {
        // Formule standard de calcul de paiement mensuel
        const payment = (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                       (Math.pow(1 + monthlyRate, numPayments) - 1);
        
        const total = payment * numPayments;
        const interest = total - principal;
        
        setMonthlyPayment(payment);
        setTotalPayment(total + validated.downPayment);
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
        <div className="flex items-center gap-3">
          <div className="p-3 bg-secondary/10 rounded-xl">
            <Calculator className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-display">Calculateur de financement</CardTitle>
            <CardDescription>Estimez vos paiements mensuels pour l'achat de cette entreprise</CardDescription>
          </div>
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

        {/* Résultats */}
        <div className="pt-6 border-t border-border/50 space-y-4">
          <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground font-medium">Montant à financer</span>
              <span className="text-lg font-bold text-foreground">{formatCurrency(loanAmount)}</span>
            </div>
            
            <div className="flex justify-between items-center pt-3 border-t border-border/30">
              <span className="text-base font-semibold text-foreground">Paiement mensuel</span>
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

        <p className="text-xs text-muted-foreground text-center pt-2">
          * Ces calculs sont fournis à titre indicatif seulement. Consultez un conseiller financier pour une estimation précise.
        </p>
      </CardContent>
    </Card>
  );
};
