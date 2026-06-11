import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createRequest } from "@/lib/actions";
import { getLocale, getRole } from "@/lib/prefs";
import { canCreateRequest, RESPONSIBILITIES } from "@/lib/permissions";
import { ROLE_LABELS } from "@/lib/roles";
import { t, DEPT_LABELS, label } from "@/lib/i18n";
import type { Department, Locale } from "@/lib/types";
import {
  DOCUMENT_TYPES,
  BUSINESS_UNITS,
  BINDING_OPTIONS,
  FINANCIAL_TYPES,
  CONTRACT_NATURES,
  PR_STATUSES,
  PAYMENT_TERMS,
  PAID_BY,
  TERMINATION_NOTICES,
  COUNTERPARTY_DOCS,
  REQUIRED_DOCS,
  DF_LABELS,
} from "@/lib/df";
import { Sparkles, Lock } from "lucide-react";

const DEPARTMENTS: Department[] = [
  "BUSINESS",
  "PROCUREMENT",
  "FINANCE",
  "LEGAL",
  "IT",
  "HR",
];

type Pair = { en: string; ar: string };

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Separator className="mb-4" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-200">
          {title}
        </h3>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  );
}

function TextField({
  name,
  lbl,
  locale,
  type = "text",
  required = false,
  placeholder,
  full = false,
}: {
  name: string;
  lbl: Pair;
  locale: Locale;
  type?: string;
  required?: boolean;
  placeholder?: string;
  full?: boolean;
}) {
  return (
    <div className={`space-y-2 ${full ? "sm:col-span-2 lg:col-span-3" : ""}`}>
      <Label htmlFor={name}>{t(locale, lbl.en, lbl.ar)}</Label>
      <Input
        id={name}
        name={name}
        type={type}
        required={required}
        min={type === "number" ? 0 : undefined}
        placeholder={placeholder}
      />
    </div>
  );
}

function SelectField({
  name,
  lbl,
  locale,
  options,
  defaultValue,
  placeholder = "—",
}: {
  name: string;
  lbl: Pair;
  locale: Locale;
  options: readonly string[];
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{t(locale, lbl.en, lbl.ar)}</Label>
      <Select id={name} name={name} defaultValue={defaultValue ?? ""}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </Select>
    </div>
  );
}

