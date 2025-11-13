import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Settings, Layers } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface VisibilityPreferences {
  showExpenseTrends: boolean;
  showExpensesByCategory: boolean;
  showNetWorthGamification: boolean;
  showQuickNetWorthUpdate: boolean;
  showReerCeli: boolean;
  showCoachIA: boolean;
  showFinancialGoals: boolean;
  widgetOrder: string[];
}

export type ViewProfile = 'complete' | 'minimal' | 'savings' | 'debts' | 'custom';

const DEFAULT_WIDGET_ORDER = [
  'expenseTrends',
  'expensesByCategory',
  'monthComparison',
  'netWorthGamification',
  'quickNetWorthUpdate',
  'coachIA',
  'financialGoals',
];

const DEFAULT_PREFERENCES: VisibilityPreferences = {
  showExpenseTrends: true,
  showExpensesByCategory: true,
  showNetWorthGamification: true,
  showQuickNetWorthUpdate: true,
  showReerCeli: false,
  showCoachIA: true,
  showFinancialGoals: true,
  widgetOrder: DEFAULT_WIDGET_ORDER,
};

// Profils de vue prédéfinis
const VIEW_PROFILES: Record<ViewProfile, VisibilityPreferences> = {
  complete: {
    showExpenseTrends: true,
    showExpensesByCategory: true,
    showNetWorthGamification: true,
    showQuickNetWorthUpdate: true,
    showReerCeli: false,
    showCoachIA: true,
    showFinancialGoals: true,
    widgetOrder: DEFAULT_WIDGET_ORDER,
  },
  minimal: {
    showExpenseTrends: true,
    showExpensesByCategory: true,
    showNetWorthGamification: false,
    showQuickNetWorthUpdate: true,
    showReerCeli: false,
    showCoachIA: false,
    showFinancialGoals: false,
    widgetOrder: DEFAULT_WIDGET_ORDER,
  },
  savings: {
    showExpenseTrends: false,
    showExpensesByCategory: false,
    showNetWorthGamification: true,
    showQuickNetWorthUpdate: true,
    showReerCeli: false,
    showCoachIA: true,
    showFinancialGoals: true,
    widgetOrder: DEFAULT_WIDGET_ORDER,
  },
  debts: {
    showExpenseTrends: true,
    showExpensesByCategory: true,
    showNetWorthGamification: true,
    showQuickNetWorthUpdate: false,
    showReerCeli: false,
    showCoachIA: true,
    showFinancialGoals: false,
    widgetOrder: DEFAULT_WIDGET_ORDER,
  },
  custom: DEFAULT_PREFERENCES,
};

const STORAGE_KEY = 'budget-dashboard-visibility';
const PROFILE_KEY = 'budget-dashboard-profile';

export const useDashboardVisibility = () => {
  const [currentProfile, setCurrentProfile] = useState<ViewProfile>(() => {
    const stored = localStorage.getItem(PROFILE_KEY);
    return (stored as ViewProfile) || 'complete';
  });

  const [preferences, setPreferences] = useState<VisibilityPreferences>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure widgetOrder exists
      if (!parsed.widgetOrder) {
        parsed.widgetOrder = DEFAULT_WIDGET_ORDER;
      }
      return parsed;
    }
    return DEFAULT_PREFERENCES;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    localStorage.setItem(PROFILE_KEY, currentProfile);
  }, [currentProfile]);

  const applyProfile = (profile: ViewProfile) => {
    setCurrentProfile(profile);
    setPreferences(VIEW_PROFILES[profile]);
  };

  return { preferences, setPreferences, currentProfile, applyProfile };
};

interface DashboardVisibilitySettingsProps {
  preferences: VisibilityPreferences;
  onChange: (preferences: VisibilityPreferences) => void;
  currentProfile: ViewProfile;
  onProfileChange: (profile: ViewProfile) => void;
}

export const DashboardVisibilitySettings = ({
  preferences,
  onChange,
  currentProfile,
  onProfileChange,
}: DashboardVisibilitySettingsProps) => {
  const { toast } = useToast();

  const togglePreference = (key: keyof VisibilityPreferences) => {
    onChange({
      ...preferences,
      [key]: !preferences[key],
    });
    // Switch to custom profile when manually changing preferences
    if (currentProfile !== 'custom') {
      onProfileChange('custom');
    }
  };

  const resetToDefaults = () => {
    onChange(DEFAULT_PREFERENCES);
    onProfileChange('complete');
    toast({
      title: "✅ Réinitialisation réussie",
      description: "Les préférences ont été restaurées par défaut",
    });
  };

  const handleProfileChange = (profile: ViewProfile) => {
    onProfileChange(profile);
    onChange(VIEW_PROFILES[profile]);
    const profileNames = {
      complete: 'Vue complète',
      minimal: 'Vue minimaliste',
      savings: 'Focus épargne',
      debts: 'Focus dettes',
      custom: 'Vue personnalisée',
    };
    toast({
      title: `📋 ${profileNames[profile]}`,
      description: "Profil de vue appliqué avec succès",
    });
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
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Profils de vue
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              Choisissez un profil prédéfini ou personnalisez
            </p>
            
            <Select value={currentProfile} onValueChange={handleProfileChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="complete">
                  <span className="flex items-center gap-2">
                    <span>📊</span> Vue complète
                  </span>
                </SelectItem>
                <SelectItem value="minimal">
                  <span className="flex items-center gap-2">
                    <span>⚡</span> Vue minimaliste
                  </span>
                </SelectItem>
                <SelectItem value="savings">
                  <span className="flex items-center gap-2">
                    <span>💰</span> Focus épargne
                  </span>
                </SelectItem>
                <SelectItem value="debts">
                  <span className="flex items-center gap-2">
                    <span>📉</span> Focus dettes
                  </span>
                </SelectItem>
                <SelectItem value="custom">
                  <span className="flex items-center gap-2">
                    <span>🎨</span> Vue personnalisée
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />
          
          <div>
            <h4 className="font-semibold mb-3 text-sm">Personnaliser les sections</h4>
          </div>

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
