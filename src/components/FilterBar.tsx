import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QUEBEC_INDUSTRIES } from "@/lib/constants";

interface FilterBarProps {
  onFilter?: (filters: { city?: string; industry?: string }) => void;
}

const FilterBar = ({ onFilter }: FilterBarProps) => {
  const [city, setCity] = useState<string>("");
  const [industry, setIndustry] = useState<string>("");

  const cities = [
    "Montréal",
    "Québec",
    "Laval",
    "Gatineau",
    "Longueuil",
    "Sherbrooke",
    "Saguenay",
    "Trois-Rivières",
    "Terrebonne",
    "Saint-Jean-sur-Richelieu",
  ];

  const handleFilter = () => {
    if (onFilter) {
      onFilter({
        city: city || undefined,
        industry: industry || undefined,
      });
    }
  };

  const handleReset = () => {
    setCity("");
    setIndustry("");
    if (onFilter) {
      onFilter({});
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-card rounded-2xl shadow-elegant p-6 border border-border">
      <div className="flex flex-col md:flex-row gap-4">
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger className="flex-1 h-12 bg-background border-border">
            <SelectValue placeholder="Ville (optionnel)" />
          </SelectTrigger>
          <SelectContent>
            {cities.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={industry} onValueChange={setIndustry}>
          <SelectTrigger className="flex-1 h-12 bg-background border-border">
            <SelectValue placeholder="Secteur (optionnel)" />
          </SelectTrigger>
          <SelectContent>
            {QUEBEC_INDUSTRIES.map((ind) => (
              <SelectItem key={ind.value} value={ind.value}>
                {ind.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Button 
            onClick={handleFilter}
            className="h-12 px-8 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
          >
            Filtrer
          </Button>
          {(city || industry) && (
            <Button 
              onClick={handleReset}
              variant="outline"
              className="h-12 px-6"
            >
              Réinitialiser
            </Button>
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground mt-3 text-center">
        Choisissez une ville, un secteur, ou les deux pour affiner votre recherche
      </p>
    </div>
  );
};

export default FilterBar;
