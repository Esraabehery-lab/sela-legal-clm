// Server-only helpers that read UI preferences (locale + demo persona) from
// cookies. Client-safe constants live in ./roles.

import { cookies } from "next/headers";
import type { Locale, Role } from "./types";
import { DEFAULT_LOCALE } from "./i18n";
import { LOCALE_COOKIE, ROLE_COOKIE, ROLE_LABELS } from "./roles";

export {
  LOCALE_COOKIE,
  ROLE_COOKIE,
  ROLE_LABELS,
  ALL_ROLES,
  actorName,
} from "./roles";

export function getLocale(): Locale {
  const v = cookies().get(LOCALE_COOKIE)?.value;
  return v === "ar" || v === "en" ? v : DEFAULT_LOCALE;
}

export function getRole(): Role {
  const v = cookies().get(ROLE_COOKIE)?.value as Role | undefined;
  return v && v in ROLE_LABELS ? v : "BUSINESS_USER";
}
