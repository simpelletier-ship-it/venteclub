import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";

interface AnimatedBadgeProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
  pulse?: boolean;
  glow?: boolean;
}

export const AnimatedBadge = ({
  children,
  className,
  variant = "default",
  pulse = false,
  glow = false,
}: AnimatedBadgeProps) => {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
      }}
      whileHover={{ scale: 1.1, rotate: 2 }}
      className="inline-block"
    >
      <Badge
        variant={variant}
        className={cn(
          "transition-all duration-300",
          pulse && "animate-pulse-glow",
          glow && "shadow-lg shadow-primary/50",
          className
        )}
      >
        {children}
      </Badge>
    </motion.div>
  );
};
