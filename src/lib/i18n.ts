// Bilingual support (US-021 / US-022, FR-18). Lightweight, SSR-friendly
// i18n: a tiny `t()` picker plus label maps for enum values. The active
// locale is stored in a cookie and read by server components.

import type {
  Locale,
  RequestStatus,
  ContractCategory,
  ApprovalStage,
  ApprovalDecision,
  ObligationType,
  ObligationStatus,
  Department,
  Severity,
} from "./types";

export type { Locale };

export const LOCALES: Locale[] = ["en", "ar"];
export const DEFAULT_LOCALE: Locale = "en";

/** Pick the right string for the active locale. */
export function t(locale: Locale, en: string, ar: string): string {
  return locale === "ar" ? ar : en;
}

export function dir(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

type Pair = { en: string; ar: string };

export const STATUS_LABELS: Record<RequestStatus, Pair> = {
  SUBMITTED: { en: "Submitted", ar: "تم الإرسال" },
  AI_ANALYZED: { en: "AI Analyzed", ar: "تم التحليل" },
  DRAFT_GENERATED: { en: "Draft Generated", ar: "تم إنشاء المسودة" },
  BU_REVIEW: { en: "Business Review", ar: "مراجعة الوحدة" },
  IN_APPROVAL: { en: "Request to Approve", ar: "طلب للاعتماد" },
  APPROVED: { en: "Approved", ar: "معتمد" },
  CONFIRMED: { en: "Confirmed", ar: "مؤكَّد" },
  CONTRACT_REVIEW: { en: "Contract Review", ar: "مراجعة العقد" },
  CONTRACT_REVISION: { en: "Contract Revision", ar: "تعديل العقد" },
  FINAL_APPROVAL: { en: "Final Approval", ar: "الاعتماد النهائي" },
  THIRD_PARTY_REVIEW: { en: "With Third Party", ar: "لدى الطرف الخارجي" },
  FINAL_CONFIRM: { en: "Final Confirmation", ar: "التأكيد النهائي" },
  USER_SIGNATURE: { en: "Awaiting Your Signature", ar: "بانتظار توقيعك" },
  THIRD_PARTY_SIGNATURE: { en: "Awaiting Third-Party Signature", ar: "بانتظار توقيع الطرف الخارجي" },
  LEGAL_SIGNATURE: { en: "Awaiting Legal Signature", ar: "بانتظار توقيع القانونية" },
  REJECTED: { en: "Rejected", ar: "مرفوض" },
  RETURNED: { en: "Returned for Edit", ar: "أُعيد للتعديل" },
  ARCHIVED: { en: "Archived", ar: "مؤرشف" },
  SIGNED: { en: "Signed", ar: "موقّع" },
  ACTIVE: { en: "Active", ar: "ساري" },
};

export const CATEGORY_LABELS: Record<ContractCategory, Pair> = {
  NDA: { en: "Non-Disclosure Agreement", ar: "اتفاقية عدم إفشاء" },
  SERVICE_AGREEMENT: { en: "Service Agreement", ar: "اتفاقية خدمات" },
  SUPPLY: { en: "Supply Contract", ar: "عقد توريد" },
  CONSULTING: { en: "Consulting Agreement", ar: "اتفاقية استشارات" },
  EMPLOYMENT: { en: "Employment Contract", ar: "عقد عمل" },
  LEASE: { en: "Lease Agreement", ar: "عقد إيجار" },
  PARTNERSHIP: { en: "Partnership Agreement", ar: "اتفاقية شراكة" },
  OTHER: { en: "General Contract", ar: "عقد عام" },
};

export const STAGE_LABELS: Record<ApprovalStage, Pair> = {
  HEAD_OF_BU: { en: "Head of Business Unit", ar: "رئيس وحدة الأعمال" },
  CSCCO: { en: "CSCCO", ar: "الرئيس التنفيذي للسلسلة والتجارة" },
  CFO: { en: "CFO", ar: "الرئيس المالي" },
  LEGAL: { en: "Legal Reviewer", ar: "المراجع القانوني" },
  PROCUREMENT: { en: "Procurement Team", ar: "فريق المشتريات" },
  FINANCE: { en: "Finance Team", ar: "الفريق المالي" },
};

export const DECISION_LABELS: Record<ApprovalDecision, Pair> = {
  PENDING: { en: "Pending", ar: "قيد الانتظار" },
  APPROVED: { en: "Approved", ar: "معتمد" },
  REJECTED: { en: "Rejected", ar: "مرفوض" },
  CHANGES_REQUESTED: { en: "Changes Requested", ar: "مطلوب تعديلات" },
};

export const DEPT_LABELS: Record<Department, Pair> = {
  LEGAL: { en: "Legal", ar: "القانونية" },
  PROCUREMENT: { en: "Procurement", ar: "المشتريات" },
  FINANCE: { en: "Finance", ar: "المالية" },
  BUSINESS: { en: "Business Unit", ar: "وحدة الأعمال" },
  IT: { en: "IT", ar: "تقنية المعلومات" },
  HR: { en: "HR", ar: "الموارد البشرية" },
};

export const OBLIGATION_TYPE_LABELS: Record<ObligationType, Pair> = {
  DELIVERABLE: { en: "Deliverable", ar: "مُخرج" },
  PAYMENT: { en: "Payment", ar: "دفعة" },
  MILESTONE: { en: "Milestone", ar: "مرحلة" },
  RENEWAL: { en: "Renewal", ar: "تجديد" },
  COMPLIANCE: { en: "Compliance", ar: "امتثال" },
};

export const OBLIGATION_STATUS_LABELS: Record<ObligationStatus, Pair> = {
  PENDING: { en: "Pending", ar: "معلّق" },
  IN_PROGRESS: { en: "In Progress", ar: "قيد التنفيذ" },
  DONE: { en: "Completed", ar: "مكتمل" },
  OVERDUE: { en: "Overdue", ar: "متأخر" },
};

export const SEVERITY_LABELS: Record<Severity, Pair> = {
  LOW: { en: "Low", ar: "منخفض" },
  MEDIUM: { en: "Medium", ar: "متوسط" },
  HIGH: { en: "High", ar: "مرتفع" },
};

/** UI chrome strings. */
export const UI = {
  appName: { en: "SELA Legal — CLM", ar: "سيلا القانونية — إدارة العقود" },
  dashboard: { en: "Dashboard", ar: "لوحة المعلومات" },
  requests: { en: "Contract Requests", ar: "طلبات العقود" },
  newRequest: { en: "New Request", ar: "طلب جديد" },
  contracts: { en: "Contracts", ar: "العقود" },
  obligations: { en: "Obligations", ar: "الالتزامات" },
  audit: { en: "Audit Trail", ar: "سجل التدقيق" },
  search: { en: "Search…", ar: "بحث…" },
} as const;

export function label<T extends string>(
  map: Record<T, Pair>,
  key: T,
  locale: Locale,
): string {
  const pair = map[key];
  if (!pair) return key;
  return t(locale, pair.en, pair.ar);
}
