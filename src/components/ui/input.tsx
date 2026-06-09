import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-lg border border-line bg-surface px-3.5 py-2 text-sm text-ink-50 shadow-soft transition-colors",
        "placeholder:text-ink-500",
        "focus-visible:outline-none focus-visible:border-sela-yellow focus-visible:ring-2 focus-visible:ring-sela-yellow/20 focus-visible:bg-surface-1",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-2",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-ink-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
