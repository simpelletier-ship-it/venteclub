import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Landmark, PiggyBank, Star, ExternalLink, Check, X } from "lucide-react";
import { motion } from "framer-motion";

interface Product {
  id: string;
  name: string;
  provider: string;
  type: "credit-card" | "savings" | "chequing";
  annualFee: number;
  interestRate: number;
  cashback?: number;
  welcomeBonus?: string;
  features: string[];
  rating: number;
  recommended?: boolean;
}

export const FinancialProductComparison = () => {
  const [activeTab, setActiveTab] = useState("credit-cards");

  const creditCards: Product[] = [
    {
      id: "1",
      name: "Tangerine World Mastercard",
      provider: "Tangerine",
      type: "credit-card",
      annualFee: 0,
      interestRate: 19.95,
      cashback: 2,
      welcomeBonus: "10% remise (max 100$)",
      features: ["2% remise catégories au choix", "Pas de frais annuels", "Assurance achat"],
      rating: 4.5,
      recommended: true,
    },
    {
      id: "2",
      name: "BMO Remises",
      provider: "BMO",
      type: "credit-card",
      annualFee: 0,
      interestRate: 20.99,
      cashback: 3,
      welcomeBonus: "5% les 3 premiers mois",
      features: ["3% épicerie", "2% essence", "1% tout le reste"],
      rating: 4.2,
    },
    {
      id: "3",
      name: "Amex Cobalt",
      provider: "American Express",
      type: "credit-card",
      annualFee: 156,
      interestRate: 21.99,
      cashback: 5,
      welcomeBonus: "30 000 points",
      features: ["5x restaurants", "2x voyage", "Lounge aéroport"],
      rating: 4.8,
    },
  ];

  const savingsAccounts: Product[] = [
    {
      id: "1",
      name: "Compte épargne EQ Bank",
      provider: "EQ Bank",
      type: "savings",
      annualFee: 0,
      interestRate: 4.0,
      features: ["Taux élevé", "Pas de frais", "Virements gratuits"],
      rating: 4.7,
      recommended: true,
    },
    {
      id: "2",
      name: "Compte épargne Tangerine",
      provider: "Tangerine",
      type: "savings",
      annualFee: 0,
      interestRate: 2.75,
      welcomeBonus: "5.75% promo 5 mois",
      features: ["Taux promo nouveaux clients", "App mobile", "Pas de minimum"],
      rating: 4.3,
    },
  ];

  const products = activeTab === "credit-cards" ? creditCards : savingsAccounts;

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-xl bg-teal-500/10">
              <Landmark className="w-5 h-5 text-teal-600" />
            </div>
            Comparateur de produits
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="credit-cards" className="gap-2">
              <CreditCard className="w-4 h-4" />
              Cartes de crédit
            </TabsTrigger>
            <TabsTrigger value="savings" className="gap-2">
              <PiggyBank className="w-4 h-4" />
              Comptes épargne
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-4">
          {products.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-4 rounded-xl border ${
                product.recommended 
                  ? "border-teal-300 dark:border-teal-700 bg-teal-50/50 dark:bg-teal-950/20" 
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{product.name}</span>
                    {product.recommended && (
                      <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 border-0">
                        Recommandé
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{product.provider}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-medium">{product.rating}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                <div className="p-2 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">
                    {activeTab === "credit-cards" ? "Frais annuels" : "Frais mensuels"}
                  </p>
                  <p className="font-semibold">
                    {product.annualFee === 0 ? "Gratuit" : `${product.annualFee}$`}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">
                    {activeTab === "credit-cards" ? "Intérêt" : "Taux d'intérêt"}
                  </p>
                  <p className="font-semibold text-emerald-600">{product.interestRate}%</p>
                </div>
                {product.cashback && (
                  <div className="p-2 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Remise max</p>
                    <p className="font-semibold">{product.cashback}%</p>
                  </div>
                )}
              </div>

              {product.welcomeBonus && (
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 mb-3">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    🎁 Bonus: {product.welcomeBonus}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mb-4">
                {product.features.map((feature, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    <Check className="w-3 h-3 mr-1 text-emerald-600" />
                    {feature}
                  </Badge>
                ))}
              </div>

              <Button variant="outline" size="sm" className="w-full gap-2">
                Voir les détails
                <ExternalLink className="w-3 h-3" />
              </Button>
            </motion.div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          * Les taux et offres peuvent varier. Vérifiez directement auprès des institutions.
        </p>
      </CardContent>
    </Card>
  );
};
