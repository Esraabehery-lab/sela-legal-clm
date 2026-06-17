"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { toast } from "sonner";
import { FileDown } from "lucide-react";

/**
 * Generates and downloads the contract as a PDF (client-side, via jsPDF).
 * Uses the English body for reliable font rendering.
 */
export function DownloadContractPdf({
  title,
  body,
  fileName,
  locale,
}: {
  title: string;
  body: string;
  fileName: string;
  locale: Locale;
}) {
  const [busy, setBusy] = React.useState(false);

  async function download() {
    setBusy(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const margin = 48;
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const usableW = pageW - margin * 2;
      let y = margin;

      // SELA brand header
      doc.setFillColor(227, 27, 35); // SELA red
      doc.roundedRect(margin, y - 2, 16, 16, 3, 3, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(33, 33, 33);
      doc.text("SELA", margin + 24, y + 11);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(130, 130, 130);
      doc.text("SPECTACULAR. EVERYDAY.", margin + 24, y + 19);
      y += 30;
      doc.setDrawColor(210, 210, 210);
      doc.line(margin, y, pageW - margin, y);
      y += 20;

      // Title
      doc.setTextColor(20, 20, 20);
      doc.setFont("times", "bold");
      doc.setFontSize(14);
      for (const line of doc.splitTextToSize(title, usableW)) {
        doc.text(line, margin, y);
        y += 20;
      }
      y += 8;

      // Body (monospace to preserve the contract's layout)
      doc.setFont("courier", "normal");
      doc.setFontSize(9.5);
      const lineH = 13;
      for (const raw of body.split("\n")) {
        const wrapped = doc.splitTextToSize(raw.length ? raw : " ", usableW);
        for (const line of wrapped) {
          if (y > pageH - margin) {
            doc.addPage();
            y = margin;
          }
          doc.text(line, margin, y);
          y += lineH;
        }
      }

      doc.save(fileName);
      toast.success(t(locale, "Contract PDF downloaded", "تم تنزيل ملف العقد"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" size="sm" variant="outline" onClick={download} disabled={busy}>
      <FileDown className="h-4 w-4" />
      {busy
        ? t(locale, "Generating…", "جارٍ الإنشاء…")
        : t(locale, "Download PDF", "تنزيل PDF")}
    </Button>
  );
}
