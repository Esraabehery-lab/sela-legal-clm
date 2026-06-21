"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { shareWithThirdParty } from "@/lib/actions";
import { t } from "@/lib/i18n";
import { formatDateTime } from "@/lib/format";
import type { Locale, ThirdPartyShare, ThirdPartyReview } from "@/lib/types";
import { toast } from "sonner";
import { Mail, Copy, Check } from "lucide-react";

/** Business user shares the contract with an external company via an email link. */
export function ShareThirdParty({
  requestId,
  share,
  review,
  locale,
}: {
  requestId: string;
  share?: ThirdPartyShare;
  review?: ThirdPartyReview;
  locale: Locale;
}) {
  const [pending, start] = React.useTransition();
  const [copied, setCopied] = React.useState(false);

  const link =
    share && typeof window !== "undefined"
      ? `${window.location.origin}/external/${share.token}`
      : "";

  function copy() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success(t(locale, "Link copied", "تم نسخ الرابط"));
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3 rounded-lg border border-line bg-surface-1 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-ink-100">
        <Mail className="h-4 w-4 text-sela-yellow" />
        {t(locale, "Share with third party", "مشاركة مع طرف خارجي")}
      </div>

      {!share && (
        <form
          action={(fd) =>
            start(async () => {
              await shareWithThirdParty(fd);
              toast.success(
                t(locale, "Shared with third party", "تمت المشاركة مع الطرف الخارجي"),
              );
            })
          }
          className="space-y-2"
        >
          <input type="hidden" name="requestId" value={requestId} />
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              name="company"
              required
              minLength={2}
              placeholder={t(locale, "Company name", "اسم الشركة")}
              className="h-9"
            />
            <Input
              name="email"
              type="email"
              required
              placeholder={t(locale, "Email address", "البريد الإلكتروني")}
              className="h-9"
            />
          </div>
          <Button type="submit" size="sm" disabled={pending}>
            <Mail className="h-4 w-4" />
            {t(locale, "Send by email", "إرسال بالبريد")}
          </Button>
        </form>
      )}

      {share && (
        <div className="space-y-2 text-xs">
          <div className="text-ink-300">
            {t(locale, "Shared with", "تمت المشاركة مع")}:{" "}
            <span className="text-ink-100">{share.company}</span> · {share.email}
            <span className="text-ink-500">
              {" "}
              · {formatDateTime(share.sharedAt, locale)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Input readOnly value={link} className="h-8 text-[11px]" />
            <Button type="button" size="sm" variant="outline" onClick={copy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {t(locale, "Copy link", "نسخ الرابط")}
            </Button>
          </div>
          <p className="text-ink-500">
            {t(
              locale,
              "In production this link is emailed to the third party. They review and respond from the link — no portal login required.",
              "في النظام الفعلي يُرسل هذا الرابط بالبريد للطرف الخارجي، فيراجع ويرد عبر الرابط دون الحاجة لتسجيل الدخول.",
            )}
          </p>

          {review ? (
            <div className="mt-2 rounded-lg border border-line bg-surface-2 p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-ink-100">
                  {t(locale, "Third-party response", "رد الطرف الخارجي")}
                </span>
                <Badge variant={review.decision === "APPROVED" ? "mint" : "amber"}>
                  {review.decision === "APPROVED"
                    ? t(locale, "Approved", "موافق")
                    : t(locale, "Changes requested", "طلب تعديلات")}
                </Badge>
              </div>
              <div className="mt-1 text-ink-400">
                {review.name} · {formatDateTime(review.reviewedAt, locale)}
              </div>
              {review.comment && (
                <p className="mt-1 text-ink-300">“{review.comment}”</p>
              )}
            </div>
          ) : (
            <Badge variant="amber">
              {t(locale, "Awaiting third-party response", "بانتظار رد الطرف الخارجي")}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