export default function NewRequestPage() {
  const locale = getLocale();
  const role = getRole();

  // Only Business Users (and Legal Ops) may raise a contract request.
  if (!canCreateRequest(role)) {
    return (
      <Card className="max-w-xl">
        <CardContent className="flex items-start gap-3 p-6">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div className="space-y-1 text-sm">
            <p className="font-medium text-ink-50">
              {t(
                locale,
                "Creating contract requests isn’t part of your role.",
                "إنشاء طلبات العقود ليس ضمن دورك.",
              )}
            </p>
            <p className="text-ink-400">
              {t(
                locale,
                `You are acting as ${ROLE_LABELS[role].en}. ${RESPONSIBILITIES[role].en} To raise a request, switch to the Business User role.`,
                `أنت تعمل كـ ${ROLE_LABELS[role].ar}. ${RESPONSIBILITIES[role].ar} لإنشاء طلب، انتقل إلى دور مستخدم الأعمال.`,
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <PageHeader
        title={t(locale, "New Contract Request (DF)", "طلب عقد جديد")}
        subtitle={t(
          locale,
          "Complete the DF form — the AI engine will classify, route and draft it automatically. Only the title, description and requester are required.",
          "أكمل نموذج DF — سيقوم محرك الذكاء الاصطناعي بتصنيفه وتوجيهه وصياغته تلقائياً. الحقول الإلزامية هي العنوان والوصف ومقدم الطلب فقط.",
        )}
      />

      <Card className="max-w-4xl">
        <CardContent className="p-6">
          <form action={createRequest} className="space-y-7">
            {/* ---- Core ---- */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <TextField
                name="title"
                lbl={{ en: "Request Title", ar: "عنوان الطلب" }}
                locale={locale}
                required
                full
                placeholder={t(
                  locale,
                  "e.g. IT Managed Services Agreement",
                  "مثال: اتفاقية خدمات تقنية مُدارة",
                )}
              />
              <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                <Label htmlFor="description">
                  {t(locale, "Description / Scope", "الوصف / النطاق")}
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  required
                  minLength={5}
                  rows={3}
                  placeholder={t(
                    locale,
                    "Describe the purpose and scope…",
                    "صف الغرض والنطاق…",
                  )}
                />
              </div>
              <TextField
                name="requesterName"
                lbl={{ en: "Requester Name", ar: "اسم مقدم الطلب" }}
                locale={locale}
                required
              />
              <div className="space-y-2">
                <Label htmlFor="department">
                  {t(locale, "Department", "القسم")}
                </Label>
                <Select id="department" name="department" defaultValue="BUSINESS">
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {label(DEPT_LABELS, d, locale)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="requestedLanguage">
                  {t(locale, "Contract Language", "لغة العقد")}
                </Label>
                <Select
                  id="requestedLanguage"
                  name="requestedLanguage"
                  defaultValue={locale}
                >
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                </Select>
              </div>
            </div>

            {/* ---- Classification ---- */}
            <Section title={t(locale, DF_LABELS.classification.en, DF_LABELS.classification.ar)}>
              <SelectField name="documentType" lbl={DF_LABELS.documentType} locale={locale} options={DOCUMENT_TYPES} defaultValue="Contract" />
              <SelectField name="businessUnit" lbl={DF_LABELS.businessUnit} locale={locale} options={BUSINESS_UNITS} />
              <SelectField name="contractNature" lbl={DF_LABELS.contractNature} locale={locale} options={CONTRACT_NATURES} />
              <SelectField name="financialType" lbl={DF_LABELS.financialType} locale={locale} options={FINANCIAL_TYPES} />
              <SelectField name="binding" lbl={DF_LABELS.binding} locale={locale} options={BINDING_OPTIONS} defaultValue="Binding" />
            </Section>

            {/* ---- Project ---- */}
            <Section title={t(locale, DF_LABELS.project.en, DF_LABELS.project.ar)}>
              <TextField name="projectName" lbl={DF_LABELS.projectName} locale={locale} />
              <TextField name="location" lbl={DF_LABELS.location} locale={locale} />
              <TextField name="commercialBrand" lbl={DF_LABELS.commercialBrand} locale={locale} />
              <TextField name="country" lbl={DF_LABELS.country} locale={locale} />
              <TextField name="budgetCode" lbl={DF_LABELS.budgetCode} locale={locale} />
              <TextField name="prNumber" lbl={DF_LABELS.prNumber} locale={locale} />
              <SelectField name="prStatus" lbl={DF_LABELS.prStatus} locale={locale} options={PR_STATUSES} />
            </Section>

            {/* ---- Counterparty ---- */}
            <Section title={t(locale, DF_LABELS.counterparty.en, DF_LABELS.counterparty.ar)}>
              <TextField name="counterparty" lbl={{ en: "Counterparty / Vendor", ar: "الطرف المقابل / المورد" }} locale={locale} required />
              <TextField name="legalName" lbl={DF_LABELS.legalName} locale={locale} />
              <TextField name="address" lbl={DF_LABELS.address} locale={locale} />
              <TextField name="authorizedSignatory" lbl={DF_LABELS.authorizedSignatory} locale={locale} />
              <TextField name="signatoryTitle" lbl={DF_LABELS.signatoryTitle} locale={locale} />
              <TextField name="projectManager" lbl={DF_LABELS.projectManager} locale={locale} />
              <TextField name="projectManagerEmail" lbl={DF_LABELS.projectManagerEmail} locale={locale} type="email" />
              <TextField name="projectManagerPhone" lbl={DF_LABELS.projectManagerPhone} locale={locale} />
              <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                <Label>{t(locale, DF_LABELS.counterpartyDocs.en, DF_LABELS.counterpartyDocs.ar)}</Label>
                <div className="flex flex-wrap gap-3">
                  {COUNTERPARTY_DOCS.map((d) => (
                    <label key={d} className="flex items-center gap-2 rounded-lg border border-line bg-surface-1 px-3 py-1.5 text-xs text-ink-300">
                      <input type="checkbox" name="counterpartyDocs" value={d} className="accent-sela-yellow" />
                      {d}
                    </label>
                  ))}
                </div>
              </div>
            </Section>

            {/* ---- Required documents (mandatory) ---- */}
            <div className="space-y-4">
              <div>
                <Separator className="mb-4" />
                <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-200">
                  {t(locale, DF_LABELS.requiredDocs.en, DF_LABELS.requiredDocs.ar)}
                  <span className="ms-1 text-red-400">*</span>
                </h3>
                <p className="mt-1 text-xs text-ink-500">
                  {t(
                    locale,
                    "All of the following must be attached before the request can be submitted.",
                    "يجب إرفاق جميع المستندات التالية قبل إرسال الطلب.",
                  )}
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {REQUIRED_DOCS.map((d) => (
                  <label
                    key={d.key}
                    className="flex items-center gap-2.5 rounded-lg border border-line bg-surface-1 px-3 py-2.5 text-sm text-ink-200"
                  >
                    <input
                      type="checkbox"
                      name={`requiredDoc_${d.key}`}
                      required
                      className="h-4 w-4 accent-sela-yellow"
                    />
                    {t(locale, d.en, d.ar)}
                    <span className="text-red-400">*</span>
                  </label>
                ))}
              </div>
            </div>

            {/* ---- Duration & Commercials ---- */}
            <Section title={t(locale, DF_LABELS.commercials.en, DF_LABELS.commercials.ar)}>
              <TextField name="durationYears" lbl={DF_LABELS.years} locale={locale} type="number" />
              <TextField name="durationMonths" lbl={DF_LABELS.months} locale={locale} type="number" />
              <TextField name="durationDays" lbl={DF_LABELS.days} locale={locale} type="number" />
              <TextField name="startDate" lbl={DF_LABELS.startDate} locale={locale} type="date" />
              <TextField name="endDate" lbl={DF_LABELS.endDate} locale={locale} type="date" />
              <SelectField name="terminationNotice" lbl={DF_LABELS.terminationNotice} locale={locale} options={TERMINATION_NOTICES} />
              <TextField name="totalValueExVat" lbl={DF_LABELS.totalValueExVat} locale={locale} type="number" />
              <TextField name="vatAmount" lbl={DF_LABELS.vatAmount} locale={locale} type="number" />
              <TextField name="grandTotal" lbl={DF_LABELS.grandTotal} locale={locale} type="number" />
              <div className="space-y-2">
                <Label htmlFor="currency">{t(locale, "Currency", "العملة")}</Label>
                <Select id="currency" name="currency" defaultValue="SAR">
                  <option value="SAR">SAR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </Select>
              </div>
              <SelectField name="paymentTerms" lbl={DF_LABELS.paymentTerms} locale={locale} options={PAYMENT_TERMS} />
              <SelectField name="paidBy" lbl={DF_LABELS.paidBy} locale={locale} options={PAID_BY} />
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm text-ink-300">
                  <input type="checkbox" name="automaticRenewal" className="accent-sela-yellow" />
                  {t(locale, DF_LABELS.automaticRenewal.en, DF_LABELS.automaticRenewal.ar)}
                </label>
              </div>
            </Section>

            <Separator />
            <div className="flex items-center gap-3">
              <Button type="submit">
                <Sparkles className="h-4 w-4" />
                {t(locale, "Submit & Run AI", "إرسال وتشغيل الذكاء الاصطناعي")}
              </Button>
              <span className="text-xs text-ink-500">
                {t(
                  locale,
                  "Generates a unique Request ID and draft contract.",
                  "يولّد معرّف طلب فريد ومسودة عقد.",
                )}
              </span>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
