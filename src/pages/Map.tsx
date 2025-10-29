import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BusinessMap from "@/components/BusinessMap";
import FilterBar from "@/components/FilterBar";
import { ArrowLeft } from "lucide-react";

const Map = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<{
    city?: string;
    industry?: string;
    minPrice?: number;
    maxPrice?: number;
  }>({});

  const handleFilter = (newFilters: {
    city?: string;
    industry?: string;
    minPrice?: number;
    maxPrice?: number;
  }) => {
    setFilters(newFilters);
  };

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

          {/* Filter Bar */}
          <div className="mb-8">
            <FilterBar onFilter={handleFilter} />
          </div>

          {/* Map */}
          <BusinessMap filters={filters} />
        </div>
      </section>
    </div>
  );
};

export default Map;
