"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SelaLogo } from "@/components/sela-logo";
import { UI, t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import {
  LayoutDashboard,
  FileText,
  FileSignature,
  ListChecks,
  History,
  Plus,
} from "lucide-react";

export function AppSidebar({ locale }: { locale: Locale }) {
  const pathname = usePathname();

  const items = [
    { href: "/dashboard", label: UI.dashboard, icon: LayoutDashboard },
    { href: "/requests", label: UI.requests, icon: FileText },
    { href: "/contracts", label: UI.contracts, icon: FileSignature },
    { href: "/obligations", label: UI.obligations, icon: ListChecks },
    { href: "/audit", label: UI.audit, icon: History },
  ];

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-e border-line bg-surface md:flex">
      <div className="flex h-16 items-center border-b border-line px-5">
        <SelaLogo size="default" withTagline={false} />
      </div>

      <div className="px-3 py-4">
        <Link
          href="/requests/new"
          className="flex h-10 items-center justify-center gap-2 rounded-lg bg-sela-yellow px-4 text-sm font-semibold text-canvas shadow-soft transition-colors hover:bg-sela-yellow-bright"
        >
          <Plus className="h-4 w-4" />
          {t(locale, UI.newRequest.en, UI.newRequest.ar)}
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {items.map((it) => {
          const active =
            pathname === it.href || pathname.startsWith(it.href + "/");
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-surface-2 font-medium text-ink-50"
                  : "text-ink-400 hover:bg-surface-2 hover:text-ink-100",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {t(locale, it.label.en, it.label.ar)}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line p-4 text-[11px] text-ink-500">
        {t(locale, "SELA CLM · Phase 1", "سيلا · المرحلة الأولى")}
      </div>
    </aside>
  );
}
