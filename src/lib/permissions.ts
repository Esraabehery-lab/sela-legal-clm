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

// Once signing/execution starts (or the request is closed) the contract is
// locked and can no longer be edited.
const EDIT_LOCKED_STATUSES: RequestStatus[] = [
  "USER_SIGNATURE",
  "THIRD_PARTY_SIGNATURE",
  "LEGAL_SIGNATURE",
  "SIGNED",
  "ACTIVE",
  "REJECTED",
  "ARCHIVED",
];

export function canEditDraft(role: Role, status?: RequestStatus): boolean {
  // Auditors are read-only.
  if (role === "AUDITOR") return false;
  // Everyone else can edit the AI-generated contract anytime before signing.
  if (!status) return true;
  return !EDIT_LOCKED_STATUSES.includes(status);
}

export function canEditRequest(role: Role, status: RequestStatus): boolean {
  return (
    (role === "BUSINESS_USER" || role === "LEGAL_OPS") &&
    (status === "AI_ANALYZED" ||
      status === "DRAFT_GENERATED" ||
      status === "BU_REVIEW" ||
      status === "RETURNED")
  );
}

export function canSubmitForApproval(role: Role, status: RequestStatus): boolean {
  return (
    (role === "BUSINESS_USER" || role === "LEGAL_OPS") &&
    (status === "AI_ANALYZED" ||
      status === "DRAFT_GENERATED" ||
      status === "BU_REVIEW" ||
      status === "RETURNED")
  );
}

/** Only the matching reviewer (or Legal Ops) can decide a given stage. */
export function canApproveStage(role: Role, stage: ApprovalStage): boolean {
  if (role === "LEGAL_OPS") return true;
  return role === stage; // PROCUREMENT / FINANCE / LEGAL
}

/** Business user confirms the AI-generated contract after full approval. */
export function canConfirmContract(role: Role, status: RequestStatus): boolean {
  return (
    (role === "BUSINESS_USER" || role === "LEGAL_OPS") && status === "APPROVED"
  );
}

/** Business user confirms the finally-approved contract before signing. */
export function canConfirmFinal(role: Role, status: RequestStatus): boolean {
  return (
    (role === "BUSINESS_USER" || role === "LEGAL_OPS") &&
    status === "FINAL_CONFIRM"
  );
}

/** The business user signs the contract in the portal (first signature). */
export function canSignByUser(role: Role, status: RequestStatus): boolean {
  return (
    (role === "BUSINESS_USER" || role === "LEGAL_OPS") &&
    status === "USER_SIGNATURE"
  );
}

/** The Legal Reviewer counter-signs after the user (final execution). */
export function canSignByLegal(role: Role, status: RequestStatus): boolean {
  return (
    (role === "LEGAL" || role === "LEGAL_OPS") && status === "LEGAL_SIGNATURE"
  );
}

/** Business user addresses contract-review comments and resubmits. */
export function canSubmitRevision(role: Role, status: RequestStatus): boolean {
  return (
    (role === "BUSINESS_USER" || role === "LEGAL_OPS") &&
    status === "CONTRACT_REVISION"
  );
}

/** Legal Reviewer gives the final approval on the revised contract. */
export function canFinalApprove(role: Role, status: RequestStatus): boolean {
  return (role === "LEGAL" || role === "LEGAL_OPS") && status === "FINAL_APPROVAL";
}

export function canManageObligations(role: Role): boolean {
  return role === "CONTRACT_OWNER" || role === "LEGAL_OPS";
}

/** The business user can share the contract with an external third party. */
export function canShareThirdParty(role: Role): boolean {
  return role === "BUSINESS_USER" || role === "LEGAL_OPS";
}

/** Business user's final confirmation after the third party approved. */
export function canConfirmAfterThirdParty(
  role: Role,
  status: RequestStatus,
): boolean {
  return (
    (role === "BUSINESS_USER" || role === "LEGAL_OPS") &&
    status === "THIRD_PARTY_APPROVED"
  );
}

/** The contract-review stage a reviewer role owns (Procurement/Finance/Legal). */
export function contractReviewStage(role: Role): ApprovalStage | null {
  if (role === "PROCUREMENT" || role === "FINANCE" || role === "LEGAL")
    return role;
  return null;
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
    en: "Approve the request scope, then review the generated contract and add comments.",
    ar: "اعتماد نطاق الطلب، ثم مراجعة العقد المُولّد وإضافة الملاحظات.",
  },
  PROCUREMENT: {
    en: "Review the generated contract and approve with comments (first contract-review stage).",
    ar: "مراجعة العقد المُولّد واعتماده مع الملاحظات (أول مرحلة مراجعة العقد).",
  },
  FINANCE: {
    en: "Review the generated contract and approve with comments (after Procurement).",
    ar: "مراجعة العقد المُولّد واعتماده مع الملاحظات (بعد المشتريات).",
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

type StageDecision = { stage: ApprovalStage; decision: string };
type RequestLike = {
  status: RequestStatus;
  approvals: StageDecision[];
  contractReviews: StageDecision[];
};

function phase1Awaits(req: RequestLike, role: Role): boolean {
  const stage = roleStage(role);
  return (
    !!stage &&
    req.status === "IN_APPROVAL" &&
    isStageActionable(req.approvals, stage)
  );
}

function phase2Awaits(req: RequestLike, role: Role): boolean {
  const stage = contractReviewStage(role);
  return (
    !!stage &&
    req.status === "CONTRACT_REVIEW" &&
    isStageActionable(req.contractReviews, stage)
  );
}

/** Whether a request is currently waiting on the given role to act. */
export function awaitsAction(req: RequestLike, role: Role): boolean {
  if (role === "AUDITOR") return false;
  if (role === "BUSINESS_USER")
    return (
      req.status === "AI_ANALYZED" ||
      req.status === "DRAFT_GENERATED" ||
      req.status === "BU_REVIEW" ||
      req.status === "RETURNED" ||
      req.status === "APPROVED" || // confirm the AI-generated contract
      req.status === "CONTRACT_REVIEW" || // contract under review — can edit
      req.status === "CONTRACT_REVISION" || // address review comments
      req.status === "THIRD_PARTY_APPROVED" || // final confirmation after third party
      req.status === "FINAL_CONFIRM" || // confirm after final approval
      req.status === "USER_SIGNATURE" // sign the contract in the portal
    );
  if (role === "CONTRACT_OWNER") return req.status === "CONFIRMED";

  if (phase1Awaits(req, role) || phase2Awaits(req, role)) return true;

  // Legal Reviewer's final approval + counter-signature.
  if (
    role === "LEGAL" &&
    (req.status === "FINAL_APPROVAL" || req.status === "LEGAL_SIGNATURE")
  )
    return true;

  if (role === "LEGAL_OPS")
    return (
      (req.status === "IN_APPROVAL" &&
        req.approvals.some((a) => isStageActionable(req.approvals, a.stage))) ||
      (req.status === "CONTRACT_REVIEW" &&
        req.contractReviews.some((a) =>
          isStageActionable(req.contractReviews, a.stage),
        )) ||
      req.status === "APPROVED" ||
      req.status === "CONTRACT_REVISION" ||
      req.status === "FINAL_APPROVAL" ||
      req.status === "FINAL_CONFIRM" ||
      req.status === "USER_SIGNATURE" ||
      req.status === "LEGAL_SIGNATURE" ||
      req.status === "CONFIRMED"
    );
  return false;
}
