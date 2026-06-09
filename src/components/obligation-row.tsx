"use client";

import * as React from "react";
import { Select } from "@/components/ui/select";
import { updateObligation } from "@/lib/actions";
import { OBLIGATION_STATUS_LABELS, OBLIGATION_TYPE_LABELS, DEPT_LABELS, label } from "@/lib/i18n";
import { formatDate, formatMoney, daysUntil } from "@/lib/format";
import { ObligationStatusBadge } from "@/components/status-badge";
import type { Locale, Obligation, ObligationStatus } from "@/lib/types";

const STATUSES: ObligationStatus[] = ["PENDING", "IN_PROGRESS", "DONE", "OVERDUE"];

export function ObligationRow({
  requestId,
  obligation,
  locale,
  canEdit,
}: {
  requestId: string;
  obligation: Obligation;
  locale: Locale;
  canEdit: boolean;
}) {
  const [pending, start] = React.useTransition();
  const due = daysUntil(obligation.dueDate);
  const overdue = due < 0 && obligation.status !== "DONE";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface-1 px-4 py-3">
      <div className="min-w-0">
        <div className="text-sm font-medium text-ink-50">
          {locale === "ar" ? obligation.titleAr : obligation.title}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-ink-500">
          <span>{label(OBLIGATION_TYPE_LABELS, obligation.type, locale)}</span>
          <span>·</span>
          <span>{label(DEPT_LABELS, obligation.assignedDept, locale)}</span>
          <span>·</span>
          <span className={overdue ? "text-red-400" : ""}>
            {formatDate(obligation.dueDate, locale)}
            {obligation.status !== "DONE" &&
              ` (${due >= 0 ? `${due}d` : `${Math.abs(due)}d ${locale === "ar" ? "تأخير" : "late"}`})`}
          </span>
          {obligation.amount != null && (
            <>
              <span>·</span>
              <span className="text-ink-300">
                {formatMoney(obligation.amount, obligation.currency ?? "SAR", locale)}
              </span>
            </>
          )}
        </div>
      </div>

      {canEdit ? (
        <form
          action={(fd) => start(() => updateObligation(fd))}
          className="flex items-center gap-2"
        >
          <input type="hidden" name="requestId" value={requestId} />
          <input type="hidden" name="obligationId" value={obligation.id} />
          <Select
            name="status"
            defaultValue={obligation.status}
            disabled={pending}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="h-8 w-[150px] text-xs"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {label(OBLIGATION_STATUS_LABELS, s, locale)}
              </option>
            ))}
          </Select>
        </form>
      ) : (
        <ObligationStatusBadge status={obligation.status} locale={locale} />
      )}
    </div>
  );
}
