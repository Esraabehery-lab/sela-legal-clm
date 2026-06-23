"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { FileDown } from "lucide-react";

// Inline document styling for the print window (mirrors .contract-doc).
const PRINT_CSS = `
  @page { size: A4; margin: 18mm 16mm; }
  body { font-family: "Times New Roman", Georgia, serif; color: #1a1a1a; font-size: 13px; line-height: 1.6; direction: rtl; text-align: right; }
  .ct-letterhead { display:flex; align-items:center; justify-content:space-between; border-bottom:2px solid #9ca0a6; padding-bottom:10px; margin-bottom:16px; direction:ltr; }
  .ct-brand { display:flex; align-items:center; gap:8px; }
  .ct-mark { width:18px; height:18px; background:#e31b23; border-radius:3px; clip-path: polygon(0 0, 70% 0, 100% 35%, 100% 100%, 0 100%); }
  .ct-word { font-family:Arial,sans-serif; font-weight:700; font-size:20px; color:#333; }
  .ct-ref { font-family:Arial,sans-serif; font-size:12px; color:#777; }
  .ct-title { text-align:center; font-size:18px; font-weight:700; margin:6px 0 18px; color:#7a7d82; }
  .ct-h2 { font-size:14px; font-weight:700; color:#7a7d82; border-bottom:1px solid #ddd; padding-bottom:4px; margin:20px 0 10px; }
  .ct-h3 { font-size:13px; font-weight:700; color:#1a1a1a; margin:16px 0 6px; }
  table.ct-table { width:100%; border-collapse:collapse; margin:8px 0 14px; font-size:12.5px; }
  table.ct-table th, table.ct-table td { border:1px solid #bfbfbf; padding:6px 9px; vertical-align:top; }
  table.ct-table th { background:#d9d9d9; font-weight:700; text-align:right; }
  table.ct-table td { background:#f2f2f2; }
  table.ct-penalties th { background:#bfbfbf; text-align:center; }
  table.ct-penalties td { text-align:center; background:#fff; }
  table.ct-sign th { background:#d9d9d9; text-align:center; }
  table.ct-sign td { background:#fff; height:90px; }
  ol.ct-terms { padding-inline-start:20px; } ol.ct-terms li { margin-bottom:8px; }
  .ct-note { font-size:11.5px; color:#555; }
  .ct-edit { background:#fff3b0; color:#6b5200; border-radius:2px; padding:0 2px; box-decoration-break:clone; }
`;

/** Opens a print-ready view of the contract (Save as PDF preserves tables/colors). */
export function DownloadContractPdf({
  html,
  fileName,
  locale,
}: {
  html: string;
  fileName: string;
  locale: Locale;
}) {
  function download() {
    // Prefer the live, on-screen contract (includes the user's current edits,
    // even unsaved ones); fall back to the saved snapshot passed in as a prop.
    const live = document.querySelector(".contract-doc")?.innerHTML;
    const body = live && live.trim().length > 0 ? live : html;
    const w = window.open("", "_blank", "width=900,height=1000");
    if (!w) return;
    w.document.write(
      `<!doctype html><html><head><meta charset="utf-8"><title>${fileName}</title><style>${PRINT_CSS}</style></head><body>${body}</body></html>`,
    );
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  }

  return (
    <Button type="button" size="sm" variant="outline" onClick={download}>
      <FileDown className="h-4 w-4" />
      {t(locale, "Download PDF", "تنزيل PDF")}
    </Button>
  );
}
