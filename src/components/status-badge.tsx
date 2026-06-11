import { Badge } from "@/components/ui/badge";
import {
  STATUS_LABELS,
  DECISION_LABELS,
  OBLIGATION_STATUS_LABELS,
  SEVERITY_LABELS,
  label,
} from "@/lib/i18n";
import type {
  Locale,
  RequestStatus,
  ApprovalDecision,
  ObligationStatus,
  Severity,
} from "@/lib/types";

type Variant = "default" | "yellow" | "mint" | "red" | "amber" | "outline";

const STATUS_VARIANT: Record<RequestStatus, Variant> = {
  SUBMITTED: "outline",
  AI_ANALYZED: "default",
  DRAFT_GENERATED: "yellow",
  BU_REVIEW: "yellow",
  IN_APPROVAL: "amber",
  APPROVED: "mint",
  CONFIRMED: "mint",
  CONTRACT_REVIEW: "amber",
  CONTRACT_REVISION: "amber",
  FINAL_APPROVAL: "amber",
  REJECTED: "red",
  RETURNED: "amber",
  ARCHIVED: "outline",
  SIGNED: "mint",
  ACTIVE: "mint",
};

export function StatusBadge({
  status,
  locale,
}: {
  status: RequestStatus;
  locale: Locale;
}) {
  return (
    <Badge variant={STATUS_VARIANT[status]}>
      {label(STATUS_LABELS, status, locale)}
    </Badge>
  );
}

const DECISION_VARIANT: Record<ApprovalDecision, Variant> = {
  PENDING: "outline",
  APPROVED: "mint",
  REJECTED: "red",
  CHANGES_REQUESTED: "amber",
};

export function DecisionBadge({
  decision,
  locale,
}: {
  decision: ApprovalDecision;
  locale: Locale;
}) {
  return (
    <Badge variant={DECISION_VARIANT[decision]}>
      {label(DECISION_LABELS, decision, locale)}
    </Badge>
  );
}

const OB_VARIANT: Record<ObligationStatus, Variant> = {
  PENDING: "outline",
  IN_PROGRESS: "yellow",
  DONE: "mint",
  OVERDUE: "red",
};

export function ObligationStatusBadge({
  status,
  locale,
}: {
  status: ObligationStatus;
  locale: Locale;
}) {
  return (
    <Badge variant={OB_VARIANT[status]}>
      {label(OBLIGATION_STATUS_LABELS, status, locale)}
    </Badge>
  );
}

const SEV_VARIANT: Record<Severity, Variant> = {
  LOW: "outline",
  MEDIUM: "amber",
  HIGH: "red",
};

export function SeverityBadge({
  severity,
  locale,
}: {
  severity: Severity;
  locale: Locale;
}) {
  return (
    <Badge variant={SEV_VARIANT[severity]}>
      {label(SEVERITY_LABELS, severity, locale)}
    </Badge>
  );
}
