import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { listRequests } from "@/lib/store";
import { getLocale } from "@/lib/prefs";
import { t, CATEGORY_LABELS, label } from "@/lib/i18n";
import { formatDate, formatMoney } from "@/lib/format";
import { FileSignature } from "lucide-react";

export default function ContractsPage() {
  const locale = getLocale();

  // "Contracts" = requests that have reached signature / execution.
  const contracts = listRequests().filter(
    (r) => r.status === "SIGNED" || r.status === "ACTIVE",
  );

  return (
    <>
      <PageHeader
        title={t(locale, "Contracts", "العقود")}
        subtitle={t(
          locale,
          "Signed and active contracts under execution monitoring",
          "العقود الموقّعة والسارية تحت المتابعة",
        )}
      />

      {contracts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-ink-500">
            {t(locale, "No signed contracts yet.", "لا توجد عقود موقّعة بعد.")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {contracts.map((r) => (
            <Link key={r.id} href={`/requests/${r.id}`}>
              <Card className="h-full transition-colors hover:bg-surface-1">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="rounded-lg bg-surface-2 p-2">
                      <FileSignature className="h-5 w-5 text-sela-mint" />
                    </div>
                    <StatusBadge status={r.status} locale={locale} />
                  </div>
                  <h3 className="mt-3 font-medium text-ink-50">{r.title}</h3>
                  <p className="mt-1 text-xs text-ink-500">
                    {r.reference} · {r.counterparty}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    {r.classification && (
                      <Badge variant="outline">
                        {label(CATEGORY_LABELS, r.classification.category, locale)}
                      </Badge>
                    )}
                    {r.signedAt && (
                      <span className="text-ink-500">
                        {t(locale, "Signed", "وُقّع")}{" "}
                        {formatDate(r.signedAt, locale)}
                      </span>
                    )}
                    {r.estimatedValue && (
                      <span className="text-ink-300">
                        {formatMoney(r.estimatedValue, r.currency, locale)}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 text-xs text-ink-500">
                    {t(locale, "Obligations", "الالتزامات")}:{" "}
                    {r.obligations.filter((o) => o.status === "DONE").length}/
                    {r.obligations.length}{" "}
                    {t(locale, "completed", "مكتملة")}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
