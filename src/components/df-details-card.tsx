import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DF_LABELS } from "@/lib/df";
import type { DfDetails } from "@/lib/df";
import { t } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import type { Locale } from "@/lib/types";
import { ClipboardList } from "lucide-react";

type Pair = { en: string; ar: string };

/** One label/value pair, rendered only when the value is present. */
function Row({
  lbl,
  value,
  locale,
}: {
  lbl: Pair;
  value?: string | number | null;
  locale: Locale;
}) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-ink-500">{t(locale, lbl.en, lbl.ar)}</span>
      <span className="text-end font-medium text-ink-100">{value}</span>
    </div>
  );
}

function hasAny(...vals: Array<unknown>): boolean {
  return vals.some((v) => v !== undefined && v !== null && v !== "");
}

/** Structured DF (DEF 2026) intake displayed on the request detail page. */
export function DfDetailsCard({
  df,
  locale,
}: {
  df: DfDetails;
  locale: Locale;
}) {
  const duration = [
    df.durationYears ? `${df.durationYears} ${t(locale, "yr", "سنة")}` : "",
    df.durationMonths ? `${df.durationMonths} ${t(locale, "mo", "شهر")}` : "",
    df.durationDays ? `${df.durationDays} ${t(locale, "d", "يوم")}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const classification = hasAny(
    df.documentType,
    df.businessUnit,
    df.contractNature,
    df.financialType,
    df.binding,
  );
  const project = hasAny(
    df.projectName,
    df.location,
    df.commercialBrand,
    df.country,
    df.budgetCode,
    df.prNumber,
    df.prStatus,
  );
  const counterparty = hasAny(
    df.legalName,
    df.address,
    df.authorizedSignatory,
    df.signatoryTitle,
    df.projectManager,
    df.projectManagerEmail,
    df.projectManagerPhone,
    df.counterpartyDocs?.length,
  );
  const commercials = hasAny(
    duration,
    df.startDate,
    df.endDate,
    df.totalValueExVat,
    df.vatAmount,
    df.grandTotal,
    df.paymentTerms,
    df.paidBy,
    df.terminationNotice,
    df.automaticRenewal,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList className="h-4 w-4 text-ink-400" />
          {t(locale, "DF Form Details", "تفاصيل نموذج DF")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {classification && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-400">
              {t(locale, DF_LABELS.classification.en, DF_LABELS.classification.ar)}
            </h4>
            <Row lbl={DF_LABELS.documentType} value={df.documentType} locale={locale} />
            <Row lbl={DF_LABELS.businessUnit} value={df.businessUnit} locale={locale} />
            <Row lbl={DF_LABELS.contractNature} value={df.contractNature} locale={locale} />
            <Row lbl={DF_LABELS.financialType} value={df.financialType} locale={locale} />
            <Row lbl={DF_LABELS.binding} value={df.binding} locale={locale} />
          </div>
        )}

        {project && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                {t(locale, DF_LABELS.project.en, DF_LABELS.project.ar)}
              </h4>
              <Row lbl={DF_LABELS.projectName} value={df.projectName} locale={locale} />
              <Row lbl={DF_LABELS.location} value={df.location} locale={locale} />
              <Row lbl={DF_LABELS.commercialBrand} value={df.commercialBrand} locale={locale} />
              <Row lbl={DF_LABELS.country} value={df.country} locale={locale} />
              <Row lbl={DF_LABELS.budgetCode} value={df.budgetCode} locale={locale} />
              <Row lbl={DF_LABELS.prNumber} value={df.prNumber} locale={locale} />
              <Row lbl={DF_LABELS.prStatus} value={df.prStatus} locale={locale} />
            </div>
          </>
        )}

        {counterparty && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                {t(locale, DF_LABELS.counterparty.en, DF_LABELS.counterparty.ar)}
              </h4>
              <Row lbl={DF_LABELS.legalName} value={df.legalName} locale={locale} />
              <Row lbl={DF_LABELS.address} value={df.address} locale={locale} />
              <Row lbl={DF_LABELS.authorizedSignatory} value={df.authorizedSignatory} locale={locale} />
              <Row lbl={DF_LABELS.signatoryTitle} value={df.signatoryTitle} locale={locale} />
              <Row lbl={DF_LABELS.projectManager} value={df.projectManager} locale={locale} />
              <Row lbl={DF_LABELS.projectManagerEmail} value={df.projectManagerEmail} locale={locale} />
              <Row lbl={DF_LABELS.projectManagerPhone} value={df.projectManagerPhone} locale={locale} />
              {df.counterpartyDocs && df.counterpartyDocs.length > 0 && (
                <div className="pt-1">
                  <div className="mb-1.5 text-xs text-ink-500">
                    {t(locale, DF_LABELS.counterpartyDocs.en, DF_LABELS.counterpartyDocs.ar)}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {df.counterpartyDocs.map((d) => (
                      <Badge key={d} variant="outline">
                        {d}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {commercials && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                {t(locale, DF_LABELS.commercials.en, DF_LABELS.commercials.ar)}
              </h4>
              <Row lbl={DF_LABELS.duration} value={duration} locale={locale} />
              <Row
                lbl={DF_LABELS.startDate}
                value={df.startDate ? formatDate(df.startDate, locale) : undefined}
                locale={locale}
              />
              <Row
                lbl={DF_LABELS.endDate}
                value={df.endDate ? formatDate(df.endDate, locale) : undefined}
                locale={locale}
              />
              <Row
                lbl={DF_LABELS.totalValueExVat}
                value={df.totalValueExVat?.toLocaleString()}
                locale={locale}
              />
              <Row lbl={DF_LABELS.vatAmount} value={df.vatAmount?.toLocaleString()} locale={locale} />
              <Row
                lbl={DF_LABELS.grandTotal}
                value={df.grandTotal?.toLocaleString()}
                locale={locale}
              />
              <Row lbl={DF_LABELS.paymentTerms} value={df.paymentTerms} locale={locale} />
              <Row lbl={DF_LABELS.paidBy} value={df.paidBy} locale={locale} />
              <Row lbl={DF_LABELS.terminationNotice} value={df.terminationNotice} locale={locale} />
              {df.automaticRenewal && (
                <Row
                  lbl={DF_LABELS.automaticRenewal}
                  value={t(locale, "Yes", "نعم")}
                  locale={locale}
                />
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
