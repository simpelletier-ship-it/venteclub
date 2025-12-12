import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 touch-manipulation active:scale-[0.98] select-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-light active:bg-primary-light",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80",
        outline: "border border-border bg-background hover:bg-muted active:bg-muted/80",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70",
        publish: "bg-primary text-primary-foreground hover:bg-primary-light active:bg-primary-light",
        success: "bg-success text-success-foreground hover:bg-success/90 active:bg-success/80",
        ghost: "hover:bg-muted active:bg-muted/80",
        link: "text-primary underline-offset-4 hover:underline",
        premium: "bg-primary text-primary-foreground hover:bg-primary-light active:bg-primary-light",
        gold: "bg-accent-gold text-foreground hover:bg-accent-gold/90 active:bg-accent-gold/80",
      },
      size: {
        default: "h-10 px-4 py-2 min-h-[44px]",
        sm: "h-9 rounded-md px-3 text-xs min-h-[40px]",
        lg: "h-11 rounded-md px-6 min-h-[48px]",
        icon: "h-10 w-10 min-h-[44px] min-w-[44px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
