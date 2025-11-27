import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:shadow-md hover:bg-primary/95 active:scale-[0.98]",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:shadow-md hover:bg-destructive/95 active:scale-[0.98]",
        outline: "border border-border bg-background hover:bg-muted/50 hover:border-primary/30 active:scale-[0.98]",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:shadow-md hover:bg-secondary/90 active:scale-[0.98]",
        publish: "bg-publish text-publish-foreground shadow-sm hover:shadow-md hover:bg-publish/95 active:scale-[0.98]",
        success: "bg-success text-success-foreground shadow-sm hover:shadow-md hover:bg-success/95 active:scale-[0.98]",
        ghost: "hover:bg-muted/50 active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
        premium: "bg-gradient-to-br from-primary to-primary-dark text-primary-foreground shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
        gold: "bg-gradient-to-br from-accent-gold to-accent-gold/80 text-foreground shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] font-bold",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 rounded-md px-4 text-xs",
        lg: "h-13 rounded-lg px-10 text-base",
        icon: "h-11 w-11",
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
