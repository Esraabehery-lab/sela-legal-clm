"use client";

import * as React from "react";
import { Toaster } from "sonner";

/**
 * App-wide client providers. The CLM Phase-1 slice uses server actions +
 * an in-memory store rather than tRPC, so this only mounts the toaster.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster richColors position="top-right" />
    </>
  );
}
