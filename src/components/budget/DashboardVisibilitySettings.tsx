import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export interface VisibilityPreferences {
  showExpenseTrends: boolean;
  showExpensesByCategory: boolean;
  showNetWorthGamification: boolean;
  showQuickNetWorthUpdate: boolean;
  showReerCeli: boolean;
  showCoachIA: boolean;
  showFinancialGoals: boolean;
}

const DEFAULT_PREFERENCES: VisibilityPreferences = {
  showExpenseTrends: true,
  showExpensesByCategory: true,
  showNetWorthGamification: true,
  showQuickNetWorthUpdate: true,
  showReerCeli: true,
  showCoachIA: true,
  showFinancialGoals: true,
};

const STORAGE_KEY = 'budget-dashboard-visibility';

export const useDashboardVisibility = () => {
  const [preferences, setPreferences] = useState<VisibilityPreferences>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_PREFERENCES;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  return { preferences, setPreferences };
};

interface DashboardVisibilitySettingsProps {
  preferences: VisibilityPreferences;
  onChange: (preferences: VisibilityPreferences) => void;
}

export const DashboardVisibilitySettings = ({
  preferences,
  onChange,
}: DashboardVisibilitySettingsProps) => {
  const togglePreference = (key: keyof VisibilityPreferences) => {
    onChange({
      ...preferences,
      [key]: !preferences[key],
    });
  };

  const resetToDefaults = () => {
    onChange(DEFAULT_PREFERENCES);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Personnaliser l'affichage
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Vue compacte</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Masquez les sections que vous n'utilisez pas
            </p>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="expense-trends" className="text-sm cursor-pointer">
                📊 Tendances des dépenses
              </Label>
              <Switch
                id="expense-trends"
                checked={preferences.showExpenseTrends}
                onCheckedChange={() => togglePreference('showExpenseTrends')}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="expenses-category" className="text-sm cursor-pointer">
                📈 Dépenses par catégorie
              </Label>
              <Switch
                id="expenses-category"
                checked={preferences.showExpensesByCategory}
                onCheckedChange={() => togglePreference('showExpensesByCategory')}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="net-worth-game" className="text-sm cursor-pointer">
                🏆 Gamification valeur nette
              </Label>
              <Switch
                id="net-worth-game"
                checked={preferences.showNetWorthGamification}
                onCheckedChange={() => togglePreference('showNetWorthGamification')}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="quick-update" className="text-sm cursor-pointer">
                ⚡ Mise à jour rapide
              </Label>
              <Switch
                id="quick-update"
                checked={preferences.showQuickNetWorthUpdate}
                onCheckedChange={() => togglePreference('showQuickNetWorthUpdate')}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Label htmlFor="reer-celi" className="text-sm cursor-pointer">
                💰 REER & CELI
              </Label>
              <Switch
                id="reer-celi"
                checked={preferences.showReerCeli}
                onCheckedChange={() => togglePreference('showReerCeli')}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="coach-ia" className="text-sm cursor-pointer">
                🤖 Coach IA
              </Label>
              <Switch
                id="coach-ia"
                checked={preferences.showCoachIA}
                onCheckedChange={() => togglePreference('showCoachIA')}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <Label htmlFor="financial-goals" className="text-sm cursor-pointer">
                🎯 Objectifs d'épargne
              </Label>
              <Switch
                id="financial-goals"
                checked={preferences.showFinancialGoals}
                onCheckedChange={() => togglePreference('showFinancialGoals')}
              />
            </div>
          </div>

          <Separator />

          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefaults}
            className="w-full"
          >
            Réinitialiser par défaut
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
