import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { MapPin, Briefcase, Building2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { quebecCities } from "@/lib/quebecCities";
import { QUEBEC_INDUSTRIES } from "@/lib/constants";

interface AutocompleteSearchProps {
  onSelect?: (item: SuggestionItem) => void;
}

interface SuggestionItem {
  type: 'city' | 'industry' | 'business';
  label: string;
  value?: string;
  slug?: string;
}

interface Suggestions {
  cities: SuggestionItem[];
  industries: SuggestionItem[];
  businesses: SuggestionItem[];
}

const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const highlightMatch = (text: string, query: string) => {
  if (!query) return text;
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark class="bg-primary/20 font-semibold rounded px-0.5">$1</mark>');
};

export const AutocompleteSearch = ({ onSelect }: AutocompleteSearchProps) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestions>({
    cities: [],
    industries: [],
    businesses: []
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const debouncedSearch = useMemo(
    () => debounce(async (searchQuery: string) => {
      if (searchQuery.length < 2) {
        setSuggestions({ cities: [], industries: [], businesses: [] });
        return;
      }
      
      setLoading(true);
      
      try {
        // Rechercher dans les villes
        const cities = quebecCities
          .filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
          .slice(0, 5)
          .map(c => ({ type: 'city' as const, label: c, icon: MapPin }));
        
        // Rechercher dans les secteurs
        const industries = QUEBEC_INDUSTRIES
          .filter(i => i.label.toLowerCase().includes(searchQuery.toLowerCase()))
          .slice(0, 5)
          .map(i => ({ type: 'industry' as const, label: i.label, value: i.value, icon: Briefcase }));
        
        // Rechercher dans les annonces
        const { data: businesses } = await supabase
          .from('businesses')
          .select('id, title, slug')
          .eq('status', 'active')
          .eq('approval_status', 'approved')
          .ilike('title', `%${searchQuery}%`)
          .limit(5);
        
        setSuggestions({
          cities: cities as SuggestionItem[],
          industries: industries as SuggestionItem[],
          businesses: businesses?.map(b => ({ 
            type: 'business' as const, 
            label: b.title, 
            slug: b.slug, 
            icon: Building2 
          })) || []
        });
      } catch (error) {
        console.error('Error searching:', error);
        setSuggestions({ cities: [], industries: [], businesses: [] });
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  const handleSelect = (item: SuggestionItem) => {
    if (item.type === 'business' && item.slug) {
      navigate(`/entreprise/${item.slug}`);
    } else if (onSelect) {
      onSelect(item);
    }
    setQuery("");
  };

  const totalSuggestions = suggestions.cities.length + suggestions.industries.length + suggestions.businesses.length;

  return (
    <div className="relative w-full">
      <Command className="rounded-lg border shadow-sm bg-background">
        <div className="relative">
          <CommandInput 
            placeholder="Rechercher une ville, un secteur ou une annonce..." 
            value={query}
            onValueChange={setQuery}
            className="h-12 text-base"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        {query.length >= 2 && (
          <CommandList className="max-h-[400px]">
            {!loading && totalSuggestions === 0 && (
              <CommandEmpty>Aucun résultat trouvé</CommandEmpty>
            )}
            
            {suggestions.cities.length > 0 && (
              <CommandGroup heading="📍 Villes">
                {suggestions.cities.map((item) => (
                  <CommandItem 
                    key={`city-${item.label}`} 
                    onSelect={() => handleSelect(item)}
                    className="cursor-pointer"
                  >
                    <MapPin className="mr-2 h-4 w-4 text-primary" />
                    <span 
                      dangerouslySetInnerHTML={{ __html: highlightMatch(item.label, query) }} 
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            
            {suggestions.industries.length > 0 && (
              <CommandGroup heading="🏢 Secteurs">
                {suggestions.industries.map((item) => (
                  <CommandItem 
                    key={`industry-${item.value}`} 
                    onSelect={() => handleSelect(item)}
                    className="cursor-pointer"
                  >
                    <Briefcase className="mr-2 h-4 w-4 text-primary" />
                    <span 
                      dangerouslySetInnerHTML={{ __html: highlightMatch(item.label, query) }} 
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            
            {suggestions.businesses.length > 0 && (
              <CommandGroup heading="📄 Annonces">
                {suggestions.businesses.map((item, idx) => (
                  <CommandItem 
                    key={`business-${item.slug || idx}`} 
                    onSelect={() => handleSelect(item)}
                    className="cursor-pointer"
                  >
                    <Building2 className="mr-2 h-4 w-4 text-primary" />
                    <span 
                      dangerouslySetInnerHTML={{ __html: highlightMatch(item.label, query) }} 
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        )}
      </Command>
    </div>
  );
};
