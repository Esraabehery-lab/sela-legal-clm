"use server";

// Server actions = the write side of the CLM. Each mutation updates the
// in-memory store, records an audit entry (US-018), then revalidates.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type {
  DFRequest,
  Department,
  Locale,
  Role,
  ApprovalStage,
  ApprovalDecision,
  ObligationStatus,
} from "./types";
import type { DfDetails } from "./df";
import { REQUIRED_DOCS } from "./df";
import {
  addRequest,
  audit,
  getRequest,
  getRequestByToken,
  nextReference,
} from "./store";
import {
  classify,
  generateContract,
  runCompliance,
  extractObligations,
  mockOcr,
} from "./ai";
import { LOCALE_COOKIE, ROLE_COOKIE, actorName } from "./roles";
import { getRole, getLocale } from "./prefs";
import {
  canCreateRequest,
  canEditRequest,
  canConfirmContract,
  canSubmitRevision,
  canFinalApprove,
  canConfirmFinal,
  canSignByUser,
  canSignByLegal,
  canShareThirdParty,
  canConfirmAfterThirdParty,
  canUploadDocuments,
  canRunAi,
  canEditDraft,
  canSubmitForApproval,
  canApproveStage,
  canManageObligations,
  isStageActionable,
} from "./permissions";

function whoami(): string {
  return actorName(getRole(), getLocale());
}

/** Throws if the current role is not allowed to perform the action. */
function ensure(allowed: boolean): void {
  if (!allowed) {
    throw new Error(
      "Not permitted: your current role cannot perform this action.",
    );
  }
}

/** Read a trimmed string field from a form, or undefined when blank. */
function str(fd: FormData, key: string): string | undefined {
  const v = fd.get(key);
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length ? t : undefined;
}

