import { useState, useEffect } from "react";
import { SEO } from "@/components/SEO";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Coffee, Server, Database, Sparkles, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";

const PRESET_AMOUNTS = [5, 10, 25, 50, 100];

const Support = () => {
  const [searchParams] = useSearchParams();
  const [customAmount, setCustomAmount] = useState("");
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast({
        title: "Merci pour votre don! 🎉",
        description: "Votre générosité nous aide à continuer à développer Vente.Club.",
      });
    } else if (searchParams.get("canceled") === "true") {
      toast({
        title: "Don annulé",
        description: "Vous pouvez réessayer quand vous le souhaitez.",
        variant: "destructive",
      });
    }
  }, [searchParams]);

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (value: string) => {
    const numValue = value.replace(/[^0-9]/g, "");
    setCustomAmount(numValue);
    setSelectedAmount(null);
  };

  const getFinalAmount = (): number => {
    if (selectedAmount) return selectedAmount;
    if (customAmount) return parseInt(customAmount, 10);
    return 0;
  };

  const handleDonate = async () => {
    const amount = getFinalAmount();
    
    if (amount < 1) {
      toast({
        title: "Montant invalide",
        description: "Le montant minimum est de 1$.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-donation", {
        body: {
          amount: amount * 100, // Convert to cents
          email: donorEmail || undefined,
          name: donorName || undefined,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      console.error("Donation error:", error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const breadcrumbItems = [
    { name: "Accueil", url: "/" },
    { name: "Soutenir", url: "/soutien" },
  ];

  return (
    <>
      <SEO
        title="Soutenir Vente.Club | Faire un don"
        description="Soutenez le développement de Vente.Club, la plateforme québécoise d'achat-vente d'entreprises. Vos dons nous aident à payer les serveurs et à améliorer le service."
        canonical="https://vente.club/soutien"
      />
      <BreadcrumbSchema items={breadcrumbItems} />

      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
              <Heart className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Soutenez Vente.Club</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Si nos outils vous ont aidé à économiser du temps ou de l'argent, 
              n'hésitez pas à nous soutenir avec un petit don.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Why Support Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Pourquoi nous soutenir?
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <Server className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Hébergement & Serveurs</h3>
                      <p className="text-sm text-muted-foreground">
                        Vos dons nous aident à payer les serveurs qui font tourner la plateforme 24/7.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <Database className="w-8 h-8 text-green-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Base de données</h3>
                      <p className="text-sm text-muted-foreground">
                        Stocker et sécuriser toutes les données des annonces et des utilisateurs a un coût.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <Coffee className="w-8 h-8 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Développement continu</h3>
                      <p className="text-sm text-muted-foreground">
                        Nous travaillons constamment à améliorer la plateforme et à ajouter de nouvelles fonctionnalités.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground italic">
                      "Chaque dollar compte et nous motive à continuer. Merci de votre confiance! 💙"
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Donation Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Faire un don</CardTitle>
                  <CardDescription>
                    Choisissez un montant ou entrez le vôtre
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Preset Amounts */}
                  <div className="grid grid-cols-5 gap-2">
                    {PRESET_AMOUNTS.map((amount) => (
                      <Button
                        key={amount}
                        variant={selectedAmount === amount ? "default" : "outline"}
                        onClick={() => handleAmountSelect(amount)}
                        className="w-full"
                      >
                        {amount}$
                      </Button>
                    ))}
                  </div>

                  {/* Custom Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="customAmount">Autre montant</Label>
                    <div className="relative">
                      <Input
                        id="customAmount"
                        type="text"
                        placeholder="Entrez un montant"
                        value={customAmount}
                        onChange={(e) => handleCustomAmountChange(e.target.value)}
                        className="pl-8"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                    </div>
                  </div>

                  {/* Optional Info */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="donorName">Votre nom (optionnel)</Label>
                      <Input
                        id="donorName"
                        placeholder="Jean Tremblay"
                        value={donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="donorEmail">Votre courriel (optionnel)</Label>
                      <Input
                        id="donorEmail"
                        type="email"
                        placeholder="jean@exemple.com"
                        value={donorEmail}
                        onChange={(e) => setDonorEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Summary */}
                  {getFinalAmount() > 0 && (
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Votre don:</span>
                        <span className="text-2xl font-bold text-primary">
                          {getFinalAmount()} $
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Donate Button */}
                  <Button
                    onClick={handleDonate}
                    disabled={getFinalAmount() < 1 || isLoading}
                    className="w-full h-12 text-lg"
                    size="lg"
                  >
                    {isLoading ? (
                      "Redirection..."
                    ) : (
                      <>
                        <Heart className="w-5 h-5 mr-2" />
                        Faire un don de {getFinalAmount() > 0 ? `${getFinalAmount()}$` : "..."}
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Paiement sécurisé par Stripe. Aucune information bancaire n'est stockée sur nos serveurs.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Thank You Message */}
          {searchParams.get("success") === "true" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-8"
            >
              <Card className="border-green-500/50 bg-green-500/10">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <CheckCircle className="w-12 h-12 text-green-500" />
                    <div>
                      <h3 className="text-xl font-bold text-green-500">Merci infiniment!</h3>
                      <p className="text-muted-foreground">
                        Votre générosité nous permet de continuer à offrir ces outils gratuitement à tous les Québécois.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
};

export default Support;
