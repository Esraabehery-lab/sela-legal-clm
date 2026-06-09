import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ObligationRow } from "@/components/obligation-row";
import { Badge } from "@/components/ui/badge";
import { listRequests } from "@/lib/store";
import { getLocale, getRole } from "@/lib/prefs";
import { t } from "@/lib/i18n";
import { daysUntil } from "@/lib/format";

export default function ObligationsPage() {
  const locale = getLocale();
  const role = getRole();
  const canEdit = role === "CONTRACT_OWNER" || role === "LEGAL_OPS";

  const rows = listRequests().flatMap((r) =>
    r.obligations.map((o) => ({ req: r, ob: o })),
  );

  // mark overdue on the fly for display accuracy
  rows.forEach(({ ob }) => {
    if (ob.status !== "DONE" && daysUntil(ob.dueDate) < 0)
      ob.status = "OVERDUE";
  });

  const overdue = rows.filter((x) => x.ob.status === "OVERDUE").length;
  const open = rows.filter((x) => x.ob.status !== "DONE").length;

  return (
    <>
      <PageHeader
        title={t(locale, "Obligation Tracking", "تتبّع الالتزامات")}
        subtitle={t(
          locale,
          "All deliverables, payments and milestones across active contracts",
          "جميع المخرجات والدفعات والمراحل عبر العقود السارية",
        )}
        actions={
          <div className="flex gap-2">
            <Badge variant="outline">
              {t(locale, "Open", "مفتوحة")}: {open}
            </Badge>
            <Badge variant={overdue > 0 ? "red" : "outline"}>
              {t(locale, "Overdue", "متأخرة")}: {overdue}
            </Badge>
          </div>
        }
      />

      {rows.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-ink-500">
            {t(
              locale,
              "No obligations yet. Sign a contract to extract obligations.",
              "لا توجد التزامات بعد. وقّع عقداً لاستخراج الالتزامات.",
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {listRequests()
            .filter((r) => r.obligations.length > 0)
            .map((r) => (
              <Card key={r.id}>
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="text-base">
                    <Link
                      href={`/requests/${r.id}`}
                      className="hover:text-sela-yellow"
                    >
                      {r.title}
                    </Link>
                  </CardTitle>
                  <span className="text-xs text-ink-500">
                    {r.reference} · {r.counterparty}
                  </span>
                </CardHeader>
                <CardContent className="space-y-2">
                  {r.obligations.map((o) => (
                    <ObligationRow
                      key={o.id}
                      requestId={r.id}
                      obligation={o}
                      locale={locale}
                      canEdit={canEdit}
                    />
                  ))}
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </>
  );
}
