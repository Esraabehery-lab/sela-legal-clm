// Demo seed data covering several lifecycle states so every screen has
// something meaningful to show on first load.

import type { DFRequest, AuditEntry } from "./types";
import {
  classify,
  generateContract,
  runCompliance,
  extractObligations,
  mockOcr,
} from "./ai";

let auditSeq = 0;
function auditEntry(
  daysAgo: number,
  actor: string,
  action: string,
  detail: string,
): AuditEntry {
  auditSeq += 1;
  return {
    id: `seed_au_${auditSeq}`,
    at: new Date(Date.now() - daysAgo * 86_400_000).toISOString(),
    actor,
    action,
    detail,
  };
}

function base(
  idx: number,
  partial: Partial<DFRequest> & Pick<DFRequest, "title" | "description" | "department" | "counterparty">,
): DFRequest {
  const createdDaysAgo = 20 - idx * 3;
  const ref = `DF-${new Date().getFullYear()}-${String(idx).padStart(4, "0")}`;
  return {
    id: `seed_${idx}`,
    reference: ref,
    title: partial.title,
    description: partial.description,
    department: partial.department,
    requesterName: partial.requesterName ?? "Sara Al-Otaibi",
    requestedLanguage: partial.requestedLanguage ?? "en",
    counterparty: partial.counterparty,
    estimatedValue: partial.estimatedValue,
    currency: partial.currency ?? "SAR",
    status: partial.status ?? "SUBMITTED",
    createdAt: new Date(Date.now() - createdDaysAgo * 86_400_000).toISOString(),
    updatedAt: new Date(Date.now() - createdDaysAgo * 86_400_000).toISOString(),
    documents: partial.documents ?? [],
    classification: partial.classification,
    draft: partial.draft,
    versions: partial.versions ?? [],
    approvals: partial.approvals ?? [],
    obligations: partial.obligations ?? [],
    compliance: partial.compliance ?? [],
    riskScore: partial.riskScore,
    signedAt: partial.signedAt,
    signedBy: partial.signedBy,
    audit: partial.audit ?? [auditEntry(createdDaysAgo, partial.requesterName ?? "Sara Al-Otaibi", "Request created", `${ref} submitted`)],
  };
}

