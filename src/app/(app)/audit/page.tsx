import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { listAudit } from "@/lib/store";
import { getLocale } from "@/lib/prefs";
import { t } from "@/lib/i18n";
import { formatDateTime } from "@/lib/format";

export default function AuditPage() {
  const locale = getLocale();
  const entries = listAudit();

  return (
    <>
      <PageHeader
        title={t(locale, "Audit Trail", "سجل التدقيق")}
        subtitle={t(
          locale,
          "Complete, immutable history of every action and AI decision",
          "سجل كامل وغير قابل للتعديل لكل إجراء وقرار للذكاء الاصطناعي",
        )}
      />

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-line">
            {entries.map((e) => (
              <div
                key={e.id}
                className="flex items-start gap-4 px-5 py-3.5 text-sm"
              >
                <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sela-yellow" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-ink-50">{e.action}</span>
                    <Link
                      href={`/requests/${e.requestId}`}
                      className="text-xs text-sela-yellow hover:underline"
                    >
                      {e.reference}
                    </Link>
                  </div>
                  <div className="text-xs text-ink-500">{e.detail}</div>
                </div>
                <div className="shrink-0 text-end text-xs text-ink-500">
                  <div>{e.actor}</div>
                  <div>{formatDateTime(e.at, locale)}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
