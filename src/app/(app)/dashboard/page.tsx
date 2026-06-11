import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { listRequests } from "@/lib/store";
import { getLocale } from "@/lib/prefs";
import { t, STATUS_LABELS, STAGE_LABELS, label } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import type { RequestStatus, ApprovalStage } from "@/lib/types";
import {
  FileText,
  Clock,
  FileSignature,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

export default function DashboardPage() {
  const locale = getLocale();
  const requests = listRequests();

  const inApproval = requests.filter((r) => r.status === "IN_APPROVAL").length;
  const active = requests.filter(
    (r) => r.status === "ACTIVE" || r.status === "SIGNED",
  ).length;

  const allObligations = requests.flatMap((r) => r.obligations);
  const overdue = allObligations.filter((o) => o.status === "OVERDUE").length;
  const openObligations = allObligations.filter(
    (o) => o.status !== "DONE",
  ).length;

  // Approval bottleneck — pending decisions per stage
  const bottleneck: Record<ApprovalStage, number> = {
    HEAD_OF_BU: 0,
    CSCCO: 0,
    CFO: 0,
    LEGAL: 0,
  };
  requests.forEach((r) =>
    r.approvals.forEach((a) => {
      if (a.decision === "PENDING") bottleneck[a.stage] += 1;
    }),
  );

  // Status breakdown
  const statusCounts = requests.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<RequestStatus, number>,
  );

  // Compliance — average risk score across analyzed contracts
  const scored = requests.filter((r) => typeof r.riskScore === "number");
  const avgRisk = scored.length
    ? Math.round(
        scored.reduce((s, r) => s + (r.riskScore ?? 0), 0) / scored.length,
      )
    : 0;

  const stats = [
    {
      label: t(locale, "Total Requests", "إجمالي الطلبات"),
      value: requests.length,
      icon: FileText,
      tone: "text-ink-50",
    },
    {
      label: t(locale, "In Approval", "قيد الاعتماد"),
      value: inApproval,
      icon: Clock,
      tone: "text-amber-400",
    },
    {
      label: t(locale, "Active Contracts", "العقود السارية"),
      value: active,
      icon: FileSignature,
      tone: "text-sela-mint",
    },
    {
      label: t(locale, "Overdue Obligations", "التزامات متأخرة"),
      value: overdue,
      icon: AlertTriangle,
      tone: overdue > 0 ? "text-red-400" : "text-ink-50",
    },
  ];

  return (
    <>
      <PageHeader
        title={t(locale, "Dashboard", "لوحة المعلومات")}
        subtitle={t(
          locale,
          "Contract performance and operational efficiency at a glance",
          "أداء العقود والكفاءة التشغيلية في لمحة",
        )}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="rounded-lg bg-surface-2 p-2.5">
                  <Icon className={`h-5 w-5 ${s.tone}`} />
                </div>
                <div>
                  <div className={`text-2xl font-semibold ${s.tone}`}>
                    {s.value}
                  </div>
                  <div className="text-xs text-ink-400">{s.label}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Contract status dashboard */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">
              {t(locale, "Contract Status", "حالة العقود")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(Object.keys(statusCounts) as RequestStatus[]).map((st) => (
              <div
                key={st}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-ink-300">
                  {label(STATUS_LABELS, st, locale)}
                </span>
                <span className="font-medium text-ink-50">
                  {statusCounts[st]}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Approval bottleneck dashboard */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">
              {t(locale, "Approval Bottlenecks", "اختناقات الاعتماد")}
            </CardTitle>
            <CardDescription>
              {t(locale, "Pending decisions by stage", "القرارات المعلقة حسب المرحلة")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(Object.keys(bottleneck) as ApprovalStage[]).map((stage) => (
              <div
                key={stage}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-ink-300">
                  {label(STAGE_LABELS, stage, locale)}
                </span>
                <span
                  className={`font-medium ${
                    bottleneck[stage] > 0 ? "text-amber-400" : "text-ink-500"
                  }`}
                >
                  {bottleneck[stage]}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Compliance + obligations dashboard */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">
              {t(locale, "Compliance & Obligations", "الامتثال والالتزامات")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-ink-300">
                {t(locale, "Average risk score", "متوسط درجة المخاطر")}
              </span>
              <span
                className={`font-semibold ${
                  avgRisk >= 50
                    ? "text-red-400"
                    : avgRisk >= 25
                      ? "text-amber-400"
                      : "text-sela-mint"
                }`}
              >
                {avgRisk}/100
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-300">
                {t(locale, "Open obligations", "الالتزامات المفتوحة")}
              </span>
              <span className="font-medium text-ink-50">{openObligations}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-300">
                {t(locale, "Overdue", "متأخرة")}
              </span>
              <span
                className={`font-medium ${overdue > 0 ? "text-red-400" : "text-ink-500"}`}
              >
                {overdue}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent requests */}
      <Card className="mt-6">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">
            {t(locale, "Recent Requests", "أحدث الطلبات")}
          </CardTitle>
          <Link
            href="/requests"
            className="flex items-center gap-1 text-sm text-sela-yellow hover:underline"
          >
            {t(locale, "View all", "عرض الكل")}
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </Link>
        </CardHeader>
        <CardContent className="space-y-2">
          {requests.slice(0, 5).map((r) => (
            <Link
              key={r.id}
              href={`/requests/${r.id}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface-1 px-4 py-3 transition-colors hover:bg-surface-2"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-ink-50">
                  {r.title}
                </div>
                <div className="text-xs text-ink-500">
                  {r.reference} · {r.counterparty} · {formatDate(r.createdAt, locale)}
                </div>
              </div>
              <StatusBadge status={r.status} locale={locale} />
            </Link>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
