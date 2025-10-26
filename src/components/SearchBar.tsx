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
              placeholder="Search businesses by name, industry..."
              className="pl-10 h-12 bg-background border-border"
            />
          </div>
        </div>
        
        <Select>
          <SelectTrigger className="w-full md:w-[200px] h-12 bg-background border-border">
            <SelectValue placeholder="Industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="technology">Technology</SelectItem>
            <SelectItem value="retail">Retail</SelectItem>
            <SelectItem value="hospitality">Hospitality</SelectItem>
            <SelectItem value="manufacturing">Manufacturing</SelectItem>
            <SelectItem value="services">Services</SelectItem>
            <SelectItem value="ecommerce">E-commerce</SelectItem>
          </SelectContent>
        </Select>

        <Select>
          <SelectTrigger className="w-full md:w-[200px] h-12 bg-background border-border">
            <SelectValue placeholder="Price Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0-100k">Under $100K</SelectItem>
            <SelectItem value="100k-500k">$100K - $500K</SelectItem>
            <SelectItem value="500k-1m">$500K - $1M</SelectItem>
            <SelectItem value="1m-5m">$1M - $5M</SelectItem>
            <SelectItem value="5m+">$5M+</SelectItem>
          </SelectContent>
        </Select>

        <Button className="h-12 px-8 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">
          Search
        </Button>
      </div>
    </div>
  );
};

export default SearchBar;