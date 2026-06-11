"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SCOPE_OF_WORK_TEMPLATE } from "@/lib/scope-template";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { FileText } from "lucide-react";
import { toast } from "sonner";

/**
 * Description / Scope field with a "Fill data" button that loads the standard
 * Scope of Work (SoW) template into the textarea, ready for the requester to
 * complete in place.
 */
export function ScopeOfWorkField({ locale }: { locale: Locale }) {
  const [value, setValue] = React.useState("");

  function fill() {
    setValue(SCOPE_OF_WORK_TEMPLATE);
    toast.success(
      t(locale, "Scope of Work template loaded", "تم تحميل قالب نطاق العمل"),
    );
  }

  return (
    <div className="space-y-2 sm:col-span-2 lg:col-span-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor="description">
          {t(locale, "Description / Scope", "الوصف / النطاق")}
        </Label>
        <Button type="button" variant="outline" size="sm" onClick={fill}>
          <FileText className="h-4 w-4" />
          {t(locale, "Fill data", "تعبئة البيانات")}
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
          "Describe the purpose and scope — or click “Fill data” to load the Scope of Work template.",
          "صف الغرض والنطاق — أو اضغط «تعبئة البيانات» لتحميل قالب نطاق العمل.",
        )}
        className={value ? "font-mono text-[13px] leading-relaxed" : ""}
      />
    </div>
  );
}
