// ============================================================
// SELA Legal — AI Contract Lifecycle Management (CLM)
// Domain model. Phase 1 vertical slice: DF intake → AI
// classification/routing → AI draft generation → multi-level
// approval → signature → obligation extraction → monitoring.
// ============================================================

import type { DfDetails } from "./df";

export type Locale = "en" | "ar";

/** Personas from the User Stories doc (Epics 1–14). */
export type Role =
  | "BUSINESS_USER" // creates DF requests, validates drafts, submits
  | "HEAD_OF_BU" // approval stage 1
  | "CSCCO" // approval stage 2
  | "CFO" // approval stage 3
  | "LEGAL" // approval stage 4 (legal reviewer)
  | "PROCUREMENT" // contract-review stage 1
  | "FINANCE" // contract-review stage 2
  | "LEGAL_OPS" // oversight / can act across stages
  | "CONTRACT_OWNER" // signature + execution monitoring
  | "AUDITOR"; // read-only history

/** End-to-end lifecycle status of a DF request / contract. */
export type RequestStatus =
  | "SUBMITTED" // US-001
  | "AI_ANALYZED" // US-003
  | "DRAFT_GENERATED" // US-005
  | "BU_REVIEW" // US-007
  | "IN_APPROVAL" // US-008/009/010
  | "APPROVED"
  | "CONFIRMED" // business user confirmed the AI-generated contract
  | "CONTRACT_REVIEW" // contract reviewed by Procurement → Finance → Legal
  | "CONTRACT_REVISION" // back to business user to address review comments
  | "FINAL_APPROVAL" // revised contract awaiting Legal Reviewer's final approval
  | "THIRD_PARTY_REVIEW" // shared with the external counterparty for review
  | "THIRD_PARTY_APPROVED" // third party approved — awaiting business user's final confirmation
  | "FINAL_CONFIRM" // finally approved — awaiting the business user's confirmation
  | "USER_SIGNATURE" // awaiting the business user's signature
  | "THIRD_PARTY_SIGNATURE" // signed by user — awaiting the third party's signature
  | "LEGAL_SIGNATURE" // signed by user, awaiting Legal Reviewer's counter-signature
  | "REJECTED"
  | "RETURNED" // rejected → returned to business user to edit & resubmit
  | "ARCHIVED" // rejected → archived (closed)
  | "SIGNED" // US-012
  | "ACTIVE"; // US-016 (obligations being monitored)

export type ContractCategory =
  | "NDA"
  | "SERVICE_AGREEMENT"
  | "SUPPLY"
  | "CONSULTING"
  | "EMPLOYMENT"
  | "LEASE"
  | "PARTNERSHIP"
  | "OTHER";

export type Department =
  | "LEGAL"
  | "PROCUREMENT"
  | "FINANCE"
  | "BUSINESS"
  | "IT"
  | "HR";

// Scope-approval chain: Head of BU → CSCCO → CFO → Legal.
// Contract-review chain: Procurement → Finance → Legal.
export type ApprovalStage =
  | "HEAD_OF_BU"
  | "CSCCO"
  | "CFO"
  | "LEGAL"
  | "PROCUREMENT"
  | "FINANCE";
export type ApprovalDecision =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CHANGES_REQUESTED";

export type Severity = "LOW" | "MEDIUM" | "HIGH";

export type ObligationType =
  | "DELIVERABLE"
  | "PAYMENT"
  | "MILESTONE"
  | "RENEWAL"
  | "COMPLIANCE";

export type ObligationStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "DONE"
  | "OVERDUE";

export interface DocumentFile {
  id: string;
  name: string;
  kind: "PDF" | "WORD" | "IMAGE";
  sizeKb: number;
  uploadedAt: string;
  /** Mock OCR/document-understanding excerpt (BR-06 / FR-03). */
  ocrSummary?: string;
}

export interface RiskIndicator {
  label: string;
  labelAr: string;
  severity: Severity;
}

