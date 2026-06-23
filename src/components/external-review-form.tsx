"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { submitThirdPartyReview, uploadThirdPartyFile } from "@/lib/actions";
import { UploadedContract } from "@/components/uploaded-contract";
import { useTrackChanges } from "@/components/use-track-changes";
import { t } from "@/lib/i18n";
import type { Locale, ThirdPartyUpload } from "@/lib/types";
import { toast } from "sonner";
import { Check, Upload } from "lucide-react";

/**
 * The third party reviews the contract. They can edit it inline, or download
 * it, edit it offline, and upload the revised file — which is kept exactly as
 * uploaded (downloadable in full) and sent back to the business user on Approve.
 */
export function ExternalReviewForm({
  token,
  html,
  upload,
  author,
  locale,
}: {
  token: string;
  html: string;
  upload?: ThirdPartyUpload;
  author: string;
  locale: Locale;
}) {
  const docRef = React.useRef<HTMLDivElement>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  // Mark the third party's inline edits in yellow, attributed to their company.
  useTrackChanges(docRef, author, !upload);
  const [name, setName] = React.useState("");
  const [comment, setComment] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [pending, start] = React.useTransition();
  const ready = name.trim().length >= 2 && !pending && !busy;

  function readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      const fd = new FormData();
      fd.set("token", token);
      fd.set("name", file.name);
      fd.set("dataUrl", dataUrl);
      await uploadThirdPartyFile(fd);
      toast.success(
        t(locale, "Contract uploaded", "تم رفع العقد"),
      );
    } catch {
      toast.error(
        t(locale, "Could not upload that file.", "تعذّر رفع هذا الملف."),
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
      {upload && <UploadedContract upload={upload} locale={locale} />}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-medium uppercase tracking-wide text-ink-400">
          {t(locale, "Contract (editable)", "العقد (قابل للتعديل)")}
        </label>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.docx,.doc,.txt,.md,.html"
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
            ? t(locale, "Uploading…", "جارٍ الرفع…")
            : upload
              ? t(locale, "Replace upload", "استبدال الملف")
              : t(locale, "Upload edited contract", "رفع العقد المُعدّل")}
        </Button>
      </div>
      <p className="text-xs text-ink-500">
        {upload
          ? t(
              locale,
              "Your uploaded file above is the revised contract. Use “Replace upload” to change it. It's sent to SELA on Approve.",
              "ملفك المرفوع بالأعلى هو العقد المُعدّل. استخدم «استبدال الملف» لتغييره. يُرسل إلى صلة عند الموافقة.",
            )
          : t(
              locale,
              "Download the contract, edit it offline, and upload your revised file (.pdf / .docx) — it's kept exactly as uploaded. Or edit inline below. Your version is sent to SELA on Approve.",
              "نزّل العقد وعدّله ثم ارفع ملفك المُعدّل (.pdf / .docx) — يُحفظ كما هو. أو عدّله مباشرةً بالأسفل. تُرسل نسختك إلى صلة عند الموافقة.",
            )}
      </p>
      {!upload && (
        <div
          ref={docRef}
          className="contract-doc max-h-[560px] overflow-auto"
          contentEditable
          suppressContentEditableWarning
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}

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
