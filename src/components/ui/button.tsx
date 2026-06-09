import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sela-yellow/50 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-sela-yellow text-canvas font-semibold shadow-soft hover:bg-sela-yellow-bright active:translate-y-px",
        mint:
          "bg-sela-mint text-canvas font-semibold shadow-soft hover:bg-sela-mint/90 active:translate-y-px",
        destructive:
          "bg-red-600 text-white shadow-soft hover:bg-red-700 active:translate-y-px",
        outline:
          "border border-line bg-surface text-ink-50 shadow-soft hover:bg-surface-2 hover:border-line-strong",
        secondary: "bg-surface-2 text-ink-50 hover:bg-surface-3",
        ghost: "text-ink-300 hover:bg-surface-2 hover:text-ink-50",
        link: "text-sela-yellow underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-[13px]",
        lg: "h-11 rounded-lg px-6 text-[15px]",
        // WCAG 2.5.5 — 44×44 minimum touch target
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
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
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
