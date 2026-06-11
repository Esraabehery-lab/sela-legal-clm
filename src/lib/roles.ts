// Client-safe role constants (no server-only imports). Kept separate from
// prefs.ts so client components can import labels without pulling next/headers.

import type { Role } from "./types";

export const LOCALE_COOKIE = "sela_locale";
export const ROLE_COOKIE = "sela_role";

export const ROLE_LABELS: Record<Role, { en: string; ar: string }> = {
  BUSINESS_USER: { en: "Business User", ar: "مستخدم الأعمال" },
  HEAD_OF_BU: { en: "Head of Business Unit", ar: "رئيس وحدة الأعمال" },
  CSCCO: { en: "CSCCO", ar: "الرئيس التنفيذي للسلسلة والتجارة" },
  CFO: { en: "CFO", ar: "الرئيس المالي" },
  LEGAL: { en: "Legal Reviewer", ar: "مراجع قانوني" },
  LEGAL_OPS: { en: "Legal Operations", ar: "العمليات القانونية" },
  CONTRACT_OWNER: { en: "Contract Owner", ar: "مالك العقد" },
  AUDITOR: { en: "Auditor", ar: "مدقق" },
};

export const ALL_ROLES = Object.keys(ROLE_LABELS) as Role[];

export function actorName(role: Role, locale: "en" | "ar"): string {
  return locale === "ar" ? ROLE_LABELS[role].ar : ROLE_LABELS[role].en;
}
