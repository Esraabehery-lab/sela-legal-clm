import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { SelaLogo } from "@/components/sela-logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalReviewForm } from "@/components/external-review-form";
import { ExternalSignForm } from "@/components/external-sign-form";
import { OtpGate } from "@/components/otp-gate";
import { DownloadContractPdf } from "@/components/download-contract-pdf";
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

  const html = req.draft.bodyHtml;
  const review = req.thirdPartyReview;
  const verified = cookies().get(`tpok_${params.token}`)?.value === "1";

  return (
    <div className="mx-auto min-h-screen max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <SelaLogo withTagline />
        <Badge variant="outline">{req.reference}</Badge>
      </div>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div className="space-y-1.5">
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
          </div>
          {verified && (
            <DownloadContractPdf
              html={html}
              fileName={`${req.reference}.pdf`}
              locale={locale}
            />
          )}
        </CardHeader>
        <CardContent className="space-y-5">
          {!verified ? (
            <OtpGate token={params.token} locale={locale} />
          ) : (
          <>
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
              <ExternalReviewForm token={params.token} html={html} locale={locale} />
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
              <div
                className="contract-doc max-h-[420px] overflow-auto"
                dangerouslySetInnerHTML={{ __html: html }}
              />
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
                      : req.finalConfirmedBy
                        ? t(
                            locale,
                            "SELA has reviewed and confirmed the contract following your approval. Thank you.",
                            "راجعت صلة العقد وأكدته بعد موافقتكم. شكراً لكم.",
                          )
                        : req.status === "THIRD_PARTY_APPROVED"
                          ? t(
                              locale,
                              "Your approval was submitted — awaiting SELA's final confirmation.",
                              "تم إرسال موافقتكم — بانتظار التأكيد النهائي من صلة.",
                            )
                          : t(locale, "Your response was submitted.", "تم إرسال ردكم.")}
                  </div>
                  {req.finalConfirmedBy && (
                    <div className="text-xs text-ink-400">
                      {t(locale, "Confirmed by SELA", "مؤكَّد من صلة")}: {req.finalConfirmedBy}
                      {req.finalConfirmedAt
                        ? ` · ${formatDateTime(req.finalConfirmedAt, locale)}`
                        : ""}
                    </div>
                  )}
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
              <div
                className="contract-doc max-h-[520px] overflow-auto"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            </>
          )}
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
