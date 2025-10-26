import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SearchBar = () => {
  return (
    <div className="w-full max-w-4xl mx-auto bg-card rounded-2xl shadow-[var(--shadow-card)] p-6 border border-border">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="Rechercher par nom, secteur d'activité..."
              className="pl-10 h-12 bg-background border-border"
            />
          </div>
        </div>
        
        <Select>
          <SelectTrigger className="w-full md:w-[200px] h-12 bg-background border-border">
            <SelectValue placeholder="Secteur" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="technology">Technologie</SelectItem>
            <SelectItem value="retail">Commerce</SelectItem>
            <SelectItem value="hospitality">Restauration</SelectItem>
            <SelectItem value="manufacturing">Industrie</SelectItem>
            <SelectItem value="services">Services</SelectItem>
            <SelectItem value="ecommerce">E-commerce</SelectItem>
          </SelectContent>
        </Select>

        <Select>
          <SelectTrigger className="w-full md:w-[200px] h-12 bg-background border-border">
            <SelectValue placeholder="Prix" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0-100k">Moins de 100K€</SelectItem>
            <SelectItem value="100k-500k">100K€ - 500K€</SelectItem>
            <SelectItem value="500k-1m">500K€ - 1M€</SelectItem>
            <SelectItem value="1m-5m">1M€ - 5M€</SelectItem>
            <SelectItem value="5m+">Plus de 5M€</SelectItem>
          </SelectContent>
        </Select>

        <Button className="h-12 px-8 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">
          Rechercher
        </Button>
      </div>
    </div>
  );
};

export default SearchBar;