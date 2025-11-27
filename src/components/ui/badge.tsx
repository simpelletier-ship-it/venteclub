import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow-sm hover:shadow-md hover:scale-105",
        secondary: "border-transparent bg-secondary text-secondary-foreground shadow-sm hover:shadow-md hover:scale-105",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow-sm hover:shadow-md hover:scale-105",
        outline: "text-foreground border-border hover:bg-muted/50",
        success: "border-transparent bg-success text-success-foreground shadow-sm hover:shadow-md hover:scale-105",
        gold: "border-transparent bg-accent-gold text-foreground shadow-sm hover:shadow-md hover:scale-105 font-bold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
