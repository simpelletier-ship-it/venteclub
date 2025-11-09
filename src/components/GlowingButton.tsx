import { ReactNode, forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlowingButtonProps extends Omit<HTMLMotionProps<"button">, 'children'> {
  children: ReactNode;
  glowColor?: string;
  variant?: "primary" | "secondary" | "accent";
}

export const GlowingButton = forwardRef<HTMLButtonElement, GlowingButtonProps>(({
  children,
  className,
  glowColor,
  variant = "primary",
  ...props
}, ref) => {
  const variantClasses = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
    accent: "bg-accent text-accent-foreground hover:bg-accent/90",
  };

  const glowColors = {
    primary: "shadow-primary/50",
    secondary: "shadow-secondary/50",
    accent: "shadow-accent/50",
  };

  return (
    <motion.button
      ref={ref}
      className={cn(
        "relative px-6 py-3 rounded-lg font-semibold transition-all duration-300",
        "shadow-lg hover:shadow-xl",
        variantClasses[variant],
        glowColors[variant],
        "overflow-hidden group",
        className
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: "-100%" }}
        whileHover={{ x: "100%" }}
        transition={{ duration: 0.6 }}
      />
      
      {/* Pulse glow on hover */}
      <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse-glow" />
      
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
});

GlowingButton.displayName = "GlowingButton";
