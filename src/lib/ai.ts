// ============================================================
// Mock AI engine for the CLM platform.
//
// These are deterministic, rule-based stand-ins for the eventual
// LLM/OCR services (BR-01..BR-07, BR-11). They are intentionally
// explainable: every output carries a rationale so the UI can show
// *why* a decision was made (NFR: Explainability). Swap these for
// real model calls (e.g. the Anthropic API) without touching callers.
// ============================================================

import type {
  AiClassification,
  ApprovalStage,
  Clause,
  ComplianceFinding,
  ContractCategory,
  ContractDraft,
  DFRequest,
  Obligation,
  RiskIndicator,
} from "./types";
import { CATEGORY_LABELS } from "./i18n";
import { buildOperationContract } from "./contract-template";

let counter = 0;
function uid(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter}`;
}

// Approval chain per DF Financial Type (derived from the DEF examples):
// - No Financial Value → Head of BU → Legal (legal review only)
// - Cash-In / Gov. Cash-In / Revenue Share → Head of BU → CFO → Legal
// - Cash-Out / Rev. Share + Cash-Out / Gov. Cash-Out → Head of BU → CSCCO → CFO → Legal
const ROUTING_BY_FINANCIAL: Record<string, ApprovalStage[]> = {
  "No Financial Value": ["HEAD_OF_BU", "LEGAL"],
  "Cash-In": ["HEAD_OF_BU", "CFO", "LEGAL"],
  "Gov. Cash-In": ["HEAD_OF_BU", "CFO", "LEGAL"],
  "Revenue Share": ["HEAD_OF_BU", "CFO", "LEGAL"],
  "Cash-Out": ["HEAD_OF_BU", "CSCCO", "CFO", "LEGAL"],
  "Rev. Share + Cash-Out": ["HEAD_OF_BU", "CSCCO", "CFO", "LEGAL"],
  "Gov. Cash-Out": ["HEAD_OF_BU", "CSCCO", "CFO", "LEGAL"],
};
const DEFAULT_ROUTING: ApprovalStage[] = ["HEAD_OF_BU", "CFO", "LEGAL"];

const CATEGORY_KEYWORDS: Record<ContractCategory, string[]> = {
  NDA: ["nda", "non-disclosure", "confidential", "secrecy", "سرية", "إفشاء"],
  SERVICE_AGREEMENT: ["service", "services", "sla", "support", "خدمة", "خدمات"],
  SUPPLY: ["supply", "goods", "delivery", "purchase", "vendor", "توريد", "بضائع"],
  CONSULTING: ["consult", "advisory", "consultant", "استشار"],
  EMPLOYMENT: ["employ", "hire", "salary", "staff", "توظيف", "موظف"],
  LEASE: ["lease", "rent", "tenancy", "premises", "إيجار"],
  PARTNERSHIP: ["partner", "joint venture", "jv", "alliance", "شراكة"],
  OTHER: [],
};

function pickCategory(haystack: string): { category: ContractCategory; hits: number } {
  let category: ContractCategory = "OTHER";
  let hits = 0;
  for (const cat of Object.keys(CATEGORY_KEYWORDS) as ContractCategory[]) {
    const n = CATEGORY_KEYWORDS[cat].filter((k) => haystack.includes(k)).length;
    if (n > hits) {
      hits = n;
      category = cat;
    }
  }
  return { category, hits };
}

// Maps the DF "Contract Nature" field onto an internal contract category.
const NATURE_TO_CATEGORY: Record<string, ContractCategory> = {
  "General Services": "SERVICE_AGREEMENT",
  Activation: "SERVICE_AGREEMENT",
  Operation: "SERVICE_AGREEMENT",
  Production: "SERVICE_AGREEMENT",
  Experience: "SERVICE_AGREEMENT",
  Sponsoring: "SERVICE_AGREEMENT",
  Construction: "SERVICE_AGREEMENT",
  Talents: "SERVICE_AGREEMENT",
  Supply: "SUPPLY",
  Purchase: "SUPPLY",
  Consultancy: "CONSULTING",
  "Lease HOT": "LEASE",
  "St. Partnership": "PARTNERSHIP",
  "JV & Investments": "PARTNERSHIP",
};

/** Classify a DF request and decide routing (US-003 / US-004, BR-01/02). */
export function classify(req: DFRequest): AiClassification {
  const haystack = `${req.title} ${req.description}`.toLowerCase();

  const keyword = pickCategory(haystack);
  // A declared DF "Contract Nature" overrides keyword guessing with high confidence.
  const declared = req.df?.contractNature
    ? NATURE_TO_CATEGORY[req.df.contractNature]
    : undefined;
  const best: ContractCategory = declared ?? keyword.category;
  const bestHits = declared ? Math.max(keyword.hits, 2) : keyword.hits;

  const confidence = Math.min(0.55 + bestHits * 0.15, 0.97);
  const value = req.estimatedValue ?? 0;

  const riskIndicators: RiskIndicator[] = [];
  if (value >= 1_000_000)
    riskIndicators.push({
      label: "High contract value",
      labelAr: "قيمة عقد مرتفعة",
      severity: "HIGH",
    });
  else if (value >= 250_000)
    riskIndicators.push({
      label: "Material contract value",
      labelAr: "قيمة عقد جوهرية",
      severity: "MEDIUM",
    });
  if (best === "OTHER")
    riskIndicators.push({
      label: "Uncategorised — manual review advised",
      labelAr: "غير مصنّف — يُنصح بمراجعة يدوية",
      severity: "MEDIUM",
    });
  if (best === "NDA")
    riskIndicators.push({
      label: "Confidential information exposure",
      labelAr: "تعرّض لمعلومات سرية",
      severity: "LOW",
    });
  if (req.documents.length === 0)
    riskIndicators.push({
      label: "No supporting documents attached",
      labelAr: "لا توجد مستندات داعمة",
      severity: "LOW",
    });

  // Sequential approval chain decided by the DF Financial Type.
  const financialType = req.df?.financialType ?? "";
  const routing: AiClassification["routing"] =
    ROUTING_BY_FINANCIAL[financialType] ?? DEFAULT_ROUTING;
  const chainEn = routing.map((s) => STAGE_LABELS_EN[s]).join(" → ");

  const catLabel = CATEGORY_LABELS[best].en;
  const stakeholders = stakeholdersFor(best, req.department);

  return {
    category: best,
    confidence,
    summary: `Classified as ${catLabel} with ${(confidence * 100).toFixed(
      0,
    )}% confidence based on request language and ${
      req.documents.length
    } attachment(s).`,
    summaryAr: `تم التصنيف كـ ${CATEGORY_LABELS[best].ar} بثقة ${(
      confidence * 100
    ).toFixed(0)}% بناءً على وصف الطلب و ${req.documents.length} مرفق.`,
    stakeholders,
    riskIndicators,
    routing,
    routingRationale: `Sequential approval based on Financial Type${
      financialType ? ` (${financialType})` : ""
    }: ${chainEn} → Signature. Each step unlocks only after the previous approval.`,
    routingRationaleAr: `اعتماد متسلسل بحسب النوع المالي${
      financialType ? ` (${financialType})` : ""
    }: ${chainEn} ← التوقيع. تُفتح كل مرحلة بعد اعتماد المرحلة السابقة.`,
  };
}

const STAGE_LABELS_EN: Record<string, string> = {
  HEAD_OF_BU: "Head of Business Unit",
  CSCCO: "CSCCO",
  CFO: "CFO",
  LEGAL: "Legal Reviewer",
  PROCUREMENT: "Procurement Team",
  FINANCE: "Finance Team",
};

function stakeholdersFor(cat: ContractCategory, dept: string): string[] {
  const base = [`${dept} (Requesting Unit)`, "Legal Department"];
  if (cat === "SUPPLY" || cat === "SERVICE_AGREEMENT")
    base.push("Procurement", "Finance");
  if (cat === "EMPLOYMENT") base.push("Human Resources");
  if (cat === "LEASE") base.push("Facilities", "Finance");
  return base;
}

/** Recommend clauses for a category (US-006, BR-04). */
export function recommendClauses(category: ContractCategory): Clause[] {
  const common: Clause[] = [
    clause(
      "Governing Law & Jurisdiction",
      "القانون الحاكم والاختصاص",
      "This Agreement shall be governed by the laws of the Kingdom of Saudi Arabia.",
      true,
      "Required by corporate policy for all contracts.",
      "مطلوب بموجب سياسة الشركة لجميع العقود.",
    ),
    clause(
      "Confidentiality",
      "السرية",
      "Each party shall keep confidential all non-public information disclosed under this Agreement.",
      true,
      "Protects proprietary information exchanged during performance.",
      "يحمي المعلومات الخاصة المتبادلة أثناء التنفيذ.",
    ),
    clause(
      "Term & Termination",
      "المدة والإنهاء",
      "This Agreement remains in force until terminated in accordance with its terms.",
      true,
      "Defines lifecycle and exit conditions.",
      "يحدد دورة الحياة وشروط الإنهاء.",
    ),
  ];
  const specific: Record<ContractCategory, Clause[]> = {
    NDA: [
      clause(
        "Permitted Use",
        "الاستخدام المسموح",
        "Confidential Information may be used solely for the agreed purpose.",
        true,
        "Limits the scope of disclosure for NDAs.",
        "يحد من نطاق الإفشاء في اتفاقيات السرية.",
      ),
    ],
    SUPPLY: [
      clause(
        "Delivery & Acceptance",
        "التسليم والقبول",
        "Goods shall be delivered per the agreed schedule and subject to acceptance testing.",
        true,
        "Critical for supply contracts to define acceptance.",
        "أساسي لعقود التوريد لتحديد القبول.",
      ),
      clause(
        "Payment Terms",
        "شروط الدفع",
        "Payment shall be made within 30 days of a valid invoice.",
        true,
        "Standard net-30 payment protection.",
        "حماية الدفع القياسية خلال 30 يوماً.",
      ),
    ],
    SERVICE_AGREEMENT: [
      clause(
        "Service Levels (SLA)",
        "مستويات الخدمة",
        "Supplier shall meet the service levels set out in Schedule A.",
        true,
        "Ensures measurable performance obligations.",
        "يضمن التزامات أداء قابلة للقياس.",
      ),
    ],
    CONSULTING: [
      clause(
        "Intellectual Property",
        "الملكية الفكرية",
        "All work product created under this Agreement vests in the Company.",
        true,
        "Secures ownership of consultant deliverables.",
        "يؤمّن ملكية مخرجات الاستشاري.",
      ),
    ],
    EMPLOYMENT: [
      clause(
        "Non-Compete",
        "عدم المنافسة",
        "Employee shall not engage in competing activities for 12 months post-termination.",
        false,
        "Optional — enforceability varies; review with Legal.",
        "اختياري — قابلية التنفيذ تختلف، يُراجع مع القانونية.",
      ),
    ],
    LEASE: [
      clause(
        "Maintenance & Repairs",
        "الصيانة والإصلاحات",
        "Lessor is responsible for structural maintenance of the premises.",
        true,
        "Allocates maintenance responsibility.",
        "يوزع مسؤولية الصيانة.",
      ),
    ],
    PARTNERSHIP: [
      clause(
        "Profit & Loss Sharing",
        "تقاسم الأرباح والخسائر",
        "Profits and losses shall be shared in proportion to each party's contribution.",
        true,
        "Defines the economic split of the venture.",
        "يحدد التقسيم الاقتصادي للمشروع.",
      ),
    ],
    OTHER: [],
  };
  return [...common, ...specific[category]];
}

function clause(
  title: string,
  titleAr: string,
  body: string,
  recommended: boolean,
  rationale: string,
  rationaleAr: string,
): Clause {
  return { id: uid("cl"), title, titleAr, body, recommended, rationale, rationaleAr };
}

/** Generate an AI contract draft (US-005, BR-07). */
export function generateContract(req: DFRequest): ContractDraft {
  const cat = req.classification?.category ?? "OTHER";
  const clauses = recommendClauses(cat);
  // Use the SELA F&B / Operation Contract template (mirrors the approved doc).
  const { title, bodyEn, bodyAr } = buildOperationContract(req);

  return { title, bodyEn, bodyAr, clauses, version: 1, updatedAt: new Date().toISOString() };
}

/** Compliance validation + risk score (US-011, BR-05). */
export function runCompliance(req: DFRequest): {
  findings: ComplianceFinding[];
  riskScore: number;
} {
  const findings: ComplianceFinding[] = [];
  const clauses = req.draft?.clauses ?? [];
  const hasGoverningLaw = clauses.some((c) =>
    c.title.toLowerCase().includes("governing law"),
  );
  const hasConfidentiality = clauses.some((c) =>
    c.title.toLowerCase().includes("confidential"),
  );

  if (!hasGoverningLaw)
    findings.push(f("Missing Governing Law clause", "بند القانون الحاكم مفقود", "HIGH"));
  if (!hasConfidentiality)
    findings.push(f("Missing Confidentiality clause", "بند السرية مفقود", "MEDIUM"));
  if ((req.estimatedValue ?? 0) >= 1_000_000)
    findings.push(
      f(
        "High-value contract requires executive sign-off",
        "العقد عالي القيمة يتطلب اعتماد الإدارة العليا",
        "MEDIUM",
      ),
    );
  if (req.documents.length === 0)
    findings.push(
      f("No supporting evidence on file", "لا توجد مستندات داعمة", "LOW"),
    );

  const weight = { HIGH: 30, MEDIUM: 15, LOW: 5 } as const;
  const raw = findings.reduce((s, x) => s + weight[x.severity], 0);
  const riskScore = Math.min(raw, 100);
  return { findings, riskScore };
}

function f(label: string, labelAr: string, severity: ComplianceFinding["severity"]): ComplianceFinding {
  return { id: uid("cf"), label, labelAr, severity, resolved: false };
}

/** Extract obligations from a signed contract (US-013/014/015, BR-11/12). */
export function extractObligations(req: DFRequest): Obligation[] {
  const cat = req.classification?.category ?? "OTHER";
  const now = new Date();
  const inDays = (d: number) =>
    new Date(now.getTime() + d * 86_400_000).toISOString();

  const out: Obligation[] = [];
  out.push(
    ob("Counterparty onboarding & kickoff", "تهيئة الطرف المقابل والانطلاق", "MILESTONE", "BUSINESS", inDays(14)),
  );

  if (req.estimatedValue) {
    const first = Math.round(req.estimatedValue * 0.5);
    out.push(
      ob(
        "First payment milestone",
        "دفعة أولى",
        "PAYMENT",
        "FINANCE",
        inDays(30),
        first,
        req.currency,
      ),
    );
    out.push(
      ob(
        "Final payment on completion",
        "الدفعة النهائية عند الإنجاز",
        "PAYMENT",
        "FINANCE",
        inDays(120),
        req.estimatedValue - first,
        req.currency,
      ),
    );
  }

  if (cat === "SUPPLY" || cat === "SERVICE_AGREEMENT")
    out.push(
      ob("Delivery of goods / services", "تسليم البضائع / الخدمات", "DELIVERABLE", "PROCUREMENT", inDays(45)),
    );
  if (cat === "SERVICE_AGREEMENT")
    out.push(
      ob("Quarterly SLA review", "مراجعة مستوى الخدمة الفصلية", "COMPLIANCE", "LEGAL", inDays(90)),
    );

  out.push(
    ob("Contract renewal review", "مراجعة تجديد العقد", "RENEWAL", "LEGAL", inDays(330)),
  );
  return out;
}

function ob(
  title: string,
  titleAr: string,
  type: Obligation["type"],
  assignedDept: Obligation["assignedDept"],
  dueDate: string,
  amount?: number,
  currency?: string,
): Obligation {
  return {
    id: uid("ob"),
    title,
    titleAr,
    type,
    assignedDept,
    dueDate,
    status: "PENDING",
    amount,
    currency,
  };
}

/** Mock OCR / document understanding (BR-06, FR-03). */
export function mockOcr(fileName: string): string {
  return `Extracted text from "${fileName}": parties, scope, and commercial terms detected. Key entities and dates indexed for search.`;
}
