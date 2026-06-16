"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { toast } from "sonner";
import { PenLine } from "lucide-react";

/**
 * In-portal e-signature: the signer types their full name and submits. Used
 * for the user's signature and the Legal Reviewer's counter-signature.
 */
export function SignContract({
  requestId,
  action,
  title,
  buttonLabel,
  locale,
}: {
  requestId: string;
  action: (formData: FormData) => Promise<void>;
  title: string;
  buttonLabel: string;
  locale: Locale;
}) {
  const [name, setName] = React.useState("");
  const [pending, start] = React.useTransition();

  return (
    <form
      action={(fd) =>
        start(async () => {
          await action(fd);
          toast.success(t(locale, "Contract signed", "تم توقيع العقد"));
        })
      }
      className="space-y-3 rounded-lg border border-sela-mint/30 bg-sela-mint/[0.06] p-4"
    >
      <input type="hidden" name="requestId" value={requestId} />
      <div className="flex items-center gap-2 text-sm font-medium text-ink-100">
        <PenLine className="h-4 w-4 text-sela-mint" />
        {title}
      </div>
      <Input
        name="signerName"
        required
        minLength={2}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t(
          locale,
          "Type your full name to sign…",
          "اكتب اسمك الكامل للتوقيع…",
        )}
        className="max-w-sm"
      />
      <Button
        type="submit"
        size="sm"
        variant="mint"
        disabled={name.trim().length < 2 || pending}
      >
        <PenLine className="h-4 w-4" />
        {buttonLabel}
      </Button>
    </form>
  );
}
