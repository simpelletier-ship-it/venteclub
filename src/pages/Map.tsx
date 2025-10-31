import BusinessMap from "@/components/BusinessMap";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import BusinessCard from "@/components/BusinessCard";

const Map = () => {
  const [allBusinesses, setAllBusinesses] = useState<any[]>([]);

  useEffect(() => {
    fetchAllBusinesses();
  }, []);

  const fetchAllBusinesses = async () => {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('status', 'active')
      .eq('approval_status', 'approved')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAllBusinesses(data);
    }
  };

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

          {/* Map */}
          <BusinessMap />
        </div>
      </section>

      {/* All Businesses Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Toutes les annonces disponibles
            </h2>
            <p className="text-muted-foreground">
              {allBusinesses.length} opportunités à découvrir
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allBusinesses.map((business) => (
              <div key={business.id} className="h-full">
                <BusinessCard {...business} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Map;
