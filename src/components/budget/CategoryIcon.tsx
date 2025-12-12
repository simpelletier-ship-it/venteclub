import { 
  Utensils, Car, Home, Film, HeartPulse, Shirt, GraduationCap, UtensilsCrossed,
  ShoppingCart, Lightbulb, Shield, Smartphone, Wifi, Tv, Dumbbell, Gift,
  PawPrint, Sparkles, Plane, Box, Banknote, Briefcase, TrendingUp, Coins,
  Building, Building2, Undo, PartyPopper, Circle, type LucideIcon
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  // Expense categories
  'utensils': Utensils,
  'car': Car,
  'home': Home,
  'film': Film,
  'heart-pulse': HeartPulse,
  'shirt': Shirt,
  'graduation-cap': GraduationCap,
  'utensils-crossed': UtensilsCrossed,
  'shopping-cart': ShoppingCart,
  'lightbulb': Lightbulb,
  'shield': Shield,
  'smartphone': Smartphone,
  'wifi': Wifi,
  'tv': Tv,
  'dumbbell': Dumbbell,
  'gift': Gift,
  'paw-print': PawPrint,
  'sparkles': Sparkles,
  'plane': Plane,
  'box': Box,
  // Income categories
  'banknote': Banknote,
  'briefcase': Briefcase,
  'trending-up': TrendingUp,
  'coins': Coins,
  'building': Building,
  'building-2': Building2,
  'undo': Undo,
  'party-popper': PartyPopper,
};

interface CategoryIconProps {
  icon: string | null | undefined;
  color?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function CategoryIcon({ icon, color, className = '', size = 'md' }: CategoryIconProps) {
  const sizeClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  // If it's a Lucide icon key
  if (icon && ICON_MAP[icon]) {
    const IconComponent = ICON_MAP[icon];
    return (
      <IconComponent 
        className={`${sizeClasses[size]} ${className}`} 
        style={color ? { color } : undefined}
      />
    );
  }

  // If it's an emoji (fallback for existing data)
  if (icon && icon.length <= 4) {
    return <span className={`${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'} ${className}`}>{icon}</span>;
  }

  // Default fallback
  return <Circle className={`${sizeClasses[size]} ${className} text-muted-foreground`} />;
}

export { ICON_MAP };