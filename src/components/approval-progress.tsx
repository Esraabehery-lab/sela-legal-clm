import { STAGE_LABELS, label, t } from "@/lib/i18n";
import type { Locale, ApprovalStage, ApprovalDecision } from "@/lib/types";
import { Check, X, Clock } from "lucide-react";

type Approval = { stage: ApprovalStage; decision: ApprovalDecision };

/**
 * Horizontal stepper showing how far a request has moved through the approval
 * chain — so the Business User (and everyone) can see "approved by Head of BU,
 * now with CSCCO".
 */
export function ApprovalProgress({
  approvals,
  locale,
}: {
  approvals: Approval[];
  locale: Locale;
}) {
  if (approvals.length === 0) return null;

  const currentIdx = approvals.findIndex((a) => a.decision === "PENDING");
  const rejected = approvals.find(
    (a) => a.decision === "REJECTED" || a.decision === "CHANGES_REQUESTED",
  );

  let caption: string;
  if (rejected) {
    caption = t(
      locale,
      `Returned by ${STAGE_LABELS[rejected.stage].en}`,
      `أُعيد من ${STAGE_LABELS[rejected.stage].ar}`,
    );
  } else if (currentIdx === -1) {
    caption = t(locale, "All approvals complete", "اكتملت جميع الاعتمادات");
  } else {
    const cur = approvals[currentIdx]!.stage;
    caption = t(
      locale,
      `Now with ${STAGE_LABELS[cur].en}`,
      `حالياً لدى ${STAGE_LABELS[cur].ar}`,
    );
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="mb-3 text-xs font-medium text-ink-300">
        {t(locale, "Approval progress", "تقدّم الاعتماد")} —{" "}
        <span className="text-sela-yellow">{caption}</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {approvals.map((a, i) => {
          const isApproved = a.decision === "APPROVED";
          const isRejected =
            a.decision === "REJECTED" || a.decision === "CHANGES_REQUESTED";
          const isCurrent = i === currentIdx && !rejected;

          const dotClass = isApproved
            ? "bg-sela-mint/15 text-sela-mint border-sela-mint/40"
            : isRejected
              ? "bg-red-500/15 text-red-400 border-red-500/40"
              : isCurrent
                ? "bg-sela-yellow/15 text-sela-yellow border-sela-yellow/50"
                : "bg-surface-2 text-ink-500 border-line";

          return (
            <div key={a.stage} className="flex items-center gap-1.5">
              <div
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${dotClass}`}
              >
                <span className="flex h-4 w-4 items-center justify-center">
                  {isApproved ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : isRejected ? (
                    <X className="h-3.5 w-3.5" />
                  ) : isCurrent ? (
                    <Clock className="h-3.5 w-3.5" />
                  ) : (
                    <span className="text-[10px]">{i + 1}</span>
                  )}
                </span>
                {label(STAGE_LABELS, a.stage, locale)}
              </div>
              {i < approvals.length - 1 && (
                <span className="text-ink-600 rtl:rotate-180">→</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
