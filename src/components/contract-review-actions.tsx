"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { reviewContract } from "@/lib/actions";
import { t } from "@/lib/i18n";
import type { Locale, ApprovalStage } from "@/lib/types";
import { toast } from "sonner";
import { Check, X } from "lucide-react";

/**
 * Contract-review action (Procurement / Finance / Legal). A comment is
 * mandatory for both approve and reject.
 */
export function ContractReviewActions({
  requestId,
  stage,
  locale,
}: {
  requestId: string;
  stage: ApprovalStage;
  locale: Locale;
}) {
  const [comment, setComment] = React.useState("");
  const [pending, start] = React.useTransition();
  const ready = comment.trim().length > 0 && !pending;

  return (
    <form
      action={(fd) =>
        start(async () => {
          await reviewContract(fd);
          toast.success(t(locale, "Review submitted", "تم إرسال المراجعة"));
        })
      }
      className="mt-3 space-y-2"
    >
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="stage" value={stage} />
      <Textarea
        name="comment"
        required
        rows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={t(
          locale,
          "Your review comment (required)…",
          "ملاحظة المراجعة (مطلوبة)…",
        )}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="submit"
          name="decision"
          value="APPROVED"
          size="sm"
          variant="mint"
          disabled={!ready}
        >
          <Check className="h-4 w-4" />
          {t(locale, "Submit", "إرسال")}
        </Button>
        <Button
          type="submit"
          name="decision"
          value="REJECTED"
          size="sm"
          variant="destructive"
          disabled={!ready}
        >
          <X className="h-4 w-4" />
          {t(locale, "Reject", "رفض")}
        </Button>
      </div>
    </form>
  );
}
