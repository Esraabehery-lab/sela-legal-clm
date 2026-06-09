import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "border-transparent bg-surface-2 text-ink-200",
        yellow: "border-sela-yellow/30 bg-sela-yellow/10 text-sela-yellow",
        mint: "border-sela-mint/30 bg-sela-mint/10 text-sela-mint",
        red: "border-red-500/30 bg-red-500/10 text-red-400",
        amber: "border-amber-500/30 bg-amber-500/10 text-amber-400",
        outline: "border-line text-ink-300",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
