import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  StatusBadge,
  DecisionBadge,
  SeverityBadge,
} from "@/components/status-badge";
import { DraftEditor } from "@/components/draft-editor";
import { ObligationRow } from "@/components/obligation-row";
import { DfDetailsCard } from "@/components/df-details-card";
import { getRequest } from "@/lib/store";
import { getLocale, getRole } from "@/lib/prefs";
import {
  t,
  CATEGORY_LABELS,
  STAGE_LABELS,
  DEPT_LABELS,
  label,
} from "@/lib/i18n";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import {
  addDocument,
  regenerate,
  submitForApproval,
  confirmContract,
  submitRevisedContract,
  finalApproveContract,
  confirmFinalContract,
  signByUser,
  signByLegal,
} from "@/lib/actions";
import { ApprovalActions } from "@/components/approval-actions";
import { ApprovalProgress } from "@/components/approval-progress";
import { DownloadContractPdf } from "@/components/download-contract-pdf";
import { ContractReviewActions } from "@/components/contract-review-actions";
import { SignContract } from "@/components/sign-contract";
import { ShareThirdParty } from "@/components/share-third-party";
import { SelaLogo } from "@/components/sela-logo";
import {
  canApproveStage,
  canEditDraft as canEditDraftFn,
  canSubmitForApproval,
  canSignByUser,
  canSignByLegal,
  canShareThirdParty,
  canManageObligations as canManageObligationsFn,
  canUploadDocuments,
  canRunAi,
  canEditRequest,
  canConfirmContract,
  canSubmitRevision,
  canFinalApprove,
  canConfirmFinal,
  isStageActionable,
  roleStage,
} from "@/lib/permissions";
import {
  ArrowLeft,
  Sparkles,
  Brain,
  FileText,
  ShieldCheck,
  Upload,
  PenLine,
  History,
  Send,
  ListChecks,
  Users,
  Pencil,
  CheckCircle2,
} from "lucide-react";

