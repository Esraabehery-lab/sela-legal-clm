// Client-safe role constants (no server-only imports). Kept separate from
// prefs.ts so client components can import labels without pulling next/headers.

import type { Role } from "./types";

export const LOCALE_COOKIE = "sela_locale";
export const ROLE_COOKIE = "sela_role";

export const ROLE_LABELS: Record<Role, { en: string; ar: string }> = {
  BUSINESS_USER: { en: "Business User", ar: "مستخدم الأعمال" },
  LEGAL_OPS: { en: "Legal Operations", ar: "العمليات القانونية" },
  PROCUREMENT: { en: "Procurement Reviewer", ar: "مراجع المشتريات" },
  FINANCE: { en: "Finance Reviewer", ar: "مراجع المالية" },
  LEGAL: { en: "Legal Reviewer", ar: "مراجع قانوني" },
  CONTRACT_OWNER: { en: "Contract Owner", ar: "مالك العقد" },
  AUDITOR: { en: "Auditor", ar: "مدقق" },
};

export const ALL_ROLES = Object.keys(ROLE_LABELS) as Role[];

export function actorName(role: Role, locale: "en" | "ar"): string {
  return locale === "ar" ? ROLE_LABELS[role].ar : ROLE_LABELS[role].en;
}
