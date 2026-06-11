import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { RequestForm, type RequestFormInitial } from "@/components/request-form";
import { updateRequest } from "@/lib/actions";
import { getRequest } from "@/lib/store";
import { getLocale, getRole } from "@/lib/prefs";
import { canEditRequest } from "@/lib/permissions";
import { t } from "@/lib/i18n";
import { ArrowLeft, Lock, AlertTriangle } from "lucide-react";

const num = (n?: number) => (typeof n === "number" ? String(n) : undefined);

export default function EditRequestPage({
  params,
}: {
  params: { id: string };
}) {
  const locale = getLocale();
  const role = getRole();
  const req = getRequest(params.id);
  if (!req) notFound();

  if (!canEditRequest(role, req.status)) {
    return (
      <Card className="max-w-xl">
        <CardContent className="flex items-start gap-3 p-6">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <p className="text-sm text-ink-300">
            {t(
              locale,
              "This request can’t be edited in its current state, or not by your role.",
              "لا يمكن تعديل هذا الطلب في حالته الحالية أو ليس من صلاحية دورك.",
            )}
          </p>
        </CardContent>
      </Card>
    );
  }

  const df = req.df ?? {};
  const initial: RequestFormInitial = {
    title: req.title,
    description: req.description,
    requesterName: req.requesterName,
    department: req.department,
    requestedLanguage: req.requestedLanguage,
    currency: req.currency,
    documentType: df.documentType,
    businessUnit: df.businessUnit,
    contractNature: df.contractNature,
    financialType: df.financialType,
    binding: df.binding,
    projectName: df.projectName,
    location: df.location,
    commercialBrand: df.commercialBrand,
    country: df.country,
    budgetCode: df.budgetCode,
    prNumber: df.prNumber,
    prStatus: df.prStatus,
    counterparty: req.counterparty,
    legalName: df.legalName,
    address: df.address,
    authorizedSignatory: df.authorizedSignatory,
    signatoryTitle: df.signatoryTitle,
    projectManager: df.projectManager,
    projectManagerEmail: df.projectManagerEmail,
    projectManagerPhone: df.projectManagerPhone,
    counterpartyDocs: df.counterpartyDocs,
    requiredDocs: df.requiredDocs,
    durationYears: num(df.durationYears),
    durationMonths: num(df.durationMonths),
    durationDays: num(df.durationDays),
    startDate: df.startDate?.slice(0, 10),
    endDate: df.endDate?.slice(0, 10),
    totalValueExVat: num(df.totalValueExVat),
    vatAmount: num(df.vatAmount),
    grandTotal: num(df.grandTotal),
    paymentTerms: df.paymentTerms,
    paidBy: df.paidBy,
    terminationNotice: df.terminationNotice,
    automaticRenewal: df.automaticRenewal,
  };

  // Most recent rejection reason (if it was returned).
  const rejection = req.audit.find(
    (a) =>
      a.action === "Returned to business user" || a.action === "Request archived",
  );

  return (
    <>
      <Link
        href={`/requests/${req.id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-100"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {t(locale, "Back to request", "العودة للطلب")}
      </Link>

      <PageHeader
        title={t(locale, "Edit Request", "تعديل الطلب")}
        subtitle={`${req.reference} · ${req.title}`}
      />

      {req.status === "RETURNED" && rejection && (
        <Card className="mb-6 border-amber-500/30 bg-amber-500/[0.05]">
          <CardContent className="flex items-start gap-2.5 p-4 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <div>
              <div className="font-medium text-ink-100">
                {t(locale, "Returned for edit", "أُعيد للتعديل")} — {rejection.actor}
              </div>
              <div className="text-ink-400">{rejection.detail}</div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="max-w-4xl">
        <CardContent className="p-6">
          <RequestForm
            action={updateRequest}
            locale={locale}
            initial={initial}
            submitLabel={t(locale, "Save & Resubmit", "حفظ وإعادة الإرسال")}
            submitHint={t(
              locale,
              "Re-runs classification and restarts the approval chain.",
              "يعيد التصنيف ويبدأ سلسلة الاعتماد من جديد.",
            )}
          >
            <input type="hidden" name="requestId" value={req.id} />
          </RequestForm>
        </CardContent>
      </Card>
    </>
  );
}
