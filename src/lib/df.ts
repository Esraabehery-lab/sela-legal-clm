// DF (Document Entry Form / DEF 2026) field definitions, mirrored from the
// official SELA DF PDF. These drive the structured intake on the New Request
// form (US-001) and are stored on each request.

export const DOCUMENT_TYPES = [
  "Contract",
  "Addendum",
  "Amendment",
  "Term Sheet / HoT",
  "Letters / MOU",
  "Counterparty Draft",
  "New Document Draft",
  "Approved Template",
  "New Approved Template",
] as const;

export const BUSINESS_UNITS = [
  "Events",
  "Venue",
  "Intl. Business",
  "Investment",
  "Corporate",
] as const;

export const BINDING_OPTIONS = ["Binding", "Non-binding"] as const;

export const FINANCIAL_TYPES = [
  "Cash-In",
  "Cash-Out",
  "Revenue Share",
  "Rev. Share + Cash-Out",
  "No Financial Value",
  "Gov. Cash-In",
  "Gov. Cash-Out",
] as const;

export const CONTRACT_NATURES = [
  "General Services",
  "Activation",
  "IP",
  "Supply",
  "Sponsoring",
  "Construction",
  "Talents",
  "Lease HOT",
  "Purchase",
  "Production",
  "Operation",
  "Consultancy",
  "Experience",
  "St. Partnership",
  "JV & Investments",
  "Framework",
  "Berthing & Charters",
  "Settlements",
  "Mutual Termination",
  "Variation Order Addendum",
  "Other",
] as const;

export const PR_STATUSES = ["Approved", "Pending"] as const;

export const PAYMENT_TERMS = ["30", "60", "90"] as const;

export const PAID_BY = ["Sela", "Counterparty"] as const;

export const TERMINATION_NOTICES = [
  "Immediate",
  "15 Days",
  "30 Days",
  "45 Days",
  "90 Days",
] as const;

/** Mandatory documents that must accompany every DF before submission. */
export const REQUIRED_DOCS = [
  { key: "cr", en: "CR", ar: "السجل التجاري" },
  {
    key: "bank",
    en: "Bank Account Information",
    ar: "معلومات الحساب البنكي",
  },
  {
    key: "authLetter",
    en: "Signatory Authorization Letter",
    ar: "خطاب تفويض التوقيع",
  },
  {
    key: "offers",
    en: "Counterparty Offers (Technical + Financial)",
    ar: "عروض الطرف المقابل (الفني + المالي)",
  },
  {
    key: "scope",
    en: "Filled-out Scope of Work",
    ar: "نطاق العمل المعبأ",
  },
] as const;

/** Additional (optional) documents that may be received. */
export const COUNTERPARTY_DOCS = [
  "VAT",
  "Vendor Registration",
  "KYC",
  "Article of Association / Bylaw",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];
export type BusinessUnit = (typeof BUSINESS_UNITS)[number];
export type BindingOption = (typeof BINDING_OPTIONS)[number];
export type FinancialType = (typeof FINANCIAL_TYPES)[number];
export type ContractNature = (typeof CONTRACT_NATURES)[number];

/** Structured DF intake captured on a request (mirrors the DEF 2026 form). */
export interface DfDetails {
  // Classification
  documentType?: string;
  businessUnit?: string;
  binding?: string;
  financialType?: string;
  contractNature?: string;

  // Project information
  projectName?: string;
  location?: string;
  commercialBrand?: string;
  country?: string;
  budgetCode?: string;
  prNumber?: string;
  prStatus?: string;

  // Counterparty information
  legalName?: string;
  address?: string;
  authorizedSignatory?: string;
  signatoryTitle?: string;
  projectManager?: string;
  projectManagerEmail?: string;
  projectManagerPhone?: string;
  requiredDocs?: string[];
  counterpartyDocs?: string[];

  // Duration & commercials
  durationYears?: number;
  durationMonths?: number;
  durationDays?: number;
  startDate?: string;
  endDate?: string;
  totalValueExVat?: number;
  vatAmount?: number;
  grandTotal?: number;
  paymentTerms?: string;
  paidBy?: string;
  automaticRenewal?: boolean;
  terminationNotice?: string;
}

/** Bilingual labels for DF field groups / fields shown in the UI. */
export const DF_LABELS = {
  // sections
  classification: { en: "Classification", ar: "التصنيف" },
  project: { en: "Project Information", ar: "معلومات المشروع" },
  counterparty: { en: "Counterparty Information", ar: "معلومات الطرف المقابل" },
  commercials: { en: "Duration & Commercials", ar: "المدة والشروط التجارية" },
  // fields
  documentType: { en: "Document Type", ar: "نوع المستند" },
  businessUnit: { en: "Business Unit", ar: "وحدة الأعمال" },
  binding: { en: "Binding", ar: "الإلزامية" },
  financialType: { en: "Financial Type", ar: "النوع المالي" },
  contractNature: { en: "Contract Nature", ar: "طبيعة العقد" },
  projectName: { en: "Project Name", ar: "اسم المشروع" },
  location: { en: "Location", ar: "الموقع" },
  commercialBrand: { en: "Commercial Brand", ar: "العلامة التجارية" },
  country: { en: "Country", ar: "الدولة" },
  budgetCode: { en: "Budget Code", ar: "رمز الميزانية" },
  prNumber: { en: "PR Number", ar: "رقم طلب الشراء" },
  prStatus: { en: "PR Status", ar: "حالة طلب الشراء" },
  legalName: { en: "Legal Name", ar: "الاسم القانوني" },
  address: { en: "Address", ar: "العنوان" },
  authorizedSignatory: { en: "Authorized Signatory", ar: "المفوّض بالتوقيع" },
  signatoryTitle: { en: "Signatory Title", ar: "منصب المفوّض" },
  projectManager: { en: "Project Manager", ar: "مدير المشروع" },
  projectManagerEmail: { en: "Manager Email", ar: "بريد المدير" },
  projectManagerPhone: { en: "Manager Phone", ar: "هاتف المدير" },
  requiredDocs: { en: "Required Documents", ar: "المستندات المطلوبة" },
  counterpartyDocs: { en: "Additional Documents", ar: "مستندات إضافية" },
  duration: { en: "Duration", ar: "المدة" },
  years: { en: "Years", ar: "سنوات" },
  months: { en: "Months", ar: "أشهر" },
  days: { en: "Days", ar: "أيام" },
  startDate: { en: "Start Date", ar: "تاريخ البداية" },
  endDate: { en: "End Date", ar: "تاريخ النهاية" },
  totalValueExVat: { en: "Total Value (ex. VAT)", ar: "القيمة الإجمالية (بدون ضريبة)" },
  vatAmount: { en: "VAT", ar: "ضريبة القيمة المضافة" },
  grandTotal: { en: "Grand Total (in. VAT)", ar: "الإجمالي الكلي (شامل الضريبة)" },
  paymentTerms: { en: "Payment Terms (days)", ar: "شروط الدفع (أيام)" },
  paidBy: { en: "Paid By", ar: "يدفعها" },
  automaticRenewal: { en: "Automatic Renewal", ar: "التجديد التلقائي" },
  terminationNotice: { en: "Termination Notice", ar: "إشعار الإنهاء" },
} as const;
