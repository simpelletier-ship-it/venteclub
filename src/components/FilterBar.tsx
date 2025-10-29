import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QUEBEC_INDUSTRIES } from "@/lib/constants";

interface FilterBarProps {
  onFilter?: (filters: { 
    city?: string; 
    industry?: string;
    minPrice?: number;
    maxPrice?: number;
  }) => void;
}

const FilterBar = ({ onFilter }: FilterBarProps) => {
  const [city, setCity] = useState<string>("");
  const [industry, setIndustry] = useState<string>("");
  const [priceRange, setPriceRange] = useState<number[]>([0, 10000000]);

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
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
      });
    }
  };

  const handleReset = () => {
    setCity("");
    setIndustry("");
    setPriceRange([0, 10000000]);
    if (onFilter) {
      onFilter({});
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-card rounded-2xl shadow-elegant p-6 border border-border">
      <div className="flex flex-col gap-6">
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
        </div>

        {/* Price Range Slider */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            Fourchette de prix
          </label>
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            min={0}
            max={10000000}
            step={50000}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{priceRange[0].toLocaleString('fr-CA')} $</span>
            <span>{priceRange[1].toLocaleString('fr-CA')} $</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleFilter}
            className="flex-1 h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
          >
            Filtrer
          </Button>
          {(city || industry || priceRange[0] > 0 || priceRange[1] < 10000000) && (
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
        Affinez votre recherche par ville, secteur ou fourchette de prix
      </p>
    </div>
  );
};

export default FilterBar;
