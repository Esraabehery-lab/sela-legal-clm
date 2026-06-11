"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { decideApproval } from "@/lib/actions";
import { t } from "@/lib/i18n";
import type { Locale, ApprovalStage } from "@/lib/types";
import { toast } from "sonner";
import { Check, X, Undo2, Archive } from "lucide-react";

/**
 * Approve / Reject actions for an approval stage. Rejecting requires a reason
 * and a choice: return the request to the Business User to edit & resubmit, or
 * archive it. Both send the request back to the Business User's view.
 */
export function ApprovalActions({
  requestId,
  stage,
  locale,
  allowArchive = true,
}: {
  requestId: string;
  stage: ApprovalStage;
  locale: Locale;
  allowArchive?: boolean;
}) {
  const [rejecting, setRejecting] = React.useState(false);
  const [comment, setComment] = React.useState("");
  const [pending, start] = React.useTransition();

  const hidden = (
    <>
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="stage" value={stage} />
    </>
  );

  if (!rejecting) {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <form
          action={(fd) =>
            start(async () => {
              await decideApproval(fd);
              toast.success(t(locale, "Approved", "تم الاعتماد"));
            })
          }
        >
          {hidden}
          <input type="hidden" name="decision" value="APPROVED" />
          <Button type="submit" size="sm" variant="mint" disabled={pending}>
            <Check className="h-4 w-4" />
            {t(locale, "Approve", "اعتماد")}
          </Button>
        </form>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={pending}
          onClick={() => setRejecting(true)}
        >
          <X className="h-4 w-4" />
          {t(locale, "Reject", "رفض")}
        </Button>
      </div>
    );
  }

  const canSubmit = comment.trim().length > 0 && !pending;

  return (
    <form
      action={(fd) =>
        start(async () => {
          await decideApproval(fd);
          toast.success(
            fd.get("outcome") === "ARCHIVE"
              ? t(locale, "Request archived", "تم أرشفة الطلب")
              : t(locale, "Returned to business user", "أُعيد لمستخدم الأعمال"),
          );
        })
      }
      className="mt-3 space-y-2"
    >
      {hidden}
      <input type="hidden" name="decision" value="REJECTED" />
      <Textarea
        name="comment"
        required
        rows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={t(
          locale,
          "Reason for rejection (required)…",
          "سبب الرفض (مطلوب)…",
        )}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="submit"
          name="outcome"
          value="RETURN"
          size="sm"
          disabled={!canSubmit}
        >
          <Undo2 className="h-4 w-4" />
          {t(locale, "Return to edit & resubmit", "إعادة للتعديل وإعادة الإرسال")}
        </Button>
        {allowArchive && (
          <Button
            type="submit"
            name="outcome"
            value="ARCHIVE"
            size="sm"
            variant="outline"
            disabled={!canSubmit}
          >
            <Archive className="h-4 w-4" />
            {t(locale, "Archive", "أرشفة")}
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => {
            setRejecting(false);
            setComment("");
          }}
        >
          {t(locale, "Cancel", "إلغاء")}
        </Button>
      </div>
    </form>
  );
}
