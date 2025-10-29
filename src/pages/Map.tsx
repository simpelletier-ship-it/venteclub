import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BusinessMap from "@/components/BusinessMap";
import { ArrowLeft } from "lucide-react";

const Map = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center cursor-pointer" onClick={() => navigate("/")}>
            <span className="text-3xl font-bold">
              Vente<span className="text-accent">.Club</span>
            </span>
          </div>
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </div>
      </nav>

      {/* Map Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">Carte Interactive</h1>
            <p className="text-xl text-muted-foreground">
              Explorez toutes les entreprises à vendre au Québec
            </p>
          </div>
          <BusinessMap />
        </div>
      </section>
    </div>
  );
};

export default Map;
