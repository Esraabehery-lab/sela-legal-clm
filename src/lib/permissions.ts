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
  HEAD_OF_BU: {
    en: "First approver — review and approve or reject the request for the Business Unit.",
    ar: "أول معتمد — مراجعة واعتماد أو رفض الطلب نيابة عن وحدة الأعمال.",
  },
  CSCCO: {
    en: "Second approver — review and approve or reject after the Head of Business Unit.",
    ar: "ثاني معتمد — المراجعة والاعتماد أو الرفض بعد رئيس وحدة الأعمال.",
  },
  CFO: {
    en: "Third approver — validate financials and approve or reject after CSCCO.",
    ar: "ثالث معتمد — التحقق من الجوانب المالية والاعتماد أو الرفض بعد CSCCO.",
  },
  LEGAL: {
    en: "Final approver — review legal terms, risks and AI recommendations, then approve or reject.",
    ar: "المعتمد النهائي — مراجعة الشروط القانونية والمخاطر وتوصيات الذكاء الاصطناعي ثم الاعتماد أو الرفض.",
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

/**
 * Sequential gate: a stage is actionable only when every earlier stage in the
 * routing chain has been approved (Head of BU → CSCCO → CFO → Legal).
 */
export function isStageActionable(
  approvals: { stage: ApprovalStage; decision: string }[],
  stage: ApprovalStage,
): boolean {
  const idx = approvals.findIndex((a) => a.stage === stage);
  if (idx === -1) return false;
  if (approvals[idx]?.decision !== "PENDING") return false;
  return approvals.slice(0, idx).every((a) => a.decision === "APPROVED");
}

/** The approval stage a reviewer role owns, if any. */
export function roleStage(role: Role): ApprovalStage | null {
  if (
    role === "HEAD_OF_BU" ||
    role === "CSCCO" ||
    role === "CFO" ||
    role === "LEGAL"
  )
    return role;
  return null;
}

type RequestLike = {
  status: RequestStatus;
  approvals: { stage: ApprovalStage; decision: string }[];
};

/** Whether a request is currently waiting on the given role to act. */
export function awaitsAction(req: RequestLike, role: Role): boolean {
  if (role === "AUDITOR") return false;
  if (role === "BUSINESS_USER")
    return req.status === "DRAFT_GENERATED" || req.status === "BU_REVIEW";
  if (role === "CONTRACT_OWNER") return req.status === "APPROVED";

  const stage = roleStage(role);
  if (stage)
    return req.status === "IN_APPROVAL" && isStageActionable(req.approvals, stage);

  if (role === "LEGAL_OPS")
    return (
      (req.status === "IN_APPROVAL" &&
        req.approvals.some((a) => isStageActionable(req.approvals, a.stage))) ||
      req.status === "APPROVED"
    );
  return false;
}
