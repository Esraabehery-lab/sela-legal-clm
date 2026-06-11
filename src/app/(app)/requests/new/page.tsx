import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { RequestForm } from "@/components/request-form";
import { createRequest } from "@/lib/actions";
import { getLocale, getRole } from "@/lib/prefs";
import { canCreateRequest, RESPONSIBILITIES } from "@/lib/permissions";
import { ROLE_LABELS } from "@/lib/roles";
import { t } from "@/lib/i18n";
import { Lock } from "lucide-react";

export default function NewRequestPage() {
  const locale = getLocale();
  const role = getRole();

  // Only Business Users (and Legal Ops) may raise a contract request.
  if (!canCreateRequest(role)) {
    return (
      <Card className="max-w-xl">
        <CardContent className="flex items-start gap-3 p-6">
          <Lock className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div className="space-y-1 text-sm">
            <p className="font-medium text-ink-50">
              {t(
                locale,
                "Creating contract requests isn’t part of your role.",
                "إنشاء طلبات العقود ليس ضمن دورك.",
              )}
            </p>
            <p className="text-ink-400">
              {t(
                locale,
                `You are acting as ${ROLE_LABELS[role].en}. ${RESPONSIBILITIES[role].en} To raise a request, switch to the Business User role.`,
                `أنت تعمل كـ ${ROLE_LABELS[role].ar}. ${RESPONSIBILITIES[role].ar} لإنشاء طلب، انتقل إلى دور مستخدم الأعمال.`,
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <PageHeader
        title={t(locale, "New Contract Request (DF)", "طلب عقد جديد")}
        subtitle={t(
          locale,
          "Complete the DF form — the AI engine will classify and route it. Only the title, description and requester are required.",
          "أكمل نموذج DF — سيقوم محرك الذكاء الاصطناعي بتصنيفه وتوجيهه. الحقول الإلزامية هي العنوان والوصف ومقدم الطلب فقط.",
        )}
      />
      <Card className="max-w-4xl">
        <CardContent className="p-6">
          <RequestForm
            action={createRequest}
            locale={locale}
            submitLabel={t(locale, "Submit & Run AI", "إرسال وتشغيل الذكاء الاصطناعي")}
            submitHint={t(
              locale,
              "Generates a unique Request ID.",
              "يولّد معرّف طلب فريد.",
            )}
          />
        </CardContent>
      </Card>
    </>
  );
}
