"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signByThirdParty } from "@/lib/actions";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { toast } from "sonner";
import { PenLine } from "lucide-react";

/** The third party signs the contract from the external link (final step). */
export function ExternalSignForm({
  token,
  locale,
}: {
  token: string;
  locale: Locale;
}) {
  const [name, setName] = React.useState("");
  const [pending, start] = React.useTransition();
  const ready = name.trim().length >= 2 && !pending;

  return (
    <form
      action={(fd) =>
        start(async () => {
          await signByThirdParty(fd);
          toast.success(t(locale, "Contract signed", "تم توقيع العقد"));
        })
      }
      className="space-y-3 rounded-lg border border-sela-mint/30 bg-sela-mint/[0.06] p-4"
    >
      <input type="hidden" name="token" value={token} />
      <div className="flex items-center gap-2 text-sm font-medium text-ink-100">
        <PenLine className="h-4 w-4 text-sela-mint" />
        {t(
          locale,
          "SELA has signed. Please sign to execute the contract.",
          "وقّعت صلة. يرجى التوقيع لإتمام تنفيذ العقد.",
        )}
      </div>
      <Input
        name="name"
        required
        minLength={2}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t(locale, "Type your full name to sign…", "اكتب اسمك الكامل للتوقيع…")}
        className="max-w-sm"
      />
      <Button type="submit" size="sm" variant="mint" disabled={!ready}>
        <PenLine className="h-4 w-4" />
        {t(locale, "Sign & Execute", "توقيع وتنفيذ")}
      </Button>
      {!ready && !pending && (
        <p className="text-xs text-amber-400">
          {t(
            locale,
            "Enter your full name above to sign.",
            "أدخل اسمك الكامل بالأعلى للتوقيع.",
          )}
        </p>
      )}
    </form>
  );
}
