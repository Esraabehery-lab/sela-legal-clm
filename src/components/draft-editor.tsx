"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { saveDraft } from "@/lib/actions";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { toast } from "sonner";
import { Save } from "lucide-react";

/** US-007: editable AI draft with a save-version action. */
export function DraftEditor({
  requestId,
  body,
  canEdit,
  locale,
}: {
  requestId: string;
  body: string;
  canEdit: boolean;
  locale: Locale;
}) {
  const [pending, start] = React.useTransition();

  return (
    <form
      action={(fd) =>
        start(async () => {
          await saveDraft(fd);
          toast.success(t(locale, "Draft saved", "تم حفظ المسودة"));
        })
      }
      className="space-y-3"
    >
      <input type="hidden" name="requestId" value={requestId} />
      <Textarea
        name="bodyEn"
        defaultValue={body}
        readOnly={!canEdit}
        rows={16}
        className="font-mono text-[13px] leading-relaxed"
      />
      {canEdit && (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            name="note"
            placeholder={t(locale, "Change note (optional)", "ملاحظة التغيير (اختياري)")}
            className="max-w-xs"
          />
          <Button type="submit" size="sm" disabled={pending}>
            <Save className="h-4 w-4" />
            {pending
              ? t(locale, "Saving…", "جارٍ الحفظ…")
              : t(locale, "Save Version", "حفظ نسخة")}
          </Button>
        </div>
      )}
    </form>
  );
}
