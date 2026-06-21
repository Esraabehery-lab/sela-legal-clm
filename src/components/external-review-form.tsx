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

/**
 * The third party reviews and may edit the shared contract, then submits
 * Approve (accept) or Request changes (sends it back for internal re-approval).
 */
export function ExternalReviewForm({
  token,
  body,
  locale,
}: {
  token: string;
  body: string;
  locale: Locale;
}) {
  const [text, setText] = React.useState(body);
  const [name, setName] = React.useState("");
  const [pending, start] = React.useTransition();
  const ready = name.trim().length >= 2 && !pending;
  const edited = text !== body;

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

      <div className="flex items-center justify-between">
        <label className="text-xs font-medium uppercase tracking-wide text-ink-400">
          {t(locale, "Contract (editable)", "العقد (قابل للتعديل)")}
        </label>
        {edited && (
          <span className="text-[11px] text-sela-yellow">
            {t(locale, "Edited", "تم التعديل")}
          </span>
        )}
      </div>
      <Textarea
        name="body"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={18}
        className="max-h-[520px] font-mono text-[13px] leading-relaxed"
      />

      <div className="space-y-1">
        <label className="text-sm font-medium text-ink-100">
          {t(locale, "Your full name", "اسمك الكامل")}
          <span className="ms-1 text-red-400">*</span>
        </label>
        <Input
          name="name"
          required
          minLength={2}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t(locale, "e.g. Mohammed Ahmed", "مثال: محمد أحمد")}
          className="max-w-sm"
        />
      </div>
      <Textarea
        name="comment"
        rows={2}
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
          {t(locale, "Request changes & send back", "طلب تعديلات وإعادة الإرسال")}
        </Button>
      </div>
      {!ready && !pending && (
        <p className="text-xs text-amber-400">
          {t(
            locale,
            "Enter your full name above to enable Approve / Request changes.",
            "أدخل اسمك الكامل بالأعلى لتفعيل الموافقة / طلب التعديلات.",
          )}
        </p>
      )}
    </form>
  );
}
