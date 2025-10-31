import BusinessMap from "@/components/BusinessMap";

const Map = () => {
  return (
    <div className="min-h-screen bg-background pt-32">
      {/* Map Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">Carte Interactive</h1>
            <p className="text-xl text-muted-foreground mb-2">
              Explorez toutes les entreprises à vendre au Québec
            </p>
            <p className="text-sm text-muted-foreground">
              💡 Utilisez l'outil polygone en haut à gauche pour dessiner une zone et voir les annonces dans cette région
            </p>
          </div>

          {/* Map - Les annonces s'affichent dans le sidebar intégré à BusinessMap */}
          <BusinessMap />
        </div>
      </section>
    </div>
  );
};

export default Map;
