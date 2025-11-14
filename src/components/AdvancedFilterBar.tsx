import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QUEBEC_INDUSTRIES, LISTING_TYPES } from "@/lib/constants";
import { QUEBEC_REGIONS, getCitiesFromRegions } from "@/lib/quebecRegions";
import { formatPrice } from "@/lib/priceFormat";
import { ChevronDown, X, Save, Bell, TrendingUp, Building2, DollarSign, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdvancedFilters {
  regions?: string[];
  cities?: string[];
  industries?: string[];
  listingTypes?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRevenue?: number;
  maxRevenue?: number;
  minBaiia?: number;
  maxBaiia?: number;
  minYear?: number;
  maxYear?: number;
  featured?: boolean;
  franchise?: boolean;
}

interface AdvancedFilterBarProps {
  onFilter?: (filters: AdvancedFilters) => void;
  onSaveSearch?: (filters: AdvancedFilters, name: string) => void;
  onCreateAlert?: (filters: AdvancedFilters) => void;
}

export const AdvancedFilterBar = ({ onFilter, onSaveSearch, onCreateAlert }: AdvancedFilterBarProps) => {
  const { toast } = useToast();
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedListingTypes, setSelectedListingTypes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<number[]>([0, 10000000]);
  const [revenueRange, setRevenueRange] = useState<number[]>([0, 5000000]);
  const [baiiaRange, setBaiiaRange] = useState<number[]>([0, 1000000]);
  const [yearRange, setYearRange] = useState<number[]>([1950, 2024]);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [franchiseOnly, setFranchiseOnly] = useState(false);
  const [searchName, setSearchName] = useState("");

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

  const getActiveFilters = (): AdvancedFilters => {
    const cities = selectedRegions.length > 0 ? getCitiesFromRegions(selectedRegions) : undefined;
    return {
      regions: selectedRegions.length > 0 ? selectedRegions : undefined,
      cities,
      industries: selectedIndustries.length > 0 ? selectedIndustries : undefined,
      listingTypes: selectedListingTypes.length > 0 ? selectedListingTypes : undefined,
      minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
      maxPrice: priceRange[1] < 10000000 ? priceRange[1] : undefined,
      minRevenue: revenueRange[0] > 0 ? revenueRange[0] : undefined,
      maxRevenue: revenueRange[1] < 5000000 ? revenueRange[1] : undefined,
      minBaiia: baiiaRange[0] > 0 ? baiiaRange[0] : undefined,
      maxBaiia: baiiaRange[1] < 1000000 ? baiiaRange[1] : undefined,
      minYear: yearRange[0] > 1950 ? yearRange[0] : undefined,
      maxYear: yearRange[1] < 2024 ? yearRange[1] : undefined,
      featured: featuredOnly || undefined,
      franchise: franchiseOnly || undefined,
    };
  };

  const handleFilter = () => {
    if (onFilter) {
      onFilter(getActiveFilters());
    }
  };

  const handleSaveSearch = () => {
    if (!searchName.trim()) {
      toast({
        title: "Nom requis",
        description: "Veuillez entrer un nom pour cette recherche",
        variant: "destructive",
      });
      return;
    }
    if (onSaveSearch) {
      onSaveSearch(getActiveFilters(), searchName);
      toast({
        title: "Recherche sauvegardée",
        description: `"${searchName}" a été sauvegardée avec succès`,
      });
      setSearchName("");
    }
  };

  const handleCreateAlert = () => {
    if (onCreateAlert) {
      onCreateAlert(getActiveFilters());
      toast({
        title: "Alerte créée",
        description: "Vous recevrez des notifications pour les nouvelles annonces correspondantes",
      });
    }
  };

  const handleReset = () => {
    setSelectedRegions([]);
    setSelectedIndustries([]);
    setSelectedListingTypes([]);
    setPriceRange([0, 10000000]);
    setRevenueRange([0, 5000000]);
    setBaiiaRange([0, 1000000]);
    setYearRange([1950, 2024]);
    setFeaturedOnly(false);
    setFranchiseOnly(false);
    if (onFilter) {
      onFilter({});
    }
  };

  const activeFilterCount = [
    selectedRegions.length > 0,
    selectedIndustries.length > 0,
    selectedListingTypes.length > 0,
    priceRange[0] > 0 || priceRange[1] < 10000000,
    revenueRange[0] > 0 || revenueRange[1] < 5000000,
    baiiaRange[0] > 0 || baiiaRange[1] < 1000000,
    yearRange[0] > 1950 || yearRange[1] < 2024,
    featuredOnly,
    franchiseOnly,
  ].filter(Boolean).length;

  return (
    <div className="bg-card border rounded-lg p-4 space-y-4">
      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-2">
          <Switch
            checked={featuredOnly}
            onCheckedChange={setFeaturedOnly}
            id="featured"
          />
          <Label htmlFor="featured" className="cursor-pointer">En vedette</Label>
        </div>
        
        <div className="flex items-center gap-2">
          <Switch
            checked={franchiseOnly}
            onCheckedChange={setFranchiseOnly}
            id="franchise"
          />
          <Label htmlFor="franchise" className="cursor-pointer">Franchises uniquement</Label>
        </div>
      </div>

      {/* Main Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Regions */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              Régions
              {selectedRegions.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {selectedRegions.length}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 max-h-96 overflow-auto">
            <div className="space-y-2">
              {QUEBEC_REGIONS.map((region) => (
                <div key={region.code} className="flex items-center space-x-2">
                  <Checkbox
                    id={region.code}
                    checked={selectedRegions.includes(region.code)}
                    onCheckedChange={() => toggleRegion(region.code)}
                  />
                  <label htmlFor={region.code} className="text-sm cursor-pointer flex-1">
                    {region.name}
                  </label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Industries */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              Industries
              {selectedIndustries.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {selectedIndustries.length}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 max-h-96 overflow-auto">
            <div className="space-y-2">
              {QUEBEC_INDUSTRIES.map((industry) => (
                <div key={industry.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={industry.value}
                    checked={selectedIndustries.includes(industry.value)}
                    onCheckedChange={() => toggleIndustry(industry.value)}
                  />
                  <label htmlFor={industry.value} className="text-sm cursor-pointer flex-1">
                    {industry.label}
                  </label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Price Range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Prix
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <Label>Prix demandé</Label>
              <Slider
                value={priceRange}
                onValueChange={setPriceRange}
                max={10000000}
                step={50000}
                className="w-full"
              />
              <div className="flex justify-between text-sm">
                <span>{formatPrice(priceRange[0])}</span>
                <span>{formatPrice(priceRange[1])}</span>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Revenue Range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Revenus
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <Label>Revenus annuels</Label>
              <Slider
                value={revenueRange}
                onValueChange={setRevenueRange}
                max={5000000}
                step={50000}
                className="w-full"
              />
              <div className="flex justify-between text-sm">
                <span>{formatPrice(revenueRange[0])}</span>
                <span>{formatPrice(revenueRange[1])}</span>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* BAIIA Range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Building2 className="h-4 w-4" />
              BAIIA
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <Label>BAIIA</Label>
              <Slider
                value={baiiaRange}
                onValueChange={setBaiiaRange}
                max={1000000}
                step={10000}
                className="w-full"
              />
              <div className="flex justify-between text-sm">
                <span>{formatPrice(baiiaRange[0])}</span>
                <span>{formatPrice(baiiaRange[1])}</span>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Year Range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Calendar className="h-4 w-4" />
              Année
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <Label>Année de fondation</Label>
              <Slider
                value={yearRange}
                onValueChange={setYearRange}
                min={1950}
                max={2024}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-sm">
                <span>{yearRange[0]}</span>
                <span>{yearRange[1]}</span>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 items-center justify-between pt-2 border-t">
        <div className="flex gap-2">
          <Button onClick={handleFilter} className="gap-2">
            Appliquer les filtres
            {activeFilterCount > 0 && (
              <Badge variant="secondary">{activeFilterCount}</Badge>
            )}
          </Button>
          {activeFilterCount > 0 && (
            <Button variant="outline" onClick={handleReset}>
              Réinitialiser
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Save className="h-4 w-4" />
                Sauvegarder
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="search-name">Nom de la recherche</Label>
                  <Input
                    id="search-name"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    placeholder="Ex: Restaurants à Montréal"
                  />
                </div>
                <Button onClick={handleSaveSearch} className="w-full">
                  Sauvegarder
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="outline" size="sm" className="gap-2" onClick={handleCreateAlert}>
            <Bell className="h-4 w-4" />
            Créer une alerte
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          {selectedRegions.map((code) => {
            const region = QUEBEC_REGIONS.find(r => r.code === code);
            return (
              <Badge key={code} variant="secondary" className="gap-1">
                {region?.name}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => toggleRegion(code)}
                />
              </Badge>
            );
          })}
          {selectedIndustries.map((industry) => {
            const ind = QUEBEC_INDUSTRIES.find(i => i.value === industry);
            return (
              <Badge key={industry} variant="secondary" className="gap-1">
                {ind?.label}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => toggleIndustry(industry)}
                />
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
};
