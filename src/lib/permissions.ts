// Central role-based permission model (US-004 routing + Epics 5–7 approvals).
// Every role does only its own responsibility. UI hides actions a role can't
// perform; server actions enforce the same rules as defence-in-depth.

import type { Role, RequestStatus, ApprovalStage } from "./types";

export function canCreateRequest(role: Role): boolean {
  return role === "BUSINESS_USER" || role === "LEGAL_OPS";
}

export function canUploadDocuments(role: Role): boolean {
  return role === "BUSINESS_USER" || role === "LEGAL_OPS";
}

export function canRunAi(role: Role): boolean {
  return role === "BUSINESS_USER" || role === "LEGAL_OPS";
}

export function canEditDraft(role: Role): boolean {
  return role === "BUSINESS_USER" || role === "LEGAL_OPS";
}

export function canSubmitForApproval(role: Role, status: RequestStatus): boolean {
  return (
    (role === "BUSINESS_USER" || role === "LEGAL_OPS") &&
    (status === "DRAFT_GENERATED" || status === "BU_REVIEW")
  );
}

/** Only the matching reviewer (or Legal Ops) can decide a given stage. */
export function canApproveStage(role: Role, stage: ApprovalStage): boolean {
  if (role === "LEGAL_OPS") return true;
  return role === stage; // PROCUREMENT / FINANCE / LEGAL
}

export function canSign(role: Role, status: RequestStatus): boolean {
  return (
    (role === "CONTRACT_OWNER" || role === "LEGAL_OPS") && status === "APPROVED"
  );
}

export function canManageObligations(role: Role): boolean {
  return role === "CONTRACT_OWNER" || role === "LEGAL_OPS";
}

export function isReadOnly(role: Role): boolean {
  return role === "AUDITOR";
}

/** Human-readable responsibility shown in the UI so the role is obvious. */
export const RESPONSIBILITIES: Record<Role, { en: string; ar: string }> = {
  BUSINESS_USER: {
    en: "Create contract requests, upload documents, validate the AI draft and submit it for approval.",
    ar: "إنشاء طلبات العقود ورفع المستندات والتحقق من المسودة وإرسالها للاعتماد.",
  },
  PROCUREMENT: {
    en: "Review and approve or reject the Procurement stage of contract requests.",
    ar: "مراجعة واعتماد أو رفض مرحلة المشتريات في طلبات العقود.",
  },
  FINANCE: {
    en: "Validate financial terms and approve or reject the Finance stage.",
    ar: "التحقق من الشروط المالية واعتماد أو رفض مرحلة المالية.",
  },
  LEGAL: {
    en: "Review legal terms, risks and AI recommendations, then approve or reject the Legal stage.",
    ar: "مراجعة الشروط القانونية والمخاطر وتوصيات الذكاء الاصطناعي ثم اعتماد أو رفض المرحلة القانونية.",
  },
  CONTRACT_OWNER: {
    en: "Sign approved contracts and monitor obligations and deliverables.",
    ar: "توقيع العقود المعتمدة ومتابعة الالتزامات والمخرجات.",
  },
  LEGAL_OPS: {
    en: "Oversee the full lifecycle and act across stages when needed.",
    ar: "الإشراف على دورة الحياة الكاملة والتدخل عبر المراحل عند الحاجة.",
  },
  AUDITOR: {
    en: "Read-only access to view the complete history and AI decisions.",
    ar: "صلاحية اطلاع فقط لعرض السجل الكامل وقرارات الذكاء الاصطناعي.",
  },
};