export default function RequestDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const locale = getLocale();
  const role = getRole();
  const req = getRequest(params.id);
  if (!req) notFound();

  const cls = req.classification;
  const canEditDraft = canEditDraftFn(role, req.status);
  const canSubmit = canSubmitForApproval(role, req.status);
  const canUserSign = canSignByUser(role, req.status);
  const canLegalSign = canSignByLegal(role, req.status);
  const canManageObligations = canManageObligationsFn(role);
  const canUpload = canUploadDocuments(role);
  const canReRunAi = canRunAi(role);
  const canEditReq = canEditRequest(role, req.status);

  // Scope-approval reviewers (Head of BU, CSCCO, CFO, Legal) get a focused
  // scope-review screen — but only while the request is in that phase.
  const focusedReview = roleStage(role) !== null && req.status === "IN_APPROVAL";

  // The contract exists once it has been generated (Legal approval onward).
  const contractGenerated =
    req.status === "APPROVED" ||
    req.status === "CONFIRMED" ||
    req.status === "CONTRACT_REVIEW" ||
    req.status === "CONTRACT_REVISION" ||
    req.status === "FINAL_APPROVAL" ||
    req.status === "FINAL_CONFIRM" ||
    req.status === "USER_SIGNATURE" ||
    req.status === "LEGAL_SIGNATURE" ||
    req.status === "SIGNED" ||
    req.status === "ACTIVE";
  // Scope-only approvers never see the contract.
  const scopeOnlyApprover =
    role === "HEAD_OF_BU" || role === "CSCCO" || role === "CFO";
  const showContract =
    !!req.draft &&
    !focusedReview &&
    !scopeOnlyApprover &&
    (role !== "BUSINESS_USER" || contractGenerated);
  const canConfirm = canConfirmContract(role, req.status);
  const canRevise = canSubmitRevision(role, req.status);
  const canFinalApproveNow = canFinalApprove(role, req.status);
  const canConfirmFinalNow = canConfirmFinal(role, req.status);
  const canShare = canShareThirdParty(role);

  // In focused review, show only the reviewer's own approval row (not the
  // whole chain). Everyone else sees the full chain.
  const myStage = roleStage(role);
  const visibleApprovals =
    focusedReview && myStage
      ? req.approvals.filter((a) => a.stage === myStage)
      : req.approvals;

  return (
    <>
      <Link
        href="/requests"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-100"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {t(locale, "Back to requests", "العودة للطلبات")}
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ink-50">
              {req.title}
            </h1>
            <StatusBadge status={req.status} locale={locale} />
          </div>
          <p className="mt-1 text-sm text-ink-400">
            {req.reference} · {req.counterparty} ·{" "}
            {label(DEPT_LABELS, req.department, locale)} ·{" "}
            {formatDate(req.createdAt, locale)}
            {req.estimatedValue
              ? ` · ${formatMoney(req.estimatedValue, req.currency, locale)}`
              : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canEditReq && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/requests/${req.id}/edit`}>
                <Pencil className="h-4 w-4" />
                {t(locale, "Edit Request", "تعديل الطلب")}
              </Link>
            </Button>
          )}
          {canReRunAi && (
            <form action={regenerate.bind(null, req.id)}>
              <Button variant="outline" size="sm" type="submit">
                <Sparkles className="h-4 w-4" />
                {t(locale, "Re-run AI", "إعادة التحليل")}
              </Button>
            </form>
          )}
          {canSubmit && (
            <form action={submitForApproval.bind(null, req.id)}>
              <Button size="sm" type="submit">
                <Send className="h-4 w-4" />
                {t(locale, "Submit for Approval", "إرسال للاعتماد")}
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Approval progress tracker — visible to everyone, incl. the requester */}
      {req.approvals.length > 0 && (
        <div className="mb-6">
          <ApprovalProgress approvals={req.approvals} locale={locale} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ---------------- Left / main column ---------------- */}
        <div
          className={
            focusedReview ? "space-y-6 lg:col-span-3" : "space-y-6 lg:col-span-2"
          }
        >
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-ink-400" />
                {t(locale, "Request Details", "تفاصيل الطلب")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-400">
                  <FileText className="h-3.5 w-3.5" />
                  {t(locale, "Scope of Work", "نطاق العمل")}
                </div>
                <div className="max-h-[460px] overflow-auto whitespace-pre-wrap rounded-lg border border-line bg-surface-1 p-4 text-[13px] leading-relaxed text-ink-200">
                  {req.description}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-ink-400">
                <div>
                  <span className="text-ink-500">
                    {t(locale, "Requester", "مقدم الطلب")}:{" "}
                  </span>
                  {req.requesterName}
                </div>
                <div>
                  <span className="text-ink-500">
                    {t(locale, "Language", "اللغة")}:{" "}
                  </span>
                  {req.requestedLanguage === "ar" ? "العربية" : "English"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* DF form details */}
          {req.df && <DfDetailsCard df={req.df} locale={locale} />}

          {/* Approval workflow (US-008/009/010) */}
          {visibleApprovals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-4 w-4 text-ink-400" />
                  {t(locale, "Approval Workflow", "مسار الاعتماد")}
                </CardTitle>
                {!focusedReview && (
                  <CardDescription>
                    {req.approvals
                      .map((a) => label(STAGE_LABELS, a.stage, locale))
                      .join(" → ")}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {visibleApprovals.map((a) => (
                  <div
                    key={a.stage}
                    className="rounded-lg border border-line bg-surface-1 p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-ink-50">
                        {label(STAGE_LABELS, a.stage, locale)}
                      </span>
                      <DecisionBadge decision={a.decision} locale={locale} />
                    </div>
                    {a.reviewer && (
                      <p className="mt-1 text-xs text-ink-500">
                        {a.reviewer}
                        {a.decidedAt
                          ? ` · ${formatDateTime(a.decidedAt, locale)}`
                          : ""}
                      </p>
                    )}
                    {a.comment && (
                      <p className="mt-1 text-xs text-ink-300">“{a.comment}”</p>
                    )}

                    {a.decision === "PENDING" &&
                      (!isStageActionable(req.approvals, a.stage) ? (
                        <p className="mt-2 text-xs text-ink-500">
                          {t(
                            locale,
                            "Waiting for the previous approval.",
                            "بانتظار اعتماد المرحلة السابقة.",
                          )}
                        </p>
                      ) : canApproveStage(role, a.stage) ? (
                        <ApprovalActions
                          requestId={req.id}
                          stage={a.stage}
                          locale={locale}
                          allowArchive={a.stage !== "HEAD_OF_BU"}
                        />
                      ) : (
                        <p className="mt-2 text-xs text-ink-500">
                          {t(
                            locale,
                            "Awaiting this approver’s decision.",
                            "بانتظار قرار هذا المعتمد.",
                          )}
                        </p>
                      ))}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}


          {/* AI generated draft + clauses */}
          {showContract && req.draft && (
            <Card>
              <CardHeader className="flex-row items-start justify-between gap-3">
                <div className="space-y-1.5">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-sela-yellow" />
                  {t(locale, "AI-Generated Contract", "العقد المُولّد بالذكاء")}
                  <Badge variant="outline">v{req.draft.version}</Badge>
                </CardTitle>
                <CardDescription>
                  {canEditDraft
                    ? t(
                        locale,
                        "Edit and save versions before submitting for approval.",
                        "حرّر واحفظ النسخ قبل الإرسال للاعتماد.",
                      )
                    : t(
                        locale,
                        "Generated by AI after Legal approval.",
                        "تم إنشاؤه بالذكاء الاصطناعي بعد اعتماد القانونية.",
                      )}
                </CardDescription>
                </div>
                <DownloadContractPdf
                  title={req.draft.title}
                  body={req.draft.bodyEn}
                  fileName={`${req.reference}.pdf`}
                  locale={locale}
                />
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Contract letterhead */}
                <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface-1 px-4 py-3">
                  <SelaLogo withTagline />
                  <div className="text-end text-[11px] leading-tight text-ink-500">
                    <div className="font-medium text-ink-300">{req.reference}</div>
                    <div>{formatDate(req.createdAt, locale)}</div>
                  </div>
                </div>
                {(canShare || req.thirdParty) && (
                  <ShareThirdParty
                    requestId={req.id}
                    share={req.thirdParty}
                    review={req.thirdPartyReview}
                    locale={locale}
                  />
                )}
                {canConfirm && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sela-mint/30 bg-sela-mint/[0.06] p-4">
                    <p className="text-sm text-ink-200">
                      {t(
                        locale,
                        "Please review the AI-generated contract and confirm it.",
                        "يرجى مراجعة العقد المُولّد بالذكاء الاصطناعي وتأكيده.",
                      )}
                    </p>
                    <form action={confirmContract.bind(null, req.id)}>
                      <Button type="submit" size="sm" variant="mint">
                        <CheckCircle2 className="h-4 w-4" />
                        {t(locale, "Confirm Contract", "تأكيد العقد")}
                      </Button>
                    </form>
                  </div>
                )}
                {canConfirmFinalNow && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sela-mint/30 bg-sela-mint/[0.06] p-4">
                    <p className="text-sm text-ink-200">
                      {t(
                        locale,
                        "The contract has received final Legal approval. Confirm it to proceed to signature.",
                        "حصل العقد على الاعتماد النهائي من القانونية. أكّده للانتقال إلى التوقيع.",
                      )}
                    </p>
                    <form action={confirmFinalContract.bind(null, req.id)}>
                      <Button type="submit" size="sm" variant="mint">
                        <CheckCircle2 className="h-4 w-4" />
                        {t(locale, "Confirm Contract", "تأكيد العقد")}
                      </Button>
                    </form>
                  </div>
                )}
                {canFinalApproveNow && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sela-mint/30 bg-sela-mint/[0.06] p-4">
                    <p className="text-sm text-ink-200">
                      {t(
                        locale,
                        "Revised contract — review and give the final approval.",
                        "العقد المُعدّل — راجِع وامنح الاعتماد النهائي.",
                      )}
                    </p>
                    <form action={finalApproveContract.bind(null, req.id)}>
                      <Button type="submit" size="sm" variant="mint">
                        <CheckCircle2 className="h-4 w-4" />
                        {t(locale, "Final Approve", "الاعتماد النهائي")}
                      </Button>
                    </form>
                  </div>
                )}
                {canUserSign && (
                  <SignContract
                    requestId={req.id}
                    action={signByUser}
                    title={t(
                      locale,
                      "This contract has Legal's final approval. Sign it to proceed.",
                      "حصل هذا العقد على الاعتماد النهائي من القانونية. وقّعه للمتابعة.",
                    )}
                    buttonLabel={t(locale, "Sign & Submit to Legal", "توقيع وإرسال للقانونية")}
                    locale={locale}
                  />
                )}
                {canLegalSign && (
                  <SignContract
                    requestId={req.id}
                    action={signByLegal}
                    title={t(
                      locale,
                      "The user has signed. Counter-sign to execute the contract.",
                      "وقّع المستخدم. وقّع كطرف مقابل لإتمام تنفيذ العقد.",
                    )}
                    buttonLabel={t(locale, "Counter-sign & Execute", "التوقيع المقابل والتنفيذ")}
                    locale={locale}
                  />
                )}
                {(req.signedByUser || req.signedByLegal) && (
                  <div className="space-y-1.5 rounded-lg border border-line bg-surface-1 p-4 text-xs">
                    <div className="font-medium text-ink-200">
                      {t(locale, "Signatures", "التواقيع")}
                    </div>
                    {req.signedByUser && (
                      <div className="flex items-center gap-2 text-ink-400">
                        <PenLine className="h-3.5 w-3.5 text-sela-mint" />
                        {t(locale, "User", "المستخدم")}: {req.signedByUser}
                        {req.signedByUserAt
                          ? ` · ${formatDateTime(req.signedByUserAt, locale)}`
                          : ""}
                      </div>
                    )}
                    {req.signedByLegal && (
                      <div className="flex items-center gap-2 text-ink-400">
                        <PenLine className="h-3.5 w-3.5 text-sela-mint" />
                        {t(locale, "Legal Reviewer", "المراجع القانوني")}:{" "}
                        {req.signedByLegal}
                        {req.signedByLegalAt
                          ? ` · ${formatDateTime(req.signedByLegalAt, locale)}`
                          : ""}
                      </div>
                    )}
                  </div>
                )}
                <DraftEditor
                  requestId={req.id}
                  body={locale === "ar" ? req.draft.bodyAr : req.draft.bodyEn}
                  canEdit={canEditDraft}
                  locale={locale}
                />

                {/* Version history (US-007) */}
                {req.versions.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-ink-100">
                        <History className="h-4 w-4 text-ink-400" />
                        {t(locale, "Version History", "سجل النسخ")}
                      </h4>
                      <div className="space-y-1.5">
                        {req.versions.map((v) => (
                          <div
                            key={v.version}
                            className="flex items-center justify-between text-xs text-ink-400"
                          >
                            <span>
                              v{v.version} · {v.savedBy}
                            </span>
                            <span className="text-ink-500">
                              {formatDateTime(v.savedAt, locale)} — {v.note}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Contract review (Procurement → Finance → Legal) */}
          {req.contractReviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-4 w-4 text-ink-400" />
                  {t(locale, "Contract Review", "مراجعة العقد")}
                </CardTitle>
                <CardDescription>
                  {t(
                    locale,
                    "Procurement → Finance → Legal (each adds a comment)",
                    "المشتريات ← المالية ← القانونية (يضيف كل منهم ملاحظة)",
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {canRevise && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/[0.06] p-4">
                    <p className="text-sm text-ink-200">
                      {t(
                        locale,
                        "Address the review comments below, edit the contract above, then submit the revised contract.",
                        "عالج ملاحظات المراجعة أدناه، وعدّل العقد بالأعلى، ثم أرسل العقد المُعدّل.",
                      )}
                    </p>
                    <form action={submitRevisedContract.bind(null, req.id)}>
                      <Button type="submit" size="sm" variant="mint">
                        <CheckCircle2 className="h-4 w-4" />
                        {t(locale, "Submit Revised Contract", "إرسال العقد المُعدّل")}
                      </Button>
                    </form>
                  </div>
                )}
                {req.contractReviews.map((rv) => (
                  <div
                    key={rv.stage}
                    className="rounded-lg border border-line bg-surface-1 p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-ink-50">
                        {label(STAGE_LABELS, rv.stage, locale)}
                      </span>
                      <DecisionBadge decision={rv.decision} locale={locale} />
                    </div>
                    {rv.reviewer && (
                      <p className="mt-1 text-xs text-ink-500">
                        {rv.reviewer}
                        {rv.decidedAt
                          ? ` · ${formatDateTime(rv.decidedAt, locale)}`
                          : ""}
                      </p>
                    )}
                    {rv.comment && (
                      <p className="mt-1 text-xs text-ink-300">“{rv.comment}”</p>
                    )}

                    {rv.decision === "PENDING" &&
                      (!isStageActionable(req.contractReviews, rv.stage) ? (
                        <p className="mt-2 text-xs text-ink-500">
                          {t(
                            locale,
                            "Waiting for the previous review.",
                            "بانتظار المراجعة السابقة.",
                          )}
                        </p>
                      ) : req.status === "CONTRACT_REVIEW" &&
                        canApproveStage(role, rv.stage) ? (
                        <ContractReviewActions
                          requestId={req.id}
                          stage={rv.stage}
                          locale={locale}
                        />
                      ) : (
                        <p className="mt-2 text-xs text-ink-500">
                          {t(
                            locale,
                            "Awaiting this reviewer’s comment.",
                            "بانتظار ملاحظة هذا المراجع.",
                          )}
                        </p>
                      ))}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Obligations (US-013/016) */}
          {req.obligations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ListChecks className="h-4 w-4 text-ink-400" />
                  {t(locale, "Obligations & Deliverables", "الالتزامات والمخرجات")}
                </CardTitle>
                <CardDescription>
                  {t(
                    locale,
                    "Extracted from the signed contract and assigned to departments.",
                    "مستخرجة من العقد الموقّع ومسندة للأقسام.",
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {req.obligations.map((o) => (
                  <ObligationRow
                    key={o.id}
                    requestId={req.id}
                    obligation={o}
                    locale={locale}
                    canEdit={canManageObligations}
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ---------------- Right column ---------------- */}
        {!focusedReview && (
        <div className="space-y-6">
          {/* AI classification (US-003 / US-004) */}
          {cls && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Brain className="h-4 w-4 text-sela-yellow" />
                  {t(locale, "AI Analysis", "تحليل الذكاء الاصطناعي")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <div className="text-xs text-ink-500">
                    {t(locale, "Contract Type", "نوع العقد")}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink-50">
                      {label(CATEGORY_LABELS, cls.category, locale)}
                    </span>
                    <Badge variant="yellow">
                      {(cls.confidence * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>

                <p className="text-xs text-ink-400">
                  {locale === "ar" ? cls.summaryAr : cls.summary}
                </p>

                <div>
                  <div className="mb-1.5 text-xs text-ink-500">
                    {t(locale, "Routing", "المسار")}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {cls.routing.map((s) => (
                      <Badge key={s} variant="outline">
                        {label(STAGE_LABELS, s, locale)}
                      </Badge>
                    ))}
                    <Badge variant="outline">
                      {t(locale, "Signature", "التوقيع")}
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-xs italic text-ink-500">
                    {locale === "ar"
                      ? cls.routingRationaleAr
                      : cls.routingRationale}
                  </p>
                </div>

                {cls.stakeholders.length > 0 && (
                  <div>
                    <div className="mb-1.5 flex items-center gap-1.5 text-xs text-ink-500">
                      <Users className="h-3.5 w-3.5" />
                      {t(locale, "Stakeholders", "أصحاب المصلحة")}
                    </div>
                    <ul className="space-y-0.5 text-xs text-ink-300">
                      {cls.stakeholders.map((s) => (
                        <li key={s}>• {s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {cls.riskIndicators.length > 0 && (
                  <div>
                    <div className="mb-1.5 text-xs text-ink-500">
                      {t(locale, "Risk Indicators", "مؤشرات المخاطر")}
                    </div>
                    <div className="space-y-1.5">
                      {cls.riskIndicators.map((r, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-2"
                        >
                          <span className="text-xs text-ink-300">
                            {locale === "ar" ? r.labelAr : r.label}
                          </span>
                          <SeverityBadge severity={r.severity} locale={locale} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Compliance (US-011) */}
          {typeof req.riskScore === "number" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-4 w-4 text-ink-400" />
                  {t(locale, "Compliance & Risk", "الامتثال والمخاطر")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-ink-500">
                    {t(locale, "Risk Score", "درجة المخاطر")}
                  </span>
                  <span
                    className={`text-lg font-semibold ${
                      req.riskScore >= 50
                        ? "text-red-400"
                        : req.riskScore >= 25
                          ? "text-amber-400"
                          : "text-sela-mint"
                    }`}
                  >
                    {req.riskScore}/100
                  </span>
                </div>
                {req.compliance.length === 0 ? (
                  <p className="text-xs text-sela-mint">
                    {t(locale, "No compliance issues found.", "لا توجد ملاحظات امتثال.")}
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {req.compliance.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="text-xs text-ink-300">
                          {locale === "ar" ? c.labelAr : c.label}
                        </span>
                        <SeverityBadge severity={c.severity} locale={locale} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Documents (US-002) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Upload className="h-4 w-4 text-ink-400" />
                {t(locale, "Supporting Documents", "المستندات الداعمة")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {req.documents.length === 0 && (
                <p className="text-xs text-ink-500">
                  {t(locale, "No documents attached.", "لا توجد مستندات.")}
                </p>
              )}
              {req.documents.map((d) => (
                <div
                  key={d.id}
                  className="rounded-lg border border-line bg-surface-1 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm text-ink-100">
                      {d.name}
                    </span>
                    <Badge variant="outline">{d.kind}</Badge>
                  </div>
                  {d.ocrSummary && (
                    <p className="mt-1 text-xs text-ink-500">{d.ocrSummary}</p>
                  )}
                </div>
              ))}

              {canUpload && (
                <>
                  <Separator />
                  {/* Mock upload (US-002 + OCR BR-06) */}
                  <form action={addDocument} className="space-y-2">
                    <input type="hidden" name="requestId" value={req.id} />
                    <Input
                      name="name"
                      placeholder={t(locale, "File name…", "اسم الملف…")}
                      className="h-9"
                      required
                    />
                    <div className="flex items-center gap-2">
                      <Select name="kind" defaultValue="PDF" className="h-9">
                        <option value="PDF">PDF</option>
                        <option value="WORD">Word</option>
                        <option value="IMAGE">Image</option>
                      </Select>
                      <Button type="submit" size="sm" variant="outline">
                        <Upload className="h-4 w-4" />
                        {t(locale, "Attach", "إرفاق")}
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </CardContent>
          </Card>

          {/* Audit trail (US-018) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4 text-ink-400" />
                {t(locale, "Audit Trail", "سجل التدقيق")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {req.audit.map((a) => (
                  <li key={a.id} className="flex gap-3 text-xs">
                    <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-sela-yellow" />
                    <div>
                      <div className="text-ink-200">{a.action}</div>
                      <div className="text-ink-500">
                        {a.actor} · {formatDateTime(a.at, locale)}
                      </div>
                      <div className="text-ink-500">{a.detail}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
        )}
      </div>
    </>
  );
}
