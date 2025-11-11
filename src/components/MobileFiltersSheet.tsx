import { useState } from "react";
import { Filter, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { QUEBEC_INDUSTRIES, LISTING_TYPES } from "@/lib/constants";
import { QUEBEC_REGIONS } from "@/lib/quebecRegions";
import { formatPrice } from "@/lib/priceFormat";

interface MobileFiltersSheetProps {
  selectedRegions: string[];
  selectedIndustries: string[];
  selectedListingTypes: string[];
  priceRange: number[];
  onRegionToggle: (region: string) => void;
  onIndustryToggle: (industry: string) => void;
  onListingTypeToggle: (type: string) => void;
  onPriceChange: (range: number[]) => void;
  onApply: () => void;
  onReset: () => void;
  accentColor?: 'purple' | 'blue';
}

export const MobileFiltersSheet = ({
  selectedRegions,
  selectedIndustries,
  selectedListingTypes,
  priceRange,
  onRegionToggle,
  onIndustryToggle,
  onListingTypeToggle,
  onPriceChange,
  onApply,
  onReset,
  accentColor = 'purple'
}: MobileFiltersSheetProps) => {
  const [open, setOpen] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState({
    types: true,
    regions: false,
    industries: false,
    price: false
  });

  const activeFiltersCount = 
    selectedRegions.length + 
    selectedIndustries.length + 
    selectedListingTypes.length +
    (priceRange[0] > 0 || priceRange[1] < 10000000 ? 1 : 0);

  const handleApply = () => {
    onApply();
    setOpen(false);
  };

  const toggleSection = (section: keyof typeof sectionsOpen) => {
    setSectionsOpen(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          className="relative h-10 sm:h-12 gap-2 bg-background border-border"
        >
          <Filter className="h-4 w-4" />
          <span>Filtres</span>
          {activeFiltersCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-primary text-white text-xs font-bold">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b border-border">
          <SheetTitle className="text-xl font-display font-bold">Filtres de recherche</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {/* Type d'annonce */}
          <Collapsible open={sectionsOpen.types} onOpenChange={() => toggleSection('types')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-left font-semibold">
              <span>Type d'annonce</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${sectionsOpen.types ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2 pb-4">
              {LISTING_TYPES.map((type) => (
                <div key={type.value} className="flex items-center space-x-3">
                  <Checkbox
                    id={`mobile-type-${type.value}`}
                    checked={selectedListingTypes.includes(type.value)}
                    onCheckedChange={() => onListingTypeToggle(type.value)}
                    className="h-5 w-5"
                  />
                  <label
                    htmlFor={`mobile-type-${type.value}`}
                    className="text-base font-medium cursor-pointer flex-1"
                  >
                    {type.label}
                  </label>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Régions */}
          <Collapsible open={sectionsOpen.regions} onOpenChange={() => toggleSection('regions')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-left font-semibold border-t border-border">
              <span>Régions ({selectedRegions.length})</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${sectionsOpen.regions ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2 pb-4 max-h-[300px] overflow-y-auto">
              {QUEBEC_REGIONS.map((region) => (
                <div key={region.code} className="flex items-center space-x-3">
                  <Checkbox
                    id={`mobile-region-${region.code}`}
                    checked={selectedRegions.includes(region.code)}
                    onCheckedChange={() => onRegionToggle(region.code)}
                    className="h-5 w-5"
                  />
                  <label
                    htmlFor={`mobile-region-${region.code}`}
                    className="text-base font-medium cursor-pointer flex-1"
                  >
                    {region.name}
                  </label>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Secteurs */}
          <Collapsible open={sectionsOpen.industries} onOpenChange={() => toggleSection('industries')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-left font-semibold border-t border-border">
              <span>Secteurs ({selectedIndustries.length})</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${sectionsOpen.industries ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2 pb-4 max-h-[300px] overflow-y-auto">
              {QUEBEC_INDUSTRIES.map((ind) => (
                <div key={ind.value} className="flex items-center space-x-3">
                  <Checkbox
                    id={`mobile-industry-${ind.value}`}
                    checked={selectedIndustries.includes(ind.value)}
                    onCheckedChange={() => onIndustryToggle(ind.value)}
                    className="h-5 w-5"
                  />
                  <label
                    htmlFor={`mobile-industry-${ind.value}`}
                    className="text-sm font-medium cursor-pointer flex-1"
                  >
                    {ind.label}
                  </label>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Prix */}
          <Collapsible open={sectionsOpen.price} onOpenChange={() => toggleSection('price')}>
            <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-left font-semibold border-t border-border">
              <span>Fourchette de prix</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${sectionsOpen.price ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-2 pb-4">
              <div className={accentColor === 'blue' ? 'slider-blue' : ''}>
                <Slider
                  value={priceRange}
                  onValueChange={onPriceChange}
                  min={0}
                  max={10000000}
                  step={50000}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{formatPrice(priceRange[0])}</span>
                <span>{formatPrice(priceRange[1])}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Min</label>
                  <Input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => {
                      const value = Math.max(0, Math.min(Number(e.target.value), priceRange[1]));
                      onPriceChange([value, priceRange[1]]);
                    }}
                    className="h-12 text-base"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Max</label>
                  <Input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => {
                      const value = Math.min(10000000, Math.max(Number(e.target.value), priceRange[0]));
                      onPriceChange([priceRange[0], value]);
                    }}
                    className="h-12 text-base"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Actions sticky en bas */}
        <div className="sticky bottom-0 p-6 pt-4 bg-background border-t border-border space-y-3 safe-area-bottom">
          <Button 
            onClick={handleApply}
            size="lg" 
            className={`w-full h-14 text-base font-semibold ${
              accentColor === 'blue' 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-primary hover:bg-primary/90'
            }`}
          >
            Appliquer les filtres
          </Button>
          {activeFiltersCount > 0 && (
            <Button 
              onClick={onReset}
              variant="outline" 
              size="lg"
              className="w-full h-12 text-base"
            >
              Réinitialiser
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
