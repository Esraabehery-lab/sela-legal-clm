"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { submitThirdPartyReview } from "@/lib/actions";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { toast } from "sonner";
import { Check } from "lucide-react";

/**
 * The third party reviews and may edit the rich contract document, then
 * submits Approve (accept) or Request changes (sends it back).
 */
export function ExternalReviewForm({
  token,
  html,
  locale,
}: {
  token: string;
  html: string;
  locale: Locale;
}) {
  const docRef = React.useRef<HTMLDivElement>(null);
  const [name, setName] = React.useState("");
  const [comment, setComment] = React.useState("");
  const [pending, start] = React.useTransition();
  const ready = name.trim().length >= 2 && !pending;

  function submit(decision: "APPROVED" | "CHANGES_REQUESTED") {
    const fd = new FormData();
    fd.set("token", token);
    fd.set("name", name);
    fd.set("decision", decision);
    fd.set("comment", comment);
    fd.set("body", docRef.current?.innerHTML ?? "");
    start(async () => {
      await submitThirdPartyReview(fd);
      toast.success(t(locale, "Response submitted", "تم إرسال الرد"));
    });
  }

  return (
    <div className="space-y-3">
      <label className="text-xs font-medium uppercase tracking-wide text-ink-400">
        {t(locale, "Contract (editable)", "العقد (قابل للتعديل)")}
      </label>
      <div
        ref={docRef}
        className="contract-doc max-h-[560px] overflow-auto"
        contentEditable
        suppressContentEditableWarning
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <div className="space-y-1">
        <label className="text-sm font-medium text-ink-100">
          {t(locale, "Your full name", "اسمك الكامل")}
          <span className="ms-1 text-red-400">*</span>
        </label>
        <Input
          required
          minLength={2}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t(locale, "e.g. Mohammed Ahmed", "مثال: محمد أحمد")}
          className="max-w-sm"
        />
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder={t(locale, "Your comments (optional)…", "ملاحظاتك (اختياري)…")}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="mint"
          disabled={!ready}
          onClick={() => submit("APPROVED")}
        >
          <Check className="h-4 w-4" />
          {t(locale, "Approve", "موافقة")}
        </Button>
      </div>
      {!ready && !pending && (
        <p className="text-xs text-amber-400">
          {t(
            locale,
            "Enter your full name above to enable Approve.",
            "أدخل اسمك الكامل بالأعلى لتفعيل الموافقة.",
          )}
        </p>
      )}
    </div>
  );
}