/** Output of the AI classification engine (US-003 / US-004). */
export interface AiClassification {
  category: ContractCategory;
  confidence: number; // 0..1
  summary: string;
  summaryAr: string;
  stakeholders: string[];
  riskIndicators: RiskIndicator[];
  /** Ordered approval routing chain (US-004). */
  routing: ApprovalStage[];
  routingRationale: string;
  routingRationaleAr: string;
}

export interface Clause {
  id: string;
  title: string;
  titleAr: string;
  body: string;
  recommended: boolean;
  /** Why the AI suggested this clause (US-006). */
  rationale: string;
  rationaleAr: string;
}

/** AI-generated contract draft (US-005), with version history (US-007). */
export interface ContractDraft {
  title: string;
  bodyEn: string;
  bodyAr: string;
  /** Rich HTML rendering of the contract (tables, sections) — the editable doc. */
  bodyHtml: string;
  clauses: Clause[];
  version: number;
  updatedAt: string;
}

export interface DraftVersion {
  version: number;
  bodyEn: string;
  savedAt: string;
  savedBy: string;
  note: string;
}

export interface Approval {
  stage: ApprovalStage;
  decision: ApprovalDecision;
  reviewer?: string;
  comment?: string;
  decidedAt?: string;
}

export interface ComplianceFinding {
  id: string;
  label: string;
  labelAr: string;
  severity: Severity;
  resolved: boolean;
}

export interface Obligation {
  id: string;
  title: string;
  titleAr: string;
  type: ObligationType;
  assignedDept: Department;
  dueDate: string;
  status: ObligationStatus;
  amount?: number;
  currency?: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
}

/** Contract shared with an external company (the counterparty) via email link. */
export interface ThirdPartyShare {
  company: string;
  email: string;
  token: string;
  otp: string;
  /** Whether the email was actually delivered via SMTP. */
  emailed?: boolean;
  sharedAt: string;
  sharedBy: string;
  /** Status to resume to when the third party approves. */
  resumeStatus: RequestStatus;
}

/** A revised contract file uploaded by the third party (kept as-is). */
export interface ThirdPartyUpload {
  name: string;
  /** The file stored as a data URL so it can be downloaded exactly as uploaded. */
  dataUrl: string;
  uploadedAt: string;
  uploadedBy: string;
}

/** The external third party's review response. */
export interface ThirdPartyReview {
  name: string;
  decision: "APPROVED" | "CHANGES_REQUESTED";
  comment: string;
  reviewedAt: string;
}

export interface DFRequest {
  id: string;
  reference: string; // e.g. DF-2026-0001
  title: string;
  description: string;
  department: Department;
  requesterName: string;
  requestedLanguage: Locale;
  counterparty: string;
  estimatedValue?: number;
  currency: string;
  /** Structured DF (DEF 2026) intake fields. */
  df?: DfDetails;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  documents: DocumentFile[];
  classification?: AiClassification;
  draft?: ContractDraft;
  versions: DraftVersion[];
  approvals: Approval[];
  /** Second-phase contract review: Procurement → Finance → Legal. */
  contractReviews: Approval[];
  obligations: Obligation[];
  compliance: ComplianceFinding[];
  riskScore?: number; // 0..100 (US-011)
  // E-signatures: user signs first, then Legal counter-signs.
  signedByUser?: string;
  signedByUserAt?: string;
  signedByLegal?: string;
  signedByLegalAt?: string;
  signedByThirdParty?: string;
  signedByThirdPartyAt?: string;
  signedAt?: string; // final execution timestamp
  signedBy?: string;
  // External third-party (counterparty) review via email link.
  thirdParty?: ThirdPartyShare;
  thirdPartyReview?: ThirdPartyReview;
  /** A revised contract file the third party uploaded (downloadable as-is). */
  thirdPartyUpload?: ThirdPartyUpload;
  /** Business user's final confirmation after the third party approved. */
  finalConfirmedBy?: string;
  finalConfirmedAt?: string;
  audit: AuditEntry[];
}