export function seedRequests(): DFRequest[] {
  // 1) Fresh, just submitted (no AI yet)
  const r1 = base(1, {
    title: "IT Managed Services Agreement",
    description:
      "Request to engage a vendor for managed IT support services and SLA-backed helpdesk for 24 months.",
    department: "IT",
    counterparty: "Najm Technologies",
    estimatedValue: 480_000,
    requesterName: "Omar Khalid",
    status: "SUBMITTED",
    df: {
      documentType: "Contract",
      businessUnit: "Corporate",
      contractNature: "General Services",
      financialType: "Cash-Out",
      binding: "Binding",
      projectName: "Enterprise IT Modernisation",
      location: "Riyadh HQ",
      country: "Saudi Arabia",
      budgetCode: "IT-2026-014",
      prNumber: "PR-88231",
      prStatus: "Approved",
      legalName: "Najm Technologies Co. LLC",
      address: "King Fahd Road, Riyadh 12211",
      authorizedSignatory: "Khalid Al-Dossari",
      signatoryTitle: "Managing Director",
      projectManager: "Lina Saud",
      projectManagerEmail: "lina@najm.example",
      projectManagerPhone: "+966 50 123 4567",
      counterpartyDocs: ["CR", "VAT", "Authorization Letter", "KYC"],
      durationYears: 2,
      startDate: new Date(Date.now() + 14 * 86_400_000).toISOString(),
      endDate: new Date(Date.now() + 744 * 86_400_000).toISOString(),
      totalValueExVat: 480_000,
      vatAmount: 72_000,
      grandTotal: 552_000,
      paymentTerms: "60",
      paidBy: "Sela",
      automaticRenewal: true,
      terminationNotice: "30 Days",
    },
    documents: [
      {
        id: "seed_doc_1",
        name: "vendor-proposal.pdf",
        kind: "PDF",
        sizeKb: 842,
        uploadedAt: new Date(Date.now() - 17 * 86_400_000).toISOString(),
        ocrSummary: mockOcr("vendor-proposal.pdf"),
      },
    ],
  });

  // 2) AI analyzed + draft generated, in business review
  const r2 = base(2, {
    title: "Office Supplies Supply Contract",
    description:
      "Supply of office consumables and furniture delivery on a quarterly purchase schedule.",
    department: "PROCUREMENT",
    counterparty: "Gulf Office Supplies Co.",
    estimatedValue: 220_000,
    requesterName: "Fatima Al-Harbi",
    status: "BU_REVIEW",
  });
  r2.classification = classify(r2);
  r2.draft = generateContract(r2);
  const comp2 = runCompliance(r2);
  r2.compliance = comp2.findings;
  r2.riskScore = comp2.riskScore;
  r2.audit = [
    auditEntry(2, "AI Engine", "Compliance validated", `Risk score ${comp2.riskScore}/100`),
    auditEntry(3, "AI Engine", "Draft generated", "Contract template generated from request"),
    auditEntry(3, "AI Engine", "Request classified", "Categorised as Supply Contract"),
    auditEntry(14, "Fatima Al-Harbi", "Request created", `${r2.reference} submitted`),
  ];

  // 3) In multi-level approval (Procurement approved, Finance pending)
  const r3 = base(3, {
    title: "Marketing Consulting Engagement",
    description:
      "Consulting services for a brand repositioning campaign including strategy and creative advisory.",
    department: "BUSINESS",
    counterparty: "BrightPath Consulting",
    estimatedValue: 360_000,
    requesterName: "Sara Al-Otaibi",
    status: "IN_APPROVAL",
  });
  r3.classification = classify(r3);
  r3.draft = generateContract(r3);
  const comp3 = runCompliance(r3);
  r3.compliance = comp3.findings;
  r3.riskScore = comp3.riskScore;
  r3.approvals = r3.classification.routing.map((stage) => ({
    stage,
    decision: stage === "PROCUREMENT" ? "APPROVED" : "PENDING",
    reviewer: stage === "PROCUREMENT" ? "Procurement Reviewer" : undefined,
    comment: stage === "PROCUREMENT" ? "Vendor pre-qualified. Approved." : undefined,
    decidedAt:
      stage === "PROCUREMENT"
        ? new Date(Date.now() - 1 * 86_400_000).toISOString()
        : undefined,
  }));
  r3.audit = [
    auditEntry(1, "Procurement Reviewer", "Approval decision", "Procurement: Approved"),
    auditEntry(2, "Sara Al-Otaibi", "Submitted for approval", "Routed Procurement → Finance → Legal"),
    auditEntry(2, "AI Engine", "Draft generated", "Consulting Agreement drafted"),
    auditEntry(11, "Sara Al-Otaibi", "Request created", `${r3.reference} submitted`),
  ];

  // 4) Signed + active, obligations being monitored
  const r4 = base(4, {
    title: "Mutual Non-Disclosure Agreement",
    description:
      "Mutual NDA to govern confidential information exchanged during partnership discussions.",
    department: "LEGAL",
    counterparty: "Horizon Ventures",
    requestedLanguage: "ar",
    status: "ACTIVE",
  });
  r4.classification = classify(r4);
  r4.draft = generateContract(r4);
  const comp4 = runCompliance(r4);
  r4.compliance = comp4.findings;
  r4.riskScore = comp4.riskScore;
  r4.approvals = r4.classification.routing.map((stage) => ({
    stage,
    decision: "APPROVED",
    reviewer: `${stage} Reviewer`,
    comment: "Approved.",
    decidedAt: new Date(Date.now() - 6 * 86_400_000).toISOString(),
  }));
  r4.status = "ACTIVE";
  r4.signedAt = new Date(Date.now() - 5 * 86_400_000).toISOString();
  r4.signedBy = "Contract Owner";
  r4.obligations = extractObligations(r4);
  // mark one as in-progress, one overdue for dashboard signal
  if (r4.obligations[0]) r4.obligations[0].status = "IN_PROGRESS";
  r4.audit = [
    auditEntry(5, "AI Engine", "Obligations extracted", `${r4.obligations.length} obligations assigned`),
    auditEntry(5, "Contract Owner", "Contract signed", "Execution complete"),
    auditEntry(6, "Legal Reviewer", "Approval decision", "Legal: Approved"),
    auditEntry(18, "Sara Al-Otaibi", "Request created", `${r4.reference} submitted`),
  ];

  return [r1, r2, r3, r4];
}
