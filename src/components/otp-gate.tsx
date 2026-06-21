"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { verifyTpOtp } from "@/lib/actions";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";

/** One-time-code gate for the external third-party contract link. */
export function OtpGate({ token, locale }: { token: string; locale: Locale }) {
  const [otp, setOtp] = React.useState("");
  const [error, setError] = React.useState(false);
  const [pending, start] = React.useTransition();
  const ready = otp.trim().length === 6 && !pending;

  function submit() {
    setError(false);
    start(async () => {
      const ok = await verifyTpOtp(token, otp.trim());
      if (!ok) {
        setError(true);
        toast.error(t(locale, "Incorrect code", "رمز غير صحيح"));
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-ink-100">
        <KeyRound className="h-4 w-4 text-sela-yellow" />
        {t(locale, "Enter the access code", "أدخل رمز الدخول")}
      </div>
      <p className="text-sm text-ink-400">
        {t(
          locale,
          "We sent a 6-digit code to your email. Enter it to open the contract.",
          "أرسلنا رمزاً من 6 أرقام إلى بريدكم. أدخلوه لفتح العقد.",
        )}
      </p>
      <Input
        inputMode="numeric"
        maxLength={6}
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
        placeholder="000000"
        className="max-w-[160px] text-center text-lg tracking-[0.4em]"
      />
      {error && (
        <p className="text-xs text-red-400">
          {t(locale, "Incorrect code — please try again.", "رمز غير صحيح — حاول مجدداً.")}
        </p>
      )}
      <Button onClick={submit} disabled={!ready} variant="mint">
        {pending
          ? t(locale, "Verifying…", "جارٍ التحقق…")
          : t(locale, "Open contract", "فتح العقد")}
      </Button>
    </div>
  );
}
