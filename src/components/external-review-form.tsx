"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { submitThirdPartyReview } from "@/lib/actions";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { toast } from "sonner";
import { Check, RefreshCw } from "lucide-react";

/** Form the external third party uses to review the shared contract. */
export function ExternalReviewForm({
  token,
  locale,
}: {
  token: string;
  locale: Locale;
}) {
  const [name, setName] = React.useState("");
  const [pending, start] = React.useTransition();
  const ready = name.trim().length >= 2 && !pending;

  return (
    <form
      action={(fd) =>
        start(async () => {
          await submitThirdPartyReview(fd);
          toast.success(t(locale, "Response submitted", "تم إرسال الرد"));
        })
      }
      className="space-y-3"
    >
      <input type="hidden" name="token" value={token} />
      <Input
        name="name"
        required
        minLength={2}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t(locale, "Your full name", "اسمك الكامل")}
        className="max-w-sm"
      />
      <Textarea
        name="comment"
        rows={3}
        placeholder={t(locale, "Your comments (optional)…", "ملاحظاتك (اختياري)…")}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="submit"
          name="decision"
          value="APPROVED"
          variant="mint"
          disabled={!ready}
        >
          <Check className="h-4 w-4" />
          {t(locale, "Approve", "موافقة")}
        </Button>
        <Button
          type="submit"
          name="decision"
          value="CHANGES_REQUESTED"
          variant="outline"
          disabled={!ready}
        >
          <RefreshCw className="h-4 w-4" />
          {t(locale, "Request changes", "طلب تعديلات")}
        </Button>
      </div>
    </form>
  );
}
