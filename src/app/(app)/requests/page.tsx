import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { listRequests } from "@/lib/store";
import { getLocale } from "@/lib/prefs";
import { t, CATEGORY_LABELS, label } from "@/lib/i18n";
import { formatDate, formatMoney } from "@/lib/format";
import { Plus, Search } from "lucide-react";

export default function RequestsPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const locale = getLocale();
  const q = (searchParams.q ?? "").trim().toLowerCase();

  // US-019 — search by name, vendor, status, category
  const requests = listRequests().filter((r) => {
    if (!q) return true;
    const cat = r.classification
      ? CATEGORY_LABELS[r.classification.category].en.toLowerCase()
      : "";
    return [r.title, r.counterparty, r.status, r.reference, cat]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  return (
    <>
      <PageHeader
        title={t(locale, "Contract Requests", "طلبات العقود")}
        subtitle={t(
          locale,
          "Every DF request and its lifecycle status",
          "كل طلب عقد وحالته في دورة الحياة",
        )}
        actions={
          <Button asChild>
            <Link href="/requests/new">
              <Plus className="h-4 w-4" />
              {t(locale, "New Request", "طلب جديد")}
            </Link>
          </Button>
        }
      />

      <form className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
          <Input
            name="q"
            defaultValue={searchParams.q ?? ""}
            placeholder={t(
              locale,
              "Search by title, vendor, status…",
              "ابحث بالعنوان أو المورد أو الحالة…",
            )}
            className="ps-9"
          />
        </div>
      </form>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-line">
            {requests.length === 0 && (
              <div className="p-8 text-center text-sm text-ink-500">
                {t(locale, "No requests found.", "لا توجد طلبات.")}
              </div>
            )}
            {requests.map((r) => (
              <Link
                key={r.id}
                href={`/requests/${r.id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-surface-1"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium text-ink-50">
                      {r.title}
                    </span>
                    {r.classification && (
                      <span className="hidden text-xs text-ink-500 sm:inline">
                        · {label(CATEGORY_LABELS, r.classification.category, locale)}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-ink-500">
                    {r.reference} · {r.counterparty} ·{" "}
                    {formatDate(r.createdAt, locale)}
                    {r.estimatedValue
                      ? ` · ${formatMoney(r.estimatedValue, r.currency, locale)}`
                      : ""}
                  </div>
                </div>
                <StatusBadge status={r.status} locale={locale} />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
