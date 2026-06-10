import { AppSidebar } from "@/components/app-sidebar";
import { Topbar } from "@/components/topbar";
import { RoleBanner } from "@/components/role-banner";
import { getLocale, getRole } from "@/lib/prefs";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = getLocale();
  const role = getRole();
  return (
    <div className="flex min-h-screen bg-canvas">
      <AppSidebar locale={locale} role={role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar locale={locale} role={role} />
        <RoleBanner role={role} locale={locale} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
