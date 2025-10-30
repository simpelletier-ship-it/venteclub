import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { quebecCities } from "@/lib/quebecCities";

interface CityComboboxProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export function CityCombobox({ value, onChange, required = false }: CityComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Filtrer les villes basé sur la recherche
  const filteredCities = quebecCities.filter((city) =>
    city.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-background"
        >
          {value || "Sélectionnez ou tapez une ville..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-popover z-50" align="start">
        <Command className="bg-popover">
          <CommandInput 
            placeholder="Rechercher une ville..." 
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            {searchValue && !quebecCities.some(city => city.toLowerCase() === searchValue.toLowerCase()) && (
              <CommandGroup>
                <CommandItem
                  value={searchValue}
                  onSelect={() => {
                    onChange(searchValue);
                    setOpen(false);
                    setSearchValue("");
                  }}
                  className="cursor-pointer"
                >
                  <Check className={cn("mr-2 h-4 w-4", "opacity-0")} />
                  Utiliser "{searchValue}"
                </CommandItem>
              </CommandGroup>
            )}
            {filteredCities.length === 0 && searchValue && quebecCities.some(city => city.toLowerCase() === searchValue.toLowerCase()) ? (
              <CommandEmpty>Aucune ville trouvée.</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredCities.slice(0, 50).map((city) => (
                  <CommandItem
                    key={city}
                    value={city}
                    onSelect={(currentValue) => {
                      onChange(currentValue === value ? "" : currentValue);
                      setOpen(false);
                      setSearchValue("");
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value?.toLowerCase() === city.toLowerCase() ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {city}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
