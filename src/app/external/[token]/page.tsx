import { notFound } from "next/navigation";
import { SelaLogo } from "@/components/sela-logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalReviewForm } from "@/components/external-review-form";
import { ExternalSignForm } from "@/components/external-sign-form";
import { getRequestByToken } from "@/lib/store";
import { getLocale } from "@/lib/prefs";
import { t } from "@/lib/i18n";
import { formatDateTime } from "@/lib/format";
import { FileText, CheckCircle2 } from "lucide-react";

export const metadata = { title: "Contract Review · SELA" };

export default function ExternalReviewPage({
  params,
}: {
  params: { token: string };
}) {
  const locale = getLocale();
  const req = getRequestByToken(params.token);
  if (!req || !req.draft || !req.thirdParty) notFound();

  const body = locale === "ar" ? req.draft.bodyAr : req.draft.bodyEn;
  const review = req.thirdPartyReview;

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <SelaLogo withTagline />
        <Badge variant="outline">{req.reference}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t(locale, "Contract for your review", "عقد لمراجعتكم")}
          </CardTitle>
          <p className="text-sm text-ink-400">
            {t(
              locale,
              `Shared with ${req.thirdParty.company} for review.`,
              `تمت المشاركة مع ${req.thirdParty.company} للمراجعة.`,
            )}
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink-400">
            <FileText className="h-3.5 w-3.5" />
            {req.draft.title}
          </div>

          {req.status === "THIRD_PARTY_REVIEW" ? (
            <div className="space-y-3 border-t border-line pt-4">
              <p className="text-sm text-ink-200">
                {t(
                  locale,
                  "Please review the contract (you can edit it) and submit your response.",
                  "يرجى مراجعة العقد (يمكنكم تعديله) وإرسال ردكم.",
                )}
              </p>
              <ExternalReviewForm token={params.token} body={body} locale={locale} />
            </div>
          ) : req.status === "THIRD_PARTY_SIGNATURE" ? (
            <div className="space-y-3 border-t border-line pt-4">
              <div className="flex items-start gap-2.5 rounded-lg border border-sela-mint/30 bg-sela-mint/[0.06] p-4 text-sm">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sela-mint" />
                <div className="text-ink-200">
                  <div className="font-medium text-ink-100">
                    {t(
                      locale,
                      "SELA has approved and signed the contract.",
                      "اعتمدت صلة العقد ووقّعته.",
                    )}
                  </div>
                  {req.signedByUser && (
                    <div className="text-xs text-ink-400">
                      {req.signedByUser}
                      {req.signedByUserAt
                        ? ` · ${formatDateTime(req.signedByUserAt, locale)}`
                        : ""}
                    </div>
                  )}
                </div>
              </div>
              <div className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-lg border border-line bg-surface-1 p-4 font-mono text-[13px] leading-relaxed text-ink-200">
                {body}
              </div>
              <ExternalSignForm token={params.token} locale={locale} />
            </div>
          ) : (
            <>
              <div className="flex items-start gap-2.5 rounded-lg border border-sela-mint/30 bg-sela-mint/[0.06] p-4 text-sm">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sela-mint" />
                <div className="text-ink-200">
                  <div className="font-medium text-ink-100">
                    {req.signedByThirdParty
                      ? t(locale, "Contract signed. Thank you.", "تم توقيع العقد. شكراً لكم.")
                      : req.status === "USER_SIGNATURE"
                        ? t(
                            locale,
                            "Your response was submitted — awaiting SELA's review and signature.",
                            "تم إرسال ردكم — بانتظار مراجعة وتوقيع صلة.",
                          )
                        : t(locale, "Your response was submitted.", "تم إرسال ردكم.")}
                  </div>
                  {/* Signatures recorded so far */}
                  {req.signedByUser && (
                    <div className="text-xs text-ink-400">
                      {t(locale, "Signed by SELA", "موقّع من صلة")}: {req.signedByUser}
                      {req.signedByUserAt ? ` · ${formatDateTime(req.signedByUserAt, locale)}` : ""}
                    </div>
                  )}
                  {req.signedByThirdParty && (
                    <div className="text-xs text-ink-400">
                      {t(locale, "Signed by you", "موقّع منكم")}: {req.signedByThirdParty}
                      {req.signedByThirdPartyAt
                        ? ` · ${formatDateTime(req.signedByThirdPartyAt, locale)}`
                        : ""}
                    </div>
                  )}
                  {review && !req.signedByThirdParty && !req.signedByUser && (
                    <div className="text-xs text-ink-400">
                      {review.name} · {formatDateTime(review.reviewedAt, locale)}
                    </div>
                  )}
                </div>
              </div>
              <div className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-lg border border-line bg-surface-1 p-4 font-mono text-[13px] leading-relaxed text-ink-200">
                {body}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <p className="mt-4 text-center text-[11px] text-ink-600">
        SELA — Contract Lifecycle Management
      </p>
    </div>
  );
}
