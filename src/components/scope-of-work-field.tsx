"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { toast } from "sonner";
import { Upload } from "lucide-react";

/**
 * Description / Scope field with an "Upload" button that reads an uploaded
 * Scope of Work file (.docx or .txt) and loads its text into the field.
 */
export function ScopeOfWorkField({
  locale,
  initial = "",
}: {
  locale: Locale;
  initial?: string;
}) {
  const [value, setValue] = React.useState(initial);
  const [busy, setBusy] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const name = file.name.toLowerCase();
      let text = "";
      if (name.endsWith(".docx")) {
        const mod: any = await import("mammoth");
        const mammoth = mod.default ?? mod;
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } else if (
        name.endsWith(".txt") ||
        name.endsWith(".md") ||
        file.type.startsWith("text/")
      ) {
        text = await file.text();
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
      setValue(text.trim());
      toast.success(
        t(locale, "Scope of Work uploaded", "تم رفع نطاق العمل"),
      );
    } catch {
      toast.error(
        t(locale, "Could not read that file.", "تعذّر قراءة هذا الملف."),
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2 sm:col-span-2 lg:col-span-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor="description">
          {t(locale, "Description / Scope", "الوصف / النطاق")}
        </Label>
        <input
          ref={inputRef}
          type="file"
          accept=".docx,.txt,.md"
          hidden
          onChange={onFile}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          {busy
            ? t(locale, "Reading…", "جارٍ القراءة…")
            : t(locale, "Upload Scope", "رفع النطاق")}
        </Button>
      </div>
      <Textarea
        id="description"
        name="description"
        required
        minLength={5}
        rows={value ? 16 : 3}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t(
          locale,
          "Describe the purpose and scope — or click “Upload Scope” to load a Scope of Work file (.docx / .txt).",
          "صف الغرض والنطاق — أو اضغط «رفع النطاق» لتحميل ملف نطاق العمل (.docx / .txt).",
        )}
        className={value ? "font-mono text-[13px] leading-relaxed" : ""}
      />
    </div>
  );
}
