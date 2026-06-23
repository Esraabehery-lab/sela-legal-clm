"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { submitThirdPartyReview } from "@/lib/actions";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { toast } from "sonner";
import { Check, Upload } from "lucide-react";

/**
 * The third party reviews and may edit the rich contract document — either by
 * typing inline, or by downloading it, editing offline, and uploading the
 * revised file (.docx / .txt). On Approve the (possibly replaced) document is
 * sent back to the business user.
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
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [name, setName] = React.useState("");
  const [comment, setComment] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [pending, start] = React.useTransition();
  const ready = name.trim().length >= 2 && !pending && !busy;

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const fname = file.name.toLowerCase();
      let docHtml = "";
      if (fname.endsWith(".docx")) {
        const mod: any = await import("mammoth");
        const mammoth = mod.default ?? mod;
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        docHtml = result.value;
      } else if (
        fname.endsWith(".txt") ||
        fname.endsWith(".md") ||
        fname.endsWith(".html") ||
        file.type.startsWith("text/")
      ) {
        const text = await file.text();
        docHtml = fname.endsWith(".html")
          ? text
          : text
              .split(/\n{2,}/)
              .map(
                (p) =>
                  `<p>${p
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/\n/g, "<br/>")}</p>`,
              )
              .join("");
      } else {
        toast.error(
          t(
            locale,
            "Unsupported file — please upload a .docx or .txt file.",
            "ملف غير مدعوم — يرجى رفع ملف .docx أو .txt.",
          ),
        );
        return;
      }
      if (docRef.current) docRef.current.innerHTML = docHtml;
      toast.success(t(locale, "Contract uploaded", "تم رفع العقد"));
    } catch {
      toast.error(
        t(locale, "Could not read that file.", "تعذّر قراءة هذا الملف."),
      );
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-medium uppercase tracking-wide text-ink-400">
          {t(locale, "Contract (editable)", "العقد (قابل للتعديل)")}
        </label>
        <input
          ref={fileRef}
          type="file"
          accept=".docx,.txt,.md,.html"
          hidden
          onChange={onFile}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          {busy
            ? t(locale, "Reading…", "جارٍ القراءة…")
            : t(locale, "Upload edited contract", "رفع العقد المُعدّل")}
        </Button>
      </div>
      <p className="text-xs text-ink-500">
        {t(
          locale,
          "Edit the contract below, or download it, edit it offline, and upload the revised file (.docx / .txt). Your version is sent back to SELA on Approve.",
          "عدّل العقد بالأسفل، أو نزّله وعدّله ثم ارفع الملف المُعدّل (.docx / .txt). تُرسل نسختك إلى صلة عند الموافقة.",
        )}
      </p>
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
      {!ready && !pending && !busy && (
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
