import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  city?: string;
  placeholder?: string;
  required?: boolean;
}

interface AddressSuggestion {
  place_name: string;
  text: string;
  center: [number, number];
}

export const AddressAutocomplete = ({
  value,
  onChange,
  city = "",
  placeholder = "Ex: 123 rue Principale",
  required = false,
}: AddressAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const debounceTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      // Construct search query with city context
      const searchQuery = city ? `${query}, ${city}, Quebec, Canada` : `${query}, Quebec, Canada`;
      
      const { data, error } = await supabase.functions.invoke('geocode-address', {
        body: { 
          query: searchQuery,
          limit: 5
        }
      });

      if (error) throw error;

      if (data?.features && Array.isArray(data.features)) {
        setSuggestions(data.features.map((feature: any) => ({
          place_name: feature.place_name,
          text: feature.text,
          center: feature.center,
        })));
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer for debounced search
    debounceTimer.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    setInputValue(suggestion.place_name);
    onChange(suggestion.place_name);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            // Delay hiding to allow click on suggestion
            setTimeout(() => setShowSuggestions(false), 200);
          }}
          placeholder={placeholder}
          required={required}
          className="pr-8"
        />
        {isLoading && (
          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg">
          <Command>
            <CommandList>
              <CommandEmpty>Aucune adresse trouvée</CommandEmpty>
              <CommandGroup>
                {suggestions.map((suggestion, index) => (
                  <CommandItem
                    key={index}
                    value={suggestion.place_name}
                    onSelect={() => handleSelectSuggestion(suggestion)}
                    className="cursor-pointer"
                  >
                    <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{suggestion.place_name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  );
};
