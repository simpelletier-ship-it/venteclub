import BusinessMap from "@/components/BusinessMap";

const Map = () => {
  return (
    <div className="min-h-screen bg-background pt-32">
      {/* Map Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">Carte Interactive</h1>
            <p className="text-xl text-muted-foreground">
              Explorez toutes les entreprises à vendre au Québec
            </p>
          </div>

          {/* Map */}
          <BusinessMap />
        </div>
      </section>
    </div>
  );
};

export default Map;
