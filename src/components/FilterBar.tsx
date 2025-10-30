import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { QUEBEC_INDUSTRIES, LISTING_TYPES } from "@/lib/constants";
import { QUEBEC_REGIONS, getCitiesFromRegions } from "@/lib/quebecRegions";
import { ChevronDown, X } from "lucide-react";

interface FilterBarProps {
  onFilter?: (filters: { 
    regions?: string[];
    cities?: string[]; 
    industries?: string[];
    listingTypes?: string[];
    minPrice?: number;
    maxPrice?: number;
  }) => void;
}

const FilterBar = ({ onFilter }: FilterBarProps) => {
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedListingTypes, setSelectedListingTypes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<number[]>([0, 10000000]);
  const [regionsOpen, setRegionsOpen] = useState(false);
  const [industriesOpen, setIndustriesOpen] = useState(false);
  const [listingTypesOpen, setListingTypesOpen] = useState(false);

  const toggleRegion = (regionCode: string) => {
    setSelectedRegions(prev => 
      prev.includes(regionCode) 
        ? prev.filter(r => r !== regionCode)
        : [...prev, regionCode]
    );
  };

  const toggleIndustry = (industry: string) => {
    setSelectedIndustries(prev => 
      prev.includes(industry) 
        ? prev.filter(i => i !== industry)
        : [...prev, industry]
    );
  };

  const toggleListingType = (type: string) => {
    setSelectedListingTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const removeRegion = (regionCode: string) => {
    setSelectedRegions(prev => prev.filter(r => r !== regionCode));
  };

  const removeIndustry = (industry: string) => {
    setSelectedIndustries(prev => prev.filter(i => i !== industry));
  };

  const removeListingType = (type: string) => {
    setSelectedListingTypes(prev => prev.filter(t => t !== type));
  };

  const handleFilter = () => {
    if (onFilter) {
      const cities = selectedRegions.length > 0 ? getCitiesFromRegions(selectedRegions) : undefined;
      onFilter({
        regions: selectedRegions.length > 0 ? selectedRegions : undefined,
        cities,
        industries: selectedIndustries.length > 0 ? selectedIndustries : undefined,
        listingTypes: selectedListingTypes.length > 0 ? selectedListingTypes : undefined,
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
      });
    }
  };

  const handleReset = () => {
    setSelectedRegions([]);
    setSelectedIndustries([]);
    setSelectedListingTypes([]);
    setPriceRange([0, 10000000]);
    if (onFilter) {
      onFilter({});
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto bg-card rounded-2xl shadow-elegant p-6 border border-border">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Type d'annonce */}
          <Popover open={listingTypesOpen} onOpenChange={setListingTypesOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="flex-1 h-12 bg-background border-border justify-between"
              >
                <span className="truncate">
                  {selectedListingTypes.length > 0 
                    ? `${selectedListingTypes.length} type${selectedListingTypes.length > 1 ? 's' : ''}`
                    : "Type (optionnel)"
                  }
                </span>
                <ChevronDown className="h-4 w-4 opacity-50 ml-2 flex-shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 bg-card border-border z-50">
              <div className="space-y-2">
                {LISTING_TYPES.map((type) => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type.value}`}
                      checked={selectedListingTypes.includes(type.value)}
                      onCheckedChange={() => toggleListingType(type.value)}
                    />
                    <label
                      htmlFor={`type-${type.value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      {type.label}
                    </label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Régions */}
          <Popover open={regionsOpen} onOpenChange={setRegionsOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="flex-1 h-12 bg-background border-border justify-between"
              >
                <span className="truncate">
                  {selectedRegions.length > 0 
                    ? `${selectedRegions.length} région${selectedRegions.length > 1 ? 's' : ''}`
                    : "Régions (optionnel)"
                  }
                </span>
                <ChevronDown className="h-4 w-4 opacity-50 ml-2 flex-shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 bg-card border-border z-50">
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {QUEBEC_REGIONS.map((region) => (
                  <div key={region.code} className="flex items-center space-x-2">
                    <Checkbox
                      id={`region-${region.code}`}
                      checked={selectedRegions.includes(region.code)}
                      onCheckedChange={() => toggleRegion(region.code)}
                    />
                    <label
                      htmlFor={`region-${region.code}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      {region.name}
                    </label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Secteurs */}
          <Popover open={industriesOpen} onOpenChange={setIndustriesOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="flex-1 h-12 bg-background border-border justify-between"
              >
                <span className="truncate">
                  {selectedIndustries.length > 0 
                    ? `${selectedIndustries.length} secteur${selectedIndustries.length > 1 ? 's' : ''}`
                    : "Secteurs (optionnel)"
                  }
                </span>
                <ChevronDown className="h-4 w-4 opacity-50 ml-2 flex-shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 bg-card border-border z-50">
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {QUEBEC_INDUSTRIES.map((ind) => (
                  <div key={ind.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`industry-${ind.value}`}
                      checked={selectedIndustries.includes(ind.value)}
                      onCheckedChange={() => toggleIndustry(ind.value)}
                    />
                    <label
                      htmlFor={`industry-${ind.value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                    >
                      {ind.label}
                    </label>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Selected filters badges */}
        {(selectedRegions.length > 0 || selectedIndustries.length > 0 || selectedListingTypes.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {selectedListingTypes.map((type) => (
              <Badge key={type} variant="default" className="pl-2 pr-1">
                {LISTING_TYPES.find(t => t.value === type)?.label || type}
                <button
                  onClick={() => removeListingType(type)}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {selectedRegions.map((regionCode) => (
              <Badge key={regionCode} variant="secondary" className="pl-2 pr-1">
                {QUEBEC_REGIONS.find(r => r.code === regionCode)?.name || regionCode}
                <button
                  onClick={() => removeRegion(regionCode)}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {selectedIndustries.map((industry) => (
              <Badge key={industry} variant="secondary" className="pl-2 pr-1">
                {QUEBEC_INDUSTRIES.find(i => i.value === industry)?.label || industry}
                <button
                  onClick={() => removeIndustry(industry)}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

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
          {(selectedRegions.length > 0 || selectedIndustries.length > 0 || selectedListingTypes.length > 0 || priceRange[0] > 0 || priceRange[1] < 10000000) && (
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
        Affinez votre recherche par type, régions, secteurs ou fourchette de prix
      </p>
    </div>
  );
};

export default FilterBar;
