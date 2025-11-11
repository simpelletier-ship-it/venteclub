import { useState } from "react";
import { Palette, Type, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const COLOR_THEMES = [
  { value: 'default', label: 'Bleu par défaut', primary: '#6366f1', secondary: '#8b5cf6' },
  { value: 'green', label: 'Vert nature', primary: '#10b981', secondary: '#059669' },
  { value: 'orange', label: 'Orange énergique', primary: '#f97316', secondary: '#ea580c' },
  { value: 'pink', label: 'Rose moderne', primary: '#ec4899', secondary: '#d946ef' },
  { value: 'teal', label: 'Turquoise apaisant', primary: '#14b8a6', secondary: '#0d9488' },
  { value: 'purple', label: 'Violet royal', primary: '#a855f7', secondary: '#9333ea' },
];

const FONT_OPTIONS = [
  { value: 'inter', label: 'Inter (défaut)', class: 'font-sans' },
  { value: 'serif', label: 'Serif classique', class: 'font-serif' },
  { value: 'mono', label: 'Mono technique', class: 'font-mono' },
];

export const ThemeCustomizer = () => {
  const [selectedTheme, setSelectedTheme] = useState('default');
  const [selectedFont, setSelectedFont] = useState('inter');

  const applyTheme = (themeValue: string) => {
    const theme = COLOR_THEMES.find(t => t.value === themeValue);
    if (!theme) return;

    // Apply theme colors to CSS variables
    const root = document.documentElement;
    const primaryHsl = hexToHsl(theme.primary);
    const secondaryHsl = hexToHsl(theme.secondary);

    root.style.setProperty('--primary', primaryHsl);
    root.style.setProperty('--secondary', secondaryHsl);

    setSelectedTheme(themeValue);
    localStorage.setItem('budget-theme', themeValue);
    
    toast.success(`Thème "${theme.label}" appliqué! 🎨`, {
      duration: 3000,
      className: "animate-scale-in",
    });
  };

  const applyFont = (fontValue: string) => {
    const font = FONT_OPTIONS.find(f => f.value === fontValue);
    if (!font) return;

    // Remove all font classes from body
    document.body.classList.remove('font-sans', 'font-serif', 'font-mono');
    
    // Add selected font class
    document.body.classList.add(font.class.replace('font-', ''));

    setSelectedFont(fontValue);
    localStorage.setItem('budget-font', fontValue);
    
    toast.success(`Police "${font.label}" appliquée! ✨`, {
      duration: 3000,
      className: "animate-fade-in",
    });
  };

  // Helper function to convert hex to HSL
  const hexToHsl = (hex: string): string => {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Convert hex to RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          Personnalisation
        </h3>
        <p className="text-muted-foreground">Personnalisez l'apparence de votre planificateur</p>
      </div>

      <Tabs defaultValue="colors">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="colors">
            <Palette className="mr-2 h-4 w-4" />
            Couleurs
          </TabsTrigger>
          <TabsTrigger value="fonts">
            <Type className="mr-2 h-4 w-4" />
            Polices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Thème de couleurs</CardTitle>
              <CardDescription>Choisissez votre palette préférée</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {COLOR_THEMES.map(theme => (
                  <Button
                    key={theme.value}
                    variant={selectedTheme === theme.value ? "default" : "outline"}
                    className="h-auto p-4 flex items-center justify-between transition-all duration-300 hover:scale-105"
                    onClick={() => applyTheme(theme.value)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <div 
                          className="w-6 h-6 rounded-full border-2 border-white"
                          style={{ backgroundColor: theme.primary }}
                        />
                        <div 
                          className="w-6 h-6 rounded-full border-2 border-white"
                          style={{ backgroundColor: theme.secondary }}
                        />
                      </div>
                      <span>{theme.label}</span>
                    </div>
                    {selectedTheme === theme.value && (
                      <span className="text-xs">✓ Actif</span>
                    )}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fonts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Style de police</CardTitle>
              <CardDescription>Modifiez la typographie de l'interface</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {FONT_OPTIONS.map(font => (
                <Button
                  key={font.value}
                  variant={selectedFont === font.value ? "default" : "outline"}
                  className={`w-full h-auto p-4 flex items-center justify-between transition-all duration-300 hover:scale-105 ${font.class}`}
                  onClick={() => applyFont(font.value)}
                >
                  <div>
                    <div className="font-semibold text-lg">{font.label}</div>
                    <div className="text-sm text-muted-foreground">
                      Le planificateur de budget personnel
                    </div>
                  </div>
                  {selectedFont === font.value && (
                    <span className="text-xs">✓ Actif</span>
                  )}
                </Button>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-purple-500" />
            <div>
              <div className="font-semibold text-lg">Personnalisation sauvegardée</div>
              <div className="text-sm text-muted-foreground">
                Vos préférences sont enregistrées automatiquement dans votre navigateur
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};