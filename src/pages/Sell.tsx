import { useNavigate } from "react-router-dom";
import { Building2, Store, Home } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Sell = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEO
        title="Vendre votre entreprise ou franchise"
        description="Choisissez de vendre votre entreprise ou votre franchise sur Vente.Club"
      />
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="container max-w-5xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 text-gradient">
              Que souhaitez-vous vendre ?
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Sélectionnez le type de vente pour accéder au formulaire approprié
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card 
              className="group cursor-pointer hover:shadow-premium transition-all duration-300 hover:scale-105 border-2 hover:border-primary flex flex-col"
              onClick={() => navigate("/list-business")}
            >
              <CardHeader className="text-center space-y-4 pb-6">
                <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Building2 className="w-10 h-10 text-primary" />
                </div>
                <CardTitle className="text-2xl">Entreprise</CardTitle>
                <CardDescription className="text-base min-h-[48px]">
                  Vendez votre entreprise établie ou commerciale
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between text-sm text-muted-foreground">
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Commerce de détail ou en ligne</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Entreprise de services</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Entreprise manufacturière</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Restauration et hôtellerie</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Distribution et import-export</span>
                  </li>
                </ul>
                <Button 
                  className="w-full bg-primary hover:bg-primary/90" 
                  onClick={() => navigate("/list-business")}
                >
                  Vendre une Entreprise
                </Button>
              </CardContent>
            </Card>

            <Card 
              className="group cursor-pointer hover:shadow-premium transition-all duration-300 hover:scale-105 border-2 hover:border-[#FF6B00] flex flex-col"
              onClick={() => navigate("/list-franchise")}
            >
              <CardHeader className="text-center space-y-4 pb-6">
                <div className="mx-auto w-20 h-20 rounded-full bg-[#FF6B00]/10 flex items-center justify-center group-hover:bg-[#FF6B00]/20 transition-colors">
                  <Store className="w-10 h-10 text-[#FF6B00]" />
                </div>
                <CardTitle className="text-2xl">Franchise</CardTitle>
                <CardDescription className="text-base min-h-[48px]">
                  Vendez votre franchise d'une marque établie
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between text-sm text-muted-foreground">
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start gap-2">
                    <span className="text-[#FF6B00] mt-0.5">•</span>
                    <span>Franchise alimentaire</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FF6B00] mt-0.5">•</span>
                    <span>Franchise de services</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FF6B00] mt-0.5">•</span>
                    <span>Franchise de distribution</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FF6B00] mt-0.5">•</span>
                    <span>Franchise de vente au détail</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FF6B00] mt-0.5">•</span>
                    <span>Autres franchises établies</span>
                  </li>
                </ul>
                <Button 
                  className="w-full bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white" 
                  onClick={() => navigate("/list-franchise")}
                >
                  Vendre une Franchise
                </Button>
              </CardContent>
            </Card>

            <Card 
              className="group cursor-pointer hover:shadow-premium transition-all duration-300 hover:scale-105 border-2 hover:border-secondary flex flex-col"
              onClick={() => navigate("/list-property")}
            >
              <CardHeader className="text-center space-y-4 pb-6">
                <div className="mx-auto w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
                  <Home className="w-10 h-10 text-secondary" />
                </div>
                <CardTitle className="text-2xl">Immeuble</CardTitle>
                <CardDescription className="text-base min-h-[48px]">
                  Vendez votre propriété commerciale ou industrielle
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between text-sm text-muted-foreground">
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start gap-2">
                    <span className="text-secondary mt-0.5">•</span>
                    <span>Bureaux commerciaux</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-secondary mt-0.5">•</span>
                    <span>Espaces de vente au détail</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-secondary mt-0.5">•</span>
                    <span>Bâtiments industriels</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-secondary mt-0.5">•</span>
                    <span>Terrains commerciaux</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-secondary mt-0.5">•</span>
                    <span>Propriétés mixtes</span>
                  </li>
                </ul>
                <Button 
                  className="w-full bg-secondary hover:bg-secondary/90" 
                  onClick={() => navigate("/list-property")}
                >
                  Vendre un Immeuble
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sell;
