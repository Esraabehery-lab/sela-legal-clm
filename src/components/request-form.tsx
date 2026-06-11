import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScopeOfWorkField } from "@/components/scope-of-work-field";
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
import { Sparkles } from "lucide-react";

const DEPARTMENTS: Department[] = [
  "BUSINESS",
  "PROCUREMENT",
  "FINANCE",
  "LEGAL",
  "IT",
  "HR",
];

type Pair = { en: string; ar: string };

/** Pre-fill values for editing an existing request. */
export interface RequestFormInitial {
  title?: string;
  description?: string;
  requesterName?: string;
  department?: string;
  requestedLanguage?: string;
  currency?: string;
  documentType?: string;
  businessUnit?: string;
  contractNature?: string;
  financialType?: string;
  binding?: string;
  projectName?: string;
  location?: string;
  commercialBrand?: string;
  country?: string;
  budgetCode?: string;
  prNumber?: string;
  prStatus?: string;
  counterparty?: string;
  legalName?: string;
  address?: string;
  authorizedSignatory?: string;
  signatoryTitle?: string;
  projectManager?: string;
  projectManagerEmail?: string;
  projectManagerPhone?: string;
  counterpartyDocs?: string[];
  requiredDocs?: string[];
  durationYears?: string;
  durationMonths?: string;
  durationDays?: string;
  startDate?: string;
  endDate?: string;
  totalValueExVat?: string;
  vatAmount?: string;
  grandTotal?: string;
  paymentTerms?: string;
  paidBy?: string;
  terminationNotice?: string;
  automaticRenewal?: boolean;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
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
  defaultValue,
}: {
  name: string;
  lbl: Pair;
  locale: Locale;
  type?: string;
  required?: boolean;
  placeholder?: string;
  full?: boolean;
  defaultValue?: string;
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
        defaultValue={defaultValue}
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

/**
 * The full DF intake form, shared by the New Request and Edit Request pages.
 * Pass `initial` to pre-fill it (edit), and `children` for hidden fields.
 */
export function RequestForm({
  action,
  locale,
  submitLabel,
  submitHint,
  initial = {},
  children,
}: {
  action: (formData: FormData) => void | Promise<void>;
  locale: Locale;
  submitLabel: string;
  submitHint?: string;
  initial?: RequestFormInitial;
  children?: ReactNode;
}) {
  const v = initial;
  return (
    <form action={action} className="space-y-7">
      {children}

      {/* ---- Core ---- */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <TextField
          name="title"
          lbl={{ en: "Request Title", ar: "عنوان الطلب" }}
          locale={locale}
          required
          full
          defaultValue={v.title}
          placeholder={t(
            locale,
            "e.g. IT Managed Services Agreement",
            "مثال: اتفاقية خدمات تقنية مُدارة",
          )}
        />
        <ScopeOfWorkField locale={locale} initial={v.description} />
        <TextField
          name="requesterName"
          lbl={{ en: "Requester Name", ar: "اسم مقدم الطلب" }}
          locale={locale}
          required
          defaultValue={v.requesterName}
        />
        <div className="space-y-2">
          <Label htmlFor="department">{t(locale, "Department", "القسم")}</Label>
          <Select
            id="department"
            name="department"
            defaultValue={v.department ?? "BUSINESS"}
          >
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
            defaultValue={v.requestedLanguage ?? locale}
          >
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </Select>
        </div>
      </div>

      {/* ---- Classification ---- */}
      <Section title={t(locale, DF_LABELS.classification.en, DF_LABELS.classification.ar)}>
        <SelectField name="documentType" lbl={DF_LABELS.documentType} locale={locale} options={DOCUMENT_TYPES} defaultValue={v.documentType ?? "Contract"} />
        <SelectField name="businessUnit" lbl={DF_LABELS.businessUnit} locale={locale} options={BUSINESS_UNITS} defaultValue={v.businessUnit} />
        <SelectField name="contractNature" lbl={DF_LABELS.contractNature} locale={locale} options={CONTRACT_NATURES} defaultValue={v.contractNature} />
        <SelectField name="financialType" lbl={DF_LABELS.financialType} locale={locale} options={FINANCIAL_TYPES} defaultValue={v.financialType} />
        <SelectField name="binding" lbl={DF_LABELS.binding} locale={locale} options={BINDING_OPTIONS} defaultValue={v.binding ?? "Binding"} />
      </Section>

      {/* ---- Project ---- */}
      <Section title={t(locale, DF_LABELS.project.en, DF_LABELS.project.ar)}>
        <TextField name="projectName" lbl={DF_LABELS.projectName} locale={locale} defaultValue={v.projectName} />
        <TextField name="location" lbl={DF_LABELS.location} locale={locale} defaultValue={v.location} />
        <TextField name="commercialBrand" lbl={DF_LABELS.commercialBrand} locale={locale} defaultValue={v.commercialBrand} />
        <TextField name="country" lbl={DF_LABELS.country} locale={locale} defaultValue={v.country} />
        <TextField name="budgetCode" lbl={DF_LABELS.budgetCode} locale={locale} defaultValue={v.budgetCode} />
        <TextField name="prNumber" lbl={DF_LABELS.prNumber} locale={locale} defaultValue={v.prNumber} />
        <SelectField name="prStatus" lbl={DF_LABELS.prStatus} locale={locale} options={PR_STATUSES} defaultValue={v.prStatus} />
      </Section>

      {/* ---- Counterparty ---- */}
      <Section title={t(locale, DF_LABELS.counterparty.en, DF_LABELS.counterparty.ar)}>
        <TextField name="counterparty" lbl={{ en: "Counterparty / Vendor", ar: "الطرف المقابل / المورد" }} locale={locale} required defaultValue={v.counterparty} />
        <TextField name="legalName" lbl={DF_LABELS.legalName} locale={locale} defaultValue={v.legalName} />
        <TextField name="address" lbl={DF_LABELS.address} locale={locale} defaultValue={v.address} />
        <TextField name="authorizedSignatory" lbl={DF_LABELS.authorizedSignatory} locale={locale} defaultValue={v.authorizedSignatory} />
        <TextField name="signatoryTitle" lbl={DF_LABELS.signatoryTitle} locale={locale} defaultValue={v.signatoryTitle} />
        <TextField name="projectManager" lbl={DF_LABELS.projectManager} locale={locale} defaultValue={v.projectManager} />
        <TextField name="projectManagerEmail" lbl={DF_LABELS.projectManagerEmail} locale={locale} type="email" defaultValue={v.projectManagerEmail} />
        <TextField name="projectManagerPhone" lbl={DF_LABELS.projectManagerPhone} locale={locale} defaultValue={v.projectManagerPhone} />
        <div className="space-y-2 sm:col-span-2 lg:col-span-3">
          <Label>{t(locale, DF_LABELS.counterpartyDocs.en, DF_LABELS.counterpartyDocs.ar)}</Label>
          <div className="flex flex-wrap gap-3">
            {COUNTERPARTY_DOCS.map((d) => (
              <label key={d} className="flex items-center gap-2 rounded-lg border border-line bg-surface-1 px-3 py-1.5 text-xs text-ink-300">
                <input type="checkbox" name="counterpartyDocs" value={d} defaultChecked={v.counterpartyDocs?.includes(d)} className="accent-sela-yellow" />
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
                defaultChecked={v.requiredDocs?.includes(d.en)}
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
        <TextField name="durationYears" lbl={DF_LABELS.years} locale={locale} type="number" defaultValue={v.durationYears} />
        <TextField name="durationMonths" lbl={DF_LABELS.months} locale={locale} type="number" defaultValue={v.durationMonths} />
        <TextField name="durationDays" lbl={DF_LABELS.days} locale={locale} type="number" defaultValue={v.durationDays} />
        <TextField name="startDate" lbl={DF_LABELS.startDate} locale={locale} type="date" defaultValue={v.startDate} />
        <TextField name="endDate" lbl={DF_LABELS.endDate} locale={locale} type="date" defaultValue={v.endDate} />
        <SelectField name="terminationNotice" lbl={DF_LABELS.terminationNotice} locale={locale} options={TERMINATION_NOTICES} defaultValue={v.terminationNotice} />
        <TextField name="totalValueExVat" lbl={DF_LABELS.totalValueExVat} locale={locale} type="number" defaultValue={v.totalValueExVat} />
        <TextField name="vatAmount" lbl={DF_LABELS.vatAmount} locale={locale} type="number" defaultValue={v.vatAmount} />
        <TextField name="grandTotal" lbl={DF_LABELS.grandTotal} locale={locale} type="number" defaultValue={v.grandTotal} />
        <div className="space-y-2">
          <Label htmlFor="currency">{t(locale, "Currency", "العملة")}</Label>
          <Select id="currency" name="currency" defaultValue={v.currency ?? "SAR"}>
            <option value="SAR">SAR</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </Select>
        </div>
        <SelectField name="paymentTerms" lbl={DF_LABELS.paymentTerms} locale={locale} options={PAYMENT_TERMS} defaultValue={v.paymentTerms} />
        <SelectField name="paidBy" lbl={DF_LABELS.paidBy} locale={locale} options={PAID_BY} defaultValue={v.paidBy} />
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-ink-300">
            <input type="checkbox" name="automaticRenewal" defaultChecked={v.automaticRenewal} className="accent-sela-yellow" />
            {t(locale, DF_LABELS.automaticRenewal.en, DF_LABELS.automaticRenewal.ar)}
          </label>
        </div>
      </Section>

      <Separator />
      <div className="flex items-center gap-3">
        <Button type="submit">
          <Sparkles className="h-4 w-4" />
          {submitLabel}
        </Button>
        {submitHint && <span className="text-xs text-ink-500">{submitHint}</span>}
      </div>
    </form>
  );
}
