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
  canUploadDocuments,
  canRunAi,
  canEditDraft,
  canSubmitForApproval,
  canApproveStage,
  canSign,
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
    obligations: [],
    compliance: [],
    audit: [],
  };
  addRequest(req);
  audit(req, parsed.requesterName, "Request created", `${reference} submitted`);

  // AI pipeline (US-003 → US-005 → US-011)
  req.classification = classify(req);
  req.status = "AI_ANALYZED";
  audit(req, "AI Engine", "Request classified", req.classification.summary);

  req.draft = generateContract(req);
  req.status = "DRAFT_GENERATED";
  audit(req, "AI Engine", "Draft generated", "Contract template generated from request");

  const comp = runCompliance(req);
  req.compliance = comp.findings;
  req.riskScore = comp.riskScore;
  audit(req, "AI Engine", "Compliance validated", `Risk score ${comp.riskScore}/100`);

  revalidatePath("/requests");
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
  bodyEn: z.string(),
  note: z.string().optional(),
});

/** US-007: business unit edits the draft; version history is kept. */
export async function saveDraft(formData: FormData): Promise<void> {
  const { requestId, bodyEn, note } = saveSchema.parse({
    requestId: formData.get("requestId"),
    bodyEn: formData.get("bodyEn"),
    note: formData.get("note") ?? "",
  });
  ensure(canEditDraft(getRole()));
  const req = getRequest(requestId);
  if (!req || !req.draft) return;
  // snapshot current version before overwriting
  req.versions.unshift({
    version: req.draft.version,
    bodyEn: req.draft.bodyEn,
    savedAt: req.draft.updatedAt,
    savedBy: whoami(),
    note: note || "Edited by business unit",
  });
  req.draft.bodyEn = bodyEn;
  req.draft.version += 1;
  req.draft.updatedAt = new Date().toISOString();
  if (req.status === "DRAFT_GENERATED") req.status = "BU_REVIEW";
  audit(req, whoami(), "Draft edited", `Saved version ${req.draft.version}`);
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
  decision: z.enum(["APPROVED", "REJECTED", "CHANGES_REQUESTED"]),
  comment: z.string().optional(),
});

/** US-008/009/010: record an approval decision for a stage (sequential). */
export async function decideApproval(formData: FormData): Promise<void> {
  const { requestId, stage, decision, comment } = decideSchema.parse({
    requestId: formData.get("requestId"),
    stage: formData.get("stage"),
    decision: formData.get("decision"),
    comment: formData.get("comment") ?? "",
  });
  ensure(canApproveStage(getRole(), stage));
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
    req.status = "REJECTED";
  } else if (req.approvals.every((a) => a.decision === "APPROVED")) {
    req.status = "APPROVED";
    audit(req, "System", "Fully approved", "All approval stages cleared");
  }
  revalidatePath(`/requests/${req.id}`);
}

/** US-012: mark the contract signed + executed, then extract obligations. */
export async function signContract(requestId: string): Promise<void> {
  const req = getRequest(requestId);
  if (!req) return;
  ensure(canSign(getRole(), req.status));
  req.status = "SIGNED";
  req.signedAt = new Date().toISOString();
  req.signedBy = whoami();
  audit(req, whoami(), "Contract signed", "Execution complete");

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
