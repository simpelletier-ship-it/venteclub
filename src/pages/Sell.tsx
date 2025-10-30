import { useNavigate } from "react-router-dom";
import { Building2, Store } from "lucide-react";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

          <div className="grid md:grid-cols-2 gap-8">
            <Card 
              className="group cursor-pointer hover:shadow-premium transition-all duration-300 hover:scale-105 border-2 hover:border-primary"
              onClick={() => navigate("/list-business")}
            >
              <CardHeader className="text-center space-y-4 pb-6">
                <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Building2 className="w-10 h-10 text-primary" />
                </div>
                <CardTitle className="text-2xl">Entreprise</CardTitle>
                <CardDescription className="text-base">
                  Vendez votre entreprise établie, commerciale ou industrielle
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <ul className="space-y-2">
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
                </ul>
              </CardContent>
            </Card>

            <Card 
              className="group cursor-pointer hover:shadow-premium transition-all duration-300 hover:scale-105 border-2 hover:border-accent"
              onClick={() => navigate("/list-franchise")}
            >
              <CardHeader className="text-center space-y-4 pb-6">
                <div className="mx-auto w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <Store className="w-10 h-10 text-accent" />
                </div>
                <CardTitle className="text-2xl">Franchise</CardTitle>
                <CardDescription className="text-base">
                  Vendez votre franchise d'une marque reconnue
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">•</span>
                    <span>Franchise alimentaire</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">•</span>
                    <span>Franchise de services</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">•</span>
                    <span>Franchise de distribution</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">•</span>
                    <span>Autres franchises établies</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sell;
