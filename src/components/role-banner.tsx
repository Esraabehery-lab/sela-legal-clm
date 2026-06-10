import { ROLE_LABELS } from "@/lib/roles";
import { RESPONSIBILITIES } from "@/lib/permissions";
import { t } from "@/lib/i18n";
import type { Locale, Role } from "@/lib/types";
import { UserCircle } from "lucide-react";

/** Always-visible reminder of the active persona and what it may do. */
export function RoleBanner({ role, locale }: { role: Role; locale: Locale }) {
  return (
    <div className="flex items-start gap-2.5 border-b border-line bg-surface-1 px-4 py-2.5 text-xs md:px-8">
      <UserCircle className="mt-0.5 h-4 w-4 shrink-0 text-sela-yellow" />
      <p className="text-ink-300">
        <span className="font-semibold text-ink-100">
          {t(locale, "Acting as", "تعمل كـ")}:{" "}
          {t(locale, ROLE_LABELS[role].en, ROLE_LABELS[role].ar)}
        </span>
        <span className="mx-1.5 text-ink-600">—</span>
        {t(locale, RESPONSIBILITIES[role].en, RESPONSIBILITIES[role].ar)}
      </p>
    </div>
  );
}
