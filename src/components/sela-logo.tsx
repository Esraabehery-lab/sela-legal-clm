import { cn } from "@/lib/utils";

/**
 * SELA wordmark for the Legal CLM portal. Uses the inline SVG asset so the
 * project carries no binary image dependencies.
 */
export function SelaLogo({
  withTagline = true,
  className,
}: {
  size?: "default" | "lg";
  withTagline?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.svg"
        alt="SELA"
        width={110}
        height={36}
        className="h-9 w-auto select-none"
      />
      {withTagline && (
        <span className="hidden flex-col border-s border-ink-700 ps-3 text-[8px] font-bold leading-tight tracking-[0.18em] text-ink-400 sm:flex">
          <span>SPECTACULAR.</span>
          <span>EVERYDAY.</span>
        </span>
      )}
    </div>
  );
}
