"use client";

import * as React from "react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { setLocale, setRole } from "@/lib/actions";
import { ROLE_LABELS, ALL_ROLES } from "@/lib/roles";
import { t } from "@/lib/i18n";
import type { Locale, Role } from "@/lib/types";
import { Languages } from "lucide-react";

export function Topbar({ locale, role }: { locale: Locale; role: Role }) {
  const [pending, startTransition] = React.useTransition();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-line bg-canvas/80 px-4 backdrop-blur md:px-6">
      <div className="text-sm text-ink-400">
        {t(locale, "Contract Lifecycle Management", "إدارة دورة حياة العقود")}
      </div>

      <div className="flex items-center gap-2">
        {/* Demo persona switcher (drives the audit actor + approval permissions) */}
        <Select
          aria-label={t(locale, "Active role", "الدور الحالي")}
          value={role}
          disabled={pending}
          onChange={(e) =>
            startTransition(() => setRole(e.target.value as Role))
          }
          className="h-9 w-[190px] text-[13px]"
        >
          {ALL_ROLES.map((r) => (
            <option key={r} value={r}>
              {t(locale, ROLE_LABELS[r].en, ROLE_LABELS[r].ar)}
            </option>
          ))}
        </Select>

        {/* Bilingual toggle (US-021 / US-022) */}
        <div className="flex items-center rounded-lg border border-line bg-surface p-0.5">
          <Languages className="mx-1.5 h-4 w-4 text-ink-400" />
          {(["en", "ar"] as Locale[]).map((l) => (
            <Button
              key={l}
              size="sm"
              variant={locale === l ? "default" : "ghost"}
              disabled={pending}
              onClick={() => startTransition(() => setLocale(l))}
              className="h-7 px-2.5 text-xs"
            >
              {l === "en" ? "EN" : "ع"}
            </Button>
          ))}
        </div>
      </div>
    </header>
  );
}