/** Read a numeric field from a form, or undefined when blank/invalid. */
function num(fd: FormData, key: string): number | undefined {
  const v = str(fd, key);
  if (v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/** Build the structured DF intake object from the submitted form. */
function parseDfDetails(fd: FormData): DfDetails {
  const docs = fd.getAll("counterpartyDocs").filter((d): d is string => typeof d === "string");
  const required = REQUIRED_DOCS.filter(
    (d) => fd.get(`requiredDoc_${d.key}`) != null,
  ).map((d) => d.en);
  const df: DfDetails = {
    documentType: str(fd, "documentType"),
    businessUnit: str(fd, "businessUnit"),
    binding: str(fd, "binding"),
    financialType: str(fd, "financialType"),
    contractNature: str(fd, "contractNature"),
    projectName: str(fd, "projectName"),
    location: str(fd, "location"),
    commercialBrand: str(fd, "commercialBrand"),
    country: str(fd, "country"),
    budgetCode: str(fd, "budgetCode"),
    prNumber: str(fd, "prNumber"),
    prStatus: str(fd, "prStatus"),
    legalName: str(fd, "legalName"),
    address: str(fd, "address"),
    authorizedSignatory: str(fd, "authorizedSignatory"),
    signatoryTitle: str(fd, "signatoryTitle"),
    projectManager: str(fd, "projectManager"),
    projectManagerEmail: str(fd, "projectManagerEmail"),
    projectManagerPhone: str(fd, "projectManagerPhone"),
    requiredDocs: required.length ? required : undefined,
    counterpartyDocs: docs.length ? docs : undefined,
    durationYears: num(fd, "durationYears"),
    durationMonths: num(fd, "durationMonths"),
    durationDays: num(fd, "durationDays"),
    startDate: str(fd, "startDate"),
    endDate: str(fd, "endDate"),
    totalValueExVat: num(fd, "totalValueExVat"),
    vatAmount: num(fd, "vatAmount"),
    grandTotal: num(fd, "grandTotal"),
    paymentTerms: str(fd, "paymentTerms"),
    paidBy: str(fd, "paidBy"),
    automaticRenewal: fd.get("automaticRenewal") === "on",
    terminationNotice: str(fd, "terminationNotice"),
  };
  // drop undefined keys so an empty form stores nothing
  (Object.keys(df) as (keyof DfDetails)[]).forEach((k) => {
    if (df[k] === undefined) delete df[k];
  });
  // automaticRenewal=false is noise when nothing else set
  if (df.automaticRenewal === false && Object.keys(df).length === 1)
    delete df.automaticRenewal;
  return df;
}

export async function setLocale(locale: Locale): Promise<void> {
  cookies().set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/", "layout");
}

export async function setRole(role: Role): Promise<void> {
  cookies().set(ROLE_COOKIE, role, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/", "layout");
}

const createSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  department: z.string(),
  counterparty: z.string().min(2),
  requesterName: z.string().min(2),
  estimatedValue: z.string().optional(),
  currency: z.string().default("SAR"),
  requestedLanguage: z.enum(["en", "ar"]).default("en"),
});

/**
 * US-001 + US-003 + US-005: create the DF request, then immediately run AI
 * classification, routing, draft generation and a compliance pass so the
 * detail page opens fully populated.
 */
export async function createRequest(formData: FormData): Promise<void> {
  ensure(canCreateRequest(getRole()));
  const parsed = createSchema.parse({
    title: formData.get("title"),
    description: formData.get("description"),
    department: formData.get("department"),
    counterparty: formData.get("counterparty"),
    requesterName: formData.get("requesterName"),
    estimatedValue: formData.get("estimatedValue") ?? undefined,
    currency: formData.get("currency") ?? "SAR",
    requestedLanguage: (formData.get("requestedLanguage") as Locale) ?? "en",
  });

  // Structured DF (DEF 2026) intake.
  const df = parseDfDetails(formData);
  if (!df.financialType) throw new Error("Financial Type is required.");

  // All mandatory counterparty documents must be attached.
  if ((df.requiredDocs?.length ?? 0) < REQUIRED_DOCS.length) {
    throw new Error(
      "All required documents must be attached before the request can be submitted.",
    );
  }

  const now = new Date().toISOString();
  const reference = nextReference();
  const manualValue = parsed.estimatedValue
    ? Number(parsed.estimatedValue)
    : undefined;
  // Prefer the DF grand total / ex-VAT total when provided.
  const value = df.grandTotal ?? df.totalValueExVat ?? manualValue;

  const req: DFRequest = {
    id: `req_${Date.now().toString(36)}`,
    reference,
    title: parsed.title,
    description: parsed.description,
    department: parsed.department as Department,
    requesterName: parsed.requesterName,
    requestedLanguage: parsed.requestedLanguage,
    counterparty: parsed.counterparty,
    estimatedValue: typeof value === "number" && Number.isFinite(value) ? value : undefined,
    currency: parsed.currency || "SAR",
    df: Object.keys(df).length ? df : undefined,
    status: "SUBMITTED",
    createdAt: now,
    updatedAt: now,
    documents: [],
    versions: [],
    approvals: [],
    contractReviews: [],
    obligations: [],
    compliance: [],
    audit: [],
  };
  addRequest(req);
  audit(req, parsed.requesterName, "Request created", `${reference} submitted`);

  // AI classification only (for routing). The contract itself is generated
  // after the Legal Reviewer (final stage) approves — not at intake.
  req.classification = classify(req);
  req.status = "AI_ANALYZED";
  audit(req, "AI Engine", "Request classified", req.classification.summary);

  revalidatePath("/requests");
  redirect(`/requests/${req.id}`);
}

/**
 * Edit a returned request and resubmit it. The Business User updates the DF
 * form; classification re-runs and the approval chain restarts.
 */
export async function updateRequest(formData: FormData): Promise<void> {
  const requestId = String(formData.get("requestId") ?? "");
  const req = getRequest(requestId);
  if (!req) return;
  ensure(canEditRequest(getRole(), req.status));

  const parsed = createSchema.parse({
    title: formData.get("title"),
    description: formData.get("description"),
    department: formData.get("department"),
    counterparty: formData.get("counterparty"),
    requesterName: formData.get("requesterName"),
    estimatedValue: formData.get("estimatedValue") ?? undefined,
    currency: formData.get("currency") ?? "SAR",
    requestedLanguage: (formData.get("requestedLanguage") as Locale) ?? "en",
  });
  const df = parseDfDetails(formData);
  if (!df.financialType) throw new Error("Financial Type is required.");
  if ((df.requiredDocs?.length ?? 0) < REQUIRED_DOCS.length) {
    throw new Error(
      "All required documents must be attached before resubmitting.",
    );
  }

  req.title = parsed.title;
  req.description = parsed.description;
  req.department = parsed.department as Department;
  req.requesterName = parsed.requesterName;
  req.requestedLanguage = parsed.requestedLanguage;
  req.counterparty = parsed.counterparty;
  req.currency = parsed.currency || "SAR";
  req.df = Object.keys(df).length ? df : undefined;
  const value = df.grandTotal ?? df.totalValueExVat;
  if (typeof value === "number" && Number.isFinite(value))
    req.estimatedValue = value;
  audit(req, whoami(), "Request edited", "Business user updated the DF form");

  // Re-classify and restart the approval chain.
  req.classification = classify(req);
  req.approvals = req.classification.routing.map((stage) => ({
    stage,
    decision: "PENDING" as ApprovalDecision,
  }));
  req.status = "IN_APPROVAL";
  audit(
    req,
    whoami(),
    "Resubmitted for approval",
    `Routed ${req.classification.routing.join(" → ")} → Signature`,
  );

  revalidatePath("/requests");
  revalidatePath("/dashboard");
  redirect(`/requests/${req.id}`);
}

const docSchema = z.object({
  requestId: z.string(),
  name: z.string().min(1),
  kind: z.enum(["PDF", "WORD", "IMAGE"]),
});

/** US-002: attach a supporting document (mock upload + OCR). */
export async function addDocument(formData: FormData): Promise<void> {
  const { requestId, name, kind } = docSchema.parse({
    requestId: formData.get("requestId"),
    name: formData.get("name"),
    kind: formData.get("kind"),
  });
  ensure(canUploadDocuments(getRole()));
  const req = getRequest(requestId);
  if (!req) return;
  req.documents.push({
    id: `doc_${Date.now().toString(36)}`,
    name,
    kind,
    sizeKb: 200 + Math.floor(Math.random() * 1200),
    uploadedAt: new Date().toISOString(),
    ocrSummary: mockOcr(name),
  });
  audit(req, whoami(), "Document uploaded", name);
  revalidatePath(`/requests/${req.id}`);
}

/** Re-run AI classification + draft (idempotent helper). */
export async function regenerate(requestId: string): Promise<void> {
  ensure(canRunAi(getRole()));
  const req = getRequest(requestId);
  if (!req) return;
  req.classification = classify(req);
  req.draft = generateContract(req);
  const comp = runCompliance(req);
  req.compliance = comp.findings;
  req.riskScore = comp.riskScore;
  if (req.status === "SUBMITTED" || req.status === "AI_ANALYZED")
    req.status = "DRAFT_GENERATED";
  audit(req, "AI Engine", "Draft regenerated", `Version ${req.draft.version}`);
  revalidatePath(`/requests/${req.id}`);
}

const saveSchema = z.object({
  requestId: z.string(),
  bodyHtml: z.string(),
  note: z.string().optional(),
});

/** Plain-text fallback derived from the rich HTML (for the external page). */
function htmlToText(html: string): string {
  return html
    .replace(/<\/(p|tr|h1|h2|li|table)>/gi, "\n")
    .replace(/<br\s*\/?>(?=)/gi, "\n")
    .replace(/<th[^>]*>/gi, "")
    .replace(/<td[^>]*>/gi, " | ")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** US-007: business unit edits the rich contract; version history is kept. */
export async function saveDraft(formData: FormData): Promise<void> {
  const { requestId, bodyHtml, note } = saveSchema.parse({
    requestId: formData.get("requestId"),
    bodyHtml: formData.get("bodyHtml"),
    note: formData.get("note") ?? "",
  });
  const req = getRequest(requestId);
  if (!req || !req.draft) return;
  ensure(canEditDraft(getRole(), req.status));
  // snapshot current version before overwriting
  req.versions.unshift({
    version: req.draft.version,
    bodyEn: req.draft.bodyEn,
    savedAt: req.draft.updatedAt,
    savedBy: whoami(),
    note: note || "Edited",
  });
  req.draft.bodyHtml = bodyHtml;
  req.draft.bodyEn = htmlToText(bodyHtml);
  req.draft.version += 1;
  req.draft.updatedAt = new Date().toISOString();
  if (req.status === "DRAFT_GENERATED") req.status = "BU_REVIEW";
  audit(req, whoami(), "Contract edited", `Saved version ${req.draft.version}`);
  revalidatePath(`/requests/${req.id}`);
}

/** US-008..010: submit the validated draft into the approval chain. */
export async function submitForApproval(requestId: string): Promise<void> {
  const req = getRequest(requestId);
  if (!req || !req.classification) return;
  ensure(canSubmitForApproval(getRole(), req.status));
  req.approvals = req.classification.routing.map((stage) => ({
    stage,
    decision: "PENDING" as ApprovalDecision,
  }));
  req.status = "IN_APPROVAL";
  audit(
    req,
    whoami(),
    "Submitted for approval",
    `Routed ${req.classification.routing.join(" → ")} → Signature`,
  );
  revalidatePath(`/requests/${req.id}`);
}

const decideSchema = z.object({
  requestId: z.string(),
  stage: z.enum(["HEAD_OF_BU", "CSCCO", "CFO", "LEGAL"]),
  decision: z.enum(["APPROVED", "REJECTED"]),
  comment: z.string().optional(),
  // On reject, the reviewer chooses what happens next.
  outcome: z.enum(["RETURN", "ARCHIVE"]).optional(),
});

/** US-008/009/010: record an approval decision for a stage (sequential). */
export async function decideApproval(formData: FormData): Promise<void> {
  const { requestId, stage, decision, comment, outcome } = decideSchema.parse({
    requestId: formData.get("requestId"),
    stage: formData.get("stage"),
    decision: formData.get("decision"),
    comment: formData.get("comment") ?? "",
    outcome: formData.get("outcome") ?? undefined,
  });
  ensure(canApproveStage(getRole(), stage));
  // A rejection must include a reason.
  if (decision === "REJECTED" && !comment?.trim()) {
    throw new Error("A comment is required when rejecting a request.");
  }
  const req = getRequest(requestId);
  if (!req) return;
  // Enforce the sequential chain — earlier stages must be approved first.
  ensure(isStageActionable(req.approvals, stage));
  const ap = req.approvals.find((a) => a.stage === stage);
  if (!ap) return;
  ap.decision = decision as ApprovalDecision;
  ap.reviewer = whoami();
  ap.comment = comment;
  ap.decidedAt = new Date().toISOString();
  audit(req, whoami(), "Approval decision", `${stage}: ${decision}`);

  if (decision === "REJECTED") {
    if (outcome === "ARCHIVE") {
      req.status = "ARCHIVED";
      audit(req, whoami(), "Request archived", comment || "Archived after rejection");
    } else {
      // Default: return to the business user to edit and resubmit.
      req.status = "RETURNED";
      audit(
        req,
        whoami(),
        "Returned to business user",
        comment || "Returned for edit & resubmit",
      );
    }
  } else if (req.approvals.every((a) => a.decision === "APPROVED")) {
    req.status = "APPROVED";
    audit(req, "System", "Fully approved", "All approval stages cleared");
    // Legal Reviewer is the final stage — their approval triggers AI
    // contract generation (US-005) + a compliance pass (US-011).
    if (!req.draft) {
      req.draft = generateContract(req);
      const comp = runCompliance(req);
      req.compliance = comp.findings;
      req.riskScore = comp.riskScore;
      audit(
        req,
        "AI Engine",
        "Contract generated",
        `AI generated the contract after Legal approval · risk ${comp.riskScore}/100`,
      );
    }
  }
  revalidatePath(`/requests/${req.id}`);
  revalidatePath("/dashboard");
}

/**
 * Business user confirms the AI-generated contract, which sends it into the
 * contract-review phase: Procurement → Finance → Legal.
 */
export async function confirmContract(requestId: string): Promise<void> {
  const req = getRequest(requestId);
  if (!req) return;
  ensure(canConfirmContract(getRole(), req.status));
  req.contractReviews = (["PROCUREMENT", "FINANCE", "LEGAL"] as const).map(
    (stage) => ({ stage, decision: "PENDING" as ApprovalDecision }),
  );
  req.status = "CONTRACT_REVIEW";
  audit(
    req,
    whoami(),
    "Contract confirmed",
    "Confirmed — routed to Procurement → Finance → Legal for contract review",
  );
  revalidatePath(`/requests/${req.id}`);
  revalidatePath("/dashboard");
}

const reviewSchema = z.object({
  requestId: z.string(),
  stage: z.enum(["PROCUREMENT", "FINANCE", "LEGAL"]),
  decision: z.enum(["APPROVED", "REJECTED"]),
  comment: z.string().optional(),
});

/**
 * Contract-review decision (Procurement → Finance → Legal). A comment is
 * mandatory. After Legal reviews, the contract returns to the business user to
 * address the comments.
 */
export async function reviewContract(formData: FormData): Promise<void> {
  const { requestId, stage, decision, comment } = reviewSchema.parse({
    requestId: formData.get("requestId"),
    stage: formData.get("stage"),
    decision: formData.get("decision"),
    comment: formData.get("comment") ?? "",
  });
  ensure(canApproveStage(getRole(), stage));
  const req = getRequest(requestId);
  if (!req) return;
  ensure(isStageActionable(req.contractReviews, stage));
  const rv = req.contractReviews.find((a) => a.stage === stage);
  if (!rv) return;
  rv.decision = decision as ApprovalDecision;
  rv.reviewer = whoami();
  rv.comment = comment;
  rv.decidedAt = new Date().toISOString();
  audit(req, whoami(), "Contract review", `${stage}: ${decision} — ${comment}`);

  const allReviewed = req.contractReviews.every(
    (a) => a.decision === "APPROVED",
  );
  if (decision === "REJECTED") {
    // A rejection returns it to the business user to address the comments.
    req.status = "CONTRACT_REVISION";
    audit(
      req,
      "System",
      "Returned for contract revision",
      "Business user to address the contract review comments",
    );
  } else if (allReviewed) {
    // Procurement → Finance → Legal all approved — the business user signs next.
    req.status = "USER_SIGNATURE";
    audit(
      req,
      "System",
      "Contract review complete",
      "Procurement, Finance and Legal approved — sent to the user to sign",
    );
  }
  revalidatePath(`/requests/${req.id}`);
  revalidatePath("/dashboard");
}

/**
 * Business user addresses the contract-review comments and finalises the
 * contract, making it ready for the Contract Owner to sign.
 */
export async function submitRevisedContract(requestId: string): Promise<void> {
  const req = getRequest(requestId);
  if (!req) return;
  ensure(canSubmitRevision(getRole(), req.status));
  req.status = "FINAL_APPROVAL";
  audit(
    req,
    whoami(),
    "Revised contract submitted",
    "Addressed review comments — sent to Legal Reviewer for final approval",
  );
  revalidatePath(`/requests/${req.id}`);
  revalidatePath("/dashboard");
}

/** Legal Reviewer's final approval — sends the contract to the user to confirm. */
export async function finalApproveContract(requestId: string): Promise<void> {
  const req = getRequest(requestId);
  if (!req) return;
  ensure(canFinalApprove(getRole(), req.status));
  req.status = "FINAL_CONFIRM";
  audit(
    req,
    whoami(),
    "Final approval",
    "Legal Reviewer gave final approval — sent to the user to confirm",
  );
  revalidatePath(`/requests/${req.id}`);
  revalidatePath("/dashboard");
}

/** Business user confirms the finally-approved contract, then signs it. */
export async function confirmFinalContract(requestId: string): Promise<void> {
  const req = getRequest(requestId);
  if (!req) return;
  ensure(canConfirmFinal(getRole(), req.status));
  req.status = "USER_SIGNATURE";
  audit(
    req,
    whoami(),
    "Contract confirmed",
    "Business user confirmed the finally-approved contract — ready to sign",
  );
  revalidatePath(`/requests/${req.id}`);
  revalidatePath("/dashboard");
}

const signSchema = z.object({
  requestId: z.string(),
  signerName: z.string().min(2),
});

/** The business user signs the contract in the portal, then it goes to Legal. */
export async function signByUser(formData: FormData): Promise<void> {
  const { requestId, signerName } = signSchema.parse({
    requestId: formData.get("requestId"),
    signerName: formData.get("signerName"),
  });
  const req = getRequest(requestId);
  if (!req) return;
  ensure(canSignByUser(getRole(), req.status));
  req.signedByUser = signerName;
  req.signedByUserAt = new Date().toISOString();
  if (req.thirdParty) {
    // Send the signed contract back to the third party to counter-sign.
    req.thirdPartyReview = undefined;
    req.status = "THIRD_PARTY_SIGNATURE";
    audit(
      req,
      signerName,
      "Signed by user",
      `Signed by the user — sent to ${req.thirdParty.company} to sign`,
    );
  } else {
    req.status = "LEGAL_SIGNATURE";
    audit(
      req,
      signerName,
      "Signed by user",
      "Contract signed by the user — sent to Legal Reviewer to counter-sign",
    );
  }
  revalidatePath(`/requests/${req.id}`);
  revalidatePath("/dashboard");
}

/** The Legal Reviewer counter-signs; the contract is then executed. */
export async function signByLegal(formData: FormData): Promise<void> {
  const { requestId, signerName } = signSchema.parse({
    requestId: formData.get("requestId"),
    signerName: formData.get("signerName"),
  });
  const req = getRequest(requestId);
  if (!req) return;
  ensure(canSignByLegal(getRole(), req.status));
  const now = new Date().toISOString();
  req.signedByLegal = signerName;
  req.signedByLegalAt = now;
  req.signedAt = now;
  req.signedBy = signerName;
  req.status = "SIGNED";
  audit(req, signerName, "Signed by Legal", "Counter-signed — execution complete");

  // US-013/014/015: AI extraction + department assignment
  req.obligations = extractObligations(req);
  req.status = "ACTIVE";
  audit(
    req,
    "AI Engine",
    "Obligations extracted",
    `${req.obligations.length} obligations assigned to departments`,
  );
  revalidatePath(`/requests/${req.id}`);
  revalidatePath("/dashboard");
}

const obSchema = z.object({
  requestId: z.string(),
  obligationId: z.string(),
  status: z.enum(["PENDING", "IN_PROGRESS", "DONE", "OVERDUE"]),
});

/** US-016: update execution status of an obligation. */
export async function updateObligation(formData: FormData): Promise<void> {
  const { requestId, obligationId, status } = obSchema.parse({
    requestId: formData.get("requestId"),
    obligationId: formData.get("obligationId"),
    status: formData.get("status"),
  });
  ensure(canManageObligations(getRole()));
  const req = getRequest(requestId);
  if (!req) return;
  const ob = req.obligations.find((o) => o.id === obligationId);
  if (!ob) return;
  ob.status = status as ObligationStatus;
  audit(req, whoami(), "Obligation updated", `${ob.title} → ${status}`);
  revalidatePath(`/requests/${req.id}`);
  revalidatePath("/obligations");
}

// ============================================================
// External third-party (counterparty) review via email link
// ============================================================

const shareSchema = z.object({
  requestId: z.string(),
  company: z.string().min(2),
  email: z.string().email(),
});

/** Business user shares the contract with an external company (email link). */
export async function shareWithThirdParty(formData: FormData): Promise<void> {
  const { requestId, company, email } = shareSchema.parse({
    requestId: formData.get("requestId"),
    company: formData.get("company"),
    email: formData.get("email"),
  });
  ensure(canShareThirdParty(getRole()));
  const req = getRequest(requestId);
  if (!req || !req.draft) return;
  const token = `tp_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
  const otp = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
  req.thirdParty = {
    company,
    email,
    token,
    otp,
    sharedAt: new Date().toISOString(),
    sharedBy: whoami(),
    resumeStatus: req.status, // resume the cycle here when they approve
  };
  req.thirdPartyReview = undefined;
  req.status = "THIRD_PARTY_REVIEW";
  audit(
    req,
    whoami(),
    "Shared with third party",
    `Contract shared with ${company} (${email}) — OTP sent`,
  );
  // No mail service in this demo — log the "email" to the dev console.
  // eslint-disable-next-line no-console
  console.log(`[email→${email}] SELA contract access code (OTP): ${otp}`);
  revalidatePath(`/requests/${req.id}`);
  revalidatePath("/dashboard");
}

/** The third party enters the OTP from their email to unlock the contract. */
export async function verifyTpOtp(token: string, otp: string): Promise<boolean> {
  const req = getRequestByToken(token);
  if (!req?.thirdParty) return false;
  if (req.thirdParty.otp !== otp.trim()) return false;
  cookies().set(`tpok_${token}`, "1", {
    path: "/",
    maxAge: 60 * 60 * 24,
  });
  revalidatePath(`/external/${token}`);
  return true;
}

const tpReviewSchema = z.object({
  token: z.string(),
  name: z.string().min(2),
  decision: z.enum(["APPROVED", "CHANGES_REQUESTED"]),
  comment: z.string().optional(),
  body: z.string().optional(),
});

/** The external third party submits their review (and edits) from the link. */
export async function submitThirdPartyReview(formData: FormData): Promise<void> {
  const { token, name, decision, comment, body } = tpReviewSchema.parse({
    token: formData.get("token"),
    name: formData.get("name"),
    decision: formData.get("decision"),
    comment: formData.get("comment") ?? "",
    body: formData.get("body") ?? undefined,
  });
  const req = getRequestByToken(token);
  if (!req || !req.draft) return;
  const actor = `${name} (${req.thirdParty?.company ?? "Third Party"})`;

  // Save the third party's edits to the contract (version-tracked).
  if (body && body.trim() && body !== req.draft.bodyHtml) {
    req.versions.unshift({
      version: req.draft.version,
      bodyEn: req.draft.bodyEn,
      savedAt: req.draft.updatedAt,
      savedBy: actor,
      note: "Edited by third party",
    });
    req.draft.bodyHtml = body;
    req.draft.bodyEn = htmlToText(body);
    req.draft.version += 1;
    req.draft.updatedAt = new Date().toISOString();
    audit(req, actor, "Contract edited", `Third party edited the contract (v${req.draft.version})`);
  }

  req.thirdPartyReview = {
    name,
    decision,
    comment: comment ?? "",
    reviewedAt: new Date().toISOString(),
  };
  audit(req, actor, "Third-party review", `${decision}${comment ? ` — ${comment}` : ""}`);

  if (req.status === "THIRD_PARTY_REVIEW") {
    if (decision === "APPROVED") {
      // Third party approved — back to the business user for final confirmation.
      req.status = "THIRD_PARTY_APPROVED";
      audit(req, "System", "Third party approved", "Approved by the third party — awaiting the business user's final confirmation");
    } else {
      // Changes requested — back to the business user to revise.
      req.status = "CONTRACT_REVISION";
      audit(req, "System", "Third party requested changes", "Returned to the business user to revise");
    }
  }
  revalidatePath(`/requests/${req.id}`);
  revalidatePath("/dashboard");
  revalidatePath(`/external/${token}`);
}

/** Business user's final confirmation after the third party approved. */
export async function confirmAfterThirdParty(requestId: string): Promise<void> {
  const req = getRequest(requestId);
  if (!req) return;
  ensure(canConfirmAfterThirdParty(getRole(), req.status));
  // Resume the cycle where it was paused before sharing.
  req.status = req.thirdParty?.resumeStatus ?? "USER_SIGNATURE";
  audit(
    req,
    whoami(),
    "Final confirmation",
    "Business user confirmed after the third party's approval — cycle resumed",
  );
  revalidatePath(`/requests/${req.id}`);
  revalidatePath("/dashboard");
}

/** The third party signs the contract from the external link (final step). */
export async function signByThirdParty(formData: FormData): Promise<void> {
  const token = String(formData.get("token") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) throw new Error("A signer name is required.");
  const req = getRequestByToken(token);
  if (!req || req.status !== "THIRD_PARTY_SIGNATURE") return;
  const now = new Date().toISOString();
  req.signedByThirdParty = `${name} (${req.thirdParty?.company ?? "Third Party"})`;
  req.signedByThirdPartyAt = now;
  req.signedAt = now;
  req.signedBy = req.signedByThirdParty;
  req.status = "SIGNED";
  audit(req, req.signedByThirdParty, "Signed by third party", "Counter-signed — execution complete");

  req.obligations = extractObligations(req);
  req.status = "ACTIVE";
  audit(
    req,
    "AI Engine",
    "Obligations extracted",
    `${req.obligations.length} obligations assigned to departments`,
  );
  revalidatePath(`/requests/${req.id}`);
  revalidatePath("/dashboard");
  revalidatePath(`/external/${token}`);
}
