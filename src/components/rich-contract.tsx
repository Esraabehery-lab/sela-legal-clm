"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { saveDraft } from "@/lib/actions";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { toast } from "sonner";
import { Save, Pencil } from "lucide-react";

/**
 * Rich, document-style contract. Renders the HTML body as a paper document
 * (tables, sections). When canEdit, the document is directly editable
 * (contentEditable) and saved as a new version.
 */
export function RichContract({
  requestId,
  html,
  canEdit,
  locale,
}: {
  requestId: string;
  html: string;
  canEdit: boolean;
  locale: Locale;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [note, setNote] = React.useState("");
  const [pending, start] = React.useTransition();

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
      {canEdit && (
        <p className="flex items-center gap-1.5 text-xs text-sela-yellow">
          <Pencil className="h-3.5 w-3.5" />
          {t(
            locale,
            "Click anywhere in the document to edit it, then Save Version.",
            "اضغط في أي مكان داخل المستند لتعديله، ثم احفظ النسخة.",
          )}
        </p>
      )}
      <div
        ref={ref}
        className={`contract-doc max-h-[640px] overflow-auto ${
          canEdit ? "ring-1 ring-sela-yellow/40" : ""
        }`}
        contentEditable={canEdit}
        suppressContentEditableWarning
        dangerouslySetInnerHTML={{ __html: html }}
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
