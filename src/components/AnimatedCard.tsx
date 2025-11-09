import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
  glow?: boolean;
}

export const AnimatedCard = ({
  children,
  className,
  delay = 0,
  hover = true,
  glow = false,
}: AnimatedCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={hover ? { y: -8, scale: 1.02 } : undefined}
      className={cn(
        "relative group transition-all duration-300",
        glow && "hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)]",
        className
      )}
    >
      {glow && (
        <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/20 to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
      )}
      <div className="relative">{children}</div>
    </motion.div>
  );
};
