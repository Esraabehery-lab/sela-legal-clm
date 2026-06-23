import { FileDown, Paperclip } from "lucide-react";
import { t } from "@/lib/i18n";
import { formatDateTime } from "@/lib/format";
import type { Locale, ThirdPartyUpload } from "@/lib/types";

/**
 * Shows the revised contract file the third party uploaded, kept exactly as
 * uploaded. The download link opens/saves the original file (e.g. the PDF),
 * which renders perfectly — unlike re-extracting its text into the page.
 */
export function UploadedContract({
  upload,
  locale,
}: {
  upload: ThirdPartyUpload;
  locale: Locale;
}) {
  return (
    <div className="rounded-lg border border-sela-mint/40 bg-sela-mint/[0.06] p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-ink-100">
        <Paperclip className="h-4 w-4 text-sela-mint" />
        {t(locale, "Revised contract (uploaded)", "العقد المُعدّل (مرفوع)")}
      </div>
      <p className="mt-1 text-xs text-ink-400">
        {t(locale, "Uploaded by", "رفعه")} {upload.uploadedBy} ·{" "}
        {formatDateTime(upload.uploadedAt, locale)}
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-surface-1 px-3 py-2">
        <span className="truncate text-sm text-ink-200">{upload.name}</span>
        <a
          href={upload.dataUrl}
          download={upload.name}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-line bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink-100 transition-colors hover:bg-surface-3"
        >
          <FileDown className="h-4 w-4" />
          {t(locale, "Download", "تنزيل")}
        </a>
      </div>
    </div>
  );
}
