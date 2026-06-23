"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { saveDraft } from "@/lib/actions";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { toast } from "sonner";
import { Save, Pencil } from "lucide-react";
import { DownloadContractPdf } from "@/components/download-contract-pdf";
import { useTrackChanges } from "@/components/use-track-changes";

/**
 * Rich, document-style contract. Renders the HTML body as a paper document
 * (tables, sections). When canEdit, the document is directly editable
 * (contentEditable) and saved as a new version. The HTML is injected via a ref
 * so the browser fully owns the editable content (React never re-applies it).
 */
export function RichContract({
  requestId,
  html,
  canEdit,
  fileName,
  author,
  locale,
}: {
  requestId: string;
  html: string;
  canEdit: boolean;
  fileName: string;
  author: string;
  locale: Locale;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [note, setNote] = React.useState("");
  const [pending, start] = React.useTransition();

  // Mark this reviewer's edits in yellow, attributed to their name.
  useTrackChanges(ref, author, canEdit);

  // Inject the HTML once (and when the saved version changes) — never during
  // editing, so the user's keystrokes are not wiped by a re-render.
  React.useEffect(() => {
    if (ref.current && ref.current.innerHTML !== html) {
      ref.current.innerHTML = html;
    }
  }, [html]);

  function save() {
    const fd = new FormData();
    fd.set("requestId", requestId);
    fd.set("bodyHtml", ref.current?.innerHTML ?? "");
    fd.set("note", note);
    start(async () => {
      await saveDraft(fd);
      setNote("");
      toast.success(t(locale, "Contract saved", "تم حفظ العقد"));
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {canEdit ? (
          <p className="flex items-center gap-1.5 text-xs text-sela-yellow">
            <Pencil className="h-3.5 w-3.5" />
            {t(
              locale,
              "Editable — your changes are highlighted in yellow. Type, then Save Version.",
              "قابل للتعديل — تظهر تغييراتك بالأصفر. اكتب ثم احفظ النسخة.",
            )}
          </p>
        ) : (
          <span />
        )}
        <DownloadContractPdf html={html} fileName={fileName} locale={locale} />
      </div>
      <div
        ref={ref}
        className={`contract-doc max-h-[640px] overflow-auto ${
          canEdit ? "ring-2 ring-sela-yellow/50" : ""
        }`}
        contentEditable={canEdit}
        suppressContentEditableWarning
      />
      {canEdit && (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t(locale, "Change note (optional)", "ملاحظة التغيير (اختياري)")}
            className="max-w-xs"
          />
          <Button type="button" size="sm" onClick={save} disabled={pending}>
            <Save className="h-4 w-4" />
            {pending
              ? t(locale, "Saving…", "جارٍ الحفظ…")
              : t(locale, "Save Version", "حفظ نسخة")}
          </Button>
        </div>
      )}
    </div>
  );
}
