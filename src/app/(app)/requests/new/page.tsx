import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createRequest } from "@/lib/actions";
import { getLocale, getRole } from "@/lib/prefs";
import { canCreateRequest, RESPONSIBILITIES } from "@/lib/permissions";
import { ROLE_LABELS } from "@/lib/roles";
import { t, DEPT_LABELS, label } from "@/lib/i18n";
import type { Department } from "@/lib/types";
import { Sparkles, Lock } from "lucide-react";

const DEPARTMENTS: Department[] = [
  "BUSINESS",
  "PROCUREMENT",
  "FINANCE",
  "LEGAL",
  "IT",
  "HR",
];

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
          "Submit a request — the AI engine will classify, route and draft it automatically.",
          "أرسل الطلب — سيقوم محرك الذكاء الاصطناعي بتصنيفه وتوجيهه وصياغته تلقائياً.",
        )}
      />

      <Card className="max-w-3xl">
        <CardContent className="p-6">
          <form action={createRequest} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">
                {t(locale, "Request Title", "عنوان الطلب")}
              </Label>
              <Input
                id="title"
                name="title"
                required
                minLength={3}
                placeholder={t(
                  locale,
                  "e.g. IT Managed Services Agreement",
                  "مثال: اتفاقية خدمات تقنية مُدارة",
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                {t(locale, "Description / Scope", "الوصف / النطاق")}
              </Label>
              <Textarea
                id="description"
                name="description"
                required
                minLength={5}
                rows={4}
                placeholder={t(
                  locale,
                  "Describe the purpose, scope and contract type…",
                  "صف الغرض والنطاق ونوع العقد…",
                )}
              />
              <p className="text-xs text-ink-500">
                {t(
                  locale,
                  "Tip: mention keywords like “supply”, “service”, “NDA”, “consulting” to help AI classify.",
                  "تلميح: اذكر كلمات مثل «توريد» أو «خدمة» أو «سرية» لمساعدة التصنيف.",
                )}
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="counterparty">
                  {t(locale, "Counterparty / Vendor", "الطرف المقابل / المورد")}
                </Label>
                <Input id="counterparty" name="counterparty" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="requesterName">
                  {t(locale, "Requester Name", "اسم مقدم الطلب")}
                </Label>
                <Input id="requesterName" name="requesterName" required />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="department">
                  {t(locale, "Department", "القسم")}
                </Label>
                <Select id="department" name="department" defaultValue="BUSINESS">
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {label(DEPT_LABELS, d, locale)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedValue">
                  {t(locale, "Estimated Value", "القيمة التقديرية")}
                </Label>
                <Input
                  id="estimatedValue"
                  name="estimatedValue"
                  type="number"
                  min={0}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">
                  {t(locale, "Currency", "العملة")}
                </Label>
                <Select id="currency" name="currency" defaultValue="SAR">
                  <option value="SAR">SAR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requestedLanguage">
                {t(locale, "Contract Language", "لغة العقد")}
              </Label>
              <Select
                id="requestedLanguage"
                name="requestedLanguage"
                defaultValue={locale}
                className="sm:w-48"
              >
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </Select>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit">
                <Sparkles className="h-4 w-4" />
                {t(locale, "Submit & Run AI", "إرسال وتشغيل الذكاء الاصطناعي")}
              </Button>
              <span className="text-xs text-ink-500">
                {t(
                  locale,
                  "Generates a unique Request ID and draft contract.",
                  "يولّد معرّف طلب فريد ومسودة عقد.",
                )}
              </span>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
